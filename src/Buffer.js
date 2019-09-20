export class Buffer {
    constructor(width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.context = this.canvas.getContext('2d', {alpha: true});
        this.context.imageSmoothingEnabled = false;
        
        this.imageData = this.context.createImageData(width, height);
        const buffer = new Uint32Array(this.imageData.data.buffer);
    
        this.dirty = false;
        
        this.getPixels = function(x, y) {
            let offset = y*width + x;
            return buffer.subarray(offset, offset+8);
        };
        this.setPixels = function(x, y, values) {
            let offset = y*width + x;
            buffer.set(values, offset);
            this.dirty = true;
            return values;
        };
    }
    
    get frame() {
        if (this.dirty) {
            this.context.putImageData(this.imageData, 0, 0);
            this.dirty = false;
        }
        return this.canvas;
    }
}

export default Buffer;
