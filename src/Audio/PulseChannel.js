import Channel from './Channel.js';

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
export class PulseChannel extends Channel {
    /**
     * @param {1|2} id The behavior of the two pulse channels differs in the effect
     * of the negate mode of their sweep units
     */
    constructor(id) {
        super();
        
        /** @private */
        this.id = id;
        
        this.constantVolume = 0;
        
        this.envelopeEnabled = true;
        this.envelopeReset   = false;
        this.envelopeCycle   = 0;
        this.envelopePeriod  = 0;
        this.envelopeVolume  = 0;
        this.envelopeLoop    = false;
        
        this.dutyCycle = 0;
        this.duty = [0,0,0,0,0,0,0,0];
        
        this.sweepEnabled = false;
        this.sweepReset   = false;
        this.sweepCycle   = 0;
        this.sweepPeriod  = 0;
        this.sweepNegate  = false;
        this.sweepShift   = 0;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
    }
    
    reset() {
        super.reset();
        
        this.envelopeCycle  = 0;
        this.envelopeVolume = 0;
        
        this.sweepCycle = 0;
        
        this.timerCycle = 0;
        
        this.volume = 0;
        this.sweep  = 0;
        this.timer  = 0;
    }
    
    //== Registers ======================================================================//
    /** @private @type {number} */
    get volume() {
        return this.envelopeEnabled ? this.envelopeVolume : this.constantVolume;
    }
    /** @private */
    set volume(value) {
        this.duty = dutySequences[(value & 0xC0) >>> 6];
        
        if (value > 0x0F) {
            this.lengthCounterHalt = (value & 0x20) !== 0;
            this.envelopeEnabled   = (value & 0x10) === 0;
            this.constantVolume    = (value & 0x0F);
        } else {
            this.lengthCounterHalt = false;
            this.envelopeEnabled   = true;
            this.constantVolume    = value;
        }
        this.envelopePeriod = this.constantVolume;
        this.envelopeLoop   = this.lengthCounterHalt;
    }
    
    /** @private @type {number} */
    get sweep() {
        const sweep = this.timerPeriod >>> this.sweepShift;
        return this.sweepNegate ? ((this.id === 1) ? ~sweep : -sweep) : sweep;
    }
    /** @private */
    set sweep(value) {
        this.sweepEnabled = (value & 0x80) !== 0;
        this.sweepPeriod  = (value & 0x70) >>> 4;
        this.sweepNegate  = (value & 0x08) !== 0;
        this.sweepShift   = (value & 0x07);
        this.sweepReset   = true;
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
        this.dutyCycle = 0;
        this.envelopeReset = true;
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        
        super.length = value;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address between 0x4000-0x4007
     * @param {number} data 8-bit data
     */
    writeRegister(address, data) {
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
            if (this.dutyCycle >= 0x8)
                this.dutyCycle -= 0x8;
        }
    }
    
    doQuarter() {
        if (this.envelopeReset) {
            this.envelopeCycle  = this.envelopePeriod;
            this.envelopeVolume = 0xF;
            this.envelopeReset  = false;
        } else if (this.envelopeCycle > 0) {
            this.envelopeCycle--;
        } else {
            this.envelopeCycle = this.envelopePeriod;
            if (this.envelopeVolume > 0) {
                this.envelopeVolume--;
            } else if (this.envelopeLoop) {
                this.envelopeVolume = 0xF;
            }
        }
    }
    
    doHalf() {
        if (this.sweepCycle > 0) {
            this.sweepCycle--;
        } else {
            if (this.sweepEnabled && this.sweepShift) {
                if (this.timer >= 0x008 && this.timer+this.sweep < 0x800)
                    this.timerPeriod += this.sweep;
            }
            this.sweepCycle = this.sweepPeriod;
        }
        if (this.sweepReset) {
            this.sweepCycle = this.sweepPeriod;
            this.sweepReset = false;
        }
        
        this.updateLength();
    }
    
    //== Output =========================================================================//
    /**
     * 4-bit output value
     * @type {number}
     */
    get output() {
        if (this.enabled && this.timer >= 0x008 && this.timer+this.sweep < 0x800) {
            return this.volume * this.duty[this.dutyCycle];
        } else {
            return 0;
        }
    }
}

export default PulseChannel;
