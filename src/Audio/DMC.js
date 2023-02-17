/** Timer period lookup */
const timerPeriods = [ // fixed to NTSC for now
    428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
];

/**
 * Delta modulation channel outputs a 7-bit PCM signal.
 */
export class DMC {
    /**
     * @param {import('../CPU.js').CPU} cpu
     */
    constructor(cpu) {
        /** @private */
        this.cpu = cpu;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
        
        /** A negative value means empty */
        this.sampleBuffer  = -1;
        this.sampleAddress = 0;
        this.sampleLength  = 0;
        this.sampleIndex   = 0;
        this.sampleLeft    = 0;
        this.sampleLoop    = false;
        
        /** A negative value means empty */
        this.shiftRegister      = -1;
        this.shiftRegisterCount = 0;
        
        this.irqEnabled = false;
        this.irq        = false;
        
        /**
         * 7-bit output value
         * @type {number}
         */
        this.output = 0;
    }
    
    reset() {
        this.timerCycle = 0;
        
        this.sampleBuffer = -1;
        
        this.shiftRegister      = -1;
        this.shiftRegisterCount = 0;
        
        this.rate    = 0;
        this.load    = 0;
        this.address = 0;
        this.length  = 0;
    }
    
    //===================================================================================//
    /** @type {boolean} */
    get enabled() {
        return this.sampleLeft > 0;
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
    }
    
    //== Interrupt ======================================================================//
    /** @private */
    doIRQ() {
        this.irq = true;
        this.cpu.doIRQ();
    }
    
    //== Registers ======================================================================//
    /** @private @type {number} */
    get rate() {
        return this.timerPeriod;
    }
    /** @private */
    set rate(value) {
        if (value >= 0x40) {
            this.irqEnabled  = (value & 0x80) !== 0;
            this.sampleLoop  = (value & 0x40) !== 0;
            this.timerPeriod = timerPeriods[value & 0x0F];
        } else {
            this.irqEnabled = false;
            this.sampleLoop = false;
            if (value > 0x0F)
                this.timerPeriod = timerPeriods[value & 0x0F];
            else
                this.timerPeriod = timerPeriods[value];
        }
        
        if (!this.irqEnabled)
            this.irq = false;
    }
    
    /** @private @type {number} */
    get load() {
        return this.output;
    }
    /** @private */
    set load(value) {
        if (value >= 0x80) value -= 0x80;
        this.output = value;
    }
    
    /** @private @type {number} */
    get address() {
        return this.sampleAddress;
    }
    /** @private */
    set address(value) {
        this.sampleAddress = 0xC000 + (value * 64);
    }
    
    /** @private @type {number} */
    get length() {
        return this.sampleLength;
    }
    /** @private */
    set length(value) {
        this.sampleLength = (value * 16) + 1;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x4010-0x4013
     * @param {number} data 8-bit data
     */
    writeRegister(address, data) {
        switch (address) {
        case 0x4010: this.rate    = data; break;
        case 0x4011: this.load    = data; break;
        case 0x4012: this.address = data; break;
        case 0x4013: this.length  = data; break;
        }
    }
    
    //== Execution ======================================================================//
    doCycle() {
        const timerCycle = this.timerCycle - 2;
        if (timerCycle <= 0) {
            this.timerCycle = this.timerPeriod;
            this.updateSampleBuffer();
            this.updateShiftRegister();
            this.updateOutput();
        } else {
            this.timerCycle = timerCycle;
        }
    }
    
    /** @private */
    updateSampleBuffer() {
        if (this.sampleBuffer < 0 && this.enabled) {
            this.sampleBuffer = this.cpu.read(this.sampleAddress + this.sampleIndex++);
            
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
    
    /** @private */
    updateShiftRegister() {
        if (--this.shiftRegisterCount <= 0) {
            this.shiftRegisterCount = 8;
            this.shiftRegister = this.sampleBuffer;
            this.sampleBuffer = -1;
        }
    }
    
    /** @private */
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
