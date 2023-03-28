/**
 * @typedef {import('./NES.js').NES} NES
 * @typedef {import('./CPU.js').CPU} CPU
 * @typedef {import('./PPU.js').PPU} PPU
 */

const frameTime = 1000/60;

const renderLines = 240;
const vblankStart = 241;
const vblankEnd   = 261;

const cyclesPerScanline = 341/3;
const cyclesPerFrame    = (341*261 + 340.5)/3;

const cyclesBeforeVBlankStart = vblankStart * cyclesPerScanline;
const cyclesBeforeVBlankEnd   = vblankEnd * cyclesPerScanline;

export class Engine {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        /** @private */
        this.bus = bus;
        
        /** @private */ this.firstLoop = this.firstLoop.bind(this);
        /** @private */ this.mainLoop  = this.mainLoop.bind(this);
        
        /** @private */
        this.runningLoop = 0;
        /** @private */
        this.lastTime = 0;
        
        this.stats = new Stats;
        
        this.isPowered = false;
        this.isPaused = false;
    }
    
    //=======================================================================================//
    
    powerOn() {
        this.coldBoot();
        
        this.isPowered = true;
        this.isPaused = false;
    }
    powerOff() {
        cancelAnimationFrame(this.runningLoop);
        this.runningLoop = 0;
        
        this.isPowered = false;
        this.isPaused = false;
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
    
    coldBoot() {
        this.doBoot(this.bus.cpu, this.bus.ppu);
        
        this.runningLoop = requestAnimationFrame(this.firstLoop);
    }
    
    /** @type {FrameRequestCallback} */
    firstLoop(time) {
        this.runningLoop = requestAnimationFrame(this.mainLoop);
        
        this.lastTime = time;
        
        this.doFrame(this.bus.cpu, this.bus.ppu);
        
        this.stats.addFrame(time);
    }
    
    /** @type {FrameRequestCallback} */
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
            this.stats.dropFrame();
        }
        this.doFrame(this.bus.cpu, this.bus.ppu);
        
        this.stats.addFrame(time);
    }
    
    //=======================================================================================//
    
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doBoot(cpu, ppu) {
        cpu.doInstructions(2279); // 1.275ms after boot
        ppu.vblank = true;
        cpu.doInstructions(4757); // 2.662ms after boot
        ppu.vblank = true;
        
        this.doVBlank(cpu, ppu);
        this.doPreFetch(cpu, ppu, 261);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
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
     */
    doScanline(cpu, ppu, scanline) {
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
        let dot = 0;
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
        ppu.incrementY();
        ppu.resetX();
        dot += 8;
        
        while (dot < 320) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchSprite(scanline);
            dot += 8;
        }
        
        this.doPreFetch(cpu, ppu, scanline);
    }
    
    /**
     * This is a dummy scanline, whose sole purpose is to fill the shift registers with
     * the data for the first two tiles of the next scanline. Although no pixels are
     * rendered for this scanline, the PPU still makes the same memory accesses it would
     * for a regular scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doPreRenderLine(cpu, ppu) {
        const scanline = 261;
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
        let dot = 0;
        while (dot < 256) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchNullTile();
            ppu.incrementX();
            dot += 8;
        }
        ppu.incrementY();
        ppu.resetX();
        while (dot < 279) {
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
        
        // Fetch the first 2 tiles of next frame
        this.doPreFetch(cpu, ppu, scanline);
    }
    
    /**
     * Fetch the first 2 tiles for the next scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @param {number} scanline
     */
    doPreFetch(cpu, ppu, scanline) {
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
        let dot = 320;
        while (dot < 336) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        ppu.fetchNullNTs();
    }
}

class Stats {
    constructor() {
        this.fps = 60;
        this.performance = 1.0;
        
        let frameTimeThisSecond = 0.0;
        let framesThisSecond = 0;
        let fps = 60;
        
        const refresh = () => {
            this.performance = 1000 / frameTimeThisSecond;
            this.fps = fps;
            
            frameTimeThisSecond = 0.0;
            framesThisSecond = 0;
            fps = 60;
        };
        
        /** @param {number} startTime */
        this.addFrame = (startTime) => {
            frameTimeThisSecond += (performance.now() - startTime);
            
            if (++framesThisSecond >= fps)
                refresh();
        };
        this.dropFrame = () => {
            if (--fps <= framesThisSecond)
                refresh();
        };
    }
}

export default Engine;
