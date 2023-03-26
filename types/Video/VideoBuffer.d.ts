export class VideoBuffer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width: number, height: number);
    width: number;
    height: number;
    /** *ImageData* ready to be drawn on screen. */
    frame: ImageData;
    /** @private */
    private image;
    /** @private */
    private data;
    /**
     * Move the current buffer into `frame` and create a new empty buffer.
     */
    setFrame(): void;
    /**
     * Write a series of pixels starting at given X/Y position (from top-left corner).
     * @param {number} x
     * @param {number} y
     * @param {ArrayLike<number>} values An array of 32-bit RGBA pixel values
     */
    writePixels(x: number, y: number, values: ArrayLike<number>): void;
}
export default VideoBuffer;
//# sourceMappingURL=VideoBuffer.d.ts.map