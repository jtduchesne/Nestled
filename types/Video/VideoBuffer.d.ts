export class VideoBuffer {
    constructor(width: number, height: number);
    width: number;
    height: number;
    createNewBuffer(): void;
    image: ImageData;
    data: Uint32Array;
    writePixels(x: number, y: number, values: ArrayLike<number>): void;
    getFrame(): ImageData;
}
export default VideoBuffer;
//# sourceMappingURL=VideoBuffer.d.ts.map