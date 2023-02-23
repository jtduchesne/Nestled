export class Channel {
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
export default Channel;
//# sourceMappingURL=Channel.d.ts.map