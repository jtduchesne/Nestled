import LinearCounter from './LinearCounter.js';

/** Output values lookup */
const values = [
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6,  5,  4,  3,  2,  1,  0,
    0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

/**
 * Triangle channel generates a pseudo-triangle wave.
 */
export class TriangleChannel extends LinearCounter {
    constructor() {
        super();
        
        /** @private */
        this.phase = 0;
    }
    
    reset() {
        super.reset();
        
        this.phase = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get length() {
        return super.length;
    }
    set length(value) {
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
                const phase = this.phase + 1;
                if (phase < 32)
                    this.phase = phase;
                else
                    this.phase = 0;
            }
        }
    }
    
    //== Output =========================================================================//
    /**
     * 4-bit output value
     * @type {number}
     */
    get output() {
        return values[this.phase];
    }
}

export default TriangleChannel;
