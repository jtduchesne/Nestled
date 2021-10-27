export class AudioBuffer {
    constructor(bufferLength, sampleRate) {
        this.context = new AudioContext();
        
        this.bufferLength = bufferLength;
        this.sampleRate   = sampleRate;
        
        this.index = 0;
        
        if (window)
            this.createBuffer();
        else
            this.data = new Float32Array(bufferLength);
    }
    
    createBuffer() {
        this.buffer = this.context.createBuffer(1, this.bufferLength, this.sampleRate);
        this.data   = this.buffer.getChannelData(0);
        
        this.sourceNode = this.context.createBufferSource();
        this.sourceNode.connect(this.context.destination);
    }
    
    //===============================================================//
    play() {
        this.sourceNode = this.context.createBufferSource();
        this.sourceNode.connect(this.context.destination);
        
        this.sourceNode.buffer = this.buffer;
        this.sourceNode.start();
        
        this.createBuffer();
        this.index = 0;
    }
    stop() {
        this.index = 0;
    }
    
    //===============================================================//
    writeSample(value) {
        this.data[this.index++] = value;
        if (this.index === this.bufferLength) {
            this.play();
        }
    }
}

export default AudioBuffer;
