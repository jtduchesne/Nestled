import AudioRingBuffer from "./Audio/AudioRingBuffer.js";

const sampleRate = 44100;
const threshold = 1/12;

/** @type {AudioContext} */
let context;

export class AudioOutput {
    constructor() {
        /** @readonly */
        this.buffer = new AudioRingBuffer(sampleRate);
        
        this.buffer.onbufferunderrun = (lag) => this.decreaseSpeed(lag);
        this.buffer.onbufferoverrun = (buffer) => {
            do this.transfer(buffer, this.context);
            while (!this.healthy);
        };
        
        /** @private */
        this.gainNode = null;
        /** @private */
        this.volumeValue = 1.0;
        
        /** @private */
        this.next = 0.0;
        /** @private */
        this.lockedUntil = Infinity;
        
        /**
         * The percentage by which the sample rate should be adjusted to keep the input
         * and output buffers in sync and prevent buffer [over/under]runs.
         * 
         * This will never exceed 1.0 (100%).
         * @type {number}
         */
        this.speedAdjustment = 1.0;
    }
    
    //===================================================================================//
    
    /**
     * @readonly
     * @type {AudioContext}
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
     * @type {AudioNode}
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
     * Output volume between 0.0 and 1.0.
     * @type {number}
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
     * @type {number}
     * @readonly
     */
    get buffered() {
        return this.next - this.context.currentTime;
    }
    /**
     * *True* if the output buffer contains enough audio to be considered safe to be
     * played.
     * @type {boolean}
     * @readonly
     */
    get healthy() {
        return this.buffered >= threshold;
    }
    
    /**
     * Sample rate (in hertz).
     * @type {number}
     * @readonly
     */
    get sampleRate() {
        return sampleRate;
    }
    
    //===================================================================================//
    
    /**
     * Initialize the audio context (if not already done) and the input buffer
     * to begin receiving audio samples via `writeSample()`.
     * 
     * Playback will start when the input buffer contains enough audio.
     */
    start() {
        const context = this.context;
        
        this.lockedUntil = Infinity;
        
        this.buffer.reset();
        this.buffer.onnewbufferready = (buffer) => {
            if (buffer.halfFull) {
                buffer.onnewbufferready = (buffer) => {
                    if (!this.healthy || buffer.halfFull)
                        this.transfer(buffer, context);
                };
                
                context.resume();
                
                this.next = context.currentTime;
                while (!this.healthy)
                    this.transfer(buffer, context);
                this.lockedUntil = this.next;
            }
        };
    }
    /**
     * Suspend the audio context, but keep it initialized for future use.
     * 
     * Playback will stop when the output buffer is empty.
     */
    stop() {
        setTimeout(() => this.context.suspend(), this.buffered * 1000);
    }
    
    /**
     * Append a new sample to the input buffer.
     * @param {number} value IEEE754 32-bit linear PCM between -1 and +1
     */
    writeSample(value) {
        this.buffer.writeSample(value);
    }
    
    //===================================================================================//
    
    /**
     * Transfer a segment of audio from the input buffer to the output context.
     * @private
     * @param {AudioRingBuffer} buffer
     * @param {AudioContext} context
     */
    transfer(buffer, context) {
        const source = context.createBufferSource();
        const audioBuffer = buffer.shift();
        source.buffer = audioBuffer;
        
        let next = this.next;
        let buffered = next - context.currentTime;
        if (buffered < threshold) {
            source.onended = () => {
                if (!this.healthy || buffer.halfFull)
                    this.transfer(buffer, context);
            };
            if (buffered < 0)
                next = context.currentTime;
        } else if (buffered > threshold*3) {
            return;
        }
        source.connect(this.destination);
        source.start(next);
        this.next = next + audioBuffer.duration;
        
        if (buffered > threshold*2)
            this.increaseSpeed((1 - (threshold*2 / buffered)) / 10);
    }
    
    /**
     * @private
     * @param {number} amount A positive number representing the percentage amount by
     * which the speed will be increased.
     */
    increaseSpeed(amount) {
        if (context.currentTime >= this.lockedUntil) {
            if (this.speedAdjustment < 1)
                this.speedAdjustment = Math.min(this.speedAdjustment * (1 + amount), 1);
            
            this.lockedUntil = this.next;
        }
    }
    /**
     * @private
     * @param {number} amount A negative number representing the percentage amount by
     * which the speed will be decreased.
     */
    decreaseSpeed(amount) {
        if (context.currentTime >= this.lockedUntil) {
            this.speedAdjustment *= (1 + amount);
            
            this.lockedUntil = this.next;
        }
    }
}

export default AudioOutput;
