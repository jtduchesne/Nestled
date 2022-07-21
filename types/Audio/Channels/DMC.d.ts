export class DMC {
    constructor(cpu: CPU);
    cpu: CPU;
    set enabled(arg: boolean);
    get enabled(): boolean;
    cycle: number;
    output: number;
    timerCycle: number;
    timerPeriod: number;
    sampleAddress: number;
    sampleLength: number;
    sampleIndex: number;
    sampleLeft: number;
    sampleLoop: boolean;
    sampleBuffer: number;
    shiftRegister: number;
    shiftRegisterBits: number;
    irqEnabled: boolean;
    irq: boolean;
    reset(): void;
    set rate(arg: number);
    get rate(): number;
    set load(arg: number);
    get load(): number;
    set address(arg: number);
    get address(): number;
    set length(arg: number);
    get length(): number;
    _enabled: boolean;
    doIRQ(): void;
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    updateSampleBuffer(): void;
    updateShiftRegister(): void;
    updateOutput(): void;
}
export default DMC;
import CPU from "../../CPU.js";
//# sourceMappingURL=DMC.d.ts.map