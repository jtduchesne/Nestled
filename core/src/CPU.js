import APU from './APU.js';

const cyclesLookup = [7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
                      2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7];

//Helper function to convert signed bytes to javascript's native numbers
function signByte(value) { return value>0x7F ? value-0x100 : value; }
//Helper function to simulate binary overflow
function wrapByte(value) { return value>0xFF ? value-0x100 : value; }

export class CPU {
    constructor(nes) {
        this.bus = nes;
        
        this.apu = new APU(this);
        
        this.ram   = new Uint8Array(0x800);
        this.stack = this.ram.subarray(0x100, 0x200);
        
        //Addressing modes lookup table
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
        
        //Instructions lookup table
        this.instructionLookup = [
            this.BRK, this.ORA, this.KIL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP, this.PHP, this.ORA, this.ASL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP,
            this.BPL, this.ORA, this.KIL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP, this.CLC, this.ORA, this.NOP, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP,
            this.JSR, this.AND, this.KIL, this.NOP, this.BIT, this.AND, this.ROL, this.NOP, this.PLP, this.AND, this.ROL, this.NOP, this.BIT, this.AND, this.ROL, this.NOP,
            this.BMI, this.AND, this.KIL, this.NOP, this.NOP, this.AND, this.ROL, this.NOP, this.SEC, this.AND, this.NOP, this.NOP, this.NOP, this.AND, this.ROL, this.NOP,
            this.RTI, this.EOR, this.KIL, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP, this.PHA, this.EOR, this.LSR, this.NOP, this.JMP, this.EOR, this.LSR, this.NOP,
            this.BVC, this.EOR, this.KIL, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP, this.CLI, this.EOR, this.NOP, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP,
            this.RTS, this.ADC, this.KIL, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP, this.PLA, this.ADC, this.ROR, this.NOP, this.JMP, this.ADC, this.ROR, this.NOP,
            this.BVS, this.ADC, this.KIL, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP, this.SEI, this.ADC, this.NOP, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP,
            this.NOP, this.STA, this.NOP, this.NOP, this.STY, this.STA, this.STX, this.NOP, this.DEY, this.NOP, this.TXA, this.NOP, this.STY, this.STA, this.STX, this.NOP,
            this.BCC, this.STA, this.KIL, this.NOP, this.STY, this.STA, this.STX, this.NOP, this.TYA, this.STA, this.TXS, this.NOP, this.NOP, this.STA, this.NOP, this.NOP,
            this.LDY, this.LDA, this.LDX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP, this.TAY, this.LDA, this.TAX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP,
            this.BCS, this.LDA, this.KIL, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP, this.CLV, this.LDA, this.TSX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP,
            this.CPY, this.CMP, this.NOP, this.NOP, this.CPY, this.CMP, this.DEC, this.NOP, this.INY, this.CMP, this.DEX, this.NOP, this.CPY, this.CMP, this.DEC, this.NOP,
            this.BNE, this.CMP, this.KIL, this.NOP, this.NOP, this.CMP, this.DEC, this.NOP, this.CLD, this.CMP, this.NOP, this.NOP, this.NOP, this.CMP, this.DEC, this.NOP,
            this.CPX, this.SBC, this.NOP, this.NOP, this.CPX, this.SBC, this.INC, this.NOP, this.INX, this.SBC, this.NOP, this.NOP, this.CPX, this.SBC, this.INC, this.NOP,
            this.BEQ, this.SBC, this.KIL, this.NOP, this.NOP, this.SBC, this.INC, this.NOP, this.SED, this.SBC, this.NOP, this.NOP, this.NOP, this.SBC, this.INC, this.NOP
        ].map((fn) => fn.bind(this));
        
        this.isPowered = false;
    }
    
    powerOn() {
        this.cycle = 0;
        this.cycleOffset = 0;
        
        //Bus access optimizations
        this.ppu   = this.bus.ppu;
        this.ctrl1 = this.bus.ctrlConnector.controllers[0];
        this.ctrl2 = this.bus.ctrlConnector.controllers[1];
        this.cart  = this.bus.cartConnector.cartridge;
        
        //Interrupt vector optimizations
        let cart = this.bus.cartConnector.cartridge;
        this.nmiVector   = () => cart.cpuRead(0xFFFA) + cart.cpuRead(0xFFFB)*256;
        this.resetVector = () => cart.cpuRead(0xFFFC) + cart.cpuRead(0xFFFD)*256;
        this.irqVector   = () => cart.cpuRead(0xFFFE) + cart.cpuRead(0xFFFF)*256;
        
        //Accumulator
        this.A = 0;
        //Indexes
        this.X = 0;
        this.Y = 0;
        //Status register: Negative|oVerflow|---|*BRK*|Decimal|Interrupt|Zero|Carry
        this.P = 0x34; //b00110100
        //Stack pointer
        this.SP = 0xFD;
        //Program counter
        this.PC = this.resetVector();
        
        this.apu.powerOn();
        
        this.isPowered = true;
    }
    powerOff() {
        this.apu.powerOff();
        
        this.isPowered = false;
    }
    
    reset() {
        this.apu.reset();
        this.doReset();
    }
    
    //== Execution ==================================================//
    doInstructions(limit = 0) {
        limit += this.cycleOffset;
        while (this.cycle <= limit) {
            let cycles = this.doInstruction();
            this.apu.doCycles(cycles);
        }
    }
    
    doInstruction() {
        this.opcode  = this.read(this.PC++);
        this.operand = this.read(this.PC++);
        
        this.instructionLookup[this.opcode](
            (override) => this.addressLookup[this.opcode](
                (override !== undefined) ? override : this.operand
            )
        );
        let cycles = cyclesLookup[this.opcode];
        this.cycle += cycles;
        
        return cycles;
    }
    
    //== Interrupts =================================================//
    doNMI() {
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        this.PC = this.nmiVector();
        this.cycle += 7;
    }
    doReset() {
        this.SP = this.SP+3;
        this.Interrupt = false;
        this.PC = this.resetVector();
        this.cycle += 7;
    }
    doIRQ() {
        if (this.Interrupt) return;
        
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        this.PC = this.irqVector();
        this.cycle += 7;
    }
    
    //== Memory access ==============================================//
    read(address) {
        if (address < 0x800) {
            return this.ram[address];
        } else if (address < 0x2000) {
            return this.ram[address & 0x7FF];
        } else if (address < 0x4018) {
            if (address < 0x4000){
                return this.ppu.readRegister(address);
            } else if (address === 0x4016) {
                return (address >>> 8) | this.ctrl1.read();
            } else if (address === 0x4017) {
                return (address >>> 8) | this.ctrl2.read();
            } else {
                return this.apu.readRegister(address);
            }
        } else {
            return this.cart.cpuRead(address);
        }
    }
    write(address, data) {
        if (address < 0x800) {
            this.ram[address] = data;
        } else if (address < 0x2000) {
            this.ram[address & 0x7FF] = data;
        } else if (address < 0x4018) {
            if (address < 0x4000) {
                this.ppu.writeRegister(address,data);
            } else if (address === 0x4014) {
                let dmaAddress = data * 256;
                for(let count = 0; count < 256; count++)
                    this.ppu.OAMData = this.read(dmaAddress++);
                
                if (this.cycle & 1) this.cycle += 513;
                else this.cycle += 514;
            } else if (address === 0x4016) {
                this.ctrl1.write(data);
                this.ctrl2.write(data);
            } else {
                this.apu.writeRegister(address, data);
            }
        } else {
            return this.cart.cpuWrite(address, data);
        }
    }
    
    //== Stack ======================================================//
    get SP()      { return this._SP; }
    set SP(value) { this._SP = wrapByte(value); }
    
    pushByte(value) {
        this.stack[this.SP--] = value;
    }
    pushWord(value) {
        this.pushByte(value >> 8);
        this.pushByte(value & 0xFF);
    }
    
    pullByte() {
        this.SP++;
        return this.stack[this.SP];
    }
    pullWord() {
        return this.pullByte() + this.pullByte()*256;
    }
    
    //== Status =====================================================//
    get Carry()          { return this.P & 0x01; }
    get Zero()           { return this.P & 0x02; }
    get Interrupt()      { return this.P & 0x04; }
    get Decimal()        { return this.P & 0x08; }
    get Overflow()       { return this.P & 0x40; }
    get Negative()       { return this.P & 0x80; }
    
    set Carry(value)     { (value ? (this.P |= 0x01) : this.P &= ~0x01); }
    set Zero(value)      { (value ? (this.P |= 0x02) : this.P &= ~0x02); }
    set Interrupt(value) { (value ? (this.P |= 0x04) : this.P &= ~0x04); }
    set Decimal(value)   { (value ? (this.P |= 0x08) : this.P &= ~0x08); }
    set Overflow(value)  { (value ? (this.P |= 0x40) : this.P &= ~0x40); }
    set Negative(value)  { (value ? (this.P |= 0x80) : this.P &= ~0x80); }
    
    //== Registers ==================================================//
    get A() { return this._A; }
    get X() { return this._X; }
    get Y() { return this._Y; }
    
    set A(value) { this._A = this.ALU(value); }
    set X(value) { this._X = this.ALU(value); }
    set Y(value) { this._Y = this.ALU(value); }
    
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
    
    //== Addressing Modes ===========================================//
    
    imp(operand) { this.PC--; return operand; }                 //Implied
    /* eslint-disable-next-line no-unused-vars */
    imm(operand) { return this.PC-1; }                          //Immediate - #00
    rel(operand) {
        this.cycle++;
        return this.PC + signByte(operand); }                   //Relative - ±#00
    
    zero(operand)  { return operand; }                          //Zero Page - $00
    zeroX(operand) { return wrapByte(operand + this.X); }       //Zero Page indexed X - $00+X
    zeroY(operand) { return wrapByte(operand + this.Y); }       //Zero Page indexed Y - $00+Y
    
    readWord(operand) { return this.operand = operand + this.read(this.PC++)*256; }
    
    abs(operand) {
        return this.readWord(operand); }                        //Absolute - $0000
    absX(operand) {
        if ((operand + this.X) > 0xFF) this.cycle++;
        return this.readWord(operand) + this.X; }               //Absolute indexed X - $0000+X
    absY(operand) {
        if ((operand + this.Y) > 0xFF) this.cycle++;
        return this.readWord(operand) + this.Y; }               //Absolute indexed Y - $0000+Y
    
    ind(operand) {
        operand = this.readWord(operand);
        return this.read(operand) + this.read(operand+1)*256; } //Indirect - ($0000)
    indX(operand) {
        operand = wrapByte(operand + this.X);
        return this.read(operand) + this.read(operand+1)*256; } //Indirect indexed X - ($00+X)
    indY(operand) {
        operand = this.read(operand) + this.read(operand+1)*256;
        if ((wrapByte(operand) + this.Y) > 0xFF) this.cycle++;
        return operand + this.Y; }                              //Indirect indexed Y - ($00)+Y
    
    //== OpCodes ====================================================//
    
    // Jump, subroutine and interrupt
    BRK(fnFetchOperand) { //Interrupt
        this.pushWord(this.PC);
        this.pushByte(this.P);
        this.Interrupt = true;
        this.PC = fnFetchOperand(this.irqVector());
    }
    RTI(fnFetchOperand) { //Return from Interrupt
        this.P = this.pullByte();
        this.PC = fnFetchOperand(this.pullWord());
    }
    JSR(fnFetchOperand) { //Jump to Subroutine
        this.pushWord(this.PC);
        this.PC = fnFetchOperand();
    }
    RTS(fnFetchOperand) { //Return from Subroutine
        this.PC = fnFetchOperand(this.pullWord() + 1);
    }
    JMP(fnFetchOperand) { //Jump to
        this.PC = fnFetchOperand();
    }
    
    // Branching
    BPL(fnFetchOperand) { //Branch if Positive
        if (!this.Negative)
            this.PC = fnFetchOperand();
    }
    BMI(fnFetchOperand) { //Branch if Negative
        if (this.Negative)
            this.PC = fnFetchOperand();
    }
    BVC(fnFetchOperand) { //Branch if oVerflow Clear
        if (!this.Overflow)
            this.PC = fnFetchOperand();
    }
    BVS(fnFetchOperand) { //Branch if oVerflow Set
        if (this.Overflow)
            this.PC = fnFetchOperand();
    }
    BCC(fnFetchOperand) { //Branch if Carry Clear
        if (!this.Carry)
            this.PC = fnFetchOperand();
    }
    BCS(fnFetchOperand) { //Branch if Carry Set
        if (this.Carry)
            this.PC = fnFetchOperand();
    }
    BNE(fnFetchOperand) { //Branch if Not Equal
        if (!this.Zero)
            this.PC = fnFetchOperand();
    }
    BEQ(fnFetchOperand) { //Branch if Equal
        if (this.Zero)
            this.PC = fnFetchOperand();
    }
    
    // Stack
    PHA(fnFetchOperand) { this.pushByte(fnFetchOperand(this.A)); } //Push Accumulator
    PHP(fnFetchOperand) { this.pushByte(fnFetchOperand(this.P)); } //Push Processor Status
    PLA(fnFetchOperand) { this.A = fnFetchOperand(this.pullByte()); } //Pull Accumulator
    PLP(fnFetchOperand) { this.P = fnFetchOperand(this.pullByte()); } //Pull Processor Status
    
    // Status flags
    CLC(fnFetchOperand) { fnFetchOperand(this.Carry = false); }
    CLD(fnFetchOperand) { fnFetchOperand(this.Decimal = false); }
    CLI(fnFetchOperand) { fnFetchOperand(this.Interrupt = false); }
    CLV(fnFetchOperand) { fnFetchOperand(this.Overflow = false); }
    
    SEC(fnFetchOperand) { fnFetchOperand(this.Carry = true); }
    SED(fnFetchOperand) { fnFetchOperand(this.Decimal = true); }
    SEI(fnFetchOperand) { fnFetchOperand(this.Interrupt = true); }
    
    // Register transfert
    TAX(fnFetchOperand) { fnFetchOperand(this.X = this.A); }  //Transfert A to X
    TXA(fnFetchOperand) { fnFetchOperand(this.A = this.X); }  //Transfert X to A
    TAY(fnFetchOperand) { fnFetchOperand(this.Y = this.A); }  //Transfert A to Y
    TYA(fnFetchOperand) { fnFetchOperand(this.A = this.Y); }  //Transfert Y to A
    TSX(fnFetchOperand) { fnFetchOperand(this.X = this.SP); } //Transfert SP to X
    TXS(fnFetchOperand) { fnFetchOperand(this.SP = this.X); } //Transfert X to SP
    
    // Move operations
    LDA(fnFetchOperand) { this.A = this.read(fnFetchOperand()); } //Load Accumulator
    LDX(fnFetchOperand) { this.X = this.read(fnFetchOperand()); } //Load X
    LDY(fnFetchOperand) { this.Y = this.read(fnFetchOperand()); } //Load Y
    STA(fnFetchOperand) { this.write(fnFetchOperand(), this.A); } //Store Accumulator
    STX(fnFetchOperand) { this.write(fnFetchOperand(), this.X); } //Store X
    STY(fnFetchOperand) { this.write(fnFetchOperand(), this.Y); } //Store Y
    
    // Arithmetic operations
    ADC(fnFetchOperand) { this.add(this.A, this.read(fnFetchOperand()));      } //Add with Carry
    SBC(fnFetchOperand) { this.add(this.A, 0xFF-this.read(fnFetchOperand())); } //Subtract with Carry
    add(reg, operand) {
        let alu = reg + operand + this.Carry;
        this.Carry = false;
        this.Overflow = (reg^alu) & (operand^alu) & 0x80;
        this.A = alu;
    }
    
    ASL(fnFetchOperand) { //Arithmetic Shift Left
        let operand;
        if (this.opcode === 0x0A) { //Opcode $0A is implied
            operand = fnFetchOperand(this.A);
            this.A = operand * 2;
        } else {
            let address = fnFetchOperand();
            operand = this.read(address);
            this.write(address, this.ALU(operand * 2));
        }
        this.Carry = (operand & 0x80);
    }
    LSR(fnFetchOperand) { //Logical Shift Right
        let operand;
        if (this.opcode === 0x4A) { //Opcode $4A is implied
            operand = fnFetchOperand(this.A);
            this.A = operand >>> 1;
        } else {
            let address = fnFetchOperand();
            operand = this.read(address);
            this.write(address, this.ALU(operand >>> 1));
        }
        this.Carry = (operand & 0x01);
    }
    ROL(fnFetchOperand) { //Rotate Left
        let operand;
        if (this.opcode === 0x2A) { //Opcode $2A is implied
            operand = fnFetchOperand(this.A);
            this.A = operand * 2 + this.Carry;
        } else {
            let address = fnFetchOperand();
            operand = this.read(address);
            this.write(address, this.ALU(operand * 2 + this.Carry));
        }
        this.Carry = (operand & 0x80);
    }
    ROR(fnFetchOperand) { //Rotate Right
        let operand;
        if (this.opcode === 0x6A) { //Opcode $6A is implied
            operand = fnFetchOperand(this.A);
            this.A = (operand >>> 1) + this.Carry*128;
        } else {
            let address = fnFetchOperand();
            operand = this.read(address);
            this.write(address, this.ALU((operand >>> 1) + this.Carry*128));
        }
        this.Carry = (operand & 0x01);
    }
    
    INC(fnFetchOperand) { //Increment memory
        let address = fnFetchOperand();
        this.write(address, this.ALU(this.read(address) + 1));
    }
    DEC(fnFetchOperand) { //Decrement memory
        let address = fnFetchOperand();
        this.write(address, this.ALU(this.read(address) - 1));
    }
    INX(fnFetchOperand) { this.X = fnFetchOperand(this.X) + 1; } //Increment X
    DEX(fnFetchOperand) { this.X = fnFetchOperand(this.X) - 1; } //Decrement X
    INY(fnFetchOperand) { this.Y = fnFetchOperand(this.Y) + 1; } //Increment Y
    DEY(fnFetchOperand) { this.Y = fnFetchOperand(this.Y) - 1; } //Decrement Y
    
    BIT(fnFetchOperand) { //Bit test
        let operand = this.read(fnFetchOperand());
        this.Negative = (operand >= 0x80);
        if (this.Negative) {
            this.Overflow = (operand >= 0xC0);
        } else {
            this.Overflow = (operand >= 0x40);
        }
        this.Zero = !(this.A & operand);
    }
    
    CMP(fnFetchOperand) { this.compare(this.A, this.read(fnFetchOperand())); } //Compare with Accumulator
    CPX(fnFetchOperand) { this.compare(this.X, this.read(fnFetchOperand())); } //Compare with X
    CPY(fnFetchOperand) { this.compare(this.Y, this.read(fnFetchOperand())); } //Compare with Y
    compare(reg, operand) {
        this.ALU(reg + (0x100-operand));
        this.Carry = (reg >= operand);
    }
    
    // Logical operations
    ORA(fnFetchOperand) { this.A = this.A | this.read(fnFetchOperand()); } //Logical OR
    AND(fnFetchOperand) { this.A = this.A & this.read(fnFetchOperand()); } //Logical AND
    EOR(fnFetchOperand) { this.A = this.A ^ this.read(fnFetchOperand()); } //Exclusive OR
    
    // Others
    NOP(fnFetchOperand) { fnFetchOperand(); }
    KIL(fnFetchOperand) { this.doReset(); } // eslint-disable-line no-unused-vars
}
 
export default CPU;