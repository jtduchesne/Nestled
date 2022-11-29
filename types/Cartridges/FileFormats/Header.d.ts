export class Header {
    constructor(data: ArrayBuffer);
    loaded: boolean;
    format: string;
    valid: boolean;
    mapperNumber: number;
    mapperName: string;
    supported: boolean;
    PRGROMByteLength: number;
    CHRROMByteLength: number;
    horiMirroring: boolean;
    vertMirroring: boolean;
    battery: boolean;
    trainer: boolean;
    consoleType: number;
    PRGRAMByteLength: number;
    CHRRAMByteLength: number;
    PRGNVRAMByteLength: number;
    CHRNVRAMByteLength: number;
    get byteLength(): number;
    parse(data: ArrayBuffer): boolean;
}
export default Header;
//# sourceMappingURL=Header.d.ts.map