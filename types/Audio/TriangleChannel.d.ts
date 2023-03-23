/**
 * Triangle channel generates a pseudo-triangle wave.
 */
export class TriangleChannel extends LinearCounter {
    /** @private */
    private phase;
    /**
     * @param {number} address 16-bit address between 0x4008-0x400B
     * @param {number} data 8-bit data
     */
    write(address: number, data: number): void;
    doCycle(): void;
    /**
     * 4-bit output value
     * @type {number}
     */
    get output(): number;
}
export default TriangleChannel;
import { LinearCounter } from "./Units/index.js";
//# sourceMappingURL=TriangleChannel.d.ts.map