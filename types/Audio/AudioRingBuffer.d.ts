/**
 * An array of short audio buffers continuously reused in a FIFO manner. When ready,
 * an audio buffer can be shifted out and then played by being passed into an
 * `AudioBufferSourceNode`.
 */
export class AudioRingBuffer {
    /**
     * @param {number} sampleRate
     */
    constructor(sampleRate: number);
    /**
     * @private @readonly
     * @type {AudioBuffer[]}
     */
    private readonly buffers;
    /** @private */
    private readyBuffer;
    private writeBuffer;
    /** @private */
    private nextReadyIndex;
    private nextWriteIndex;
    /** @private */
    private data;
    /** @private */
    private index;
    /**
     * The length in seconds of one audio buffer.
     * @readonly
     * @type {number}
     */
    readonly duration: number;
    /**
     * Triggered when a new audio buffer is ready to be shifted out and played.
     * @type {((buffer:AudioRingBuffer) => void)|undefined}
     */
    onnewbufferready: ((buffer: AudioRingBuffer) => void) | undefined;
    /**
     * Triggered just **_after_** a buffer underrun occurs.
     *
     * This should be used for logging, or to take action to prevent *another* such
     * event from happening, but nothing should be read/written to the buffer at this
     * time since it happens *while* an audio buffer is being shifted out.
     * @type {((lag:number) => void)|undefined}
     */
    onbufferunderrun: ((lag: number) => void) | undefined;
    /**
     * Triggered just **_before_** a buffer overrun occurs.
     *
     * This gives the opportunity to prevent it by shifting out one or more audio
     * buffers to free some space.
     * @type {((buffer:AudioRingBuffer) => void)|undefined}
     */
    onbufferoverrun: ((buffer: AudioRingBuffer) => void) | undefined;
    /**
     * Empties all buffers completely and bring `usage` back to 0%.
     */
    reset(): void;
    /** @private */
    private initChannelData;
    /**
     * The length (in samples) of each audio buffer.
     * @readonly
     */
    readonly get length(): number;
    /**
     * The total number of audio buffers in the queue.
     * @readonly
     */
    readonly get buffersCount(): number;
    /**
     * The number of audio buffers that are currently ready to be shifted out of the
     * queue and played.
     * @readonly
     */
    readonly get readyBuffersCount(): number;
    /**
     * The percentage usage of the whole ring buffer.
     * @readonly
     */
    readonly get usage(): number;
    /**
     * *True* if there is at least 1 buffer ready to be played.
     * @readonly
     */
    readonly get ready(): boolean;
    /**
     * *True* if half of the buffers are ready to be played.
     * @readonly
     */
    readonly get halfFull(): boolean;
    /**
     * Get the first *Ready* buffer out of the queue.
     *
     * If no buffer is ready yet (buffer underrun), current `writeBuffer` will be
     * fulfilled with the last received sample (which will result in silence) and then
     * rotated.
     *
     * @returns {AudioBuffer} The first *Ready* buffer
     */
    shift(): AudioBuffer;
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
    writeSample(value: number): void;
    /** @private */
    private rotateWriteBuffer;
    /** @private */
    private rotateReadyBuffer;
}
export default AudioRingBuffer;
//# sourceMappingURL=AudioRingBuffer.d.ts.map