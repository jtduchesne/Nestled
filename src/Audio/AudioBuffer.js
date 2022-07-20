export class AudioBuffer {
    constructor(output) {
        this.output       = output;
        this.context      = output.context;
        this.sampleRate   = this.context ? this.context.sampleRate : 44100;
        this.bufferLength = this.sampleRate / 30;
        
        this.createNewBuffer();
    }
    
    createNewBuffer() {
        if (this.context) {
            this.buffer = this.context.createBuffer(1, this.bufferLength, this.sampleRate);
            this.data   = this.buffer.getChannelData(0);
        } else {
            this.buffer = null;
            this.data   = new Uint8Array(this.bufferLength);
        }
        
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
