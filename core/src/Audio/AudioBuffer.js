export class AudioBuffer {
    constructor(output) {
        this.output       = output;
        this.context      = output.context;
        this.sampleRate   = this.context.sampleRate;
        this.bufferLength = this.sampleRate / 30;
        
        this.cyclesPerSample = 1789772.727 / 2 / this.sampleRate;
        
        this.buffers = [];
        this.createBuffer();
    }
    
    createBuffer() {
        let buffer = this.context.createBuffer(1, this.bufferLength, this.sampleRate);
        this.data  = buffer.getChannelData(0);
        
        this.buffers.push(buffer);
        
        this.index = 0;
    }
    
    //===============================================================//
    writeSample(value) {
        this.data[this.index++] = value;
        
        if (this.index === this.bufferLength) {
            this.createBuffer();
            this.output.schedule(this.buffers.shift());
        }
    }
}

export default AudioBuffer;
