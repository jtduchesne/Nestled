import { Colors, VideoBuffer } from "./Video/index.js";
const { cssColors, pxlColors } = Colors;

const width  = 256;
const height = 240;

export class VideoOutput {
    constructor() {
        this.canvas  = null;
        this.context = null;
        
        this.layers = [
            this.sprBehindLayer = new VideoBuffer(width +8, height +16),
            this.bkgLayer       = new VideoBuffer(width,    height),
            this.sprBeforeLayer = new VideoBuffer(width +8, height +16),
        ];
    }
    
    //===================================================================================//
    
    connect(output) {
        if (output.nodeName === 'CANVAS') {
            return this.canvas = output;
        } else {
            throw new TypeError("VideoOutput.connect() expects a <CANVAS> element but " +
                                "received <" + output.nodeName + "> instead.");
        }
    }
    disconnect() {
        const disconnected = this.canvas;
        this.canvas = null;
        return disconnected;
    }
    
    get connected()    { return !!this.canvas; }
    get disconnected() { return  !this.canvas; }
    
    //===================================================================================//
    
    start() {
        if (this.connected) {
            this.context = this.canvas.getContext('2d', {alpha: false});
            this.context.imageSmoothingEnabled = false;
            
            this.offCanvas = document.createElement('canvas');
            this.offCanvas.width  = width;
            this.offCanvas.height = height;
            this.offContext = this.offCanvas.getContext('2d', {alpha: true});
            this.offContext.imageSmoothingEnabled = false;
        }
    }
    
    stop() {
        if (this.connected) {
            window.cancelAnimationFrame(this.scheduled);
            
            this.context = null;
            
            this.offCanvas.remove();
            this.offContext = null;
        }
    }
    
    //===================================================================================//
    
    get colors() { return pxlColors; }
    
    schedule(backdrop) {
        if (this.connected) {
            this.layers.forEach((layer) => layer.setFrame());
            
            this.scheduled = window.requestAnimationFrame(() => {
                this.context.fillStyle = cssColors[backdrop];
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.layers.forEach(({ frame }) => {
                    this.offContext.putImageData(frame, 0, 0);
                    this.context.drawImage(
                        this.offCanvas,
                        0, 0, width, height,
                        0, 0, this.canvas.width, this.canvas.height
                    );
                });
            });
        }
    }
}

export default VideoOutput;
