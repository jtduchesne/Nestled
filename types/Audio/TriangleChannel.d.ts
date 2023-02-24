/**
 * Triangle channel generates a pseudo-triangle wave.
 */
export class TriangleChannel extends LengthCounter {
    /** @private */
    private phase;
    linearCounter: number;
    linearCounterMax: number;
    linearCounterReset: boolean;
    linearCounterControl: boolean;
    set counter(arg: number);
    /** @type {number} */
    get counter(): number;
    /**
     * @param {number} address 16-bit address between 0x4008-0x400B
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
export default TriangleChannel;
import LengthCounter from "./LengthCounter.js";
//# sourceMappingURL=TriangleChannel.d.ts.map