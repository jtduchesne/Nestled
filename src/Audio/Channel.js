import lengths from "./lengths.js";

export class Channel {
    constructor() {
        /** @private */
        this.disabled = true;
        /** @private */
        this.lengthCounter = 0;
        /** @protected */
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.enabled = false;
    }
    
    //===================================================================================//
    /** @type {boolean} */
    get enabled() {
        return this.lengthCounter > 0;
    }
    set enabled(value) {
        if ((this.disabled = !value))
            this.lengthCounter = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get length() {
        return this.lengthCounter;
    }
    set length(value) {
        if (!this.disabled)
            this.lengthCounter = lengths[(value & 0xF8) >>> 3];
    }
    
    //== Execution ======================================================================//
    doHalf() {
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
}

export default Channel;
