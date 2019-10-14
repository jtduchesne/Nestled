export class AudioBuffer {
    constructor(bufferLength, sampleRate) {
        let context = new AudioContext();
        
        this.bufferLength = bufferLength;
        this.sampleRate   = sampleRate;
        
        this.data = new Float32Array(bufferLength);
        this.reset();
        
        let buffer = context.createBuffer(1, bufferLength, sampleRate);
        
        var sourceNode;
        this.play = () => {
            sourceNode = context.createBufferSource();
            sourceNode.connect(context.destination);
            
            buffer.copyToChannel(this.data, 0);
            
            sourceNode.buffer = buffer;
            sourceNode.start();
            
            this.reset();
        };
        this.stop = () => {
            if (sourceNode)
                sourceNode.stop();
            
            this.reset();
        };
    }
    
    reset() {
        this.index = 0;
        this.sample = 0.0;
    }
    
    set sample(value) {
        this.data[this.index++] = value;
        if (this.index === this.bufferLength) {
            this.data[this.index] = 0.0;
            this.play();
        }
    }
}

export default AudioBuffer;
