export class VideoOutput {
    canvas: any;
    context: any;
    layers: any[];
    get connected(): boolean;
    get disconnected(): boolean;
    connect(output: any): any;
    width: any;
    height: any;
    disconnect(): any;
    addLayer(videoBuffer: any): void;
    start(): void;
    offCanvas: HTMLCanvasElement;
    offContext: CanvasRenderingContext2D;
    stop(): void;
    schedule(cssBackdrop: any): void;
    scheduled: number;
}
export default VideoOutput;
//# sourceMappingURL=VideoOutput.d.ts.map