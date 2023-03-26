export class VideoBuffer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this.width  = width;
        this.height = height;
        
        /** *ImageData* ready to be drawn on screen. */
        this.frame = new ImageData(width, height);
        /** @private */
        this.image = new ImageData(width, height);
        /** @private */
        this.data  = new Uint32Array(this.image.data.buffer);
    }
    
    //===================================================================================//
    /**
     * Move the current buffer into `frame` and create a new empty buffer.
     */
    setFrame() {
        this.frame = this.image;
        this.image = new ImageData(this.width, this.height);
        this.data  = new Uint32Array(this.image.data.buffer);
    }
    
    //===================================================================================//
    /**
     * Write a series of pixels starting at given X/Y position (from top-left corner).
     * @param {number} x
     * @param {number} y
     * @param {ArrayLike<number>} values An array of 32-bit RGBA pixel values
     */
    writePixels(x, y, values) {
        this.data.set(values, y*this.width + x);
    }
}

export default VideoBuffer;
