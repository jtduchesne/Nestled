/**
 * @typedef {import('./NES.js').NES} NES
 * @typedef {() => number} AddressingFunc
 * @typedef {() => void} InstructionFunc
 */

import { Powered } from './Power.js';

/** Number of cycles by opcode lookup table. */
const cyclesLookup = [7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
                      2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7];

export class CPU extends Powered {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        super();
        
        /** @private */
        this.bus = bus;
        
        /** Internal 2kb of RAM, located at `[0x0000-0x07FF]`. */
        this.ram   = new Uint8Array(0x800);
        /** Predefined memory page used for the Stack, located at `[0x0100-0x01FF]`. */
        this.stack = this.ram.subarray(0x100, 0x200);
        
        /**
         * Optimized accessor for the NMI vector `[0xFFFA]`.
         * @private
         */
        this.nmiVector   = () => 0x0000;
        /**
         * Optimized accessor for the RESET vector `[0xFFFC]`.
         * @private
         */
        this.resetVector = () => 0x0000;
        /**
         * Optimized accessor for the IRQ vector `[0xFFFE]`.
         * @private
         */
        this.irqVector   = () => 0x0000;
        
        /**
         * **Accumulator**
         * 
         * **A** is byte-wide and along with the *Arithmetic Logic Unit* (**ALU**),
         * supports using the *Status register* for carrying, overflow detection,
         * and so on.
         */
        this.A = 0x00;
        /**
         * **X index**
         * 
         * **X** is byte-wide and used for several addressing modes. It can be used as
         * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
         * the accumulator, it has limited addressing modes when loading and saving.
         */
        this.X = 0x00;
        /**
         * **Y index**
         * 
         * **Y** is byte-wide and used for several addressing modes. It can be used as
         * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
         * the accumulator, it has limited addressing modes when loading and saving.
         */
        this.Y = 0x00;
        /**
         * **Status Register**
         * 
         * `|---7----|---6----|--5--|---4---|---3---|----2----|--1---|---0---|`
         * `|Negative|oVerflow| - - | *BRK* |Decimal|Interrupt| Zero | Carry |`
         * 
         * **P** has 6 bits used by the **ALU** but is byte-wide. `PHP`, `PLP`,
         * *Arithmetic*, *Testing*, and *Branch* instructions can access this register.
         */
        this.P = 0x30;
        /**
         * **Stack Pointer**
         * 
         * **S** is byte-wide and can be accessed using *Interrupts*, *Pulls*, *Pushes*,
         * and *Transfers*. It indexes into a 256 bytes stack at `[0x0100-0x01FF]`.
         */
        this.SP = 0x00;
        /**
         * **Program Counter**
         * 
         * **PC** is 2-byte-wide and can be accessed either by CPU's internal fetch logic
         * increment, by an interrupt (*NMI*, *Reset*, *IRQ/BRQ*), or by using the
         * `RTS`/`JMP`/`JSR`/ *Branch* instructions.
         */
        this.PC = 0x0000;
        
        /**
         * Addressing modes by opcode lookup table.
         * @type {AddressingFunc[]}
         * @private
         */
        this.addressingLookup = [
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.abs, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.ind,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroY, this.zeroY, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absY, this.absY,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroY, this.zeroY, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absY, this.absY,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX
        ].map((fn) => fn.bind(this));
        
        /**
         * Instructions by opcode lookup table.
         * @type {InstructionFunc[]}
         * @private
         */
        this.instructionLookup = [
            this.BRK, this.ORA,  this.KIL, this.NOP,  this.NOP,   this.ORA,   this.ASL,   this.NOP,   this.PHP, this.ORA,  this.AXL, this.NOP,  this.NOP,  this.ORA,  this.ASL,  this.NOP,
            this.BPL, this.ORA,  this.KIL, this.NOP,  this.NOP,   this.ORA,   this.ASL,   this.NOP,   this.CLC, this.ORA,  this.NOP, this.NOP,  this.NOP,  this.ORA,  this.ASL,  this.NOP,
            this.JSR, this.AND,  this.KIL, this.NOP,  this.BIT,   this.AND,   this.ROL,   this.NOP,   this.PLP, this.AND,  this.RXL, this.NOP,  this.BIT,  this.AND,  this.ROL,  this.NOP,
            this.BMI, this.AND,  this.KIL, this.NOP,  this.NOP,   this.AND,   this.ROL,   this.NOP,   this.SEC, this.AND,  this.NOP, this.NOP,  this.NOP,  this.AND,  this.ROL,  this.NOP,
            this.RTI, this.EOR,  this.KIL, this.NOP,  this.NOP,   this.EOR,   this.LSR,   this.NOP,   this.PHA, this.EOR,  this.LXR, this.NOP,  this.JMP,  this.EOR,  this.LSR,  this.NOP,
            this.BVC, this.EOR,  this.KIL, this.NOP,  this.NOP,   this.EOR,   this.LSR,   this.NOP,   this.CLI, this.EOR,  this.NOP, this.NOP,  this.NOP,  this.EOR,  this.LSR,  this.NOP,
            this.RTS, this.ADC,  this.KIL, this.NOP,  this.NOP,   this.ADC,   this.ROR,   this.NOP,   this.PLA, this.ADC,  this.RXR, this.NOP,  this.JMP,  this.ADC,  this.ROR,  this.NOP,
            this.BVS, this.ADC,  this.KIL, this.NOP,  this.NOP,   this.ADC,   this.ROR,   this.NOP,   this.SEI, this.ADC,  this.NOP, this.NOP,  this.NOP,  this.ADC,  this.ROR,  this.NOP,
            this.NOP, this.STA,  this.NOP, this.NOP,  this.STY,   this.STA,   this.STX,   this.NOP,   this.DEY, this.NOP,  this.TXA, this.NOP,  this.STY,  this.STA,  this.STX,  this.NOP,
            this.BCC, this.STA,  this.KIL, this.NOP,  this.STY,   this.STA,   this.STX,   this.NOP,   this.TYA, this.STA,  this.TXS, this.NOP,  this.NOP,  this.STA,  this.NOP,  this.NOP,
            this.LDY, this.LDA,  this.LDX, this.NOP,  this.LDY,   this.LDA,   this.LDX,   this.NOP,   this.TAY, this.LDA,  this.TAX, this.NOP,  this.LDY,  this.LDA,  this.LDX,  this.NOP,
            this.BCS, this.LDA,  this.KIL, this.NOP,  this.LDY,   this.LDA,   this.LDX,   this.NOP,   this.CLV, this.LDA,  this.TSX, this.NOP,  this.LDY,  this.LDA,  this.LDX,  this.NOP,
            this.CPY, this.CMP,  this.NOP, this.NOP,  this.CPY,   this.CMP,   this.DEC,   this.NOP,   this.INY, this.CMP,  this.DEX, this.NOP,  this.CPY,  this.CMP,  this.DEC,  this.NOP,
            this.BNE, this.CMP,  this.KIL, this.NOP,  this.NOP,   this.CMP,   this.DEC,   this.NOP,   this.CLD, this.CMP,  this.NOP, this.NOP,  this.NOP,  this.CMP,  this.DEC,  this.NOP,
            this.CPX, this.SBC,  this.NOP, this.NOP,  this.CPX,   this.SBC,   this.INC,   this.NOP,   this.INX, this.SBC,  this.NOP, this.NOP,  this.CPX,  this.SBC,  this.INC,  this.NOP,
            this.BEQ, this.SBC,  this.KIL, this.NOP,  this.NOP,   this.SBC,   this.INC,   this.NOP,   this.SED, this.SBC,  this.NOP, this.NOP,  this.NOP,  this.SBC,  this.INC,  this.NOP
        ].map((fn) => fn.bind(this));
        
        this.cycle = 0;
        
        this.opcode  = 0x00;
        this.operand = 0x00;
        
        this.addressBus = 0x0000;
    }
    
    //== Power ==========================================================================//
    powerOn() {
        this.cycle = 0;
        
        //Interrupt vectors optimizations
        const cart = this.bus.game.cartridge;
        this.nmiVector   = () => cart.cpuRead(0xFFFA) + cart.cpuRead(0xFFFB)*256;
        this.resetVector = () => cart.cpuRead(0xFFFC) + cart.cpuRead(0xFFFD)*256;
        this.irqVector   = () => cart.cpuRead(0xFFFE) + cart.cpuRead(0xFFFF)*256;
        
        //Accumulator
        this.A = 0x00;
        //Indexes
        this.X = 0x00;
        this.Y = 0x00;
        //Status register
        this.P = 0x34; //b00110100
        //Stack pointer
        this.SP = 0xFD;
        //Program counter
        this.PC = this.resetVector();
        
        return super.powerOn();
    }
    powerOff() {
        return super.powerOff();
    }
    
    reset() {
        this.doReset();
    }
    
    //== Execution ======================================================================//
    /**
     * Execute instructions up to a given limit of CPU cycles, the limit being based on
     * the number of cycle since the beginning of the current frame.
     * @param {number} limit 
     */
    doInstructions(limit) {
        if (this.cycle < limit) {
            const apu = this.bus.apu;
            
            let cycleBefore;
            do {
                cycleBefore = this.cycle;
                this.doInstruction();
                apu.doCycles(this.cycle - cycleBefore);
            } while (this.cycle < limit);
        }
    }
    
    /**
     * Execute a single instruction.
     */
    doInstruction() {
        const opcode =
        this.opcode  = this.read(this.PC++);
        this.operand = this.read(this.PC);
        
        this.addressBus = this.addressingLookup[opcode]();
        
        this.instructionLookup[opcode]();
        
        this.cycle += cyclesLookup[opcode];
    }
    
    //== Memory access ==================================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     */
    read(address) {
        if (address < 0x800) {
            return this.ram[address];
        } else if (address < 0x2000) {
            return this.ram[address & 0x7FF];
        } else if (address < 0x4018) {
            if (address < 0x4000) {
                return this.bus.ppu.read(address);
            } else if (address >= 0x4016) {
                return this.bus.controllers.read(address);
            } else {
                return this.bus.apu.read(address);
            }
        } else {
            return this.bus.game.cartridge.cpuRead(address);
        }
    }
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     */
    write(address, data) {
        if (address < 0x800) {
            this.ram[address] = data;
        } else if (address < 0x2000) {
            this.ram[address & 0x7FF] = data;
        } else if (address < 0x4018) {
            if (address < 0x4000) {
                this.bus.ppu.write(address,data);
            } else if (address === 0x4014) {
                this.bus.ppu.doDMA(data * 256);
                
                if (this.cycle & 1) this.cycle += 513;
                else this.cycle += 514;
            } else if (address === 0x4016) {
                this.bus.controllers.write(address, data);
            } else {
                this.bus.apu.write(address, data);
            }
        } else {
            this.bus.game.cartridge.cpuWrite(address, data);
        }
    }
    
    //== Stack ==========================================================================//
    /** @param {number} value 8-bit value @private */
    pushByte(value) {
        const SP = this.SP;
        this.stack[SP] = value;
        this.SP = (SP > 0) ? SP - 1 : 0xFF;
    }
    /** @param {number} value 16-bit value @private */
    pushWord(value) {
        this.pushByte(value >> 8);
        this.pushByte(value & 0xFF);
    }
    
    /** @returns {number} 8-bit value @private */
    pullByte() {
        return this.stack[this.SP = wrapByte(this.SP + 1)];
    }
    /** @returns {number} 16-bit value @private */
    pullWord() {
        return this.pullByte() + this.pullByte()*256;
    }
    
    //== Status =========================================================================//
    get Carry()          { return (this.P & 0x01) > 0; }
    get Zero()           { return (this.P & 0x02) > 0; }
    get Interrupt()      { return (this.P & 0x04) > 0; }
    get Decimal()        { return (this.P & 0x08) > 0; }
    get Overflow()       { return (this.P & 0x40) > 0; }
    get Negative()       { return (this.P & 0x80) > 0; }
    
    set Carry(value)     { value ? (this.P |= 0x01) : (this.P &= ~0x01); }
    set Zero(value)      { value ? (this.P |= 0x02) : (this.P &= ~0x02); }
    set Interrupt(value) { value ? (this.P |= 0x04) : (this.P &= ~0x04); }
    set Decimal(value)   { value ? (this.P |= 0x08) : (this.P &= ~0x08); }
    set Overflow(value)  { value ? (this.P |= 0x40) : (this.P &= ~0x40); }
    set Negative(value)  { value ? (this.P |= 0x80) : (this.P &= ~0x80); }
    
    //== Arithmetic Logic Unit ==========================================================//
    /** @param {number} value @private */
    ALU(value) {
        if (value > 0xFF) {
            this.Carry = true;
            while (value > 0xFF) value -= 0x100;
        }
        
        this.Zero = (value === 0);
        
        if (value < 0) {
            this.Negative = true;
            while (value < 0) value += 0x100;
        } else
            this.Negative = (value >= 0x80);
        
        return value;
    }
    
    //== Interrupts =====================================================================//
    doNMI() {
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        this.PC = this.nmiVector();
        this.cycle += 7;
    }
    doReset() {
        this.SP = wrapByte(this.SP+3);
        this.PC = this.resetVector();
        this.Interrupt = true;
        this.cycle += 7;
    }
    doIRQ() {
        if (this.P & 0x04) return;
        
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        this.PC = this.irqVector();
        this.Interrupt = true;
        this.cycle += 7;
    }
    
    //== Addressing Modes ===============================================================//
    
    /** Implied
     * @private */
    imp() { return this.PC; }
    /** Immediate - `#00`
     * @private */
    imm() { return this.PC++; }
    
    /** Relative - `±#00`
     * @private */
    rel() { return ++this.PC + (this.operand = signByte(this.operand)); }
    
    /** Zero Page - `$00`
     * @private */
    zero()  { this.PC++; return this.operand; }
    /** Zero Page indexed X - `$00+X`
     * @private */
    zeroX() { return wrapByte(this.zero() + this.X); }
    /** Zero Page indexed Y - `$00+Y`
     * @private */
    zeroY() { return wrapByte(this.zero() + this.Y); }
    
    /** Absolute - `$0000`
     * @private */
    abs() { this.PC++; return this.operand += this.read(this.PC++)*256; }
    /** Absolute indexed X - `$0000+X`
     * @private */
    absX() {
        if ((this.operand + this.X) > 0xFF) this.cycle++;
        return this.abs() + this.X; }
    /** Absolute indexed Y - `$0000+Y`
     * @private */
    absY() {
        if ((this.operand + this.Y) > 0xFF) this.cycle++;
        return this.abs() + this.Y; }
    
    /** Indirect - `($0000)`
     * @private */
    ind() {
        const indirect = this.abs();
        return this.read(indirect) + this.read(indirect+1)*256; }
    /** Indirect indexed X - `($00+X)`
     * @private */
    indX() {
        const indirect = this.zeroX();
        return this.read(indirect) + this.read(indirect+1)*256; }
    /** Indirect indexed Y - `($00)+Y`
     * @private */
    indY() {
        const indirect = this.zero();
        const lowByte  = this.read(indirect);
        const highByte = this.read(indirect+1);
        if ((lowByte + this.Y) > 0xFF) this.cycle++;
        return lowByte + highByte*256 + this.Y; }
    
    //== Instructions ===================================================================//
    
    //-- Jump, subroutine and interrupt ------------------------------------//
    
    /** Interrupt
     * @private */
    BRK() {
        this.pushWord(this.PC+1);
        this.pushByte(this.P);
        this.Interrupt = true;
        this.PC = this.irqVector();
    }
    /** Return from Interrupt
     * @private */
    RTI() {
        this.P = this.pullByte();
        this.PC = this.pullWord();
    }
    /** Jump to Subroutine
     * @private */
    JSR() {
        this.pushWord(this.PC-1);
        this.PC = this.addressBus;
    }
    /** Return from Subroutine
     * @private */
    RTS() {
        this.PC = this.pullWord() + 1;
    }
    /** Jump to
     * @private */
    JMP() {
        this.PC = this.addressBus;
    }
    
    //-- Branching ---------------------------------------------------------//
    
    /** Branch if Positive
     * @private */
    BPL() {
        if (!this.Negative) this.branch();
    }
    /** Branch if Negative
     * @private */
    BMI() {
        if (this.Negative) this.branch();
    }
    /** Branch if oVerflow Clear
     * @private */
    BVC() {
        if (!this.Overflow) this.branch();
    }
    /** Branch if oVerflow Set
     * @private */
    BVS() {
        if (this.Overflow) this.branch();
    }
    /** Branch if Carry Clear
     * @private */
    BCC() {
        if (!this.Carry) this.branch();
    }
    /** Branch if Carry Set
     * @private */
    BCS() {
        if (this.Carry) this.branch();
    }
    /** Branch if Not Equal
     * @private */
    BNE() {
        if (!this.Zero) this.branch();
    }
    /** Branch if Equal
     * @private */
    BEQ() {
        if (this.Zero) this.branch();
    }
    
    /** @private */
    branch() {
        this.PC = this.addressBus;
        this.cycle++;
    }
    
    //-- Stack -------------------------------------------------------------//
    
    /** Push Accumulator
     * @private */
    PHA() { this.pushByte(this.A); }
    /** Push Processor Status
     * @private */
    PHP() { this.pushByte(this.P); }
    /** Pull Accumulator
     * @private */
    PLA() { this.A = this.ALU(this.pullByte()); }
    /** Pull Processor Status
     * @private */
    PLP() { this.P = this.pullByte(); }
    
    //-- Status flags ------------------------------------------------------//
    
    /** Clear Carry
     * @private */
    CLC() { this.Carry = false; }
    /** Clear Decimal
     * @private */
    CLD() { this.Decimal = false; }
    /** Clear Interrupt
     * @private */
    CLI() { this.Interrupt = false; }
    /** Clear Overflow
     * @private */
    CLV() { this.Overflow = false; }
    
    /** Set Carry
     * @private */
    SEC() { this.Carry = true; }
    /** Set Decimal
     * @private */
    SED() { this.Decimal = true; }
    /** Set Interrupt
     * @private */
    SEI() { this.Interrupt = true; }
    
    //-- Register transfer ------------------------------------------------//
    
    /** Transfer A to X
     * @private */
    TAX() { this.X = this.ALU(this.A); }
    /** Transfer X to A
     * @private */
    TXA() { this.A = this.ALU(this.X); }
    /** Transfer A to Y
     * @private */
    TAY() { this.Y = this.ALU(this.A); }
    /** Transfer Y to A
     * @private */
    TYA() { this.A = this.ALU(this.Y); }
    /** Transfer SP to X
     * @private */
    TSX() { this.X = this.ALU(this.SP); }
    /** Transfer X to SP
     * @private */
    TXS() { this.SP = this.X; }
    
    //-- Move operations ---------------------------------------------------//
    
    /** Load Accumulator
     * @private */
    LDA() { this.A = this.ALU(this.read(this.addressBus)); }
    /** Load X
     * @private */
    LDX() { this.X = this.ALU(this.read(this.addressBus)); }
    /** Load Y
     * @private */
    LDY() { this.Y = this.ALU(this.read(this.addressBus)); }
    
    /** Store Accumulator
     * @private */
    STA() { this.write(this.addressBus, this.A); }
    /** Store X
     * @private */
    STX() { this.write(this.addressBus, this.X); }
    /** Store Y
     * @private */
    STY() { this.write(this.addressBus, this.Y); }
    
    //-- Arithmetic operations ---------------------------------------------//
    
    /** Add with Carry
     * @private */
    ADC() { this.add(this.A, this.read(this.addressBus)); }
    /** Subtract with Carry
     * @private */
    SBC() { this.add(this.A, 0xFF-this.read(this.addressBus)); }
    
    /**
     * @param {number} reg
     * @param {number} operand
     * @private
     */
    add(reg, operand) {
        const alu = reg + operand + (this.Carry ? 1 : 0);
        this.Carry = false;
        this.Overflow = ((reg^alu) & (operand^alu) & 0x80) > 0;
        this.A = this.ALU(alu);
    }
    
    /** Arithmetic Shift Left
     * @private */
    ASL() {
        const operand = this.read(this.addressBus);
        this.write(this.addressBus, this.ALU(operand * 2));
        this.Carry = (operand >= 0x80);
    }
    /** Arithmetic Shift Left (implied)
     * @private */
    AXL() {
        const operand = this.A;
        this.A = this.ALU(operand * 2);
        this.Carry = (operand >= 0x80);
    }
    
    /** Logical Shift Right
     * @private */
    LSR() {
        const operand = this.read(this.addressBus);
        this.write(this.addressBus, this.ALU(operand >>> 1));
        this.Carry = (operand & 0x01) > 0;
    }
    /** Logical Shift Right (implied)
     * @private */
    LXR() {
        const operand = this.A;
        this.A = this.ALU(operand >>> 1);
        this.Carry = (operand & 0x01) > 0;
    }
    
    /** Rotate Left
     * @private */
    ROL() {
        const carry = (this.Carry ? 0x01 : 0x00);
        const operand = this.read(this.addressBus);
        this.write(this.addressBus, this.ALU((operand * 2) + carry));
        this.Carry = (operand >= 0x80);
    }
    /** Rotate Left (implied)
     * @private */
    RXL() {
        const carry = (this.Carry ? 0x01 : 0x00);
        const operand = this.A;
        this.A = this.ALU((operand * 2) + carry);
        this.Carry = (operand >= 0x80);
    }
    
    /** Rotate Right
     * @private */
    ROR() {
        const carry = (this.Carry ? 0x80 : 0x00);
        const operand = this.read(this.addressBus);
        this.write(this.addressBus, this.ALU((operand >>> 1) + carry));
        this.Carry = (operand & 0x01) > 0;
    }
    /** Rotate Right (implied)
     * @private */
    RXR() {
        const carry = (this.Carry ? 0x80 : 0x00);
        const operand = this.A;
        this.A = this.ALU((operand >>> 1) + carry);
        this.Carry = (operand & 0x01) > 0;
    }
    
    /** Increment memory
     * @private */
    INC() { this.write(this.addressBus, this.ALU(this.read(this.addressBus) + 1)); }
    /** Decrement memory
     * @private */
    DEC() { this.write(this.addressBus, this.ALU(this.read(this.addressBus) - 1)); }
    /** Increment X
     * @private */
    INX() { this.X = this.ALU(this.X + 1); }
    /** Decrement X
     * @private */
    DEX() { this.X = this.ALU(this.X - 1); }
    /** Increment Y
     * @private */
    INY() { this.Y = this.ALU(this.Y + 1); }
    /** Decrement Y
     * @private */
    DEY() { this.Y = this.ALU(this.Y - 1); }
    
    //-- Test operations ---------------------------------------------------//
    
    /** Bit test
     * @private */
    BIT() {
        const operand = this.read(this.addressBus);
        if (operand >= 0x80) {
            this.Negative = true;
            this.Overflow = (operand >= 0xC0);
        } else {
            this.Negative = false;
            this.Overflow = (operand >= 0x40);
        }
        this.Zero = !(this.A & operand);
    }
    
    /** Compare with Accumulator
     * @private */
    CMP() { this.compare(this.A, this.read(this.addressBus)); }
    /** Compare with X
     * @private */
    CPX() { this.compare(this.X, this.read(this.addressBus)); }
    /** Compare with Y
     * @private */
    CPY() { this.compare(this.Y, this.read(this.addressBus)); }
    
    /**
     * @param {number} reg
     * @param {number} operand
     * @private */
    compare(reg, operand) {
        this.ALU(reg + (0x100-operand));
        this.Carry = (reg >= operand);
    }
    
    //-- Logical operations ------------------------------------------------//
    
    /** Logical OR
     * @private */
    ORA() { this.A = this.ALU(this.A | this.read(this.addressBus)); }
    /** Logical AND
     * @private */
    AND() { this.A = this.ALU(this.A & this.read(this.addressBus)); }
    /** Exclusive OR
     * @private */
    EOR() { this.A = this.ALU(this.A ^ this.read(this.addressBus)); }
    
    //-- Misc --------------------------------------------------------------//
    
    /** No-Op
     * @private */
    NOP() { return; }
    /** Fault
     * @private */
    KIL() { this.doReset(); }
}

/**
 * Helper function to convert signed bytes to javascript's native numbers
 * @param {number} value
 */
function signByte(value) { return value>0x7F ? value-0x100 : value; }
/**
 * Helper function to simulate binary overflow
 * @param {number} value
 */
function wrapByte(value) { return value>0xFF ? value-0x100 : value; }

export default CPU;