export class VideoBuffer {
    constructor(width, height) {
        this.width  = width;
        this.height = height;
        
        this.createNewBuffer();
    }
    
    createNewBuffer() {
        if (typeof ImageData === 'function') {
            this.image = new ImageData(this.width, this.height);
            this.data  = new Uint32Array(this.image.data.buffer);
        } else {
            this.image = null;
            this.data  = new Uint32Array(this.width * this.height);
        }
    }
    
    //===============================================================//
    writePixels(x, y, values) {
        this.data.set(values, y*this.width + x);
    }
    
    getFrame() {
        let frame = this.image;
        this.createNewBuffer();
        return frame;
    }
}

export default VideoBuffer;
