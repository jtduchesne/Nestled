export class Channel {
    lengthCounter: number;
    lengthCounterHalt: boolean;
    reset(): void;
    set enabled(arg: boolean);
    /** @type {boolean} */
    get enabled(): boolean;
    protected set length(arg: number);
    /** @protected @type {number} */
    protected get length(): number;
    /** @protected */
    protected updateLength(): void;
}
export default Channel;
//# sourceMappingURL=Channel.d.ts.map