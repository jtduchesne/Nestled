export class AudioBuffer {
    constructor(output) {
        this.output       = output;
        this.context      = output.context;
        this.sampleRate   = this.context.sampleRate;
        this.bufferLength = this.sampleRate / 30;
        
        this.createNewBuffer();
    }
    
    createNewBuffer() {
        this.buffer = this.context.createBuffer(1, this.bufferLength, this.sampleRate);
        this.data   = this.buffer.getChannelData(0);
        
        this.index = 0;
    }
    
    //===============================================================//
    writeSample(value) {
        this.data[this.index++] = value;
        
        if (this.index === this.bufferLength) {
            this.output.schedule(this.buffer);
            this.createNewBuffer();
        }
    }
}

export default AudioBuffer;
