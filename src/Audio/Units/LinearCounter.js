import LengthCounter from './LengthCounter.js';

/**
 * The linear counter is an extra duration timer of higher accuracy than the length
 * counter.
 */
export class LinearCounter extends LengthCounter {
    constructor() {
        super();
        
        this.linearCounter        = 0;
        this.linearCounterMax     = 0;
        this.linearCounterReset   = false;
        this.linearCounterControl = false;
    }
    
    reset() {
        super.reset();
        
        this.counter = 0;
        this.linearCounter = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get counter() {
        return this.linearCounter;
    }
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
    
    /** @type {number} */
    get length() {
        return super.length;
    }
    set length(value) {
        this.linearCounterReset = true;
        
        super.length = value;
    }
    
    //== Execution ======================================================================//
    doQuarter() {
        if (this.linearCounterReset) {
            this.linearCounter = this.linearCounterMax;
        } else if (this.linearCounter > 0) {
            this.linearCounter--;
        }
        
        if (!this.linearCounterControl)
            this.linearCounterReset = false;
    }
}

export default LinearCounter;
