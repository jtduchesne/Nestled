/**
 * Noise channel generates pseudo-random 1-bit noise at 16 different frequencies.
 */
export class NoiseChannel extends EnvelopeGenerator {
    timerMode: boolean;
    /** @private */
    private shiftRegister;
    /**
     * @param {number} address 16-bit address between 0x400C-0x400F
     * @param {number} data 8-bit data
     */
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    /**
     * 4-bit output value
     * @type {number}
     */
    get output(): number;
}
export default NoiseChannel;
import { EnvelopeGenerator } from "./Units/index.js";
//# sourceMappingURL=NoiseChannel.d.ts.map