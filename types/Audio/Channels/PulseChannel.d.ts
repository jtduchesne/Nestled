export class PulseChannel extends Channel {
    constructor(id: any);
    id: any;
    constantVolume: number;
    envelopeEnabled: boolean;
    envelopeReset: boolean;
    envelopeCycle: number;
    envelopePeriod: number;
    envelopeVolume: number;
    envelopeLoop: boolean;
    dutyCycle: number;
    duty: number;
    sweepEnabled: boolean;
    sweepReset: boolean;
    sweepCycle: number;
    sweepPeriod: number;
    sweepNegate: boolean;
    sweepShift: number;
    timerCycle: number;
    timerPeriod: number;
    set volume(arg: number);
    get volume(): number;
    set sweep(arg: number);
    get sweep(): number;
    set timer(arg: number);
    get timer(): number;
    writeRegister(address: any, data: any): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    get output(): number;
}
export default PulseChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=PulseChannel.d.ts.map