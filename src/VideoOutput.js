import { Colors, VideoBuffer } from "./Video/index.js";
const { cssColors, pxlColors } = Colors;

const width  = 256;
const height = 240;

export class VideoOutput {
    constructor() {
        /** @private @type {HTMLCanvasElement?} */
        this.canvas  = null;
        /** @private @type {CanvasRenderingContext2D?} */
        this.context = null;
        
        this.layers = [
            /** Sprites layer behind background. */
            this.sprBehindLayer = new VideoBuffer(width +8, height +16),
            /** Background layer. */
            this.bkgLayer       = new VideoBuffer(width,    height),
            /** Sprites layer before background. */
            this.sprBeforeLayer = new VideoBuffer(width +8, height +16),
        ];
        
        /** @private @type {HTMLCanvasElement?} */
        this.offCanvas  = null;
        /** @private @type {CanvasRenderingContext2D?} */
        this.offContext = null;
        
        /** @private */
        this.scheduled = 0;
    }
    
    //===================================================================================//
    /**
     * @param {HTMLCanvasElement} output
     * @returns {HTMLCanvasElement} The now connected CANVAS element
     */
    connect(output) {
        if (output.nodeName === 'CANVAS') {
            return this.canvas = output;
        } else {
            throw new TypeError("VideoOutput.connect() expects a <CANVAS> element but " +
                                "received <" + output.nodeName + "> instead.");
        }
    }
    /**
     * @returns {HTMLCanvasElement?} The now disconnected CANVAS element
     */
    disconnect() {
        const disconnected = this.canvas;
        this.canvas = null;
        return disconnected;
    }
    
    /**
     * *True* if properly connected to a CANVAS element.
     * @readonly */
    get connected()    { return !!this.canvas; }
    /**
     * *True* if not connected to any CANVAS element.
     * @readonly */
    get disconnected() { return  !this.canvas; }
    
    //===================================================================================//
    
    start() {
        if (this.canvas) {
            if ((this.context = this.canvas.getContext('2d', {alpha: false})))
                this.context.imageSmoothingEnabled = false;
            
            this.offCanvas = document.createElement('canvas');
            this.offCanvas.width  = width;
            this.offCanvas.height = height;
            
            if ((this.offContext = this.offCanvas.getContext('2d', {alpha: true})))
                this.offContext.imageSmoothingEnabled = false;
        }
    }
    
    stop() {
        if (this.canvas) {
            window.cancelAnimationFrame(this.scheduled);
            
            this.context = null;
            
            if (this.offCanvas) {
                this.offCanvas.remove();
                this.offCanvas  = null;
                this.offContext = null;
            }
        }
    }
    
    //===================================================================================//
    /** @readonly */
    get colors() { return pxlColors; }
    
    /**
     * @param {number} backdrop 6-bit color index
     */
    schedule(backdrop) {
        if (this.canvas) {
            this.layers.forEach((layer) => layer.setFrame());
            
            const outputWidth  = this.canvas.width;
            const outputHeight = this.canvas.height;
            
            this.scheduled = window.requestAnimationFrame(() => {
                const context    = this.context;
                const offCanvas  = this.offCanvas;
                const offContext = this.offContext;
                
                if (context && offCanvas && offContext) {
                    context.fillStyle = cssColors[backdrop];
                    context.fillRect(0, 0, outputWidth, outputHeight);
                    
                    this.layers.forEach(({ frame }) => {
                        offContext.putImageData(frame, 0, 0);
                        context.drawImage(
                            offCanvas,
                            0, 0, width, height,
                            0, 0, outputWidth, outputHeight
                        );
                    });
                }
            });
        }
    }
}

export default VideoOutput;
