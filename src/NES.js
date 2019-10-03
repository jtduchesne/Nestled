import { Cartridge, NoCartridge } from './Cartridge.js';
import NESFile from './NESFile.js';
import CPU from './CPU.js';
import PPU from './PPU.js';
import MainLoop from './MainLoop.js';

export class NES {
    constructor(opts) {
        if (opts) {
            if (opts['screen']) this.screen = opts['screen'];
            
            if (opts['onpower']) this.onpower = opts['onpower'];
            if (opts['onreset']) this.onreset = opts['onreset'];
            
            if (opts['onemulation']) this.onemulation = opts['onemulation'];
            if (opts['onpause']) this.onpause = opts['onpause'];
            if (opts['ontime']) this.ontime = opts['ontime'];
            if (opts['onfps']) this.onfps = opts['onfps'];
            
            if (opts['oninsertcartridge']) this.oninsertcartridge = opts['oninsertcartridge'];
            if (opts['onremovecartridge']) this.onremovecartridge = opts['onremovecartridge'];
        }
        
        this.cpu = new CPU(this);
        this.ppu = new PPU(this);
        this.mainLoop = new MainLoop(this);
        
        if (opts && opts['cartridge'] || opts instanceof Cartridge)
            this.insertCartridge(opts['cartridge'] || opts);
        else if (opts && opts['file'] || opts instanceof NESFile)
            this.insertCartridge(opts['file'] || opts);
        else
            this.removeCartridge();
        
        this.isPowered = false;
    }
     
    //== Power ==============================================================================//
    powerOn()  {
        if (!this.isPowered) {
            this.isPowered = true;
            
            this.cpu.powerOn();
            this.ppu.powerOn();
        
            if (this.onpower) this.onpower({target: this});
            
            this.startEmulation();
        }
    }
    powerOff() {
        if (this.isPowered) {
            this.stopEmulation();
            
            this.isPowered = false;
            
            this.cpu.powerOff();
            this.ppu.powerOff();
        
            if (this.onpower) this.onpower({target: this});
        }
    }
     
    //== Emulation ==========================================================================//
    startEmulation() {
        if (!this.isRunning) {
            this.mainLoop.start();
            if (this.onemulation) this.onemulation({target: this});
        }
    }
    stopEmulation() {
        if (this.isRunning) {
            this.mainLoop.stop();
            if (this.onemulation) this.onemulation({target: this});
        }
    }
    get isRunning() { return this.mainLoop.isRunning; }
    
    pauseEmulation() {
        if (this.isRunning && !this.isPaused) {
            this.mainLoop.pause();
            if (this.onpause) this.onpause({target: this});
        }
    }
    resumeEmulation() {
        if (this.isPaused) {
            this.mainLoop.start();
            if (this.onpause) this.onpause({target: this});
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
        if (this.onreset) this.onreset({target: this});
        
        this.cpu.doReset();
        this.ppu.doReset();
    }
     
    //== Front red LED ======================================================================//
    // (Yes, it is a fully-fledged part of the NES !)
    get frontLEDState() { return this.isPowered ? this.isPaused ? "paused" : "on" : "off"; }
    
    //== Cartridge ==========================================================================//
    insertCartridge(inserted) {
        if (!(this.cartridge instanceof NoCartridge)) this.removeCartridge();
        
        if (inserted instanceof NESFile)
            this.cartridge = new Cartridge({file: inserted});
        else
            this.cartridge = inserted;
        
        if (!(this.cartridge instanceof NoCartridge)) {
            if (this.cartridge.tvSystem === "NTSC")
                this.ppu.ntsc = true;
            else
                this.ppu.ntsc = false;
            
            if (this.oninsertcartridge) this.oninsertcartridge({target: this});
        }
        
        return this.cartridge;
    }
    removeCartridge() {
        const removed = this.cartridge;
        if (removed && !(removed instanceof NoCartridge)) {
            if (this.onremovecartridge) this.onremovecartridge({target: this});
        }
        this.cartridge = new NoCartridge;
        
        return removed;
    }
    blowIntoCartridge() { //Indeed
        const cart = this.removeCartridge();
        if (cart && (typeof cart.blowInto === 'function'))
            cart.blowInto(Math.floor(Math.random() * 3) + 1);
        return this.insertCartridge(cart);
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
