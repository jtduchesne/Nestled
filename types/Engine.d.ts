export class Engine {
    /**
     * @param {NES} bus
     */
    constructor(bus: NES);
    /** @private */
    private bus;
    /**
     * @type {FrameRequestCallback}
     * @private */
    private firstLoop;
    /**
     * @type {FrameRequestCallback}
     * @private */
    private mainLoop;
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
    /** @private */
    private coldBoot;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    private doBoot;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    private doFrame;
    /**
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    private skipFrame;
    /**
     * Vertical blanking lines (241-260).
     * The VBlank flag of the PPU is set at scanline 241, where the VBlank NMI also occurs.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    private doVBlank;
    /**
     * This is a visible scanline, which also processes the graphics to be displayed on
     * the screen.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @param {number} scanline
     * @private
     */
    private doScanline;
    /**
     * This is a dummy scanline, whose sole purpose is to fill the shift registers with
     * the data for the first two tiles of the next scanline. Although no pixels are
     * rendered for this scanline, the PPU still makes the same memory accesses it would
     * for a regular scanline.
     * @param {CPU} cpu
     * @param {PPU} ppu
     * @private
     */
    private doPreRenderLine;
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