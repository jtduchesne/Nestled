export class TriangleChannel extends Channel {
    dutyCycle: number;
    linearCounter: number;
    linearCounterMax: number;
    linearCounterReset: boolean;
    timerCycle: number;
    timerPeriod: number;
    dutyPosition: number;
    set counter(arg: number);
    set timer(arg: number);
    get timer(): number;
    linearCounterControl: boolean;
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    get output(): number;
}
export default TriangleChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=TriangleChannel.d.ts.map