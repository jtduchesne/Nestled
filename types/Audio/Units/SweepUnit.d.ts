/**
 * The sweep unit can be made to periodically adjust a Pulse channel's period up or down.
 */
export class SweepUnit extends EnvelopeGenerator {
    /**
     * @param {number} negateMode
     */
    constructor(negateMode: number);
    /** @private */
    private negateMode;
    sweepEnabled: boolean;
    sweepReset: boolean;
    sweepCycle: number;
    sweepPeriod: number;
    sweepNegate: boolean;
    sweepShift: number;
    set sweep(arg: number);
    /** @type {number} */
    get sweep(): number;
}
export default SweepUnit;
import EnvelopeGenerator from "./EnvelopeGenerator.js";
//# sourceMappingURL=SweepUnit.d.ts.map