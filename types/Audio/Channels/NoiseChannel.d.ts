export class NoiseChannel extends Channel {
    constantVolume: number;
    envelopeEnabled: boolean;
    envelopeReset: boolean;
    envelopeCycle: number;
    envelopePeriod: number;
    envelopeVolume: number;
    envelopeLoop: boolean;
    timerMode: boolean;
    timerCycle: number;
    timerPeriod: number;
    shiftRegister: number;
    set volume(arg: number);
    get volume(): number;
    set timer(arg: number);
    get timer(): number;
    writeRegister(address: any, data: any): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    get output(): number;
}
export default NoiseChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=NoiseChannel.d.ts.map