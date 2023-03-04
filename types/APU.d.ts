export class APU {
    /**
     * @param {NES} bus
     */
    constructor(bus: NES);
    /** @private */
    private bus;
    /** Pulse Channel 1 */
    pulse1: PulseChannel;
    /** Pulse Channel 2 */
    pulse2: PulseChannel;
    /** Triangle Channel */
    triangle: TriangleChannel;
    /** Noise Channel */
    noise: NoiseChannel;
    /** Delta Modulation Channel */
    dmc: DMC;
    /** @private */
    private set status(arg);
    /**
     * 0x4015 Status register
     * @type {number}
     * @private
     */
    private get status();
    /** If IRQ is disabled at the moment */
    irqDisabled: boolean;
    /** If an IRQ has happened. This is cleared after reading 0x4015 */
    irq: boolean;
    /** @private */
    private counterMode;
    /** @private */
    private toggle;
    cycle: number;
    /** @private */
    private resetDelay;
    /** @private */
    private cyclesPerSample;
    /** @private */
    private cyclesUntilSample;
    powerOn(): void;
    powerOff(): void;
    reset(): void;
    /** @private */
    private set counter(arg);
    /**
     * 0x4017 Frame counter
     * @type {number}
     * @private
     */
    private get counter();
    /** @private */
    private doIRQ;
    /** @readonly @type {boolean} */
    readonly get fourStepCounterMode(): boolean;
    /** @readonly @type {boolean} */
    readonly get fiveStepCounterMode(): boolean;
    /**
     * @param {number} address 16-bit address
     * @returns {number}
     */
    readRegister(address: number): number;
    /**
     * @param {number} address 16-bit address between 0x4000-0x4017
     * @param {number} data 8-bit data
     */
    writeRegister(address: number, data: number): void;
    /**
     * @param {number} count The number of (CPU) cycles to execute
     */
    doCycles(count: number): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    /** @private */
    private doSample;
}
export default APU;
export type NES = import('./NES.js').NES;
import { PulseChannel } from "./Audio/index.js";
import { TriangleChannel } from "./Audio/index.js";
import { NoiseChannel } from "./Audio/index.js";
import { DMC } from "./Audio/index.js";
//# sourceMappingURL=APU.d.ts.map