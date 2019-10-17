const timerPeriods = [ // fixed to NTSC for now
    428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
];

export class DMC {
    constructor(cpu) {
        this.cpu = cpu;
        
        this.enabled = false;
        
        this.cycle  = 0;
        this.output = 0;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
        
        this.sampleAddress = 0;
        this.sampleLength  = 0;
        this.sampleIndex   = 0;
        this.sampleLeft    = 0;
        this.sampleLoop    = false;
        this.sampleBuffer  = -1;
        
        this.shiftRegister     = -1;
        this.shiftRegisterBits = 0;
        
        this.irqEnabled = false;
        this.irq        = false;
    }
    
    reset() {
        this.cycle = 0;
        
        this.timerCycle = 0;
        
        this.sampleBuffer = -1;
        
        this.shiftRegister     = -1;
        this.shiftRegisterBits = 0;
        
        this.rate    = 0;
        this.load    = 0;
        this.address = 0;
        this.length  = 0;
    }
    
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        if (value) {
            if (this.sampleLeft === 0) {
                this.sampleIndex = 0;
                this.sampleLeft  = this.sampleLength;
            }
        } else {
            this.sampleLeft = 0;
        }
        this.irq = false;
        
        this._enabled = value;
    }
    
    //== Interrupt ==================================================//
    doIRQ() {
        this.irq = true;
        if (this.irqEnabled)
            this.cpu.doIRQ();
    }
    
    //== Registers ==================================================//
    get rate() {
        return this.timerPeriod;
    }
    set rate(value) {
        this.irqEnabled  = (value & 0x80) !== 0;
        this.sampleLoop  = (value & 0x40) !== 0;
        this.timerPeriod = timerPeriods[value & 0x0F];
        
        if (!this.irqEnabled)
            this.irq = false;
    }
    
    get load() {
        return this.output;
    }
    set load(value) {
        this.output = (value & 0x7F);
    }
    
    get address() {
        return this.sampleAddress;
    }
    set address(value) {
        this.sampleAddress = 0xC000 + (value * 64);
    }
    
    get length() {
        return this.sampleLength;
    }
    set length(value) {
        this.sampleLength = (value * 16) + 1;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address & 0x3) {
        case 0x0: this.rate    = data; break;
        case 0x1: this.load    = data; break;
        case 0x2: this.address = data; break;
        case 0x3: this.length  = data; break;
        }
    }
    
    //== Execution ==================================================//
    doCycle() {
        if (this.cycle > 0) {
            this.cycle--;
        }
        if (--this.timerCycle <= 0) {
            this.timerCycle = this.timerPeriod;
            this.updateSampleBuffer();
            this.updateShiftRegister();
            this.updateOutput();
        }
    }
    
    updateSampleBuffer() {
        if (this.sampleBuffer < 0 && this.sampleLeft > 0) {
            this.sampleBuffer = this.cpu.read(this.sampleAddress + this.sampleIndex++);
            this.cycle = 4;
            
            if (--this.sampleLeft <= 0) {
                if (this.sampleLoop) {
                    this.sampleIndex = 0;
                    this.sampleLeft = this.sampleLength;
                } else if (this.irqEnabled) {
                    this.doIRQ();
                }
            }
        }
    }
    
    updateShiftRegister() {
        if (--this.shiftRegisterBits <= 0) {
            this.shiftRegisterBits = 8;
            this.shiftRegister = this.sampleBuffer;
            this.sampleBuffer = -1;
        }
    }
    
    updateOutput() {
        if (this.shiftRegister >= 0) {
            if (this.shiftRegister & 1) {
                if (this.output <= 125) {
                    this.output += 2;
                }
            } else if (this.output >= 2) {
                this.output -= 2;
            }
            this.shiftRegister >>>= 1;
        }
    }
}

export default DMC;
