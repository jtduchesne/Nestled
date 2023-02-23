/**
 * Pulse channels generate a square wave with variable duty.
 */
export class PulseChannel extends Channel {
    /**
     * @param {1|2} id The behavior of the two pulse channels differs in the effect
     * of the negate mode of their sweep units
     */
    constructor(id: 1 | 2);
    /** @private */
    private id;
    /** @private */
    private dutyCycle;
    /** @private */
    private duty;
    constantVolume: number;
    envelopeEnabled: boolean;
    envelopeReset: boolean;
    envelopeCycle: number;
    envelopePeriod: number;
    envelopeVolume: number;
    envelopeLoop: boolean;
    sweepEnabled: boolean;
    sweepReset: boolean;
    sweepCycle: number;
    sweepPeriod: number;
    sweepNegate: boolean;
    sweepShift: number;
    timerCycle: number;
    timerPeriod: number;
    set volume(arg: number);
    /** @type {number} */
    get volume(): number;
    set sweep(arg: number);
    /** @type {number} */
    get sweep(): number;
    set timer(arg: number);
    /** @type {number} */
    get timer(): number;
    /**
     * @param {number} address 16-bit address between 0x4000-0x4007
     * @param {number} data 8-bit data
     */
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    doQuarter(): void;
    /**
     * 4-bit output value
     * @type {number}
     */
    get output(): number;
}
export default PulseChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=PulseChannel.d.ts.map