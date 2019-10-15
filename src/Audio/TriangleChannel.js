const duty = [
    0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6,  5,  4,  3,  2,  1,  0,
];
const lengths = [
    10, 254, 20,  2, 40,  4, 80,  6, 160,  8, 60, 10, 14, 12, 26, 14,
    12,  16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
];

export class TriangleChannel {
    constructor() {
        this.enabled = false;
        
        this.dutyCycle = 0;
        
        this.linearCounter      = 0;
        this.linearCounterMax   = 0;
        this.linearCounterReset = false;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
        
        this.lengthCounter     = 0;
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.enabled = false;
        
        this.dutyPosition  = 0;
        this.linearCounter = 0;
        this.timerCycle    = 0;
        this.timerPeriod   = 0;
        
        this.counter = 0;
        this.timer   = 0;
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
    set counter(value) {
        this.lengthCounterHalt = (value & 0x80) !== 0;
        this.linearCounterMax  = (value & 0x7F);
        this.linearCounterControl = this.lengthCounterHalt;
    }
    
    get timer() {
        return this.timerPeriod;
    }
    set timer(value) {
        this.timerPeriod = (this.timerPeriod & 0x700) | (value & 0xFF);
    }
    
    get length() {
        return this.lengthCounter;
    }
    set length(value) {
        if (this.enabled)
            this.lengthCounter = lengths[(value & 0xF8) >>> 3];
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        this.linearCounterReset = true;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address & 0x3) {
        case 0x0: this.counter = data; break;
        case 0x2: this.timer   = data; break;
        case 0x3: this.length  = data; break;
        }
    }
    
    //== Execution ==================================================//
    doCycle() {
        this.timerCycle -= 2;
        if (this.timerCycle <= 0) {
            this.timerCycle = (this.timerPeriod + 1);
            if (this.lengthCounter && this.linearCounter && this.timerPeriod > 3) {
                this.dutyCycle++;
                if (this.dutyCycle >= 0x20)
                    this.dutyCycle -= 0x20;
            }
        }
    }
    
    doQuarter() {
        if (this.linearCounterReset) {
            this.linearCounter = this.linearCounterMax;
        } else if (this.linearCounter > 0) {
            this.linearCounter--;
        }
        
        if (!this.linearCounterControl)
            this.linearCounterReset = false;
    }
    
    doHalf() {
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
    
    //== Output =====================================================//
    get output() {
        return duty[this.dutyCycle];
    }
}

export default TriangleChannel;
