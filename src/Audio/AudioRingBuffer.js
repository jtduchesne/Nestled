const bufferLength = 512;
const buffersCount = 16;

/**
 * An array of short audio buffers continuously reused in a FIFO manner. When ready,
 * an audio buffer can be shifted out and then played by being passed into an
 * `AudioBufferSourceNode`.
 */
export class AudioRingBuffer {
    /**
     * @param {number} sampleRate
     */
    constructor(sampleRate) {
        /**
         * @private @readonly
         * @type {AudioBuffer[]}
         */
        this.buffers = new Array(buffersCount).fill(null).map(() => (
            new AudioBuffer({ length: bufferLength, sampleRate })
        ));

        /**
         * The length in seconds of one audio buffer.
         * @readonly
         * @type {number}
         */
        this.duration = bufferLength / sampleRate;

        /**
         * Triggered when a new audio buffer is ready to be shifted out and played.
         * @type {(buffer:AudioRingBuffer) => void|undefined}
         */
        this.onnewbufferready = undefined;

        /**
         * Triggered just **_after_** a buffer underrun occurs.
         * 
         * This should be used for logging, or to take action to prevent *another* such
         * event from happening, but nothing should be read/written to the buffer at this
         * time since it happens *while* an audio buffer is being shifted out.
         * @type {(lag:number) => void|undefined}
         */
        this.onbufferunderrun = undefined;
        /**
         * Triggered just **_before_** a buffer overrun occurs.
         * 
         * This gives the opportunity to prevent it by shifting out one or more audio
         * buffers to free some space.
         * @type {(buffer:AudioRingBuffer) => void|undefined}
         */
        this.onbufferoverrun = undefined;

        this.reset();
    }

    //===================================================================================//

    /**
     * Empties all buffers completely and bring `usage` back to 0%.
     */
    reset() {
        /** @private */
        this.readyBuffer = this.writeBuffer = this.buffers[0];
        /** @private */
        this.nextReadyIndex = this.nextWriteIndex = 1;

        this.initChannelData();
    }
    /** @private */
    initChannelData() {
        /** @private */
        this.data = this.writeBuffer.getChannelData(0);
        /** @private */
        this.index = 0;
    }

    //===================================================================================//

    /**
     * The length (in samples) of each audio buffer.
     * @readonly
     */
    get length() {
        return bufferLength;
    }

    /**
     * The total number of audio buffers in the queue.
     * @readonly
     */
    get buffersCount() {
        return buffersCount;
    }
    /**
     * The number of audio buffers that are currently ready to be shifted out of the
     * queue and played.
     * @readonly
     */
    get readyBuffersCount() {
        const readyCount = this.nextWriteIndex - this.nextReadyIndex;
        return (readyCount < 0) ? readyCount + buffersCount : readyCount;
    }

    /**
     * The percentage usage of the whole ring buffer.
     * @readonly
     */
    get usage() {
        return (this.readyBuffersCount + (this.index / bufferLength)) / buffersCount;
    }

    /**
     * *True* if there is at least 1 buffer ready to be played.
     * @readonly
     */
    get ready() { return this.nextReadyIndex !== this.nextWriteIndex; }
    /**
     * *True* if half of the buffers are ready to be played.
     * @readonly
     */
    get halfFull() { return this.readyBuffersCount >= buffersCount/2; }

    //===================================================================================//

    /**
     * Get the first *Ready* buffer out of the queue.
     * 
     * If no buffer is ready yet (buffer underrun), current `writeBuffer` will be
     * fulfilled with the last received sample (which will result in silence) and then
     * rotated.
     * 
     * @returns {AudioBuffer} The first *Ready* buffer
     */
    shift() {
        if (!this.ready) {
            const index = this.index;
            const lastSample = index && this.data[index-1];
            this.data.fill(lastSample, index);
            this.rotateWriteBuffer();
            this.data = this.writeBuffer.getChannelData(0);
            this.data.fill(lastSample, 0, index);

            if (typeof this.onbufferunderrun === 'function')
                this.onbufferunderrun(((index / bufferLength) - 1) * this.duration);
        }
        const currentBuffer = this.readyBuffer;

        this.rotateReadyBuffer();

        return currentBuffer;
    }

    /**
     * Appends a sample to the current `writeBuffer`, automatically rotating it when full.
     * 
     * If the queue becomes full (buffer overrun), `onbufferoverrun` will be called first
     * (if set), which gives the opportunity to free some space by shifting one or more
     * *Ready* buffers. Otherwise the whole ring buffer will be cleared except for the
     * first *Ready* buffer, which will keep its *Ready* state, and writing will continue
     * on the next one (audio click will occur).
     * 
     * @param {number} value IEEE754 32-bit linear PCM between -1 and +1
     */
    writeSample(value) {
        this.data[this.index++] = value;
        if (this.index === bufferLength) {
            if (this.usage === 1.0) {
                if (typeof this.onbufferoverrun === 'function')
                    this.onbufferoverrun(this);
            }
            this.rotateWriteBuffer();

            if (this.ready) {
                this.initChannelData();
                if (typeof this.onnewbufferready === 'function')
                    this.onnewbufferready(this);
            } else {
                this.rotateWriteBuffer();
                this.initChannelData();
            }
        }
    }

    //===================================================================================//

    /** @private */
    rotateWriteBuffer() {
        let nextWriteIndex = this.nextWriteIndex;
        this.writeBuffer = this.buffers[nextWriteIndex++];
        this.nextWriteIndex = (nextWriteIndex < buffersCount) ? nextWriteIndex : 0;
    }
    /** @private */
    rotateReadyBuffer() {
        let nextReadyIndex = this.nextReadyIndex;
        this.readyBuffer = this.buffers[nextReadyIndex++];
        this.nextReadyIndex = (nextReadyIndex < buffersCount) ? nextReadyIndex : 0;
    }
}

export default AudioRingBuffer;
