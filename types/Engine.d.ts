export class Engine {
    /**
     * @param {NES} bus
     */
    constructor(bus: NES);
    /** @private */
    private bus;
    firstLoop(time: number): void;
    mainLoop(time: number): void;
    /** @private */
    private runningLoop;
    /** @private */
    private lastTime;
    stats: Stats;
    isPowered: boolean;
    isPaused: boolean;
    powerOn(): void;
    powerOff(): void;
    pause(): boolean;
    coldBoot(): void;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doBoot(cpu: CPU, ppu: PPU): void;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doFrame(cpu: CPU, ppu: PPU): void;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    skipFrame(cpu: CPU, ppu: PPU): void;
    /**
     * Vertical blanking lines (241-260).
     * The VBlank flag of the PPU is set at scanline 241, where the VBlank NMI also occurs.
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doVBlank(cpu: CPU, ppu: PPU): void;
    /**
     * This is a visible scanline, which also processes the graphics to be displayed on
     * the screen.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @param {number} scanline
     */
    doScanline(cpu: CPU, ppu: PPU, scanline: number): void;
    /**
     * This is a dummy scanline, whose sole purpose is to fill the shift registers with
     * the data for the first two tiles of the next scanline. Although no pixels are
     * rendered for this scanline, the PPU still makes the same memory accesses it would
     * for a regular scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     */
    doPreRenderLine(cpu: CPU, ppu: PPU): void;
    /**
     * Fetch the first 2 tiles for the next scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @param {number} scanline
     */
    doPreFetch(cpu: CPU, ppu: PPU, scanline: number): void;
}
export default Engine;
export type NES = import('./NES.js').NES;
export type CPU = import('./CPU.js').CPU;
export type PPU = import('./PPU.js').PPU;
declare class Stats {
    fps: number;
    performance: number;
    /** @param {number} startTime */
    addFrame: (startTime: number) => void;
    dropFrame: () => void;
}
//# sourceMappingURL=Engine.d.ts.map