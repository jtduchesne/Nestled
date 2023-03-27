const frameTime = 1000/60;

const renderLines = 240;
const vblankStart = 241;
const vblankEnd   = 261;

const cyclesPerScanline = 341/3;
const cyclesPerFrame    = (341*261 + 340.5)/3;

const cyclesBeforeVBlankStart = vblankStart * cyclesPerScanline;
const cyclesBeforeVBlankEnd   = vblankEnd * cyclesPerScanline;

export class Engine {
    constructor(nes) {
        this.bus = nes;
        
        this.firstLoop = this.firstLoop.bind(this);
        this.mainLoop  = this.mainLoop.bind(this);
        
        this.runningLoop = 0;
        
        this.lastTimestamp = 0;
        
        this.init();
        
        this.isPowered = false;
        this.isPaused = false;
    }
    
    init() {
        this.fps = 60;
        this.performance = 1.0;
        
        this._frameTimeThisSecond = 0.0;
        this._framesThisSecond = 0;
        this._fps = 60;
    }
    
    //=======================================================================================//
    
    powerOn() {
        this.init();
        this.coldBoot();
        
        this.isPowered = true;
        this.isPaused = false;
    }
    powerOff() {
        clearTimeout(this.runningLoop);
        this.runningLoop = 0;
        
        this.isPowered = false;
        this.isPaused = false;
    }
    
    pause() {
        if (this.isPaused) {
            this.runningLoop = setTimeout(this.firstLoop, 0);
            this.isPaused = false;
        } else {
            clearTimeout(this.runningLoop);
            this.runningLoop = 0;
            this.isPaused = this.isPowered;
        }
        return this.isPaused;
    }
    
    //=======================================================================================//
    
    coldBoot() {
        const cpu = this.bus.cpu;
        const ppu = this.bus.ppu;
        
        this.doBoot(cpu, ppu);
        
        this.runningLoop = setTimeout(this.firstLoop, 0);
    }
    
    firstLoop() {
        const timestamp = window.performance.now();
        
        const cpu = this.bus.cpu;
        const ppu = this.bus.ppu;
        
        this.doFrame(cpu, ppu);
        
        this.updateStats(window.performance.now() - timestamp);
        
        this.lastTimestamp = timestamp;
        
        this.runningLoop = setTimeout(this.mainLoop, 0);
    }
    
    mainLoop() {
        const timestamp = window.performance.now();
        
        let delta = (timestamp - this.lastTimestamp);
        
        if (delta >= frameTime) {
            if (delta > 1000) {
                this.pause();
                return;
            }
            
            const cpu = this.bus.cpu;
            const ppu = this.bus.ppu;
            
            while ((delta -= frameTime) >= frameTime) {
                this.skipFrame(cpu, ppu);
                this._fps--;
            }
            this.doFrame(cpu, ppu);
            
            this.updateStats(window.performance.now() - timestamp);
            
            this.lastTimestamp = timestamp;
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
    
    doBoot(cpu, ppu) {
        cpu.doInstructions(2279); // 1.275ms after boot
        ppu.vblank = true;
        cpu.doInstructions(4757); // 2.662ms after boot
        ppu.vblank = true;
        
        this.doVBlank(cpu, ppu);
        this.doPreFetch(cpu, ppu, 261);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    doFrame(cpu, ppu) {
        for (let scanline = 0; scanline < renderLines; scanline++)
            this.doScanline(cpu, ppu, scanline);
        
        ppu.printFrame();
        
        this.doVBlank(cpu, ppu);
        this.doPreRenderLine(cpu, ppu);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    skipFrame(cpu, ppu) {
        this.doVBlank(cpu, ppu);
        cpu.doInstructions(cyclesPerFrame);
        
        cpu.cycle -= cyclesPerFrame;
    }
    
    //=======================================================================================//
    
    doVBlank(cpu, ppu) {
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
    }
    
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
        
        this.doPreFetch(cpu, ppu, scanline);
    }
    
    doPreFetch(cpu, ppu, scanline) {
        const cyclesBeforeScanline = scanline*cyclesPerScanline;
        
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
