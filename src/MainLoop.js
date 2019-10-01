const frameTime = 1000/60;

const renderLines = 239;
const vblankStart = 241;
const vblankEnd   = 261;

const cyclesPerScanline = 341/3;
const cyclesPerFrame    = (341*261 + 340.5)/3;

const cyclesBeforeVBlankStart   = vblankStart * cyclesPerScanline;
const cyclesBeforeVBlankEnd     = vblankEnd * cyclesPerScanline - 8;
const cyclesBeforePreRenderLine = 261*cyclesPerScanline;

export class MainLoop {
    constructor(nes) {
        this.bus = nes;
        
        this.reset();
        this.runningLoop = -1;
    }
    
    reset() {
        this.frame = 0;
        this.dropped = 0;
        
        this.delta = 0.0;
        this.lastFrameTime = 0.0;
    }
    
    //=======================================================================================//
    
    start() {
        if (this.frame === 0) {
            this.reset();
            this.initialize();
        }
        
        if (window)
            this.runningLoop = window.requestAnimationFrame(this.loop.bind(this));
        else
            this.runningLoop = setTimeout(this.loop.bind(this, Date.now()), 0);
    }
    stop() {
        if (window)
            window.cancelAnimationFrame(this.runningLoop);
        else
            clearTimeout(this.runningLoop);
        this.frame = 0;
        
        this.runningLoop = -1;
    }
    
    pause() {
        if (window)
            window.cancelAnimationFrame(this.runningLoop);
        else
            clearTimeout(this.runningLoop);
        this.lastFrameTime = 0.0;
        
        this.runningLoop = 0;
    }
    
    get isRunning() {
        return this.runningLoop >= 0 || (typeof this.runningLoop === 'object');
    }
    get isPaused() { return this.runningLoop === 0; }
    
    //=======================================================================================//
    
    initialize() {
        let cpu = this.bus.cpu;
        let ppu = this.bus.ppu;
        
        cpu.cycleOffset = 0;
        
        ppu.clearFrame();
        
        cpu.doInstructions(2279); // 1.275ms after boot
        ppu.vblank = true;
        cpu.doInstructions(4757); // 2.662ms after boot
        ppu.vblank = true;
        
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
        
        this.doPreFetch(cpu, ppu, 261);
    }
    
    loop(timestamp, onlyOnce) {
        let cpu = this.bus.cpu;
        let ppu = this.bus.ppu;
        
        let lastFrameTime = this.lastFrameTime;
        let delta = lastFrameTime ? this.delta + (timestamp - lastFrameTime) : this.delta;
        
        if (delta > 2000) {
            this.cancelPendingFrames();
            this.bus.pauseEmulation();
        } else {
            if (delta >= frameTime) {
                while ((delta -= frameTime) >= frameTime)
                    this.cancelFrame(cpu, ppu);
                this.doFrame(cpu, ppu);
            }
            if (onlyOnce)
                this.runningLoop = 0;
            else if (window)
                this.runningLoop = window.requestAnimationFrame(this.loop.bind(this));
            else
                this.runningLoop = setTimeout(this.loop.bind(this, Date.now()), frameTime);
        }
        
        this.delta = delta;
        this.lastFrameTime = timestamp;
    }
    
    cancelPendingFrames() {
        let cpu = this.bus.cpu;
        let ppu = this.bus.ppu;
        
        while (this.delta >= frameTime) {
            this.cancelFrame(cpu, ppu);
            this.delta -= frameTime;
        }
    }
    
    //=======================================================================================//
    
    doFrame(cpu, ppu) {
        cpu.cycleOffset = this.frame * cyclesPerFrame;
        
        for (var scanline = 0; scanline <= renderLines; scanline++)
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
    
    doScanline(cpu, ppu, scanline) {
        let cyclesBeforeScanline = scanline*cyclesPerScanline;
        var dot = 0;
        
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
            //ppu.renderSprite(scanline);
            dot += 8;
        }
        
        this.doPreFetch(cpu, ppu, scanline);
    }
    
    doPreRenderLine(cpu, ppu) {
        let cyclesBeforeScanline = cyclesBeforePreRenderLine;
        var dot = 0;
        
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
            //ppu.fetchNullSprite();
            dot += 8;
        }
        while (dot < 304) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            //ppu.fetchNullSprite();
            ppu.resetY();
            dot += 8;
        }
        while (dot < 320) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            //ppu.fetchNullSprite();
            dot += 8;
        }
        
        this.doPreFetch(cpu, ppu, 261);
    }
    
    doPreFetch(cpu, ppu, scanline) {
        let cyclesBeforeScanline = scanline*cyclesPerScanline;
        var dot = 320;
        
        while (dot < 336) {
            cpu.doInstructions(cyclesBeforeScanline + dot/3);
            // First 2 tiles of next frame's background:
            ppu.fetchTile();
            ppu.incrementX();
            dot += 8;
        }
        ppu.fetchNullNTs();
    }
    
    cancelFrame(cpu, ppu) {
        cpu.cycleOffset = this.frame * cyclesPerFrame;
        
        cpu.doInstructions(cyclesBeforeVBlankStart);
        ppu.doVBlank();
        cpu.doInstructions(cyclesBeforeVBlankEnd);
        ppu.endVBlank();
        cpu.doInstructions(cyclesPerFrame);
        
        this.frame++;
        this.dropped++;
    }
}

export default MainLoop;
