/**
 * Noise channel generates pseudo-random 1-bit noise at 16 different frequencies.
 */
export class NoiseChannel extends LengthCounter {
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
    /** @private */
    private shiftRegister;
    /** @private */
    private set volume(arg);
    /** @private @type {number} */
    private get volume();
    /** @private */
    private set timer(arg);
    /** @private @type {number} */
    private get timer();
    /**
     * @param {number} address 16-bit address between 0x400C-0x400F
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
export default NoiseChannel;
import LengthCounter from "./LengthCounter.js";
//# sourceMappingURL=NoiseChannel.d.ts.map