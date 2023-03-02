/** @typedef {import('./Header.js').Header} Header */
export const PRGROMBANKSIZE: 16384;
export const CHRROMBANKSIZE: 4096;
export class Cartridge {
    PRGRAM: Uint8Array;
    CHRRAM: Uint8Array;
    /** @type {Uint8Array[]} */
    PRGROM: Uint8Array[];
    /** @protected */
    protected firstPRGBank: Uint8Array;
    /** @protected */
    protected lastPRGBank: Uint8Array;
    PRGBank: Uint8Array[];
    /** @type {Uint8Array[]} */
    CHRROM: Uint8Array[];
    /** @protected */
    protected firstCHRBank: Uint8Array;
    /** @protected */
    protected secondCHRBank: Uint8Array;
    CHRBank: Uint8Array[];
    horiMirroring: boolean;
    vertMirroring: boolean;
    /**
     * Loads cartridge data from a file, and sets circuitry (mirroring) from header data.
     * @param {Header} header Already parsed header informations
     * @param {ArrayBuffer} data The whole file, including the header data
     */
    load(header: Header, data: ArrayBuffer): void;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit value
     */
    cpuRead(address: number): number;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     */
    cpuWrite(address: number, data: number): void;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit value
     */
    ppuRead(address: number): number;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     */
    ppuWrite(address: number, data: number): void;
    /**
     * This is the 1k bank selection input for PPU's internal RAM, derived from the
     * address bus.
     *
     * This is used to control how the name tables are banked; in other words, this
     * selects nametable mirroring.
     * @param {number} address 16-bit address
     * @returns {0|1}
     */
    ciramA10(address: number): 0 | 1;
    /**
     * This is the video memory selection input, derived from the address bus.
     *
     * When set, this tells the PPU to use its own internal 2kb of RAM instead of
     * cartridge's CHR-ROM.
     * @param {number} address 16-bit address
     * @returns {boolean}
     */
    ciramEnabled(address: number): boolean;
}
export default Cartridge;
export type Header = import('./Header.js').Header;
//# sourceMappingURL=Cartridge.d.ts.map