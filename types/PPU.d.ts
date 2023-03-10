export class PPU {
    /**
     * @param {NES} bus
     */
    constructor(bus: NES);
    /** @private */
    private bus;
    ntsc: boolean;
    /** Internal Video RAM (or Character Internal RAM (CI-RAM) ) */
    vram: Uint8Array;
    /** @private */
    private vramBank;
    /** Internal Palette memory (2x 16-bytes) */
    palette: Uint8Array[];
    /** @type {1|32} */
    addressIncrement: 1 | 32;
    /** @type {0x0000 | 0x1000} */
    sprPatternTable: 0x0000 | 0x1000;
    /** @type {0x0000 | 0x1000} */
    bkgPatternTable: 0x0000 | 0x1000;
    sprite8x16: boolean;
    nmiEnabled: boolean;
    /** @type {8|16} @private */
    private spriteHeight;
    grayscale: boolean;
    showLeftMostBkg: boolean;
    showLeftMostSpr: boolean;
    showBackground: boolean;
    showSprites: boolean;
    emphasizeRed: boolean;
    emphasizeGreen: boolean;
    emphasizeBlue: boolean;
    /** @private */
    private renderingEnabled;
    /**
     * Set when a *Sprite Overflow* occurs,
     * and cleared after *V-Blank*. */
    spriteOverflow: boolean;
    /**
     * Set when *Sprite-0 hit* occurs,
     * and cleared after *V-Blank*. */
    sprite0Hit: boolean;
    /**
     * Set when *V-Blank* occurs,
     * and cleared after *V-Blank*, or by reading *$2002*. */
    vblank: boolean;
    /** Object Attribute Memory (256-bytes) */
    oamPrimary: Uint8Array;
    /** 8-bit wide - For accessing primary OAM through *$2004* and *DMA*. */
    oamAddress: number;
    /**
     * Internal buffer for Sprite rendering, can hold up to 8 sprites worth
     * of metadata (32-bytes).
     * @private */
    private oamSecondary;
    /** 5-bit wide - Used internally to access secondary OAM buffer.
     * @private */
    private oamIndex;
    /** 3-bit wide */
    fineScrollX: number;
    /** 3-bit wide */
    fineScrollY: number;
    /** @private */
    private writeToggle;
    /** 16-bit wide */
    addressBus: number;
    /**
     * 16-bit wide - Used internally to allow atomic modifications of the
     * 16-bit address bus.
     * @private */
    private addressBuffer;
    /**
     * 8-bit wide - Used internally when accessing external data.
     * @private */
    private readBuffer;
    /** @private */ private bkgPixelsBuffer;
    /** @private */ private sprPixelsBuffer;
    /** @private */ private bkgLayer;
    /** @private */ private sprBehindLayer;
    /** @private */ private sprBeforeLayer;
    /** @private */ private sprLayer;
    /** @private */ private sprite0Layer;
    /** @private */ private sprite0;
    isPowered: boolean;
    powerOn(): void;
    /**
     * 0x2000 Control
     * @param {number} value 8-bit value
     * @private
     */
    private set control(arg);
    /**
     * 0x2001 Mask
     * @param {number} value 8-bit value
     * @private
     */
    private set mask(arg);
    /**
     * 0x2003 OAM address
     * @param {number} value 8-bit value
     * @private
     */
    private set OAMAddress(arg);
    powerOff(): void;
    reset(): void;
    doVBlank(): void;
    endVBlank(): void;
    /**
     * Transfer 256-bytes from CPU memory at given address directly to OAM data.
     * @param {number} address 16-bit address
     */
    doDMA(address: number): void;
    /** @private */
    private set OAMData(arg);
    /**
     * 0x2004 OAM data
     *
     * Writing to this register automatically increments OAM address.
     * @type {number} 8-bit value
     * @private
     */
    private get OAMData();
    /**
     * 0x2002 Status
     *
     * Reading this register is not idempotent as it resets *V-Blank* afterward.
     * @type {number} 8-bit value
     * @private
     */
    private get status();
    /**
     * 0x2005 Scroll
     * @param {number} value 8-bit value
     * @private
     */
    private set scroll(arg);
    /**
     * 0x2006 Address
     * @param {number} value 8-bit value
     * @private
     */
    private set address(arg);
    /** @private */
    private set data(arg);
    /**
     * 0x2007 Data
     *
     * Reading or writing to this register automatically increments the address
     * bus by the amount set in *$2000*.
     * @type {number} 8-bit value
     * @private
     */
    private get data();
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     */
    read(address: number): number;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     */
    write(address: number, data: number): void;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     * @private
     */
    private readData;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     * @private
     */
    private writeData;
    /** The first color of background palette */
    get backdrop(): number;
    /** Background palette (4x 4-bytes) */
    get bkgPalette(): Uint8Array;
    /** Sprite palette (4x 4-bytes) */
    get sprPalette(): Uint8Array;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     * @private
     */
    private readPalette;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     * @private
     */
    private writePalette;
    incrementX(): void;
    incrementY(): void;
    resetX(): void;
    resetY(): void;
    /**
     * @param {number} bus 16-bit address bus
     * @private
     */
    private fetchNameTable;
    /**
     * @param {number} bus 16-bit address bus
     * @private
     */
    private fetchAttributeTable;
    /**
     * @param {number} patternIndex
     * @param {number} row
     * @private
     */
    private fetchBkgPatternTable;
    fetchTile(): void;
    fetchNullTile(): void;
    fetchNullNTs(): void;
    /**
     * @param {number} dot
     * @param {number} scanline
     */
    renderTile(dot: number, scanline: number): void;
    clearSecondaryOAM(): void;
    /** @param {number} scanline */
    evaluateSprites(scanline: number): void;
    /**
     * @param {number} patternIndex
     * @param {number} row
     * @private
     */
    private fetchSprPatternTable;
    /** @param {number} scanline */
    fetchSprite(scanline: number): void;
    fetchNullSprite(): void;
    /** @param {number} scanline */
    renderSprite(scanline: number): void;
    /**
     *
     * @param {Uint32Array} target Buffer of 8x 32-bit RGBA pixels
     * @param {number} pattern
     * @param {Uint8Array} palette
     * @param {number} paletteIndex
     * @param {boolean=} flip
     */
    setPatternPixels(target: Uint32Array, pattern: number, palette: Uint8Array, paletteIndex: number, flip?: boolean | undefined): void;
    printFrame(): void;
}
export default PPU;
export type NES = import('./NES.js').NES;
//# sourceMappingURL=PPU.d.ts.map