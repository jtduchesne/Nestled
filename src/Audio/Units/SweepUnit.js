import EnvelopeGenerator from "./EnvelopeGenerator.js";

/**
 * The sweep unit can be made to periodically adjust a Pulse channel's period up or down.
 */
export class SweepUnit extends EnvelopeGenerator {
    /**
     * @param {number} negateMode
     */
    constructor(negateMode) {
        super();
        
        /** @private */
        this.negateMode = negateMode;
        
        this.sweepEnabled = false;
        this.sweepReset   = false;
        this.sweepCycle   = 0;
        this.sweepPeriod  = 0;
        this.sweepNegate  = false;
        this.sweepShift   = 0;
    }
    
    reset() {
        super.reset();
        
        this.sweep = 0;
        this.sweepCycle = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get sweep() {
        const timer = this.timer;
        const sweep = timer >>> this.sweepShift;
        return timer + (this.sweepNegate ? ((this.negateMode === 1) ? ~sweep : -sweep) : sweep);
    }
    set sweep(value) {
        this.sweepEnabled = (value & 0x80) !== 0;
        this.sweepPeriod  = (value & 0x70) >>> 4;
        this.sweepNegate  = (value & 0x08) !== 0;
        this.sweepShift   = (value & 0x07);
        this.sweepReset   = true;
    }
    
    //== Execution ======================================================================//
    doHalf() {
        if (this.sweepCycle > 0) {
            this.sweepCycle--;
        } else {
            if (this.sweepEnabled && this.sweepShift) {
                if (this.timer >= 0x008 && this.sweep < 0x800)
                    this.timerPeriod = this.sweep;
            }
            this.sweepCycle = this.sweepPeriod;
        }
        if (this.sweepReset) {
            this.sweepCycle = this.sweepPeriod;
            this.sweepReset = false;
        }
        
        super.doHalf();
    }
}

export default SweepUnit;
