export class Engine {
    constructor(nes: any);
    bus: any;
    firstLoop(): void;
    mainLoop(): boolean;
    runningLoop: NodeJS.Timeout;
    isPowered: boolean;
    isPaused: boolean;
    init(): void;
    frame: number;
    dropped: number;
    fps: number;
    performance: number;
    _delta: number;
    _lastTimestamp: number;
    _frameTimeThisSecond: number;
    _framesThisSecond: number;
    _fps: number;
    powerOn(): void;
    cpu: any;
    ppu: any;
    powerOff(): void;
    pause(): boolean;
    coldBoot(): void;
    updateStats(frameTime: any): void;
    doFrame(cpu: any, ppu: any): void;
    skipFrame(cpu: any, ppu: any): void;
    doScanline(cpu: any, ppu: any, scanline: any): void;
    doPreRenderLine(cpu: any, ppu: any): void;
    doPreFetch(cpu: any, ppu: any, scanline: any): void;
}
export default Engine;
//# sourceMappingURL=Engine.d.ts.map