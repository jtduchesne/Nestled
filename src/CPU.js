const cyclesPerFrame = 21477272/12/60; //Hardcoded to NTSC for now...

const cyclesLookup = [7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
                      2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
                      2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                      2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7];

export class CPU {
    constructor(nes) {
        this.bus = nes;
        
        this.ram   = new Uint8Array(0x800);
        this.stack = this.ram.subarray(0x100, 0x200);
        
        this.isPowered = false;
    }
    
    powerOn() {
        if (this.isPowered) this.powerOff();
        
        this.cycle = 0;
        this.instruction = 0;
        this.frame = 0;
        
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
        let cart = this.bus.cartridge;
        this.PC = cart.cpuRead(0xFFFC) + cart.cpuRead(0xFFFD)*256;
        
        this.isPowered = true;
    }
    powerOff() {
        this.isPowered = false;
    }
    
    //== Main loop ==================================================//
    doFrame() {
        while(this.cycle < cyclesPerFrame) {
            this.doInstruction(this.PC++);
            this.instruction++;
        }
        this.cycle -= cyclesPerFrame;
        this.frame++;
    }
    doInstruction(pc) {
        var opcode  = this.read(pc);
        var operand = this.read(pc+1);
         
        this.cycle += cyclesLookup[opcode];
    }
    
    //== Interrupts =================================================//
    doNMI() {
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        let cart = this.bus.cartridge;
        this.PC = cart.cpuRead(0xFFFA) + cart.cpuRead(0xFFFB)*256;
        this.cycle += 7;
    }
    doRESET() {
        this.SP = this.SP+3;
        this.Interrupt = true;
        let cart = this.bus.cartridge;
        this.PC = cart.cpuRead(0xFFFC) + cart.cpuRead(0xFFFD)*256;
        this.cycle += 7;
    }
    doIRQ() {
        this.pushWord(this.PC);
        this.pushByte(this.P & ~0x10);
        let cart = this.bus.cartridge;
        this.PC = cart.cpuRead(0xFFFE) + cart.cpuRead(0xFFFF)*256;
        this.cycle += 7;
    }
    
    //== Memory access ==============================================//
    read(address) {
        if (address < 0x2000) {
            return this.ram[address & 0x7FF];
        } else if (address < 0x4018) {
            if (address < 0x4000)        { /* return this.ppu.read(address); */ }
            else if (address === 0x4016) { /* return this.joypad[0].read(); */ }
            else if (address === 0x4017) { /* return this.joypad[1].read(); */ }
            else                         { /* return this.apu.read(); */ }
        } else {
            return this.bus.cartridge.cpuRead(address);
        }
    }
    write(address, data) {
        if (address < 0x2000) {
            this.ram[address & 0x7FF] = data;
        } else if (address < 0x4018) {
            if (address < 0x4000)        { /* this.ppu.write(address,data); */ }
            else if (address === 0x4014) { /* this.ppu.dma(data); */}
            else if (address === 0x4016) { /* (Joypads strobe); */ }
            else                         { /* this.apu.write(address,data); */ }
        } else {
            return this.bus.cartridge.cpuWrite(address, data);
        }
    }
    
    //== Stack ======================================================//
    get SP()      { return this._SP; }
    set SP(value) { this._SP = value & 0xFF; }
    
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
    
    //== OpCodes ====================================================//
    
}
 
export default CPU;