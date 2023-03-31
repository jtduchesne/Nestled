import CartConnector from './CartConnector.js';
import CtrlConnector from './CtrlConnector.js';
import VideoOutput from './VideoOutput.js';
import AudioOutput from './AudioOutput.js';
import CPU from './CPU.js';
import APU from './APU.js';
import PPU from './PPU.js';
import Engine from './Engine.js';

export class NES {
    constructor() {
        this.game        = new CartConnector;
        this.controllers = new CtrlConnector;
        this.video       = new VideoOutput;
        this.audio       = new AudioOutput;
        
        this.cpu = new CPU(this);
        this.apu = new APU(this);
        this.ppu = new PPU(this);
        this.engine = new Engine(this);
        
        this.buttons = {
            pressPower: () => {
                if (!this.isPowered)
                    return this.powerOn();
                else
                    return this.powerOff();
            },
            pressReset: () => {
                this.reset();
            },
        };
        
        this.isPowered = false;
    }
    
    /**
     * The state of the front red LED.
     * @readonly
     */
    get frontLED() {
        return this.isPowered ? this.engine.isPaused ? "paused" : "on" : "off";
    }
    
    //== Power ==============================================================================//
    powerOn() {
        if (!this.cpu.isPowered) this.cpu.powerOn();
        if (!this.ppu.isPowered) this.ppu.powerOn();
        if (!this.engine.isPowered) this.engine.powerOn();
        
        return this.isPowered = true;
    }
    powerOff() {
        if (this.cpu.isPowered) this.cpu.powerOff();
        if (this.ppu.isPowered) this.ppu.powerOff();
        if (this.engine.isPowered) this.engine.powerOff();
        
        return this.isPowered = false;
    }
    
    reset() {
        this.cpu.reset();
        this.ppu.reset();
    }
}

export default NES;
