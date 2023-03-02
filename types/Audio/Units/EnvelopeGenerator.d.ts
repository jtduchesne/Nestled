/**
 * The envelope generator controls the volume in one of two ways:
 *
 * It can generate a decreasing saw envelope with optional looping, or it can generate a
 * constant volume that a more sophisticated software envelope generator can manipulate.
 */
export class EnvelopeGenerator extends LengthCounter {
    constantVolume: number;
    envelopeEnabled: boolean;
    envelopeReset: boolean;
    envelopeCycle: number;
    envelopePeriod: number;
    envelopeVolume: number;
    envelopeLoop: boolean;
    set volume(arg: number);
    /** @type {number} */
    get volume(): number;
    doQuarter(): void;
}
export default EnvelopeGenerator;
import LengthCounter from "./LengthCounter.js";
//# sourceMappingURL=EnvelopeGenerator.d.ts.map