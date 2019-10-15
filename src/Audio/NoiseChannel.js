import Channel from './Channel.js';

const timerPeriods = [ // fixed to NTSC for now
    4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
];

export class NoiseChannel extends Channel {
    constructor() {
        super();
        
        this.constantVolume = 0;
        
        this.envelopeEnabled = true;
        this.envelopeReset   = false;
        this.envelopeCycle   = 0;
        this.envelopePeriod  = 0;
        this.envelopeVolume  = 0;
        this.envelopeLoop    = false;
        
        this.timerMode   = false;
        this.timerCycle  = 0;
        this.timerPeriod = 0;
        
        this.shiftRegister = 1;
    }
    
    reset() {
        super.reset();
        
        this.envelopeCycle  = 0;
        this.envelopeVolume = 0;
        
        this.timerCycle    = 0;
        
        this.shiftRegister = 1;
        
        this.volume = 0;
        this.timer  = 0;
    }
    
    //== Registers ==================================================//
    get volume() {
        return this.envelopeEnabled ? this.envelopeVolume : this.constantVolume;
    }
    set volume(value) {
        this.constantVolume    = (value & 0x0F);
        this.envelopeEnabled   = (value & 0x10) === 0;
        this.lengthCounterHalt = (value & 0x20) !== 0;
        
        this.envelopeLoop   = this.lengthCounterHalt;
        this.envelopePeriod = this.constantVolume;
    }
    
    get timer() {
        return this.timerPeriod;
    }
    set timer(value) {
        this.timerMode   = (value & 0x80) !== 0;
        this.timerPeriod = timerPeriods[value & 0x0F];
    }
    
    get length() {
        return super.length;
    }
    set length(value) {
        this.envelopeReset = true;
        
        super.length = value;
    }
    
    //== Registers access ===========================================//
    writeRegister(address, data) {
        switch (address & 0x3) {
        case 0x0: this.volume = data; break;
        case 0x2: this.timer  = data; break;
        case 0x3: this.length = data; break;
        }
    }
    
    //== Execution ==================================================//
    doCycle() {
        if (--this.timerCycle <= 0) {
            this.timerCycle = this.timerPeriod;
            
            var feedback = (this.shiftRegister & 1);
            if (this.timerMode)
                feedback ^= ((this.shiftRegister >>> 6) & 1);
            else
                feedback ^= ((this.shiftRegister >>> 1) & 1);
            
            this.shiftRegister = (this.shiftRegister >>> 1) | (feedback << 14);
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
        this.updateLength();
    }
    
    //== Output =====================================================//
    get output() {
        if (this.length > 0 && !(this.shiftRegister & 1)) {
            return this.volume;
        } else {
            return 0;
        }
    }
}

export default NoiseChannel;
