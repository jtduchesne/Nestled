const lengths = [
    10, 254, 20,  2, 40,  4, 80,  6, 160,  8, 60, 10, 14, 12, 26, 14,
    12,  16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
];

export class Channel {
    constructor() {
        this.enabled = false;
        
        this.lengthCounter     = 0;
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.enabled = false;
        
        this.length  = 0;
    }
    
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        if (!value)
            this.lengthCounter = 0;
        this._enabled = value;
    }
    
    //== Registers ==================================================//
    get length() {
        return this.lengthCounter;
    }
    set length(value) {
        if (this.enabled)
            this.lengthCounter = lengths[(value & 0xF8) >>> 3];
    }
    
    updateLength() {
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
}

export default Channel;
