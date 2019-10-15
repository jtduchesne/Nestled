import AudioBuffer from './Audio/AudioBuffer.js';
import PulseChannel from './Audio/PulseChannel.js';
import TriangleChannel from './Audio/TriangleChannel.js';

export class APU {
    constructor(cpu) {
        this.cpu = cpu;
        
        this.pulse1   = new PulseChannel(1);
        this.pulse2   = new PulseChannel(2);
        this.triangle = new TriangleChannel;
        //this.noise    = new NoiseChannel;
        //this.dmc      = new DMCChannel(cpu);
        
        this.tick  = false;
        this.cycle = 0;
        
        this.status  = null;
        this.counter = null;
        this.irq     = false;
        
        this.audio = null;
        this.cyclesPerSample = 0.0;
    }
    
    powerOn() {
        this.audio = new AudioBuffer(4410, 44100);
        this.cyclesPerSample = 1789772.72 / 2 / this.audio.sampleRate;
    }
    powerOff() {
        if (this.audio)
            this.audio.stop();
        this.audio = null;
    }
    
    reset() {
        this.pulse1.reset();
        this.pulse2.reset();
        this.triangle.reset();
        //this.noise.reset();
        //this.dmc.reset();
        
        this.counter = 0;
        this.irq     = false;
    }
    
    //== Interrupt ==================================================//
    doIRQ() {
        this.irq = true;
        if (!this.irqDisabled)
            this.cpu.doIRQ();
    }
    
    //== Registers ==================================================//
    //= 0x4015 Status =//
    get status() {
        let value = (this.pulse1.length   && 0x01) |
                    (this.pulse2.length   && 0x02) |
                    (this.triangle.length && 0x04) |
                    //(this.noise.length    && 0x08) |
                    //(this.dmc.sampleLeft  && 0x10) |
                    //(this.dmc.irq         && 0x80) |
                    (this.irq             && 0x40);
        //this.dmc.irq  = false;
        this.irq      = false;
        
        return value;
    }
    set status(value) {
        if (value !== null) {
            this.pulse1.enabled   = !!(value & 0x01);
            this.pulse2.enabled   = !!(value & 0x02);
            this.triangle.enabled = !!(value & 0x04);
            //this.noise.enabled    = !!(value & 0x08);
            //this.dmc.enabled      = !!(value & 0x10);
        } else {
            this.pulse1.enabled   = false;
            this.pulse2.enabled   = false;
            this.triangle.enabled = false;
            //this.noise.enabled    = false;
            //this.dmc.enabled      = false;
        }
    }
    
    //= 0x4017 Frame counter =//
    set counter(value) {
        if (value !== null) {
            this.counterMode = (value & 0x80) >>> 7;
            this.irqDisabled = !!(value & 0x40);
            
            if (this.irqDisabled)
                this.irq = false;
            
            this.resetDelay = (this.cycle & 1) ? 3 : 4;
            
            if (this.counterMode === 1) {
                this.doQuarter();
                this.doHalf();
            }
        } else {
            this.counterMode = 0;
            this.irqDisabled = false;
            this.resetDelay = 0;
        }
    }
    
    //== Registers access ===========================================//
    readRegister(address) {
        if (address === 0x4015)
            return this.status;
    }
    writeRegister(address, data) {
        if (address <= 0x4003)
            this.pulse1.writeRegister(address, data);
        else if (address <= 0x4007)
            this.pulse2.writeRegister(address, data);
        else if (address <= 0x400B)
            this.triangle.writeRegister(address, data);
        else if (address <= 0x400F)
            return; //this.noise.writeRegister(address, data);
        else if (address <= 0x4013)
            return; //this.dmc.writeRegister(address, data);
        else if (address === 0x4015)
            this.status = data;
        else if (address === 0x4017)
            this.counter = data;
    }
    
    //== Execution ==================================================//
    doCycles(count) {
        while (count--) {
            let tick = this.tick;
            if (tick) {
                if (this.resetDelay > 0) {
                    if (--this.resetDelay === 0)
                        this.cycle = 0;
                }
                this.doCycle();
            }
            this.tick = !tick;
        }
    }
    
    doCycle() {
        let cycle = this.cycle++;
        if (cycle <= 7457) {
            if (cycle === 7457) {
                this.doQuarter();
            }
        } else if (cycle <= 14914) {
            if (cycle === 14914) {
                this.doQuarter();
                this.doHalf();
            }
        } else if (cycle <= 22371) {
            if (cycle === 22371) {
                this.doQuarter();
            }
        } else {
            if (this.counterMode === 0) {
                if (cycle === 29828) {
                    this.doQuarter();
                    this.doHalf();
                    
                    if (!this.irqDisabled)
                        this.doIRQ();
                    
                    this.cycle = 0;
                }
            } else if (cycle === 37281) {
                this.doQuarter();
                this.doHalf();
                
                this.cycle = 0;
            }
        }
        this.pulse1.doCycle();
        this.pulse2.doCycle();
        this.triangle.doCycle();
        //this.noise.doCycle();
        //this.dmc.doCycle();
        
        if (this.cycle >= this.cyclesPerSample) {
            var sample = 0;
            
            let pulse = this.pulse1.output + this.pulse2.output;
            if (pulse)
                sample += 95.52 / ((8128 / pulse) + 100);
            
            let triangle = this.triangle.output;
            let noise = 0;
            let dmc = 0;

            if (triangle || noise || dmc) {
                sample += 159.79 / ((1 / ((triangle / 8227) + (noise / 12241) + (dmc / 22638))) + 100);
            }
            
            this.writeSample(sample);
            
            this.cycle -= this.cyclesPerSample;
        }
    }
    
    doQuarter() {
        this.pulse1.doQuarter();
        this.pulse2.doQuarter();
        this.triangle.doQuarter();
        //this.noise.doQuarter();
        //this.dmc.doQuarter();
    }
    
    doHalf() {
        this.pulse1.doHalf();
        this.pulse2.doHalf();
        this.triangle.doHalf();
        //this.noise.doHalf();
        //this.dmc.doHalf();
    }
    
    writeSample(value) {
        if (this.audio)
            this.audio.sample = value;
    }
}

export default APU;
