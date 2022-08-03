export class Engine {
    constructor(nes: NES);
    bus: NES;
    firstLoop(): void;
    mainLoop(): void;
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
    cpu: CPU;
    ppu: PPU;
    powerOff(): void;
    pause(): boolean;
}
export default Engine;
import CPU from "./CPU.js";
import NES from "./NES.js";
import PPU from "./PPU.js";
//# sourceMappingURL=Engine.d.ts.map