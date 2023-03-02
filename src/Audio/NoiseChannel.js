import { EnvelopeGenerator } from './Units/index.js';

/** Timer period lookup */
const timerPeriods = [ // fixed to NTSC for now
    4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
];

/**
 * Noise channel generates pseudo-random 1-bit noise at 16 different frequencies.
 */
export class NoiseChannel extends EnvelopeGenerator {
    constructor() {
        super();
        
        this.timerMode = false;
        
        /** @private */
        this.shiftRegister = 1;
    }
    
    //== Registers ======================================================================//
    
    /** @type {number} */
    get timer() {
        return this.timerPeriod;
    }
    set timer(value) {
        if (value > 0x0F) {
            this.timerMode   = (value >= 0x80);
            this.timerPeriod = timerPeriods[value & 0x0F];
        } else {
            this.timerMode   = false;
            this.timerPeriod = timerPeriods[value];
        }
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x400C-0x400F
     * @param {number} data 8-bit data
     */
    writeRegister(address, data) {
        switch (address) {
        case 0x400C: this.volume = data; break;
        case 0x400E: this.timer  = data; break;
        case 0x400F: this.length = data; break;
        }
    }
    
    //== Execution ======================================================================//
    doCycle() {
        if (--this.timerCycle <= 0) {
            this.timerCycle = (this.timerPeriod + 1);
            
            const shiftRegister = this.shiftRegister;
            let feedback = (shiftRegister & 1);
            if (this.timerMode)
                feedback ^= ((shiftRegister >>> 6) & 1);
            else
                feedback ^= ((shiftRegister >>> 1) & 1);
            
            this.shiftRegister = (shiftRegister >>> 1) | (feedback << 14);
        }
    }
    
    //== Output =========================================================================//
    /**
     * 4-bit output value
     * @type {number}
     */
    get output() {
        if (this.enabled && !(this.shiftRegister & 1)) {
            return this.volume;
        } else {
            return 0;
        }
    }
}

export default NoiseChannel;
