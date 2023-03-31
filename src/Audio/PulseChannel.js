import { SweepUnit } from "./Units/index.js";

/** Duty cycle sequences lookup */
const dutySequences = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 0],
];

/**
 * Pulse channels generate a square wave with variable duty.
 */
export class PulseChannel extends SweepUnit {
    /**
     * @param {1|2} id The behavior of the two pulse channels differs in the effect
     * of the negate mode of their sweep units
     */
    constructor(id) {
        super(id);
        
        /** @private */
        this.dutyCycle = 0;
        /** @private */
        this.duty = [0,0,0,0,0,0,0,0];
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get volume() {
        return super.volume;
    }
    set volume(value) {
        if (value > 0x3F) {
            this.duty = dutySequences[(value & 0xC0) >>> 6];
        } else {
            this.duty = dutySequences[0];
        }
        super.volume = value;
    }
    
    /** @type {number} */
    get length() {
        return super.length;
    }
    set length(value) {
        this.dutyCycle = 0;
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        
        super.length = value;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x4000-0x4007
     * @param {number} data 8-bit data
     */
    write(address, data) {
        switch (address) {
        case 0x4000: case 0x4004: this.volume = data; break;
        case 0x4001: case 0x4005: this.sweep  = data; break;
        case 0x4002: case 0x4006: this.timer  = data; break;
        case 0x4003: case 0x4007: this.length = data; break;
        }
    }
    
    //== Execution ======================================================================//
    doCycle() {
        if (--this.timerCycle <= 0) {
            this.timerCycle = (this.timerPeriod + 1);
            
            this.dutyCycle++;
            if (this.dutyCycle >= 8)
                this.dutyCycle = 0;
        }
    }
    
    //== Output =========================================================================//
    /**
     * 4-bit output value
     * @type {number}
     */
    get output() {
        if (this.enabled && this.timer >= 0x008 && this.sweep < 0x800) {
            return this.volume * this.duty[this.dutyCycle];
        } else {
            return 0;
        }
    }
}

export default PulseChannel;
