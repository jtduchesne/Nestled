export class VideoBuffer {
    constructor(width: any, height: any);
    width: any;
    height: any;
    createNewBuffer(): void;
    image: ImageData;
    data: Uint32Array;
    writePixels(x: any, y: any, values: any): void;
    getFrame(): ImageData;
}
export default VideoBuffer;
//# sourceMappingURL=VideoBuffer.d.ts.map