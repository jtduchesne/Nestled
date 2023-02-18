import Channel from './Channel.js';

/** Output values lookup */
const values = [
    0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6,  5,  4,  3,  2,  1,  0,
];

/**
 * Triangle channel generates a pseudo-triangle wave.
 */
export class TriangleChannel extends Channel {
    constructor() {
        super();
        
        /** @private */
        this.position = 0;
        
        this.linearCounter        = 0;
        this.linearCounterMax     = 0;
        this.linearCounterReset   = false;
        this.linearCounterControl = false;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
    }
    
    reset() {
        super.reset();
        
        this.position = 0;
        
        this.linearCounter = 0;
        
        this.timerCycle = 0;
        
        this.counter = 0;
        this.timer   = 0;
    }
    
    //== Registers ======================================================================//
    /** @private @type {number} */
    get counter() {
        return this.linearCounter;
    }
    /** @private */
    set counter(value) {
        if (value >= 0x80) {
            this.lengthCounterHalt    = true;
            this.linearCounterControl = true;
            this.linearCounterMax     = (value - 0x80);
        } else {
            this.lengthCounterHalt    = false;
            this.linearCounterControl = false;
            this.linearCounterMax     = value;
        }
    }
    
    /** @private @type {number} */
    get timer() {
        return this.timerPeriod;
    }
    /** @private */
    set timer(value) {
        this.timerPeriod = (this.timerPeriod & 0x700) + value;
    }
    
    /** @type {number} */
    get length() {
        return super.length;
    }
    set length(value) {
        this.linearCounterReset = true;
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        
        super.length = value;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x4008-0x400B
     * @param {number} data 8-bit data
     */
    writeRegister(address, data) {
        switch (address) {
        case 0x4008: this.counter = data; break;
        case 0x400A: this.timer   = data; break;
        case 0x400B: this.length  = data; break;
        }
    }
    
    //== Execution ======================================================================//
    doCycle() {
        this.timerCycle -= 2;
        if (this.timerCycle <= 0) {
            this.timerCycle = (this.timer + 1);
            
            if (this.length && this.counter && this.timer > 3) {
                this.position++;
                if (this.position >= 0x20)
                    this.position -= 0x20;
            }
        }
    }
    
    doQuarter() {
        if (this.linearCounterReset) {
            this.linearCounter = this.linearCounterMax;
        } else if (this.linearCounter > 0) {
            this.linearCounter--;
        }
        
        if (!this.linearCounterControl)
            this.linearCounterReset = false;
    }
    
    doHalf() {
        this.updateLength();
    }
    
    //== Output =========================================================================//
    /**
     * 4-bit output value
     * @type {number}
     */
    get output() {
        return values[this.position];
    }
}

export default TriangleChannel;
