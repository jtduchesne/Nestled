export class VideoBuffer {
    constructor(width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.context = this.canvas.getContext('2d', {alpha: true});
        this.context.imageSmoothingEnabled = false;
        
        this.imageData = this.context.createImageData(width, height);
        const buffer = new Uint32Array(this.imageData.data.buffer);
        
        this.getPixels = function(x, y) {
            let offset = y*width + x;
            return buffer.subarray(offset, offset+8);
        };
        this.setPixels = function(x, y, values) {
            let offset = y*width + x;
            buffer.set(values, offset);
        };
    }
    
    get frame() {
        this.context.putImageData(this.imageData, 0, 0);
        return this.canvas;
    }
    
    clear() {
        this.imageData.data.fill(0);
        this.context.putImageData(this.imageData, 0, 0);
    }
}

export default VideoBuffer;
