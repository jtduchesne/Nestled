export class Channel {
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
    /** @protected */
    protected updateLength(): void;
}
export default Channel;
//# sourceMappingURL=Channel.d.ts.map