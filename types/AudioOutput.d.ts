export class AudioOutput {
    /** @readonly */
    readonly buffer: AudioRingBuffer;
    /** @private */
    private gainNode;
    /** @private */
    private volumeValue;
    /** @private */
    private next;
    /** @private */
    private lockedUntil;
    /**
     * The percentage by which the sample rate should be adjusted to keep the input
     * and output buffers in sync and prevent buffer [over/under]runs.
     *
     * This will never exceed 1.0 (100%).
     * @type {number}
     */
    speedAdjustment: number;
    /**
     * @readonly
     * @type {AudioContext}
     */
    readonly get context(): AudioContext;
    /**
     * @readonly
     * @type {AudioNode}
     */
    readonly get destination(): AudioNode;
    set volume(arg: number);
    /**
     * Output volume between 0.0 and 1.0.
     * @type {number}
     */
    get volume(): number;
    /**
     * The amount of audio currently in the output buffer (in second).
     * @type {number}
     * @readonly
     */
    readonly get buffered(): number;
    /**
     * *True* if the output buffer contains enough audio to be considered safe to be
     * played.
     * @type {boolean}
     * @readonly
     */
    readonly get healthy(): boolean;
    /**
     * Sample rate (in hertz).
     * @type {number}
     * @readonly
     */
    readonly get sampleRate(): number;
    /**
     * Initialize the audio context (if not already done) and the input buffer
     * to begin receiving audio samples via `writeSample()`.
     *
     * Playback will start when the input buffer contains enough audio.
     */
    start(): void;
    /**
     * Suspend the audio context, but keep it initialized for future use.
     *
     * Playback will stop when the output buffer is empty.
     */
    stop(): void;
    /**
     * Append a new sample to the input buffer.
     * @param {number} value IEEE754 32-bit linear PCM between -1 and +1
     */
    writeSample(value: number): void;
    /**
     * Transfer a segment of audio from the input buffer to the output context.
     * @private
     * @param {AudioRingBuffer} buffer
     * @param {AudioContext} context
     */
    private transfer;
    /**
     * @private
     * @param {number} amount A positive number representing the percentage amount by
     * which the speed will be increased.
     */
    private increaseSpeed;
    /**
     * @private
     * @param {number} amount A negative number representing the percentage amount by
     * which the speed will be decreased.
     */
    private decreaseSpeed;
}
export default AudioOutput;
import AudioRingBuffer from "./Audio/AudioRingBuffer.js";
//# sourceMappingURL=AudioOutput.d.ts.map