import AudioRingBuffer from "./Audio/AudioRingBuffer.js";

const sampleRate = 44100;
const threshold = 1/12;

/** @type {AudioContext} */
let context;

export class AudioOutput {
    constructor() {
        /** @private */
        this.buffer = new AudioRingBuffer(sampleRate);
        
        /** @private */
        this.gainNode = null;
        /** @private */
        this.volumeValue = 1.0;
        
        /** @private */
        this.next = 0.0;
    }
    
    //===================================================================================//
    
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
    
    //===================================================================================//
    
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
    
    /**
     * The amount of audio currently in the output buffer (in second).
     * @readonly
     */
    get buffered() {
        return this.next - this.context.currentTime;
    }
    /**
     * *True* if the output buffer contains enough audio to be considered safe to be
     * played.
     * @readonly
     */
    get healthy() {
        return this.buffered >= threshold;
    }
    
    /**
     * Sample rate (in hertz).
     * @readonly
     */
    get sampleRate() {
        return sampleRate;
    }
    
    //===================================================================================//
    
    start() {
        const context = this.context;
        
        this.buffer.reset();
        this.buffer.onnewbufferready = (buffer) => {
            if (buffer.halfFull) {
                buffer.onnewbufferready = (buffer) => {
                    if (!this.healthy || buffer.halfFull)
                        this.schedule(context, buffer);
                };
                
                context.resume();
                
                this.next = context.currentTime;
                while (!this.healthy)
                    this.schedule(context, buffer);
            }
        };
    }
    stop() {
        setTimeout(() => this.context.suspend(), this.buffered * 1000);
    }
    
    /** @param {number} value */
    writeSample(value) {
        this.buffer.writeSample(value);
    }
    
    //===================================================================================//
    
    /**
     * @private
     * @param {AudioContext} context
     * @param {AudioRingBuffer} buffer
     */
    schedule(context, buffer) {
        const source = context.createBufferSource();
        const audioBuffer = buffer.shift();
        source.buffer = audioBuffer;
        source.onended = () => {
            if (!this.healthy || buffer.halfFull)
                this.schedule(context, buffer);
        };
        
        let next = this.next;
        if (next - context.currentTime < 0)
            next = context.currentTime;
        
        source.connect(this.destination);
        source.start(next);
        this.next = next + audioBuffer.duration;
    }
}

export default AudioOutput;
