export class VideoBuffer {
    constructor(width, height) {
        this.width  = width;
        this.height = height;
        
        this.frame = new ImageData(width, height);
        this.image = new ImageData(width, height);
        this.data  = new Uint32Array(this.image.data.buffer);
    }
    
    //===================================================================================//
    writePixels(x, y, values) {
        this.data.set(values, y*this.width + x);
    }
    
    setFrame() {
        this.frame = this.image;
        this.image = new ImageData(this.width, this.height);
        this.data  = new Uint32Array(this.image.data.buffer);
    }
}

export default VideoBuffer;
