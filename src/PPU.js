/**
 * @typedef {import('./NES.js').NES} NES
 */

/** @type {Readonly<Record<number, number>>} */
const bitplaneLookup = Object.freeze({
    0x0000: 0,
    0x8000: 1,
    0x0080: 2,
    0x8080: 3,
});

export class PPU {
    /**
     * @param {NES} bus
     */
    constructor(bus) {
        /** @private */
        this.bus = bus;
        
        this.ntsc = true;
        
        /** Internal Video RAM (or Character Internal RAM (CI-RAM) )
         * @type {[Uint8Array, Uint8Array]} */
        this.vram = [new Uint8Array(0x400), new Uint8Array(0x400)];
        
        /** Internal Palette memory (2x 16-bytes)
         * @type {[Uint8Array, Uint8Array]} */
        this.palette = [new Uint8Array(4*4), new Uint8Array(4*4)];
        
        //-----------------------------------------------------------------------//
        /** @type {1|32} */
        this.addressIncrement = 1;
        /** @type {0x0000 | 0x1000} */
        this.sprPatternTable  = 0x0000;
        /** @type {0x0000 | 0x1000} */
        this.bkgPatternTable  = 0x0000;
        this.sprite8x16       = false;
        this.nmiEnabled       = false;
        
        /** @type {8|16} @private */
        this.spriteHeight     = 8;
        
        this.grayscale        = false;
        this.showLeftMostBkg  = false;
        this.showLeftMostSpr  = false;
        this.showBackground   = false;
        this.showSprites      = false;
        this.emphasizeRed     = false;
        this.emphasizeGreen   = false;
        this.emphasizeBlue    = false;
        
        /** @private */
        this.renderingEnabled = false;
        
        /**
         * Set when a *Sprite Overflow* occurs,
         * and cleared after *V-Blank*. */
        this.spriteOverflow   = false;
        /**
         * Set when *Sprite-0 hit* occurs,
         * and cleared after *V-Blank*. */
        this.sprite0Hit       = false;
        /**
         * Set when *V-Blank* occurs,
         * and cleared after *V-Blank*, or by reading *$2002*. */
        this.vblank           = false;
        
        /** Object Attribute Memory (256-bytes) */
        this.oamPrimary       = new Uint8Array(64*4);
        /** 8-bit wide - For accessing primary OAM through *$2004* and *DMA*. */
        this.oamAddress       = 0x00;
        
        /**
         * Internal buffer for Sprite rendering, can hold up to 8 sprites worth
         * of metadata (32-bytes).
         * @private */
        this.oamSecondary     = new Uint8Array(8*4);
        /** 5-bit wide - Used internally to access secondary OAM buffer.
         * @private */
        this.oamIndex         = 0x00;
        
        /** 3-bit wide */
        this.fineScrollX      = 0x0;
        /** 3-bit wide */
        this.fineScrollY      = 0x0;
        
        /** @private */
        this.writeToggle      = false;
        
        /** 16-bit wide */
        this.addressBus       = 0x0000;
        /**
         * 16-bit wide - Used internally to allow atomic modifications of the
         * 16-bit address bus.
         * @private */
        this.addressBuffer    = 0x0000;
        
        /**
         * 8-bit wide - Used internally when accessing external data.
         * @private */
        this.readBuffer       = 0x00;
        //-----------------------------------------------------------------------//
        
        //Buffers
        /** @private */ this.bkgPixelsBuffer = new Uint32Array(16);
        /** @private */ this.sprPixelsBuffer = new Uint32Array(8);
        
        //Layers
        /** @private */ this.bkgLayer = this.bus.videoOutput.bkgLayer;
        /** @private */ this.sprLayer = this.bus.videoOutput.sprBeforeLayer;
        
        //Used for Sprite0 hit detection
        /** @private */ this.sprite0Layer = new Uint32Array(264);
        /** @private */ this.sprite0      = false;
        
        this.isPowered = false;
    }
    
    //== Power ==========================================================================//
    powerOn() {
        this.control       = 0x00;   //$2000 Control
        this.mask          = 0x00;   //$2001 Mask
        this.sprite0Hit    = false;  //$2002 Status
        this.OAMAddress    = 0x00;   //$2003 OAM address
        this.fineScrollX   = 0x0;    //$2005 Scroll
        this.fineScrollY   = 0x0;
        this.addressBus    = 0x0000; //$2006 Address
        this.addressBuffer = 0x0000;
        this.readBuffer    = 0x00;   //$2007 Data
        
        this.writeToggle   = false;
        
        this.ntsc = (this.bus.cartConnector.metadata.tvSystem === "NTSC");
        
        this.bus.videoOutput.start();
        
        this.isPowered = true;
    }
    powerOff() {
        this.bus.videoOutput.stop();
        
        this.isPowered = false;
    }
    
    reset() {
        this.control     = 0x00; //$2000 Control
        this.mask        = 0x00; //$2001 Mask
        this.fineScrollX = 0x0;  //$2005 Scroll
        this.fineScrollY = 0x0;
        this.readBuffer  = 0x00; //$2007 Data
        
        this.writeToggle = false;
    }
    
    //== Vertical Blank =================================================================//
    doVBlank() {
        this.vblank = true;
        if (this.nmiEnabled) this.bus.cpu.doNMI();
    }
    endVBlank() {
        this.spriteOverflow = false;
        this.sprite0Hit = false;
        this.vblank = false;
    }
    
    //== DMA ============================================================================//
    /**
     * Transfer 256-bytes from CPU memory at given address directly to OAM data.
     * @param {number} address 16-bit address
     */
    doDMA(address) {
        const cpu = this.bus.cpu;
        for(let count = 0; count < 256; count++)
            this.OAMData = cpu.read(address++);
    }
    
    //== Registers ======================================================================//
    /**
     * 0x2000 Control
     * @param {number} value 8-bit value
     * @private
     */
    set control(value) {
        this.addressBuffer &= ~0x0C00; // b1111.0011.1111.1111
        if (value) {
            this.addressBuffer |= (value & 0x3)<<10;
            
            this.addressIncrement = (value & 0x04) ? 32 : 1;
            this.sprPatternTable =  (value & 0x08) ? 0x1000 : 0x0000;
            this.bkgPatternTable =  (value & 0x10) ? 0x1000 : 0x0000;
            this.sprite8x16 =     !!(value & 0x20);
            this.nmiEnabled =     !!(value & 0x80);
        } else {
            this.addressIncrement = 1;
            this.sprPatternTable = 0x0000;
            this.bkgPatternTable = 0x0000;
            this.sprite8x16 = false;
            this.nmiEnabled = false;
        }
        this.spriteHeight = this.sprite8x16 ? 16 : 8;
    }
    
    /**
     * 0x2001 Mask
     * @param {number} value 8-bit value
     * @private
     */
    set mask(value) {
        if (value) {
            this.grayscale       = !!(value & 0x01);
            this.showLeftMostBkg = !!(value & 0x02);
            this.showLeftMostSpr = !!(value & 0x04);
            this.showBackground  = !!(value & 0x08);
            this.showSprites     = !!(value & 0x10);
            this.emphasizeRed    = !!(value & (this.ntsc ? 0x20 : 0x40));
            this.emphasizeGreen  = !!(value & (this.ntsc ? 0x40 : 0x20));
            this.emphasizeBlue   = !!(value & 0x80);
            
            this.renderingEnabled = !!(value & 0x18);
        } else {
            this.grayscale       = false;
            this.showLeftMostBkg = false;
            this.showLeftMostSpr = false;
            this.showBackground  = false;
            this.showSprites     = false;
            this.emphasizeRed    = false;
            this.emphasizeGreen  = false;
            this.emphasizeBlue   = false;
            
            this.renderingEnabled = false;
        }
    }
    
    /**
     * 0x2002 Status
     * 
     * Reading this register is not idempotent as it resets *V-Blank* afterward.
     * @type {number} 8-bit value
     * @private
     */
    get status() {
        let value = (this.spriteOverflow ? 0x20 : 0) +
                    (this.sprite0Hit ? 0x40 : 0) +
                    (this.vblank ? 0x80 : 0);
        this.vblank = false;
        this.writeToggle = false;
        
        return value;
    }
    
    /**
     * 0x2003 OAM address
     * @param {number} value 8-bit value
     * @private
     */
    set OAMAddress(value) {
        this.oamAddress = value;
    }
    
    /**
     * 0x2004 OAM data
     * 
     * Writing to this register automatically increments OAM address.
     * @type {number} 8-bit value
     * @private
     */
    get OAMData() {
        return this.oamPrimary[this.oamAddress];
    }
    /** @private */
    set OAMData(value) {
        this.oamPrimary[this.oamAddress++] = value;
        if (this.oamAddress > 0xFF) this.oamAddress = 0x00;
    }
    
    /**
     * 0x2005 Scroll
     * @param {number} value 8-bit value
     * @private
     */
    set scroll(value) {
        const toggle = this.writeToggle;
        
        let addressBuffer = this.addressBuffer;
        if (toggle) {
            // Vertical scroll
            addressBuffer &= 0x0C1F; // b0000.1100.0001.1111
            addressBuffer |= ((value & 0x07) << 12);
            addressBuffer |= ((value & 0xF8) << 2);
            
            this.fineScrollY = value & 0x07;
        } else {
            // Horizontal scroll
            addressBuffer &= 0x7FE0; // b0111.1111.1110.0000
            addressBuffer |= (value >>> 3);
            
            this.fineScrollX = value & 0x07;
        }
        this.addressBuffer = addressBuffer;
        
        this.writeToggle = !toggle;
    }
    
    /**
     * 0x2006 Address
     * @param {number} value 8-bit value
     * @private
     */
    set address(value) {
        const toggle = this.writeToggle;
        
        if (toggle) {
            this.addressBuffer = (this.addressBuffer & 0xff00) | value;
            this.addressBus = this.addressBuffer;
        } else {
            value = (value & 0x3f) << 8;
            this.addressBuffer = (this.addressBuffer & 0x00ff) | value;
        }
        
        this.writeToggle = !toggle;
    }
    
    /**
     * 0x2007 Data
     * 
     * Reading or writing to this register automatically increments the address
     * bus by the amount set in *$2000*.
     * @type {number} 8-bit value
     * @private
     */
    get data() {
        const address = this.addressBus;
        
        let value;
        if (address >= 0x3F00)
            value = this.readPalette(address);
        else
            value = this.readBuffer;
        
        this.readBuffer = this.readData(address);
        this.addressBus = address + this.addressIncrement;
        
        return value;
    }
    /** @private */
    set data(value) {
        const address = this.addressBus;
        if (address >= 0x3F00)
            this.writePalette(address, value);
        else
            this.writeData(address, value);
        
        this.addressBus = address + this.addressIncrement;
    }
    
    //== Registers access ===============================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     */
    read(address) {
        if (address > 0x2007) address &= 0x2007;
        switch (address) {
        case 0x2002: return this.status;
        case 0x2004: return this.OAMData;
        case 0x2007: return this.data;
        default:     return 0x00;
        }
    }
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     */
    write(address, data) {
        if (address > 0x2007) address &= 0x2007;
        switch (address) {
        case 0x2000: this.control    = data; break;
        case 0x2001: this.mask       = data; break;
        case 0x2003: this.OAMAddress = data; break;
        case 0x2004: this.OAMData    = data; break;
        case 0x2005: this.scroll     = data; break;
        case 0x2006: this.address    = data; break;
        case 0x2007: this.data       = data; break;
        }
    }
    
    //== Data ===========================================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     * @private
     */
    readData(address) {
        const cartridge = this.bus.cartConnector.cartridge;
        if (cartridge.ciramEnabled(address))
            return this.vram[cartridge.ciramA10(address)][address & 0x3FF];
        else
            return cartridge.ppuRead(address);
    }
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     * @private
     */
    writeData(address, data) {
        const cartridge = this.bus.cartConnector.cartridge;
        if (cartridge.ciramEnabled(address))
            this.vram[cartridge.ciramA10(address)][address & 0x3FF] = data;
        else
            cartridge.ppuWrite(address, data);
    }
    
    //== Palettes =======================================================================//
    /** The first color of background palette
     * @type {number} 6-bit color index */
    get backdrop() { return this.palette[0][0]; }
    
    /** Background palette (4x 4-bytes)*/
    get bkgPalette() { return this.palette[0]; }
    /** Sprite palette (4x 4-bytes) */
    get sprPalette() { return this.palette[1]; }
    
    /**
     * @param {number} address 16-bit address
     * @returns {number} 6-bit color index
     * @private
     */
    readPalette(address) {
        if (address & 0x3)
            return this.palette[(address & 0x10) >>> 4][address & 0x0F];
        else
            return this.backdrop;
    }
    /**
     * @param {number} address 16-bit address
     * @param {number} data 6-bit color index
     * @private
     */
    writePalette(address, data) {
        if (data > 0x3F) data &= 0x3F;
        if (address & 0x3)
            this.palette[(address & 0x10) >>> 4][address & 0x0F] = data;
        else
            this.bkgPalette[address & 0x0F] = data;
    }
    
    //== Scrolling ======================================================================//
    incrementX() {
        if (!this.renderingEnabled) return;
        
        let addressBus = this.addressBus;
        if ((addressBus & 0x001F) === 31) {
            addressBus &= 0x7FE0; // b0111.1111.1110.0000
            addressBus ^= 0x0400; // b0000.0100.0000.0000
        } else {
            addressBus++;
        }
        this.addressBus = addressBus;
    }
    incrementY() {
        if (!this.renderingEnabled) return;
        
        let addressBus = this.addressBus;
        if (addressBus < 0x7000) {
            addressBus += 0x1000;
            this.fineScrollY++;
        } else {
            addressBus -= 0x7000; 
            
            const coarseY = (addressBus & 0x03E0);
            if (coarseY === 0x03A0) { // 29 << 5
                addressBus &= 0x0C1F;
                addressBus ^= 0x0800;
            } else
            if (coarseY === 0x03E0)   // 31 << 5
                addressBus &= 0xFC1F;
            else
                addressBus += 0x0020;
            
            this.fineScrollY = addressBus >>> 12;
        }
        this.addressBus = addressBus;
    }
    
    resetX() {
        if (!this.renderingEnabled) return;
        
        let addressBus = this.addressBus;            //  _yyy.nnYY.YYYX.XXXX
        addressBus &= 0x7BE0;                        // b0111.1011.1110.0000
        addressBus |= (this.addressBuffer & 0x041F); // b0000.0100.0001.1111
        this.addressBus = addressBus;
    }
    resetY() {
        if (!this.renderingEnabled) return;
        
        let addressBus = this.addressBus;            //  _yyy.nnYY.YYYX.XXXX
        addressBus &= 0x041F;                        // b0000.0100.0001.1111
        addressBus |= (this.addressBuffer & 0x7BE0); // b0111.1011.1110.0000
        this.addressBus = addressBus;
        
        this.fineScrollY = addressBus >>> 12;
    }
    
    //== Background =====================================================================//
    /**
     * @param {number} bus 16-bit address bus
     * @returns {number} 8-bit pattern index
     * @private
     */
    fetchNameTable(bus) {
        const address = 0x2000 + (bus & 0x0FFF);
        return this.readData(address);
    }
    /**
     * @param {number} bus 16-bit address bus
     * @returns {number} 2-bit palette index
     * @private
     */
    fetchAttributeTable(bus) {
        const address = 0x23C0 | (bus & 0x0C00) | (bus>>>4 & 0x0038) | (bus>>>2 & 0x0007);
        let offset = 0;
        if (bus & 0x0002) offset += 2;
        if (bus & 0x0040) offset += 4;
        return (this.readData(address) >>> offset) & 0x3;
    }
    /**
     * @param {number} patternIndex 8-bit pattern index
     * @param {number} row 3-bit fine Y-Scroll value
     * @returns {number} 16-bit pattern
     * @private
     */
    fetchBkgPatternTable(patternIndex, row) {
        const address = this.bkgPatternTable + patternIndex*16 + row;
        return this.readData(address)*256 + this.readData(address+8);
    }
    
    /**
     * @param {number} pattern 16-bit pattern
     * @param {number} paletteIndex 2-bit palette index
     * @private
     */
    fillBkgPixelsBuffer(pattern, paletteIndex) {
        this.bkgPixelsBuffer.copyWithin(0, 8);
        const target = this.bkgPixelsBuffer.subarray(8);
        
        const colors = this.bus.videoOutput.colors;
        
        const palette = this.bkgPalette;
        
        if (paletteIndex >= 4) paletteIndex %= 4;
        const paletteOffset = paletteIndex * 4;
        
        for (let offset = 0; offset < 8; offset++) {
            const colorIndex = bitplaneLookup[(pattern << offset) & 0x8080];
            if (colorIndex)
                target[offset] = colors[palette[paletteOffset + colorIndex]];
            else
                target[offset] = 0x00000000;
        }
    }
    
    /** Fetch the next tile and fill the buffer. */
    fetchTile() {
        if (!this.showBackground) return;

        const addressBus = this.addressBus;
        
        const patternIndex = this.fetchNameTable(addressBus);
        const paletteIndex = this.fetchAttributeTable(addressBus);
        
        const pattern = this.fetchBkgPatternTable(patternIndex, this.fineScrollY);
        
        this.fillBkgPixelsBuffer(pattern, paletteIndex);
    }
    
    /** Garbage fetch of a tile. */
    fetchNullTile() {
        if (!this.showBackground) return;
        
        const addressBus = this.addressBus;
        
        const patternIndex = this.fetchNameTable(addressBus);
        this.fetchAttributeTable(addressBus);
        this.fetchBkgPatternTable(patternIndex, this.fineScrollY);
    }
    /** Garbage fetch of 2 pattern indexes. */
    fetchNullNTs() {
        if (!this.showBackground) return;
        
        const addressBus = this.addressBus;
        this.fetchNameTable(addressBus);
        this.fetchNameTable(addressBus);
    }
    
    /**
     * Draw 8 pixels from the buffer, according to fine X scrolling, to the screen
     * at given position.
     * @param {number} dot
     * @param {number} scanline
     */
    renderTile(dot, scanline) {
        if (!this.showBackground) return;
        
        const offset = this.fineScrollX;
        const pixels = this.bkgPixelsBuffer.subarray(offset, offset+8);
        
        if (this.sprite0 && !this.sprite0Hit) {
            if (this.sprite0Layer.subarray(dot, dot+8).some((e,i) => (e && pixels[i])))
                this.sprite0Hit = true;
        }
        
        this.bkgLayer.writePixels(dot, scanline, pixels);
    }
    
    //== Sprites ========================================================================//
    clearSecondaryOAM() {
        this.oamSecondary.fill(0xFF);
        this.oamIndex = 0;
    }
    
    /** @param {number} scanline */
    evaluateSprites(scanline) {
        const spritesList = this.oamPrimary;
        const sprites     = this.oamSecondary;
        
        const height = this.spriteHeight;
        
        while (this.oamAddress < 256) {
            const y = spritesList[this.oamAddress];
            
            const top    = y + height; //Sprite's coordinates are bottom-left
            const bottom = y;
            
            if (this.oamIndex === 32) {
                this.oamAddress++; //This causes the 'Sprite overflow bug'
                this.oamIndex++;
            } else {
                if (this.oamIndex < 32)
                    sprites[this.oamIndex] = y;
                if (scanline >= bottom && scanline < top) {
                    if (this.oamIndex < 32) {
                        if (this.oamAddress === 0)
                            this.sprite0 = true;
                        for (let i=1; i<4; i++)
                            sprites[this.oamIndex+i] = spritesList[this.oamAddress+i];
                        this.oamIndex += 4;
                    } else {
                        this.spriteOverflow = true;
                        break;
                    }
                }
                this.oamAddress += 4;
            }
        }
        this.oamIndex = 0;
    }
    
    /**
     * @param {number} patternIndex 8-bit pattern index
     * @param {number} row 3-bit sprite row
     * @returns {number} 16-bit pattern
     * @private 
     */
    fetchSprPatternTable(patternIndex, row) {
        let offset = this.sprPatternTable;
        if (this.sprite8x16) {
            if (patternIndex & 0x1) {
                offset = 0x1000;
                patternIndex &= 0xFE;
            } else {
                offset = 0x0000;
            }
        }
        const address = offset + patternIndex*16 + row;
        return this.readData(address)*256 + this.readData(address+8);
    }
    
    /**
     * @param {number} pattern 16-bit pattern
     * @param {number} paletteIndex 2-bit palette index
     * @param {boolean} flip Is pattern flipped horizontally ?
     * @private
     */
    fillSprPixelsBuffer(pattern, paletteIndex, flip) {
        const target = this.sprPixelsBuffer;
        
        const colors = this.bus.videoOutput.colors;
        
        const palette = this.sprPalette;
        
        if (paletteIndex >= 4) paletteIndex %= 4;
        const paletteOffset = paletteIndex * 4;
        
        for (let offset = 0; offset < 8; offset++) {
            const colorIndex = bitplaneLookup[(pattern << offset) & 0x8080];
            if (colorIndex)
                target[flip ? 7-offset : offset] = colors[palette[paletteOffset + colorIndex]];
            else
                target[flip ? 7-offset : offset] = 0x00000000;
        }
    }
    
    /**
     * Fetch the next sprite and fill the buffer.
     * @param {number} scanline
     */
    fetchSprite(scanline) {
        if (!this.showSprites) return;
        
        const addressBus = this.addressBus;   //
        this.fetchNameTable(addressBus);      // Garbage fetch
        this.fetchAttributeTable(addressBus); //
        
        this.oamAddress = 0x00;
        
        const sprites = this.oamSecondary;
        
        if (this.sprite0)
            this.sprite0 = (this.oamIndex === 0);
        
        const y = sprites[this.oamIndex++];
        let row = scanline - y;
        
        let patternIndex = sprites[this.oamIndex++];
        let attributes   = sprites[this.oamIndex++];
        
        // Vertical Flip
        if (attributes >= 0x80) {
            row = this.spriteHeight - row - 1;
            attributes -= 0x80;
        }
        
        let flip = false;
        // Horizontal Flip
        if (attributes >= 0x40) {
            flip = true;
            attributes -= 0x40;
        }
        
        // Behind Background
        if (attributes >= 0x20) {
            this.sprLayer = this.bus.videoOutput.sprBehindLayer;
            attributes -= 0x20;
        } else
            this.sprLayer = this.bus.videoOutput.sprBeforeLayer;
        
        if (attributes > 0x03)
            attributes &= 0x03;
        
        // 8x16 Sprites
        if (row >= 8) {
            row -= 8;
            patternIndex++;
        }
        
        const pattern = this.fetchSprPatternTable(patternIndex, row);
        this.fillSprPixelsBuffer(pattern, attributes, flip);
    }
    
    /** Garbage fetch of a sprite. */
    fetchNullSprite() {
        if (!this.showSprites) return;
        
        const addressBus = this.addressBus;
        this.fetchNameTable(addressBus);
        this.fetchAttributeTable(addressBus);
        
        this.fetchSprPatternTable(0x00, 0);
    }
    
    /**
     * Draw the content of the buffer at the appropriate X position on the next scanline.
     * @param {number} scanline
     */
    renderSprite(scanline) {
        if (!this.showSprites) return;
        
        const x = this.oamSecondary[this.oamIndex++];
        const pixels = this.sprPixelsBuffer;
        
        if (this.sprite0)
            this.sprite0Layer.fill(0).set(pixels, x);
        
        this.sprLayer.writePixels(x, scanline+1, pixels);
    }
    
    //== Output =========================================================================//
    printFrame() {
        this.bus.videoOutput.schedule(this.backdrop);
    }
}

export default PPU;
