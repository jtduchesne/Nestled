export class Cartridge {
    constructor(mapperNumber: any);
    mapperNumber: any;
    PRGRAM: Uint8Array;
    CHRRAM: Uint8Array;
    PRGROM: any[];
    CHRROM: any[];
    PRGBank: Uint8Array[];
    CHRBank: Uint8Array[];
    horiMirroring: boolean;
    vertMirroring: boolean;
    battery: boolean;
    get empty(): boolean;
    get present(): boolean;
    init(): void;
    cpuRead(address: any): number;
    cpuWrite(address: any, data: any): void;
    ppuRead(address: any): number;
    ppuWrite(address: any, data: any): void;
    ciramA10(address: any): number;
    ciramEnabled(address: any): number;
}
export default Cartridge;
//# sourceMappingURL=Cartridge.d.ts.map