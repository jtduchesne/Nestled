/**
 * Triangle channel generates a pseudo-triangle wave.
 */
export class TriangleChannel extends Channel {
    /** @private */
    private position;
    linearCounter: number;
    linearCounterMax: number;
    linearCounterReset: boolean;
    linearCounterControl: boolean;
    timerCycle: number;
    timerPeriod: number;
    /** @private */
    private set counter(arg);
    /** @private @type {number} */
    private get counter();
    /** @private */
    private set timer(arg);
    /** @private @type {number} */
    private get timer();
    /**
     * @param {number} address 16-bit address between 0x4008-0x400B
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
export default TriangleChannel;
import Channel from "./Channel.js";
//# sourceMappingURL=TriangleChannel.d.ts.map