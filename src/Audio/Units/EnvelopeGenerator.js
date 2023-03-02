import LengthCounter from "./LengthCounter.js";

/**
 * The envelope generator controls the volume in one of two ways:
 * 
 * It can generate a decreasing saw envelope with optional looping, or it can generate a
 * constant volume that a more sophisticated software envelope generator can manipulate.
 */
export class EnvelopeGenerator extends LengthCounter {
    constructor() {
        super();
        
        this.constantVolume = 0;
        
        this.envelopeEnabled = true;
        this.envelopeReset   = false;
        this.envelopeCycle   = 0;
        this.envelopePeriod  = 0;
        this.envelopeVolume  = 0;
        this.envelopeLoop    = false;
    }
    
    reset() {
        super.reset();
        
        this.volume = 0;
        this.envelopeCycle  = 0;
        this.envelopeVolume = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get volume() {
        return this.envelopeEnabled ? this.envelopeVolume : this.constantVolume;
    }
    set volume(value) {
        if (value > 0x0F) {
            this.lengthCounterHalt =
            this.envelopeLoop      = (value & 0x20) !== 0;
            this.envelopeEnabled   = (value & 0x10) === 0;
            this.envelopePeriod    =
            this.constantVolume    = (value & 0x0F);
        } else {
            this.lengthCounterHalt = false;
            this.envelopeLoop      = false;
            this.envelopeEnabled   = true;
            this.envelopePeriod    = value;
            this.constantVolume    = value;
        }
    }
    
    /** @type {number} */
    get length() {
        return super.length;
    }
    set length(value) {
        this.envelopeReset = true;
        
        super.length = value;
    }
    
    //== Execution ======================================================================//
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
}

export default EnvelopeGenerator;
