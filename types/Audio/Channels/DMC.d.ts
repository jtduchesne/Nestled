export class DMC {
    constructor(cpu: any);
    cpu: any;
    set enabled(arg: any);
    get enabled(): any;
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
    _enabled: any;
    doIRQ(): void;
    writeRegister(address: any, data: any): void;
    doCycle(): void;
    updateSampleBuffer(): void;
    updateShiftRegister(): void;
    updateOutput(): void;
}
export default DMC;
//# sourceMappingURL=DMC.d.ts.map