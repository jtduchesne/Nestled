/**
 * Pulse channels generate a square wave with variable duty.
 */
export class PulseChannel extends Channel {
    /**
     * @param {1|2} id The behavior of the two pulse channels differs in the effect
     * of the negate mode of their sweep units
     */
    constructor(id: 1 | 2);
    id: 2 | 1;
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
    private set volume(arg);
    /** @private @type {number} */
    private get volume();
    private set sweep(arg);
    /** @private @type {number} */
    private get sweep();
    private set timer(arg);
    /** @private @type {number} */
    private get timer();
    /**
     * @param {number} address 16-bit address between 0x4000-0x4007
     * @param {number} data 8-bit data
     */
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    /**
     * 4-bit output value
     * @type {number}
     */
    get output(): number;
}
export default PulseChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=PulseChannel.d.ts.map