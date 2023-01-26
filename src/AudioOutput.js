const sampleRate = 44100;
const bufferLength = sampleRate / 30;

/** @type {AudioContext} */
let context;

export class AudioOutput {
    constructor() {
        this.volumeValue = 1.0;
        this.next = 0.0;
    }
    
    /**
     * @readonly
     * @returns {AudioContext} AudioContext
     */
    get context() {
        if (!context) {
            context = new AudioContext({ sampleRate });
            context.suspend();
        }
        return context;
    }
    
    /**
     * @readonly
     * @returns {AudioNode} AudioNode
     */
    get destination() {
        if (!this.gainNode) {
            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = this.volumeValue;
            this.gainNode.connect(this.context.destination);
        }
        return this.gainNode;
    }
    
    /** @readonly */
    get sampleRate() {
        return sampleRate;
    }
    
    /**
     * Output volume between 0.0 and 1.0
     */
    get volume() {
        return this.volumeValue;
    }
    set volume(value) {
        this.volumeValue = Math.min(1, Math.abs(value));
        if (this.gainNode)
            this.gainNode.gain.value = this.volumeValue;
    }
    
    //===============================================================//
    
    start() {
        this.context.resume();
        this.createNewBuffer();
    }
    stop() {
        this.context.suspend();
    }
    
    //===============================================================//
    
    /**
     * @param {number} value
     */
    writeSample(value) {
        this.data[this.index++] = value;
        if (this.index === bufferLength) {
            this.schedule(this.buffer);
            this.createNewBuffer();
        }
    }
    
    /** @private */
    createNewBuffer() {
        this.buffer = this.context.createBuffer(1, bufferLength, sampleRate);
        this.data   = this.buffer.getChannelData(0);
        this.index = 0;
    }
    
    /**
     * @private
     * @param {AudioBuffer} buffer
     */
    schedule(buffer) {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.destination);
        
        if (this.next < context.currentTime) {
            source.start();
            this.next = context.currentTime + buffer.duration;
        } else {
            source.start(this.next);
            this.next += buffer.duration;
        }
    }
}

export default AudioOutput;
