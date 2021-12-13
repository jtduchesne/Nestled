import CPU from './CPU.js';
import PPU from './PPU.js';
import MainLoop from './MainLoop.js';
import CartConnector from './Cartridges';
import CtrlConnector from './Controllers';

export class NES {
    constructor(opts) {
        this.isPowered = false;
        
        this.cpu = new CPU(this);
        this.ppu = new PPU(this);
        this.mainLoop = new MainLoop(this);
        
        this.cartConnector = new CartConnector;
        if (opts && opts['file'] || opts instanceof File)
            this.insertCartridge(opts['file'] || opts);
        
        this.ctrlConnector = new CtrlConnector;
        if (opts && opts['controllers'])
            this.ctrlConnector.insert(...opts['controllers']);
        else if (opts && opts['controller'])
            this.ctrlConnector.insert(opts['controller']);
        
        this.screen = null;
        if (opts && opts['screen'])
            this.screen = opts['screen'];
    }
     
    //== Power ==============================================================================//
    powerOn()  {
        if (!this.isPowered) {
            this.isPowered = true;
            
            this.cpu.powerOn();
            this.ppu.powerOn();
            
            this.startEmulation();
        }
    }
    powerOff() {
        if (this.isPowered) {
            this.stopEmulation();
            
            this.isPowered = false;
            
            this.cpu.powerOff();
            this.ppu.powerOff();
        }
    }
     
    //== Emulation ==========================================================================//
    startEmulation() {
        if (!this.isRunning) {
            this.mainLoop.start();
        }
    }
    stopEmulation() {
        if (this.isRunning) {
            this.mainLoop.stop();
        }
    }
    get isRunning() { return this.mainLoop.isRunning; }
    
    pauseEmulation() {
        if (this.isRunning && !this.isPaused) {
            this.mainLoop.pause();
        }
    }
    resumeEmulation() {
        if (this.isPaused) {
            this.mainLoop.start();
        }
    }
    get isPaused() { return this.mainLoop.isPaused; }
    
    pause() {
        if (this.isPaused)
            this.resumeEmulation();
        else
            this.pauseEmulation();
        
        return this.isPaused;
    }
    
    //== Buttons ============================================================================//
    pressPower() {
        if (this.isPowered)
            this.powerOff();
        else
            this.powerOn();
        
        return this.isPowered;
    }
    pressReset()  {
        this.cpu.reset();
        this.ppu.reset();
    }
     
    //== Front red LED ======================================================================//
    // (Yes, it is a fully-fledged part of the NES !)
    get frontLEDState() { return this.isPowered ? this.isPaused ? "paused" : "on" : "off"; }
    
    //== Cartridge ==========================================================================//
    insertCartridge(file) {
        return this.cartConnector.load(file).then((connector) => {
            this.ppu.ntsc = (connector.tvSystem === "NTSC");
            return connector;
        });
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
    get screen() {
        return this.outputCanvas; }
    set screen(value) {
        if (value && value.nodeName === 'CANVAS') {
            this.outputCanvas = value;
            this.outputContext = value.getContext('2d', {alpha: false});
            this.outputContext.imageSmoothingEnabled = false;
        } else {
            this.outputCanvas  = null;
            this.outputContext = null;
        }
    }
}
export default NES;
