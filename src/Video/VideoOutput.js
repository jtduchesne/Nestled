export class VideoOutput {
    constructor() {
        this.canvas  = null;
        this.context = null;
        
        this.layers = [];
    }
    
    get connected()    { return !!this.canvas; }
    get disconnected() { return  !this.canvas; }
    
    connect(output) {
        if (output && output.nodeName === 'CANVAS') {
            this.canvas = output;
            
            this.width  = output.width;
            this.height = output.height;
            
            return output;
        } else {
            return this.disconnect();
        }
    }
    disconnect() {
        return this.canvas = null;
    }
    
    //===============================================================//
    
    addLayer(videoBuffer) {
        this.layers.push(videoBuffer);
    }
    
    start() {
        if (this.canvas) {
            this.context = this.canvas.getContext('2d', {alpha: false});
            this.context.imageSmoothingEnabled = false;
            
            this.offCanvas = document.createElement('canvas');
            this.offCanvas.width  = 256;
            this.offCanvas.height = 240;
            this.offContext = this.offCanvas.getContext('2d', {alpha: true});
            this.offContext.imageSmoothingEnabled = false;
        }
    }
    
    stop() {
        if (this.canvas) {
            window.cancelAnimationFrame(this.scheduled);
            
            this.layers = [];
            
            this.context = null;
            
            this.offCanvas.remove();
            this.offContext = null;
        }
    }
    
    //===============================================================//
    
    schedule(cssBackdrop) {
        const layers = this.layers.map((layer) => layer.getFrame());
        
        this.scheduled = window.requestAnimationFrame(() => {
            this.context.fillStyle = cssBackdrop;
            this.context.fillRect(0, 0, this.width, this.height);
            
            layers.forEach((layer) => {
                this.offContext.putImageData(layer, 0, 0);
                this.context.drawImage(this.offCanvas, 0, 0, 256, 240, 0, 0, this.width, this.height);
            });
        });
    }
}

export default VideoOutput;
