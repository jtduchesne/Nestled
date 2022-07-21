const frameTime = 1000/60;

const renderLines = 239;
const vblankStart = 241;
const vblankEnd   = 261;

const cyclesPerScanline = 341/3;
const cyclesPerFrame    = (341*261 + 340.5)/3;

const cyclesBeforeVBlankStart   = vblankStart * cyclesPerScanline;
const cyclesBeforeVBlankEnd     = vblankEnd * cyclesPerScanline - 8;
const cyclesBeforePreRenderLine = 261*cyclesPerScanline;

export class Engine {
    constructor(nes) {
        this.bus = nes;
        
        this.firstLoop = this.firstLoop.bind(this);
        this.mainLoop  = this.mainLoop.bind(this);
        
        this.runningLoop = null;
        
        this.init();
        
        this.isPowered = false;
        this.isPaused = false;
    }
    
    init() {
        this.frame = 0;
        this.dropped = 0;
        
        this.fps = 60;
        this.performance = 1.0;
        
        this._delta = 0.0;
        this._lastTimestamp = 0.0;
        this._frameTimeThisSecond = 0.0;
        this._framesThisSecond = 0;
        this._fps = 60;
    }
    
    //=======================================================================================//
    
    powerOn() {
        this.cpu = this.bus.cpu;
        this.ppu = this.bus.ppu;
        
        this.init();
        this.coldBoot();
        
        this.isPowered = true;
        this.isPaused = false;
    }
    powerOff() {
        clearTimeout(this.runningLoop);
        this.runningLoop = null;
        
        this.isPowered = false;
        this.isPaused = false;
    }
    
    pause() {
        if (this.isPaused) {
            this.runningLoop = setTimeout(this.firstLoop, 0);
            this.isPaused = false;
        } else {
            clearTimeout(this.runningLoop);
            this.runningLoop = null;
            this.isPaused = this.isPowered;
        }
        return this.isPaused;
    }
    
    //=======================================================================================//
    
    coldBoot() {
        let cpu = this.cpu;
        let ppu = this.ppu;
        
        cpu.cycleOffset = 0;
        
        cpu.doInstructions(2279); // 1.275ms after boot
        ppu.vblank = true;
        cpu.doInstructions(4757); // 2.662ms after boot
        ppu.vblank = true;
        
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
        
        this.doPreFetch(cpu, ppu, 261);
        
        this.runningLoop = setTimeout(this.firstLoop, 0);
    }
    
    firstLoop() {
        if (typeof window === 'undefined') return;
        
        let timestamp = window.performance.now();
        
        let cpu = this.cpu;
        let ppu = this.ppu;
        
        this.doFrame(cpu, ppu);
        
        this.updateStats(window.performance.now() - timestamp);
        
        this._lastTimestamp = timestamp;
        
        this.runningLoop = setTimeout(this.mainLoop, 0);
    }
    
    mainLoop() {
        let timestamp = window.performance.now();
        
        this._delta = (timestamp - this._lastTimestamp);
        
        if (this._delta >= frameTime) {
            if (this._delta > 1000) {
                this.pause();
                return;
            }
            
            let cpu = this.cpu;
            let ppu = this.ppu;
            
            while ((this._delta -= frameTime) >= frameTime) {
                this.skipFrame(cpu, ppu);
                this._fps--;
            }
            this.doFrame(cpu, ppu);
            
            this.updateStats(window.performance.now() - timestamp);
            
            this._lastTimestamp = timestamp;
        }
        
        this.runningLoop = setTimeout(this.mainLoop, 0);
    }
    
    updateStats(frameTime) {
        this._frameTimeThisSecond += frameTime;
        this._framesThisSecond++;
        
        if (this._framesThisSecond >= this._fps) {
            this.performance = 1000 / this._frameTimeThisSecond;
            this.fps = this._fps;
            
            this._frameTimeThisSecond = 0.0;
            this._framesThisSecond = 0;
            this._fps = 60;
        }
    }
    
    //=======================================================================================//
    
    doFrame(cpu, ppu) {
        cpu.cycleOffset = this.frame * cyclesPerFrame;
        
        for (let scanline = 0; scanline <= renderLines; scanline++)
            this.doScanline(cpu, ppu, scanline);
        
        cpu.doInstructions(cyclesBeforeVBlankStart);
        
        ppu.printFrame();
        
        // VBlank
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
        
        // Pre-render line
        this.doPreRenderLine(cpu, ppu);
        
        this.frame++;
    }
    
    skipFrame(cpu, ppu) {
        cpu.cycleOffset = this.frame * cyclesPerFrame;
        
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
        cpu.doInstructions(cyclesPerFrame);
        
        this.frame++;
        this.dropped++;
    }
    
    doScanline(cpu, ppu, scanline) {
        let cyclesBeforeScanline = scanline*cyclesPerScanline;
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
            ppu.renderSprite(scanline);
            dot += 8;
        }
        
        this.doPreFetch(cpu, ppu, scanline);
    }
    
    doPreRenderLine(cpu, ppu) {
        let cyclesBeforeScanline = cyclesBeforePreRenderLine;
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
        
        this.doPreFetch(cpu, ppu, 261);
    }
    
    doPreFetch(cpu, ppu, scanline) {
        let cyclesBeforeScanline = scanline*cyclesPerScanline;
        let dot = 320;
        
        while (dot < 336) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            // First 2 tiles of next frame's background:
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        ppu.fetchNullNTs();
    }
}

export default Engine;
