export class CPU {
    constructor(nes: NES);
    bus: NES;
    cycle: number;
    cycleOffset: number;
    apu: APU;
    ram: Uint8Array;
    stack: Uint8Array;
    nmiVector: () => number;
    resetVector: () => number;
    irqVector: () => number;
    set A(arg: number);
    get A(): number;
    set X(arg: number);
    get X(): number;
    set Y(arg: number);
    get Y(): number;
    P: number;
    set SP(arg: number);
    get SP(): number;
    PC: number;
    addressLookup: Array<() => void>;
    instructionLookup: Array<() => void>;
    isPowered: boolean;
    powerOn(): void;
    ppu: PPU;
    ctrl1: Controller;
    ctrl2: Controller;
    cart: Cartridge;
    powerOff(): void;
    reset(): void;
    doInstructions(limit?: number): void;
    doInstruction(): number;
    opcode: number;
    operand: number;
    doNMI(): void;
    doReset(): void;
    set Interrupt(arg: number);
    get Interrupt(): number;
    doIRQ(): void;
    read(address: number): number;
    write(address: number, data: number): void;
    _SP: number;
    pushByte(value: number): void;
    pushWord(value: number): void;
    pullByte(): number;
    pullWord(): number;
    set Carry(arg: number);
    get Carry(): number;
    set Zero(arg: number);
    get Zero(): number;
    set Decimal(arg: number);
    get Decimal(): number;
    set Overflow(arg: number);
    get Overflow(): number;
    set Negative(arg: number);
    get Negative(): number;
}
export default CPU;
import APU from "./APU.js";
import { Cartridge } from "./Cartridges.js";
import { Controller } from "./Controllers.js";
import NES from "./NES.js";
import PPU from "./PPU.js";
//# sourceMappingURL=CPU.d.ts.map