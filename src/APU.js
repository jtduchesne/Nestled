/** @typedef {import('./NES.js').NES} NES */

import {
    PulseChannel,
    TriangleChannel,
    NoiseChannel,
    DMC
} from './Audio/index.js';

const cyclesFrequency = 1786830 / 2;

const FOURSTEP = 0x00;
const FIVESTEP = 0x80;

export class APU {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        /** @private */
        this.bus = bus;
        
        /** Pulse Channel 1 */
        this.pulse1   = new PulseChannel(1);
        /** Pulse Channel 2 */
        this.pulse2   = new PulseChannel(2);
        /** Triangle Channel */
        this.triangle = new TriangleChannel;
        /** Noise Channel */
        this.noise    = new NoiseChannel;
        /** Delta Modulation Channel */
        this.dmc      = new DMC(bus);
        
        this.status = 0;
        
        /** If IRQ is disabled at the moment */
        this.irqDisabled = false;
        /** If an IRQ has happened. This is cleared after reading 0x4015 */
        this.irq         = false;
        
        /** @private */
        this.counterMode = FOURSTEP;
        
        /** @private */
        this.toggle = true;
        this.cycle  = 0;
        
        /** @private */
        this.resetDelay = 0;
        
        /** @private */
        this.cyclesPerSample = 0;
        /** @private */
        this.cyclesUntilSample = Infinity;
    }
    
    //===================================================================================//
    
    powerOn() {
        this.bus.audioOutput.start();
        
        this.cyclesPerSample   = cyclesFrequency / this.bus.audioOutput.sampleRate;
        this.cyclesUntilSample = this.cyclesPerSample * this.bus.audioOutput.speedAdjustment;
    }
    powerOff() {
        this.bus.audioOutput.stop();
    }
    
    reset() {
        this.pulse1.reset();
        this.pulse2.reset();
        this.triangle.reset();
        this.noise.reset();
        this.dmc.reset();
        
        this.counter = 0;
        
        this.irq = false;
    }
    
    //== Interrupt ======================================================================//
    /** @private */
    doIRQ() {
        this.irq = true;
        this.bus.cpu.doIRQ();
    }
    
    //== Registers ======================================================================//
    /**
     * 0x4015 Status register
     * @type {number}
     * @private
     */
    get status() {
        let value = (this.pulse1.enabled   ? 0x01 : 0) +
                    (this.pulse2.enabled   ? 0x02 : 0) +
                    (this.triangle.enabled ? 0x04 : 0) +
                    (this.noise.enabled    ? 0x08 : 0) +
                    (this.dmc.enabled      ? 0x10 : 0) +
                    (this.dmc.irq          ? 0x80 : 0) +
                    (this.irq              ? 0x40 : 0);
        this.irq     = false;
        
        return value;
    }
    /** @private */
    set status(value) {
        if (value) {
            this.pulse1.enabled   = !!(value & 0x01);
            this.pulse2.enabled   = !!(value & 0x02);
            this.triangle.enabled = !!(value & 0x04);
            this.noise.enabled    = !!(value & 0x08);
            this.dmc.enabled      = !!(value & 0x10);
        } else {
            this.pulse1.enabled   = false;
            this.pulse2.enabled   = false;
            this.triangle.enabled = false;
            this.noise.enabled    = false;
            this.dmc.enabled      = false;
        }
    }
    
    /**
     * 0x4017 Frame counter
     * @type {number}
     * @private
     */
    get counter() {
        return this.counterMode;
    }
    /** @private */
    set counter(value) {
        if (value) {
            if (value >= 0x80) {
                this.counterMode = FIVESTEP;
                this.irqDisabled = (value >= 0xC0);
                this.doQuarter();
                this.doHalf();
            } else {
                this.counterMode = FOURSTEP;
                this.irqDisabled = (value >= 0x40);
            }
            
            if (this.irqDisabled)
                this.irq = false;
        } else {
            this.counterMode = FOURSTEP;
            this.irqDisabled = false;
        }
        this.resetDelay = 2;
    }
    
    /** @readonly @type {boolean} */
    get fourStepCounterMode() {
        return this.counterMode === FOURSTEP;
    }
    /** @readonly @type {boolean} */
    get fiveStepCounterMode() {
        return this.counterMode === FIVESTEP;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number}
     */
    readRegister(address) {
        if (address === 0x4015)
            return this.status;
        else
            return 0;
    }
    /**
     * @param {number} address 16-bit address between 0x4000-0x4017
     * @param {number} data 8-bit data
     */
    writeRegister(address, data) {
        if (address <= 0x4003)
            this.pulse1.writeRegister(address, data);
        else if (address <= 0x4007)
            this.pulse2.writeRegister(address, data);
        else if (address <= 0x400B)
            this.triangle.writeRegister(address, data);
        else if (address <= 0x400F)
            this.noise.writeRegister(address, data);
        else if (address <= 0x4013)
            this.dmc.writeRegister(address, data);
        else if (address === 0x4015)
            this.status = data;
        else if (address === 0x4017)
            this.counter = data;
    }
    
    //== Execution ======================================================================//
    /**
     * @param {number} count The number of (CPU) cycles to execute
     */
    doCycles(count) {
        while (count--) {
            if ((this.toggle = !this.toggle)) {
                if (this.resetDelay > 0) {
                    if (--this.resetDelay === 0)
                        this.cycle = 0;
                }
                this.doCycle();
            }
        }
    }
    
    doCycle() {
        const cycle = this.cycle++;
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
        } else if (cycle >= 29828) {
            if (cycle === 29828 && this.fourStepCounterMode) {
                this.doQuarter();
                this.doHalf();
                
                if (!this.irqDisabled)
                    this.doIRQ();
                
                this.cycle = 0;
            } else if (cycle === 37281) {
                this.doQuarter();
                this.doHalf();
                
                this.cycle = 0;
            }
        }
        this.pulse1.doCycle();
        this.pulse2.doCycle();
        this.triangle.doCycle();
        this.noise.doCycle();
        this.dmc.doCycle();
        
        if (--this.cyclesUntilSample <= 0) {
            this.doSample();
            this.cyclesUntilSample += this.cyclesPerSample * this.bus.audioOutput.speedAdjustment;
        }
    }
    
    doQuarter() {
        this.pulse1.doQuarter();
        this.pulse2.doQuarter();
        this.triangle.doQuarter();
        this.noise.doQuarter();
    }
    
    doHalf() {
        this.pulse1.doHalf();
        this.pulse2.doHalf();
        this.triangle.doHalf();
        this.noise.doHalf();
    }
    
    //== Output =========================================================================//
    /** @private */
    doSample() {
        const pulses = this.pulse1.output + this.pulse2.output;
        const others = 3*this.triangle.output + 2*this.noise.output + this.dmc.output;
        
        this.bus.audioOutput.writeSample(pulsesSamples[pulses] + othersSamples[others]);
    }
}

const pulsesSamples = new Float32Array(31);
for (let i = 0; i < 31; i++ ) {
    pulsesSamples[i] = 95.52 / (8128.0 / i + 100);
}
const othersSamples = new Float32Array(203);
for (let i = 0; i < 203; i++ ) {
    othersSamples[i] = 163.67 / (24329.0 / i + 100);
}

export default APU;
