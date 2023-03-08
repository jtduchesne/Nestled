/**
 * @typedef {import('./NES.js').NES} NES
 * @typedef {(implied?:any) => any} FetchOperandFunc
 * @typedef {FetchOperandFunc} AddressingModeFunc
 * @typedef {(fnFetchOperand:FetchOperandFunc) => void} InstructionFunc
 */

/** Number of cycles by opcode lookup table. */
const cyclesLookup = [7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
                      2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7];

export class CPU {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        /** @private */
        this.bus = bus;
        
        this.cycle = 0;
        
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
        this.A = 0xFF;
        /**
         * **X index**
         * 
         * **X** is byte-wide and used for several addressing modes. It can be used as
         * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
         * the accumulator, it has limited addressing modes when loading and saving.
         */
        this.X = 0xFF;
        /**
         * **Y index**
         * 
         * **Y** is byte-wide and used for several addressing modes. It can be used as
         * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
         * the accumulator, it has limited addressing modes when loading and saving.
         */
        this.Y = 0xFF;
        /**
         * **Status Register**
         * 
         * `|---7----|---6----|--5--|---4---|---3---|----2----|--1---|---0---|`
         * `|Negative|oVerflow| - - | *BRK* |Decimal|Interrupt| Zero | Carry |`
         * 
         * **P** has 6 bits used by the **ALU** but is byte-wide. `PHP`, `PLP`,
         * *Arithmetic*, *Testing*, and *Branch* instructions can access this register.
         */
        this.P = 0xFF;
        /**
         * **Stack Pointer**
         * 
         * **S** is byte-wide and can be accessed using *Interrupts*, *Pulls*, *Pushes*,
         * and *Transfers*. It indexes into a 256 bytes stack at `[0x0100-0x01FF]`.
         */
        this.SP = 0xFF;
        /**
         * **Program Counter**
         * 
         * **PC** is 2-byte-wide and can be accessed either by CPU's internal fetch logic
         * increment, by an interrupt (*NMI*, *Reset*, *IRQ/BRQ*), or by using the
         * `RTS`/`JMP`/`JSR`/ *Branch* instructions.
         */
        this.PC = 0xFFFF;
        
        /**
         * Addressing modes by opcode lookup table.
         * @type {AddressingModeFunc[]}
         * @private
         */
        this.addressLookup = [
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
        
        /** @private */
        this.opcode  = 0x00;
        /** @private */
        this.operand = 0x00;
        
        this.isPowered = false;
    }
    
    //== Power ==========================================================================//
    powerOn() {
        this.cycle = 0;
        
        //Interrupt vectors optimizations
        const cart = this.bus.cartConnector.cartridge;
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
        
        this.bus.apu.powerOn();
        
        this.isPowered = true;
    }
    powerOff() {
        this.bus.apu.powerOff();
        
        this.isPowered = false;
    }
    
    reset() {
        this.bus.apu.reset();
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
        this.operand = this.read(this.PC++);
        
        this.instructionLookup[opcode](this.addressLookup[opcode]);
        
        this.cycle += cyclesLookup[opcode];
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
        this.P &= ~0x04;
        this.PC = this.resetVector();
        this.cycle += 7;
    }
    doIRQ() {
        if (this.P & 0x04) return;
        
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        this.PC = this.irqVector();
        this.cycle += 7;
    }
    
    //== Memory access ==================================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number}
     */
    read(address) {
        if (address < 0x800) {
            return this.ram[address];
        } else if (address < 0x2000) {
            return this.ram[address & 0x7FF];
        } else if (address < 0x4018) {
            if (address < 0x4000){
                return this.bus.ppu.readRegister(address);
            } else if (address >= 0x4016) {
                return this.bus.ctrlConnector.read(address);
            } else {
                return this.bus.apu.readRegister(address);
            }
        } else {
            return this.bus.cartConnector.cartridge.cpuRead(address);
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
                this.bus.ppu.writeRegister(address,data);
            } else if (address === 0x4014) {
                const ppu = this.bus.ppu;
                let dmaAddress = data * 256;
                for(let count = 0; count < 256; count++)
                    ppu.OAMData = this.read(dmaAddress++);
                
                if (this.cycle & 1) this.cycle += 513;
                else this.cycle += 514;
            } else if (address === 0x4016) {
                this.bus.ctrlConnector.write(address, data);
            } else {
                this.bus.apu.writeRegister(address, data);
            }
        } else {
            this.bus.cartConnector.cartridge.cpuWrite(address, data);
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
    /** @private @param {number} value */
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
    
    //== Addressing Modes ===============================================================//
    
    /** Implied
     * @template {number|boolean} T
     * @param {T} implied
     * @private */
    imp(implied) { this.PC--; return implied; }
    /** Immediate - `#00`
     * @private */
    imm() { return this.PC-1; }
    /** Relative - `±#00`
     * @private */
    rel() { this.cycle++; return signByte(this.operand); }
    
    /** Zero Page - `$00`
     * @private */
    zero()  { return this.operand; }
    /** Zero Page indexed X - `$00+X`
     * @private */
    zeroX() { return wrapByte(this.operand + this.X); }
    /** Zero Page indexed Y - `$00+Y`
     * @private */
    zeroY() { return wrapByte(this.operand + this.Y); }
    
    /** @private */
    readWord() { return this.operand += this.read(this.PC++)*256; }
    
    /** Absolute - `$0000`
     * @private */
    abs() { return this.readWord(); }
    /** Absolute indexed X - `$0000+X`
     * @private */
    absX() {
        if ((this.operand + this.X) > 0xFF) this.cycle++;
        return this.readWord() + this.X; }
    /** Absolute indexed Y - `$0000+Y`
     * @private */
    absY() {
        if ((this.operand + this.Y) > 0xFF) this.cycle++;
        return this.readWord() + this.Y; }
    
    /** Indirect - `($0000)`
     * @private */
    ind() {
        const indirect = this.readWord();
        return this.read(indirect) + this.read(indirect+1)*256; }
    /** Indirect indexed X - `($00+X)`
     * @private */
    indX() {
        const indirect = wrapByte(this.operand + this.X);
        return this.read(indirect) + this.read(indirect+1)*256; }
    /** Indirect indexed Y - `($00)+Y`
     * @private */
    indY() {
        const lowByte  = this.read(this.operand);
        const highByte = this.read(this.operand+1);
        if ((lowByte + this.Y) > 0xFF) this.cycle++;
        return lowByte + highByte*256 + this.Y; }
    
    //== OpCodes ========================================================================//
    
    //-- Jump, subroutine and interrupt ------------------------------------//
    
    /** Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BRK(fnFetchOperand) {
        this.pushWord(this.PC);
        this.pushByte(this.P);
        this.Interrupt = true;
        this.PC = fnFetchOperand(this.irqVector());
    }
    /** Return from Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    RTI(fnFetchOperand) {
        this.P = this.pullByte();
        this.PC = fnFetchOperand(this.pullWord());
    }
    /** Jump to Subroutine
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    JSR(fnFetchOperand) {
        this.pushWord(this.PC);
        this.PC = fnFetchOperand();
    }
    /** Return from Subroutine
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    RTS(fnFetchOperand) {
        this.PC = fnFetchOperand(this.pullWord() + 1);
    }
    /** Jump to
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    JMP(fnFetchOperand) {
        this.PC = fnFetchOperand();
    }
    
    //-- Branching ---------------------------------------------------------//
    
    /** Branch if Positive
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BPL(fnFetchOperand) {
        if (!this.Negative)
            this.PC += fnFetchOperand();
    }
    /** Branch if Negative
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BMI(fnFetchOperand) {
        if (this.Negative)
            this.PC += fnFetchOperand();
    }
    /** Branch if oVerflow Clear
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BVC(fnFetchOperand) {
        if (!this.Overflow)
            this.PC += fnFetchOperand();
    }
    /** Branch if oVerflow Set
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BVS(fnFetchOperand) {
        if (this.Overflow)
            this.PC += fnFetchOperand();
    }
    /** Branch if Carry Clear
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BCC(fnFetchOperand) {
        if (!this.Carry)
            this.PC += fnFetchOperand();
    }
    /** Branch if Carry Set
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BCS(fnFetchOperand) {
        if (this.Carry)
            this.PC += fnFetchOperand();
    }
    /** Branch if Not Equal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BNE(fnFetchOperand) {
        if (!this.Zero)
            this.PC += fnFetchOperand();
    }
    /** Branch if Equal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BEQ(fnFetchOperand) {
        if (this.Zero)
            this.PC += fnFetchOperand();
    }
    
    //-- Stack -------------------------------------------------------------//
    
    /** Push Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    PHA(fnFetchOperand) { this.pushByte(fnFetchOperand(this.A)); }
    /** Push Processor Status
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    PHP(fnFetchOperand) { this.pushByte(fnFetchOperand(this.P)); }
    /** Pull Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    PLA(fnFetchOperand) { this.A = this.ALU(fnFetchOperand(this.pullByte())); }
    /** Pull Processor Status
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    PLP(fnFetchOperand) { this.P = fnFetchOperand(this.pullByte()); }
    
    //-- Status flags ------------------------------------------------------//
    
    /** Clear Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CLC(fnFetchOperand) { fnFetchOperand(this.Carry = false); }
    /** Clear Decimal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CLD(fnFetchOperand) { fnFetchOperand(this.Decimal = false); }
    /** Clear Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CLI(fnFetchOperand) { fnFetchOperand(this.Interrupt = false); }
    /** Clear Overflow
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CLV(fnFetchOperand) { fnFetchOperand(this.Overflow = false); }
    
    /** Set Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    SEC(fnFetchOperand) { fnFetchOperand(this.Carry = true); }
    /** Set Decimal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    SED(fnFetchOperand) { fnFetchOperand(this.Decimal = true); }
    /** Set Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    SEI(fnFetchOperand) { fnFetchOperand(this.Interrupt = true); }
    
    //-- Register transfert ------------------------------------------------//
    
    /** Transfert A to X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TAX(fnFetchOperand) { fnFetchOperand(this.X = this.ALU(this.A)); }
    /** Transfert X to A
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TXA(fnFetchOperand) { fnFetchOperand(this.A = this.ALU(this.X)); }
    /** Transfert A to Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TAY(fnFetchOperand) { fnFetchOperand(this.Y = this.ALU(this.A)); }
    /** Transfert Y to A
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TYA(fnFetchOperand) { fnFetchOperand(this.A = this.ALU(this.Y)); }
    /** Transfert SP to X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TSX(fnFetchOperand) { fnFetchOperand(this.X = this.ALU(this.SP)); }
    /** Transfert X to SP
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    TXS(fnFetchOperand) { fnFetchOperand(this.SP = this.X); }
    
    //-- Move operations ---------------------------------------------------//
    
    /** Load Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    LDA(fnFetchOperand) { this.A = this.ALU(this.read(fnFetchOperand())); }
    /** Load X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    LDX(fnFetchOperand) { this.X = this.ALU(this.read(fnFetchOperand())); }
    /** Load Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    LDY(fnFetchOperand) { this.Y = this.ALU(this.read(fnFetchOperand())); }
    
    /** Store Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    STA(fnFetchOperand) { this.write(fnFetchOperand(), this.A); }
    /** Store X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    STX(fnFetchOperand) { this.write(fnFetchOperand(), this.X); }
    /** Store Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    STY(fnFetchOperand) { this.write(fnFetchOperand(), this.Y); }
    
    //-- Arithmetic operations ---------------------------------------------//
    
    /** Add with Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    ADC(fnFetchOperand) { this.add(this.A, this.read(fnFetchOperand())); }
    /** Subtract with Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    SBC(fnFetchOperand) { this.add(this.A, 0xFF-this.read(fnFetchOperand())); }
    
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
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    ASL(fnFetchOperand) {
        const address = fnFetchOperand();
        const operand = this.read(address);
        this.write(address, this.ALU(operand * 2));
        this.Carry = (operand >= 0x80);
    }
    /** Arithmetic Shift Left (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    AXL(fnFetchOperand) {
        const operand = fnFetchOperand(this.A);
        this.A = this.ALU(operand * 2);
        this.Carry = (operand >= 0x80);
    }
    
    /** Logical Shift Right
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    LSR(fnFetchOperand) {
        const address = fnFetchOperand();
        const operand = this.read(address);
        this.write(address, this.ALU(operand >>> 1));
        this.Carry = (operand & 0x01) > 0;
    }
    /** Logical Shift Right (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    LXR(fnFetchOperand) {
        const operand = fnFetchOperand(this.A);
        this.A = this.ALU(operand >>> 1);
        this.Carry = (operand & 0x01) > 0;
    }
    
    /** Rotate Left
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    ROL(fnFetchOperand) {
        const carry = (this.Carry ? 0x01 : 0x00);
        const address = fnFetchOperand();
        const operand = this.read(address);
        this.write(address, this.ALU((operand * 2) + carry));
        this.Carry = (operand >= 0x80);
    }
    /** Rotate Left (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    RXL(fnFetchOperand) {
        const carry = (this.Carry ? 0x01 : 0x00);
        const operand = fnFetchOperand(this.A);
        this.A = this.ALU((operand * 2) + carry);
        this.Carry = (operand >= 0x80);
    }
    
    /** Rotate Right
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    ROR(fnFetchOperand) {
        const carry = (this.Carry ? 0x80 : 0x00);
        const address = fnFetchOperand();
        const operand = this.read(address);
        this.write(address, this.ALU((operand >>> 1) + carry));
        this.Carry = (operand & 0x01) > 0;
    }
    /** Rotate Right (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    RXR(fnFetchOperand) {
        const carry = (this.Carry ? 0x80 : 0x00);
        const operand = fnFetchOperand(this.A);
        this.A = this.ALU((operand >>> 1) + carry);
        this.Carry = (operand & 0x01) > 0;
    }
    
    /** Increment memory
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    INC(fnFetchOperand) {
        const address = fnFetchOperand();
        this.write(address, this.ALU(this.read(address) + 1));
    }
    /** Decrement memory
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    DEC(fnFetchOperand) {
        const address = fnFetchOperand();
        this.write(address, this.ALU(this.read(address) - 1));
    }
    /** Increment X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    INX(fnFetchOperand) { this.X = this.ALU(fnFetchOperand(this.X) + 1); }
    /** Decrement X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    DEX(fnFetchOperand) { this.X = this.ALU(fnFetchOperand(this.X) - 1); }
    /** Increment Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    INY(fnFetchOperand) { this.Y = this.ALU(fnFetchOperand(this.Y) + 1); }
    /** Decrement Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    DEY(fnFetchOperand) { this.Y = this.ALU(fnFetchOperand(this.Y) - 1); }
    
    //-- Test operations ---------------------------------------------------//
    
    /** Bit test
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    BIT(fnFetchOperand) {
        const operand = this.read(fnFetchOperand());
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
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CMP(fnFetchOperand) { this.compare(this.A, this.read(fnFetchOperand())); }
    /** Compare with X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CPX(fnFetchOperand) { this.compare(this.X, this.read(fnFetchOperand())); }
    /** Compare with Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    CPY(fnFetchOperand) { this.compare(this.Y, this.read(fnFetchOperand())); }
    
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
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    ORA(fnFetchOperand) { this.A = this.ALU(this.A | this.read(fnFetchOperand())); }
    /** Logical AND
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    AND(fnFetchOperand) { this.A = this.ALU(this.A & this.read(fnFetchOperand())); }
    /** Exclusive OR
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    EOR(fnFetchOperand) { this.A = this.ALU(this.A ^ this.read(fnFetchOperand())); }
    
    //-- Misc --------------------------------------------------------------//
    
    /** No-Op
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    NOP(fnFetchOperand) { fnFetchOperand(); }
    /** Fault
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    KIL(fnFetchOperand) { fnFetchOperand(); this.doReset(); }
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