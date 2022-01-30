export class VideoBuffer {
    constructor(width, height) {
        this.width  = width;
        this.height = height;
        
        this.createNewBuffer();
    }
    
    createNewBuffer() {
        this.image = new ImageData(this.width, this.height);
        this.data  = new Uint32Array(this.image.data.buffer);
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
