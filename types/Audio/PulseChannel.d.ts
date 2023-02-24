/**
 * Pulse channels generate a square wave with variable duty.
 */
export class PulseChannel extends SweepUnit {
    /**
     * @param {1|2} id The behavior of the two pulse channels differs in the effect
     * of the negate mode of their sweep units
     */
    constructor(id: 1 | 2);
    /** @private */
    private dutyCycle;
    /** @private */
    private duty;
    /**
     * @param {number} address 16-bit address between 0x4000-0x4007
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
export default PulseChannel;
import SweepUnit from "./SweepUnit.js";
//# sourceMappingURL=PulseChannel.d.ts.map