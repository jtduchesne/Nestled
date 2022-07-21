export class Channel {
    set enabled(arg: boolean);
    get enabled(): boolean;
    lengthCounter: number;
    lengthCounterHalt: boolean;
    reset(): void;
    set length(arg: number);
    get length(): number;
    _enabled: boolean;
    updateLength(): void;
}
export default Channel;
//# sourceMappingURL=Channel.d.ts.map