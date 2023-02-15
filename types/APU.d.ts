export class APU {
    constructor(cpu: CPU);
    bus: NES;
    cpu: CPU;
    pulse1: PulseChannel;
    pulse2: PulseChannel;
    triangle: TriangleChannel;
    noise: NoiseChannel;
    dmc: DMC;
    audioBuffer: AudioBuffer;
    cyclesPerSample: number;
    cyclesUntilSample: number;
    irqDisabled: boolean;
    irq: boolean;
    set status(arg: number);
    get status(): number;
    set counter(arg: number);
    carry: number;
    cycle: number;
    powerOn(): void;
    powerOff(): void;
    reset(): void;
    doIRQ(): void;
    counterMode: number;
    resetDelay: number;
    readRegister(address: number): number;
    writeRegister(address: number, data: number): void;
    doCycles(count: number): void;
    doCycle(): void;
    doQuarter(): void;
    doHalf(): void;
    /** @private */
    private doSample;
}
export default APU;
import { PulseChannel } from "./Audio/Channels.js";
import { TriangleChannel } from "./Audio/Channels.js";
import { NoiseChannel } from "./Audio/Channels.js";
import { DMC } from "./Audio/Channels.js";
import { AudioBuffer } from "./Audio/AudioBuffer.js";
import CPU from "./CPU.js";
import NES from "./NES.js";
//# sourceMappingURL=APU.d.ts.map