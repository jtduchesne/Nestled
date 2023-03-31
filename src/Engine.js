/**
 * @typedef {import('./NES.js').NES} NES
 * @typedef {import('./CPU.js').CPU} CPU
 * @typedef {import('./PPU.js').PPU} PPU
 */

import { Powered } from './Power.js';

class Stats extends Powered {
    constructor() {
        super();
        
        /** Number of Frames properly rendered Per Second. */
        this.fps = 60;
        /** Emulation performance in percentage of the real hardware speed. */
        this.performance = 1.0;
        
        let frameTimeThisSecond = 0.0;
        let framesThisSecond = 0;
        let fps = 60;
        
        const update = () => {
            this.performance = 1000 / frameTimeThisSecond;
            this.fps = fps;
            
            frameTimeThisSecond = 0.0;
            framesThisSecond = 0;
            fps = 60;
        };
        
        /** @param {number} startTime @protected */
        this.addFrame = (startTime) => {
            frameTimeThisSecond += (performance.now() - startTime);
            
            if (++framesThisSecond >= fps)
                update();
        };
        /** @protected */
        this.dropFrame = () => {
            if (--fps <= framesThisSecond)
                update();
        };
    }
}

const frameTime = 1000/60;

const renderLines = 240;
const vblankStart = 241;
const vblankEnd   = 261;

const cyclesPerScanline = 341/3;
const cyclesPerFrame    = (341*261 + 340.5)/3;

const cyclesBeforeVBlankStart = vblankStart * cyclesPerScanline;
const cyclesBeforeVBlankEnd   = vblankEnd * cyclesPerScanline;

export class Engine extends Stats {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        super();
        
        /** @private */
        this.bus = bus;
        
        /** @private */ this.firstLoop = this.firstLoop.bind(this);
        /** @private */ this.mainLoop  = this.mainLoop.bind(this);
        
        /** @private */
        this.runningLoop = 0;
        /** @private */
        this.lastTime = 0;
        
        this.isPaused = false;
    }
    
    //=======================================================================================//
    
    powerOn() {
        this.coldBoot();
        
        this.isPaused = false;
        return super.powerOn();
    }
    powerOff() {
        cancelAnimationFrame(this.runningLoop);
        this.runningLoop = 0;
        
        this.isPaused = false;
        return super.powerOff();
    }
    
    pause() {
        if (this.isPaused) {
            this.runningLoop = requestAnimationFrame(this.firstLoop);
            this.isPaused = false;
        } else {
            cancelAnimationFrame(this.runningLoop);
            this.runningLoop = 0;
            this.isPaused = this.isPowered;
        }
        return this.isPaused;
    }
    
    //=======================================================================================//
    
    /** @private */
    coldBoot() {
        this.doBoot(this.bus.cpu, this.bus.ppu);
        
        this.runningLoop = requestAnimationFrame(this.firstLoop);
    }
    
    /**
     * @type {FrameRequestCallback}
     * @private */
    firstLoop(time) {
        this.runningLoop = requestAnimationFrame(this.mainLoop);
        
        this.lastTime = time;
        
        this.doFrame(this.bus.cpu, this.bus.ppu);
        
        this.addFrame(time);
    }
    
    /**
     * @type {FrameRequestCallback}
     * @private */
    mainLoop(time) {
        this.runningLoop = requestAnimationFrame(this.mainLoop);
        
        let delta = (time - this.lastTime);
        this.lastTime = time;
        
        if (delta > 1000) {
            this.pause();
            return;
        }
        
        while ((delta -= frameTime) >= frameTime) {
            this.skipFrame(this.bus.cpu, this.bus.ppu);
            this.dropFrame();
        }
        this.doFrame(this.bus.cpu, this.bus.ppu);
        
        this.addFrame(time);
    }
    
    //=======================================================================================//
    
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    doBoot(cpu, ppu) {
        cpu.doInstructions(2279); // 1.275ms after boot
        ppu.vblank = true;
        cpu.doInstructions(4757); // 2.662ms after boot
        ppu.vblank = true;
        
        this.doVBlank(cpu, ppu);
        this.doPreRenderLine(cpu, ppu);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    doFrame(cpu, ppu) {
        for (let scanline = 0; scanline < renderLines; scanline++)
            this.doScanline(cpu, ppu, scanline);
        
        ppu.printFrame();
        
        this.doVBlank(cpu, ppu);
        this.doPreRenderLine(cpu, ppu);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    skipFrame(cpu, ppu) {
        this.doVBlank(cpu, ppu);
        cpu.doInstructions(cyclesPerFrame);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    //=======================================================================================//
    
    /**
     * Vertical blanking lines (241-260).
     * The VBlank flag of the PPU is set at scanline 241, where the VBlank NMI also occurs.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    doVBlank(cpu, ppu) {
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
    }
    
    /**
     * This is a visible scanline, which also processes the graphics to be displayed on
     * the screen.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @param {number} scanline
     * @private
     */
    doScanline(cpu, ppu, scanline) {
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
        let dot = 0;
        
        // Background (and sprites evaluation)
        ppu.clearSecondaryOAM();
        while (dot < 64) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.renderTile(dot, scanline);
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        ppu.evaluateSprites(scanline);
        while (dot < 248) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.renderTile(dot, scanline);
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        
        // HBlank
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
        ppu.renderTile(dot, scanline);
        ppu.fetchNullTile();
        ppu.incrementX();
        ppu.incrementY();
        ppu.resetX();
        dot += 8;
        
        // Sprites
        while (dot < 320) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchSprite(scanline);
            dot += 8;
        }
        
        // First 2 tiles of next scanline
        while (dot < 336) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        
        // Garbage fetches
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
        ppu.fetchNullNTs();
        dot += 4.5;
        
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
    }
    
    /**
     * This is a dummy scanline, whose sole purpose is to fill the shift registers with
     * the data for the first two tiles of the next scanline. Although no pixels are
     * rendered for this scanline, the PPU still makes the same memory accesses it would
     * for a regular scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    doPreRenderLine(cpu, ppu) {
        const scanline = 261;
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
        let dot = 0;
        
        // Background
        while (dot < 248) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchNullTile();
            ppu.incrementX();
            dot += 8;
        }
        
        // HBlank
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
        ppu.fetchNullTile();
        ppu.incrementX();
        ppu.incrementY();
        ppu.resetX();
        dot += 8;
        
        // Sprites
        while (dot < 280) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchNullSprite();
            dot += 8;
        }
        while (dot < 304) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchNullSprite();
            ppu.resetY();
            dot += 8;
        }
        while (dot < 320) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchNullSprite();
            dot += 8;
        }
        
        // First 2 tiles of next frame
        while (dot < 336) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        
        // Garbage fetches
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
        ppu.fetchNullNTs();
        dot += 4.5;
        
        cpu.doInstructions(cyclesBeforeScanline + dot/3);
    }
}

export default Engine;
