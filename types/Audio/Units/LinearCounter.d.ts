/**
 * The linear counter is an extra duration timer of higher accuracy than the length
 * counter.
 */
export class LinearCounter extends LengthCounter {
    linearCounter: number;
    linearCounterMax: number;
    linearCounterReset: boolean;
    linearCounterControl: boolean;
    set counter(arg: number);
    /** @type {number} */
    get counter(): number;
    doQuarter(): void;
}
export default LinearCounter;
import LengthCounter from "./LengthCounter.js";
//# sourceMappingURL=LinearCounter.d.ts.map