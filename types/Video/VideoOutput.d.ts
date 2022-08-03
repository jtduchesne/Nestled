export class VideoOutput {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    layers: VideoBuffer[];
    get connected(): boolean;
    get disconnected(): boolean;
    connect(output: HTMLCanvasElement): HTMLCanvasElement | null;
    width: number;
    height: number;
    disconnect(): null;
    addLayer(videoBuffer: VideoBuffer): void;
    start(): void;
    offCanvas: HTMLCanvasElement;
    offContext: CanvasRenderingContext2D;
    stop(): void;
    schedule(cssBackdrop: string): void;
    scheduled: number;
}
export default VideoOutput;
import VideoBuffer from "./VideoBuffer.js";
//# sourceMappingURL=VideoOutput.d.ts.map