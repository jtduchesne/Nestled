export class VideoOutput {
    constructor(output) {
        this.connect(output);
    }
    
    get connected()    { return !!this.canvas; }
    get disconnected() { return  !this.canvas; }
    
    connect(output) {
        if (output && output.nodeName === 'CANVAS') {
            this.canvas = output;
            
            let context = output.getContext('2d', {alpha: false});
            context.imageSmoothingEnabled = false;
            
            let width  = output.width;
            let height = output.height;
            
            this.draw = function(videoBuffer) {
                context.drawImage(videoBuffer.frame, 0, 0, 256, 240, 0, 0, width, height);
                videoBuffer.clear();
            };
            this.fill = function(cssColor) {
                context.fillStyle = cssColor;
                context.fillRect(0, 0, width, height);
            };
            
            return output;
        } else {
            return this.disconnect();
        }
    }
    disconnect() {
        this.canvas  = null;
        
        this.draw = function() { return; };
        this.fill = function() { return; };
        
        return null;
    }
}

export default VideoOutput;
