import Channel from './Channel.js';

const duty = [
    0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6,  5,  4,  3,  2,  1,  0,
];

export class TriangleChannel extends Channel {
    constructor() {
        super();
        
        this.dutyCycle = 0;
        
        this.linearCounter      = 0;
        this.linearCounterMax   = 0;
        this.linearCounterReset = false;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
    }
    
    reset() {
        super.reset();
        
        this.dutyPosition  = 0;
        this.linearCounter = 0;
        
        this.timerCycle    = 0;
        
        this.counter = 0;
        this.timer   = 0;
    }
    
    //== Registers ==================================================//
    set counter(value) {
        if (value >= 0x80) {
            this.lengthCounterHalt = true;
            this.linearCounterMax  = (value - 0x80);
        } else {
            this.lengthCounterHalt = false;
            this.linearCounterMax  = value;
        }
        this.linearCounterControl = this.lengthCounterHalt;
    }
    
    get timer() {
        return this.timerPeriod;
    }
    set timer(value) {
        this.timerPeriod = (this.timerPeriod & 0x700) + value;
    }
    
    get length() {
        return super.length;
    }
    set length(value) {
        this.linearCounterReset = true;
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        
        super.length = value;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address) {
        case 0x4008: this.counter = data; break;
        case 0x400A: this.timer   = data; break;
        case 0x400B: this.length  = data; break;
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
        this.updateLength();
    }
    
    //== Output =====================================================//
    get output() {
        return duty[this.dutyCycle];
    }
}

export default TriangleChannel;
