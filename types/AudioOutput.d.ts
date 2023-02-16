export class AudioOutput {
    /** @private */
    private buffer;
    /** @private */
    private gainNode;
    /** @private */
    private volumeValue;
    /** @private */
    private next;
    /** @private */
    private lockedUntil;
    speedAdjustment: number;
    /**
     * @readonly
     * @returns {AudioContext} AudioContext
     */
    readonly get context(): AudioContext;
    /**
     * @readonly
     * @returns {AudioNode} AudioNode
     */
    readonly get destination(): AudioNode;
    set volume(arg: number);
    /**
     * Output volume between 0.0 and 1.0
     */
    get volume(): number;
    /**
     * The amount of audio currently in the output buffer (in second).
     * @readonly
     */
    readonly get buffered(): number;
    /**
     * *True* if the output buffer contains enough audio to be considered safe to be
     * played.
     * @readonly
     */
    readonly get healthy(): boolean;
    /**
     * Sample rate (in hertz).
     * @readonly
     */
    readonly get sampleRate(): number;
    start(): void;
    stop(): void;
    /** @param {number} value */
    writeSample(value: number): void;
    /**
     * @private
     * @param {AudioContext} context
     * @param {AudioRingBuffer} buffer
     */
    private schedule;
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
//# sourceMappingURL=AudioOutput.d.ts.map