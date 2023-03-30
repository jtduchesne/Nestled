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
        
        this.isPowered = false;
    }
    
    //== Buttons ============================================================================//
    pressPower() {
        if (!this.isPowered) {
            this.cpu.powerOn();
            this.ppu.powerOn();
            
            this.engine.powerOn();
            
            this.isPowered = true;
        } else {
            this.cpu.powerOff();
            this.ppu.powerOff();
            
            this.engine.powerOff();
            
            this.isPowered = false;
        }
        return this.isPowered;
    }
    pressReset() {
        this.cpu.reset();
        this.ppu.reset();
    }
    
    //== Front red LED ======================================================================//
    // (Yes, it is a fully-fledged part of the NES !)
    get frontLEDState() { return this.isPowered ? this.engine.isPaused ? "paused" : "on" : "off"; }
}
export default NES;
