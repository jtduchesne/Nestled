import Channel from './Channel.js';

const duties = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 0],
];

export class PulseChannel extends Channel {
    constructor(id) {
        super();
        
        this.id = id;
        
        this.constantVolume = 0;
        
        this.envelopeEnabled = true;
        this.envelopeReset   = false;
        this.envelopeCycle   = 0;
        this.envelopePeriod  = 0;
        this.envelopeVolume  = 0;
        this.envelopeLoop    = false;
        
        this.dutyCycle = 0;
        this.duty      = 0;
        
        this.sweepEnabled = false;
        this.sweepReset   = false;
        this.sweepCycle   = 0;
        this.sweepPeriod  = 0;
        this.sweepNegate  = false;
        this.sweepShift   = 0;
        
        this.timerCycle  = 0;
        this.timerPeriod = 0;
    }
    
    reset() {
        super.reset();
        
        this.envelopeCycle  = 0;
        this.envelopeVolume = 0;
        
        this.sweepCycle = 0;
        
        this.timerCycle = 0;
        
        this.volume = 0;
        this.sweep  = 0;
        this.timer  = 0;
    }
    
    //== Registers ==================================================//
    get volume() {
        let volume = this.envelopeEnabled ? this.envelopeVolume : this.constantVolume;
        return volume * this.duty[this.dutyCycle];
    }
    set volume(value) {
        this.duty = duties[(value & 0xC0) >>> 6];
        
        this.constantVolume    = (value & 0x0F);
        this.envelopeEnabled   = (value & 0x10) === 0;
        this.lengthCounterHalt = (value & 0x20) !== 0;
        
        this.envelopePeriod   = this.constantVolume;
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
        return super.length;
    }
    set length(value) {
        this.dutyCycle = 0;
        this.envelopeReset = true;
        
        this.timerPeriod = (this.timerPeriod & 0x0FF) | ((value & 0x07) << 8);
        
        super.length = value;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address & 0x3) {
        case 0x0: this.volume = data; break;
        case 0x1: this.sweep  = data; break;
        case 0x2: this.timer  = data; break;
        case 0x3: this.length = data; break;
        }
    }
    
    //== Execution ==================================================//
    doCycle() {
        if (--this.timerCycle <= 0) {
            this.timerCycle = (this.timerPeriod + 1);
            
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
        
        this.updateLength();
    }
    
    //== Output =====================================================//
    get output() {
        let timer = this.timer;
        if (this.length > 0 && timer >= 0x008 && timer+this.sweep < 0x800) {
            return this.volume;
        } else {
            return 0;
        }
    }
}

export default PulseChannel;
