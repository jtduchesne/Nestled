export const PRGROMBANKSIZE: 16384;
export const CHRROMBANKSIZE: 4096;
export class Cartridge {
    PRGRAM: Uint8Array;
    CHRRAM: Uint8Array;
    PRGROM: Uint8Array[];
    firstPRGBank: Uint8Array;
    lastPRGBank: Uint8Array;
    PRGBank: [Uint8Array, Uint8Array];
    CHRROM: Uint8Array[];
    firstCHRBank: Uint8Array;
    secondCHRBank: Uint8Array;
    CHRBank: [Uint8Array, Uint8Array];
    horiMirroring: boolean;
    vertMirroring: boolean;
    load(header: Header, data: ArrayBuffer): void;
    cpuRead(address: number): number;
    cpuWrite(address: number, data: number): void;
    ppuRead(address: number): number;
    ppuWrite(address: number, data: number): void;
    ciramA10(address: number): number;
    ciramEnabled(address: number): number;
}
export default Cartridge;
//# sourceMappingURL=Cartridge.d.ts.map