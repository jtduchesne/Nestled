/**
 * The timer is used in each of the channels to control the sound frequency.
 */
export class TimerUnit {
    constructor() {
        this.timerCycle  = 0;
        this.timerPeriod = 0;
    }
    
    reset() {
        this.timer = 0;
        this.timerCycle = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get timer() {
        return this.timerPeriod;
    }
    set timer(value) {
        const timerPeriod = this.timerPeriod;
        if (timerPeriod > 0xFF)
            this.timerPeriod = (timerPeriod & 0x700) + value;
        else
            this.timerPeriod = value;
    }
}

export default TimerUnit;
