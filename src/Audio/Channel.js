import lengths from "./lengths.js";

export class Channel {
    constructor() {
        /** @private */
        this.lengthCounter = 0;
        /** @protected */
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.lengthCounter = 0;
    }
    
    //===================================================================================//
    /** @type {boolean} */
    get enabled() {
        return this.lengthCounter > 0;
    }
    set enabled(value) {
        if (!value)
            this.lengthCounter = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get length() {
        return this.lengthCounter;
    }
    set length(value) {
        this.lengthCounter = lengths[(value & 0xF8) >>> 3];
    }
    
    /** @protected */
    updateLength() {
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
}

export default Channel;
