const duties = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 0],
];
const lengths = [
    10, 254, 20,  2, 40,  4, 80,  6, 160,  8, 60, 10, 14, 12, 26, 14,
    12,  16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
];

export class PulseChannel {
    constructor(id) {
        this.id = id;
        
        this.enabled = false;
        this.volume  = 0;
        
        this.constantVolume = false;
        
        this.envelopeReset  = false;
        this.envelopeCycle  = 0;
        this.envelopePeriod = 0;
        this.envelopeVolume = 0;
        this.envelopeLoop   = false;
        
        this.dutyCycle     = 0;
        this.dutySelection = 0;
        
        this.sweepEnabled = false;
        this.sweepReset   = false;
        this.sweepCycle   = 0;
        this.sweepPeriod  = 0;
        this.sweepNegate  = false;
        this.sweepShift   = 0;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
        
        this.lengthCounter     = 0;
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.enabled = false;
        
        this.envelopeCycle  = 0;
        this.envelopeVolume = 0;
        this.sweepCycle     = 0;
        this.timerCycle     = 0;
        this.timerPeriod    = 0;
        
        this.duty   = 0;
        this.sweep  = 0;
        this.timer  = 0;
        this.length = 0;
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
    get duty() {
        return duties[this.dutySelection];
    }
    set duty(value) {
        this.dutySelection     = (value & 0xC0) >>> 6;
        
        this.volume            = (value & 0x0F);
        this.constantVolume    = (value & 0x10) !== 0;
        this.lengthCounterHalt = (value & 0x20) !== 0;
        
        this.envelopePeriod   = this.volume;
        this.envelopeLoop     = this.lengthCounterHalt;
    }
    
    get sweep() {
        let sweep = this.timerPeriod >>> this.sweepShift;
        return this.sweepNegate ? ((this.id === 1) ? ~sweep : -sweep) : sweep;
    }
    set sweep(value) {
        this.sweepEnabled = (value & 0x80) !== 0;
        this.sweepPeriod  = (value & 0x70) >>> 4;
        this.sweepNegate  = (value & 0x08) !== 0;
        this.sweepShift   = (value & 0x07);
        this.sweepReset   = true;
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
        this.dutyCycle = 0;
        this.envelopeReset = true;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address & 0x3) {
        case 0x0: this.duty   = data; break;
        case 0x1: this.sweep  = data; break;
        case 0x2: this.timer  = data; break;
        case 0x3: this.length = data; break;
        }
    }
    
    //== Execution ==================================================//
    doCycle() {
        if (--this.timerCycle <= 0) {
            this.timerCycle = (this.timerPeriod + 1) * 2;
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
                let timer = this.timer;
                if (timer >= 0x008 && timer+this.sweep < 0x800)
                    this.timerPeriod += this.sweep;
            }
            this.sweepCycle = this.sweepPeriod;
        }
        if (this.sweepReset) {
            this.sweepCycle = this.sweepPeriod;
            this.sweepReset = false;
        }
        
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
    
    //== Output =====================================================//
    get output() {
        let timer = this.timer;
        if (this.length > 0 && timer >= 0x008 && timer+this.sweep < 0x800) {
            let volume = this.constantVolume ? this.volume : this.envelopeVolume;
            return volume * this.duty[this.dutyCycle];
        } else {
            return 0;
        }
    }
}

export default PulseChannel;
