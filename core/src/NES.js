import { Cartridge, NoCartridge } from './Cartridge.js';
import { NoController } from './Controllers';
import NESFile from './NESFile.js';
import CPU from './CPU.js';
import PPU from './PPU.js';
import MainLoop from './MainLoop.js';

export class NES {
    constructor(opts) {
        this.isPowered = false;
        
        this.cpu = new CPU(this);
        this.ppu = new PPU(this);
        this.mainLoop = new MainLoop(this);
        
        this.cartridge = new NoCartridge;
        if (opts && opts['cartridge'] || opts instanceof Cartridge)
            this.insertCartridge(opts['cartridge'] || opts);
        else if (opts && opts['file'] || opts instanceof NESFile)
            this.insertCartridge(opts['file'] || opts);
        
        this.controllers = [new NoController, new NoController];
        if (opts && opts['controllers'])
            opts['controllers'].forEach((controller) => this.insertController(controller));
        else if (opts && opts['controller'])
            this.controllers = [opts['controller'], new NoController];
        
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
        }
        
        return this.cartridge;
    }
    removeCartridge() {
        const removed = this.cartridge;
        this.cartridge = new NoCartridge;
        
        return removed;
    }
    blowIntoCartridge() { //Indeed
        const cart = this.removeCartridge();
        if (cart && (typeof cart.blowInto === 'function'))
            cart.blowInto(Math.floor(Math.random() * 3) + 1);
        return this.insertCartridge(cart);
    }
    
    //== Controllers ========================================================================//
    insertController(controller) {
        if (this.controllers.indexOf(controller) > -1)
            return controller;
        else if (this.controllers[0] instanceof NoController)
            this.controllers[0] = controller;
        else if (this.controllers[1] instanceof NoController)
            this.controllers[1] = controller;
        else
            return;
        
        return controller;
    }
    removeController(controller) {
        let index = this.controllers.indexOf(controller);
        if (index > -1) {
            this.controllers[index] = new NoController;
            
            return controller;
        }
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
