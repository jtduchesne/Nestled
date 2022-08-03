export class Cartridge {
    constructor(mapperNumber: number);
    mapperNumber: number;
    PRGRAM: Uint8Array;
    CHRRAM: Uint8Array;
    PRGROM: Uint8Array[];
    CHRROM: Uint8Array[];
    PRGBank: Uint8Array[];
    CHRBank: Uint8Array[];
    horiMirroring: boolean;
    vertMirroring: boolean;
    battery: boolean;
    get empty(): boolean;
    get present(): boolean;
    init(): void;
    cpuRead(address: number): number;
    cpuWrite(address: number, data: number): void;
    ppuRead(address: number): number;
    ppuWrite(address: number, data: number): void;
    ciramA10(address: number): number;
    ciramEnabled(address: number): number;
}
export default Cartridge;
//# sourceMappingURL=Cartridge.d.ts.map