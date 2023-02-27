/**
 * Delta modulation channel outputs a 7-bit PCM signal.
 */
export class DMC {
    /**
     * @param {import('../CPU.js').CPU} cpu
     */
    constructor(cpu: import('../CPU.js').CPU);
    /** @private */
    private cpu;
    timerCycle: number;
    timerPeriod: number;
    /** A negative value means empty */
    sampleBuffer: number;
    sampleAddress: number;
    sampleLength: number;
    sampleLeft: number;
    sampleLoop: boolean;
    /** A negative value means empty */
    shiftRegister: number;
    shiftRegisterCycle: number;
    irqEnabled: boolean;
    irq: boolean;
    /**
     * 7-bit output value
     * @type {number}
     */
    output: number;
    reset(): void;
    set enabled(arg: boolean);
    /** @type {boolean} */
    get enabled(): boolean;
    set rate(arg: number);
    /** @type {number} */
    get rate(): number;
    set load(arg: number);
    /** @type {number} */
    get load(): number;
    set address(arg: number);
    /** @type {number} */
    get address(): number;
    set length(arg: number);
    /** @type {number} */
    get length(): number;
    /** @private */
    private doIRQ;
    /**
     * @param {number} address 16-bit address between 0x4010-0x4013
     * @param {number} data 8-bit data
     */
    writeRegister(address: number, data: number): void;
    doCycle(): void;
    /** @private */
    private updateSampleBuffer;
    /** @private */
    private updateShiftRegister;
    /** @private */
    private updateOutput;
}
export default DMC;
//# sourceMappingURL=DMC.d.ts.map