/**
 * The length counter provides automatic duration control for the waveform channels.
 *
 * Once loaded with a value, it can optionally count down (when the halt flag is clear)
 * and once it reaches zero, the corresponding channel is silenced.
 */
export class LengthCounter {
    /** @private */
    private disabled;
    /** @private */
    private lengthCounter;
    /** @protected */
    protected lengthCounterHalt: boolean;
    reset(): void;
    set enabled(arg: boolean);
    /** @type {boolean} */
    get enabled(): boolean;
    set length(arg: number);
    /** @type {number} */
    get length(): number;
    doHalf(): void;
}
export default LengthCounter;
//# sourceMappingURL=LengthCounter.d.ts.map