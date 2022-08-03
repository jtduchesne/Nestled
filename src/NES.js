import CPU from './CPU.js';
import PPU from './PPU.js';
import Engine from './Engine.js';
import CartConnector from './Cartridges.js';
import CtrlConnector from './Controllers.js';
import VideoOutput from './Video.js';
import AudioOutput from './Audio.js';

export class NES {
    constructor() {
        this.cpu = new CPU(this);
        this.apu = this.cpu.apu;
        this.ppu = new PPU(this);
        this.engine = new Engine(this);
        
        this.cartConnector = new CartConnector;
        this.ctrlConnector = new CtrlConnector;
        this.videoOutput = new VideoOutput;
        this.audioOutput = new AudioOutput;
        
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
    
    //== Engine =============================================================================//
    pause() {
        return this.engine.pause();
    }
    
    //== Front red LED ======================================================================//
    // (Yes, it is a fully-fledged part of the NES !)
    get frontLEDState() { return this.isPowered ? this.engine.isPaused ? "paused" : "on" : "off"; }
    
    //== Cartridge ==========================================================================//
    insertCartridge(file) {
        return this.cartConnector.load(file);
    }
    removeCartridge() {
        return this.cartConnector.unload();
    }
    
    //== Controllers ========================================================================//
    insertController(controller) {
        return this.ctrlConnector.insert(controller);
    }
    removeController(controller) {
        return this.ctrlConnector.remove(controller);
    }
    
    //== Video ==============================================================================//
    connectVideo(output) {
        return this.videoOutput.connect(output);
    }
    disconnectVideo() {
        return this.videoOutput.disconnect();
    }
    
    //== Audio ==============================================================================//
    connectAudio(output) {
        return this.audioOutput.connect(output);
    }
    disconnectAudio() {
        return this.audioOutput.disconnect();
    }
}
export default NES;
