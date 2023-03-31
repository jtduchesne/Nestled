/** Timer period lookup */
const timerPeriods = [ // fixed to NTSC for now
    428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54
];

/**
 * Delta modulation channel outputs a 7-bit PCM signal.
 */
export class DMC {
    /**
     * @param {import('../NES.js').NES} bus
     */
    constructor(bus) {
        /** @private */
        this.bus = bus;
        
        this.timerCycle  = 0;
        this.timerPeriod = timerPeriods[0];
        
        /** A negative value means empty */
        this.sampleBuffer  = -1;
        this.sampleAddress = 0xC000;
        this.sampleLength  = 1;
        this.sampleLeft    = 0;
        this.sampleLoop    = false;
        
        /** A negative value means empty */
        this.shiftRegister      = -1;
        this.shiftRegisterCycle = 0;
        
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
        
        this.enabled = false;
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
            if (this.sampleLeft === 0)
                this.sampleLeft = this.sampleLength;
        } else {
            this.sampleLeft = 0;
        }
        this.irq = false;
    }
    
    //== Interrupt ======================================================================//
    /** @private */
    doIRQ() {
        this.irq = true;
        this.bus.cpu.doIRQ();
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get rate() {
        return this.timerPeriod;
    }
    set rate(value) {
        if (value > 0x0F) {
            this.irqEnabled  = (value & 0x80) !== 0;
            this.sampleLoop  = (value & 0x40) !== 0;
            this.timerPeriod = timerPeriods[value & 0x0F];
        } else {
            this.irqEnabled  = false;
            this.sampleLoop  = false;
            this.timerPeriod = timerPeriods[value];
        }
        
        if (!this.irqEnabled)
            this.irq = false;
    }
    
    /** @type {number} */
    get load() {
        return this.output;
    }
    set load(value) {
        if (value >= 0x80)
            this.output = value - 0x80;
        else
            this.output = value;
    }
    
    /** @type {number} */
    get address() {
        return this.sampleAddress;
    }
    set address(value) {
        this.sampleAddress = 0xC000 + (value * 64);
    }
    
    /** @type {number} */
    get length() {
        return this.sampleLength;
    }
    set length(value) {
        this.sampleLength = (value * 16) + 1;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x4010-0x4013
     * @param {number} data 8-bit data
     */
    write(address, data) {
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
            let sampleLeft = this.sampleLeft;
            let sampleLength = this.sampleLength;
            
            const index = sampleLength - sampleLeft;
            this.sampleBuffer = this.bus.cpu.read(this.sampleAddress + index);
            
            if (--sampleLeft > 0) {
                this.sampleLeft = sampleLeft;
            } else if (this.sampleLoop) {
                this.sampleLeft = sampleLength;
            } else {
                this.sampleLeft = 0;
                
                if (this.irqEnabled)
                    this.doIRQ();
            }
        }
    }
    
    /** @private */
    updateShiftRegister() {
        if (--this.shiftRegisterCycle <= 0) {
            this.shiftRegisterCycle = 8;
            this.shiftRegister = this.sampleBuffer;
            this.sampleBuffer = -1;
        }
    }
    
    /** @private */
    updateOutput() {
        const shiftRegister = this.shiftRegister;
        if (shiftRegister >= 0) {
            const output = this.output;
            
            if (shiftRegister & 1) {
                if (output <= 125)
                    this.output = output + 2;
            } else {
                if (output >= 2)
                    this.output = output - 2;
            }
            
            this.shiftRegister = shiftRegister >>> 1;
        }
    }
}

export default DMC;
