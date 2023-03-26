export class VideoOutput {
    /** @private @type {HTMLCanvasElement?} */
    private canvas;
    /** @private @type {CanvasRenderingContext2D?} */
    private context;
    layers: VideoBuffer[];
    /** Sprites layer behind background. */
    sprBehindLayer: VideoBuffer;
    /** Background layer. */
    bkgLayer: VideoBuffer;
    /** Sprites layer before background. */
    sprBeforeLayer: VideoBuffer;
    /** @private @type {HTMLCanvasElement?} */
    private offCanvas;
    /** @private @type {CanvasRenderingContext2D?} */
    private offContext;
    /** @private */
    private scheduled;
    /**
     * @param {HTMLCanvasElement} output
     * @returns {HTMLCanvasElement} The now connected CANVAS element
     */
    connect(output: HTMLCanvasElement): HTMLCanvasElement;
    /**
     * @returns {HTMLCanvasElement?} The now disconnected CANVAS element
     */
    disconnect(): HTMLCanvasElement | null;
    /**
     * *True* if properly connected to a CANVAS element.
     * @readonly */
    readonly get connected(): boolean;
    /**
     * *True* if not connected to any CANVAS element.
     * @readonly */
    readonly get disconnected(): boolean;
    start(): void;
    stop(): void;
    /** @readonly */
    readonly get colors(): Uint32Array;
    /**
     * @param {number} backdrop 6-bit color index
     */
    schedule(backdrop: number): void;
}
export default VideoOutput;
import { VideoBuffer } from "./Video/index.js";
//# sourceMappingURL=VideoOutput.d.ts.map