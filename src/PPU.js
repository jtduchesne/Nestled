import Buffer from './Buffer.js';
import * as Colors from './Colors.js';

//                      0x0000, 0x8000,   0x0080, 0x8080
const bitplaneLookup = {0: 0,   32768: 1, 128: 2, 32896: 3};

export class PPU {
    constructor(nes) {
        this.bus = nes;
                
        this.vblank = false;
        
        //Internal Video RAM (or Character Internal RAM (CI-RAM) )
        this.vram = new Uint8Array(0x800);
        this.vramBank = [this.vram.subarray(0x000, 0x400), this.vram.subarray(0x400, 0x800)];
        
        //Object Attribute Memory
        this.oamPrimary   = new Uint8Array(64*4);
        this.oamSecondary = new Uint8Array(8*4);
        this.oamAddress = 0; //For accessing primary OAM through $2004 and DMA
        this.oamIndex   = 0; //For internal access to secondary OAM
        
        //Palettes
        this.palette = [new Uint8Array(4*4), new Uint8Array(4*4)];
        
        //Colors
        this.pxlColors = Colors.pxlColor;
        this.cssColors = Colors.cssColor;
        
        this.bkgPixelsBuffer = new Uint32Array(16);
        this.sprPixelsBuffer = new Uint32Array(8);
        
        //Layers
        this.sprBehindLayer  = new Buffer(264, 256);
        this.sprInFrontLayer = new Buffer(264, 256);
        this.sprite0Layer = new Buffer(264, 256);
        
        this.bkgLayer = new Buffer(264, 256);
        this.sprLayer = this.sprInFrontLayer;
        
        this.isPowered = false;
    }
    
    powerOn() {        
        this.isPowered = true;
        
        this.control    = null; //$2000 Control
        this.mask       = null; //$2001 Mask
        this.status     = null; //$2002 Status
        this.OAMAddress = null; //$2003 OAM address
        this.oamPrimary.fill(0);//$2004 OAM data
        this.scroll     = null; //$2005 Scroll
        this.address    = null; //$2006 Address
        this.data       = null; //$2007 Data
    }
    powerOff() {
        this.isPowered = false;
    }
    
    doReset() {
        this.control = null; //$2000 Control Register
        this.mask    = null; //$2001 Mask Register
        this.scroll  = null; //$2005 Scroll Register
        this.data    = null; //$2007 Data Register
    }
    
    doVBlank() {
        this.vblank = true;
        this.renderingEnabled = false;
        if (this.nmiEnabled) this.bus.cpu.doNMI();
    }
    endVBlank() {
        this.status = null;
        this.renderingEnabled = (this.showBackground || this.showSprites);
    }
    
    //== Registers ==================================================//
    //= 0x2000 Control =//
    set control(value) {
        if (value !== null) {
            this.addressBuffer &= ~0x0C00; // b1111.0011.1111.1111
            this.addressBuffer |= (value & 0x3)<<10;
        
            this.addressIncrement = (value & 0x04) ? 32 : 1;
            this.sprPatternTable =  (value & 0x08) ? 0x1000 : 0x0000;
            this.bkgPatternTable =  (value & 0x10) ? 0x1000 : 0x0000;
            this.sprite8x16 =     !!(value & 0x20);
            this.nmiEnabled =     !!(value & 0x80);
        } else {
            this.addressIncrement = 1;     //[1,32]
            this.sprPatternTable = 0x0000; //[0x0000,0x1000]
            this.bkgPatternTable = 0x0000; //[0x0000,0x1000]
            this.sprite8x16 = false;
            this.nmiEnabled = false;
        }
    }
    
    //= 0x2001 Mask =//
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
        
    //= 0x2002 Status =//
    get status() {
        let value = (this.spriteOverflow && 0x20) |
                    (this.sprite0Hit && 0x40) |
                    (this.vblank && 0x80);
        this.vblank = false;
        this.writeToggle = false;
        
        return value;
    }
    set status(value) {
        this.spriteOverflow = false;
        this.sprite0Hit = false;
        this.sprite0 = false;
        this.vblank = false;
    }
    
    //= 0x2003 OAM address =//
    set OAMAddress(value) {
        this.oamAddress = value || 0x00;
    }
    
    //= 0x2004 OAM data =//
    get OAMData() {
        return this.oamPrimary[this.oamAddress];
    }
    set OAMData(value) {
        this.oamPrimary[this.oamAddress++] = value;
        if (this.oamAddress > 0xFF) this.oamAddress = 0x00;
    }
    
    //= 0x2005 Scroll =//
    set scroll(value) {
        if (value !== null) {
            const toggle = this.writeToggle;
            var addressBuffer = this.addressBuffer;
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
        } else {
            this.writeToggle = false;
            this.fineScrollX = 0x0;
            this.fineScrollY = 0x0;
        }
    }
    
    //= 0x2006 Address =//
    set address(value) {
        if (value !== null) {
            let toggle = this.writeToggle;
            if (toggle) {
                this.addressBuffer = (this.addressBuffer & 0xff00) | value;
                this.addressBus = this.addressBuffer;
            } else {
                value = (value & 0x3f) << 8;
                this.addressBuffer = (this.addressBuffer & 0x00ff) | value;
            }
            this.writeToggle = !toggle;
        } else {
            this.writeToggle = false;
            this.addressBus = this.addressBuffer = 0x0000;
        }
    }
    
    //= 0x2007 Data =//
    get data() {
        let value;
        let address = this.addressBus;
        
        if (address >= 0x3F00)
            value = this.readPalette(address);
        else
            value = this.readBuffer;
        
        this.readBuffer = this.read(address);
        this.addressBus = address + this.addressIncrement;
        
        return value;
    }
    set data(value) {
        if (value !== null) {
            let address = this.addressBus;
            if (address >= 0x3F00)
                this.writePalette(address, value);
            else
                this.write(address, value);
            
            this.addressBus = address + this.addressIncrement;
        } else
            this.readBuffer = 0x00;
    }
    
    //== Registers access ===========================================//
    readRegister(address) {
        switch (address & 0x7) {
        case 0x2: return this.status;
        case 0x4: return this.OAMData;
        case 0x7: return this.data;
        }
    }
    writeRegister(address, data) {
        switch (address & 0x7) {
        case 0x0: this.control    = data; break;
        case 0x1: this.mask       = data; break;
        case 0x3: this.OAMAddress = data; break;
        case 0x4: this.OAMData    = data; break;
        case 0x5: this.scroll     = data; break;
        case 0x6: this.address    = data; break;
        case 0x7: this.data       = data; break;
        }
    }
    
    read(address) {
        let cartridge = this.bus.cartridge;
        if (cartridge.ciramEnabled(address))
            return this.vramBank[cartridge.ciramA10(address) ? 1 : 0][address & 0x3FF];
        else
            return cartridge.ppuRead(address);
    }
    write(address, data) {
        let cartridge = this.bus.cartridge;
        if (cartridge.ciramEnabled(address))
            this.vramBank[cartridge.ciramA10(address) ? 1 : 0][address & 0x3FF] = data;
        else
            cartridge.ppuWrite(address, data);
    }
    
    //== Palettes ===================================================//
    get backdrop() { return this.palette[0][0]; }
    
    get bkgPalette() { return this.palette[0]; }
    get sprPalette() { return this.palette[1]; }
    
    readPalette(address) {
        if (address & 0x3)
            return this.palette[(address & 0x10) >>> 4][address & 0x0F];
        else
            return this.palette[0][0x00];
    }
    writePalette(address, data) {
        if (address & 0x3)
            this.palette[(address & 0x10) >>> 4][address & 0x0F] = data;
        else
            this.palette[0][address & 0x0F] = data;
    }
    
    //== Scrolling ==================================================//
    incrementX() {
        if (!this.renderingEnabled) return;
        
        var addressBus = this.addressBus;
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
        
        var addressBus = this.addressBus;
        if (addressBus < 0x7000) {
            addressBus += 0x1000;
            this.fineScrollY++;
        } else {
            addressBus -= 0x7000; 

            let coarseY = (addressBus & 0x03E0);
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
        
        var addressBus = this.addressBus;            //  _yyy.nnYY.YYYX.XXXX
        addressBus &= 0x7BE0;                        // b0111.1011.1110.0000
        addressBus |= (this.addressBuffer & 0x041F); // b0000.0100.0001.1111
        this.addressBus = addressBus;
    }
    resetY() {
        if (!this.renderingEnabled) return;
        
        var addressBus = this.addressBus;            //  _yyy.nnYY.YYYX.XXXX
        addressBus &= 0x041F;                        // b0000.0100.0001.1111
        addressBus |= (this.addressBuffer & 0x7BE0); // b0111.1011.1110.0000
        this.addressBus = addressBus;
        
        this.fineScrollY = addressBus >>> 12;
    }
    
    //== Background =================================================//
    fetchNameTable(bus) {
        let address = 0x2000 + (bus & 0x0FFF);
        return this.read(address);
    }
    fetchAttributeTable(bus) {
        let address = 0x23C0 | (bus & 0x0C00) | (bus>>>4 & 0x0038) | (bus>>>2 & 0x0007);
        var offset = 0;
        if (bus & 0x0002) offset += 2;
        if (bus & 0x0040) offset += 4;
        return (this.read(address) >>> offset) & 0x3;
    }
    fetchBkgPatternTable(patternIndex, row) {
        let address = this.bkgPatternTable + patternIndex*16 + row;
        return this.read(address)*256 + this.read(address+8);
    }
    
    fetchTile() {
        if (!this.showBackground) return;

        let addressBus = this.addressBus;
        
        let patternIndex = this.fetchNameTable(addressBus);
        let paletteIndex = this.fetchAttributeTable(addressBus);
        let pattern      = this.fetchBkgPatternTable(patternIndex, this.fineScrollY);
        
        let pixels = this.getPatternPixels(pattern, this.bkgPalette, paletteIndex);
        this.bkgPixelsBuffer.copyWithin(0, 8);
        this.bkgPixelsBuffer.set(pixels, 8);
    }
    
    fetchNullTile() {
        if (!this.showBackground) return;
        
        let addressBus = this.addressBus;
        let patternIndex = this.fetchNameTable(addressBus);
        this.fetchAttributeTable(addressBus);
        this.fetchBkgPatternTable(patternIndex);
    }
    fetchNullNTs() {
        if (!this.showBackground) return;
        
        let addressBus = this.addressBus;
        this.fetchNameTable(addressBus);
        this.fetchNameTable(addressBus);
    }
    
    renderTile(dot, scanline) {
        if (!this.showBackground) return;
        
        let offset = this.fineScrollX;
        let pixels = this.bkgPixelsBuffer.subarray(offset, offset+8);
        
        if (this.sprite0 && !this.sprite0Hit) {
            if (this.sprite0Layer.getPixels(dot, scanline).some((e,i) => (e & pixels[i])))
                this.sprite0Hit = true;
        }
        
        this.bkgLayer.setPixels(dot, scanline, pixels);
    }
    
    //== Sprites ====================================================//
    clearSecondaryOAM() {
        this.oamSecondary.fill(0xFF);
        this.oamIndex = 0;
    }
    evaluateSprites(scanline) {
        let spritesList = this.oamPrimary;
        let sprites     = this.oamSecondary;
        
        let height = this.sprite8x16 ? 16 : 8;
        
        while (this.oamAddress < 256) {
            let y = spritesList[this.oamAddress];
            
            let top = Math.max(0, y + height);
            let bottom = y;
            
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
                        for (var i=1; i<4; i++)
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
    
    fetchSprPatternTable(patternIndex, row) {
        var offset = this.sprPatternTable;
        if (this.sprite8x16) {
            offset = (patternIndex & 0x1) << 12;
            patternIndex &= 0xFE;
        }
        let address = offset + patternIndex*16 + row;
        return this.read(address)*256 + this.read(address+8);
    }
    
    fetchSprite(scanline) {
        if (!this.showSprites) return;
        
        let addressBus = this.addressBus;     //
        this.fetchNameTable(addressBus);      // Garbage fetch
        this.fetchAttributeTable(addressBus); //
        
        this.oamAddress = 0x00;
        
        let sprites = this.oamSecondary;
        
        if (this.sprite0)
            this.sprite0 = this.sprite0 && !this.oamIndex;
        
        let y = sprites[this.oamIndex++];
        var row = scanline - y;
        
        let patternIndex = sprites[this.oamIndex++];
        let attributes   = sprites[this.oamIndex++];
        
        let vertFlip = attributes & 0x80;
        if (vertFlip)
            row = (this.sprite8x16 ? 16 : 8) - row - 1;
        if (row >= 8) {
            row -= 8;
            patternIndex++;
        }
        
        let pattern = this.fetchSprPatternTable(patternIndex, row);
        
        if (y < 240) {
            let paletteIndex = attributes & 0x03;
            this.sprPixelsBuffer = this.getPatternPixels(pattern, this.sprPalette, paletteIndex);
            
            let horiFlip = attributes & 0x40;
            if (horiFlip) this.sprPixelsBuffer.reverse();
            
            let isBehind = attributes & 0x20;
            if (isBehind)
                this.sprLayer = this.sprBehindLayer;
            else
                this.sprLayer = this.sprInFrontLayer;
        }
    }
        
    fetchNullSprite() {
        if (!this.showSprites) return;
        
        let addressBus = this.addressBus;
        this.fetchNameTable(addressBus);
        this.fetchAttributeTable(addressBus);
        
        this.fetchSprPatternTable(this.sprPatternTable, 0xFF, 3);
    }
    
    renderSprite(scanline) {
        if (!this.showSprites) return;
        
        let x = this.oamSecondary[this.oamIndex++];
        let pixels = this.sprPixelsBuffer;
        
        if (this.sprite0)
            this.sprite0Layer.setPixels(x, scanline+1, pixels);
        
        this.sprLayer.setPixels(x, scanline+1, pixels);
    }
    
    //== Pixels Rendering ===========================================//
    getPatternPixels(pattern, palette, paletteIndex) {
        let colors = this.pxlColors;
        let paletteOffset = paletteIndex * 4;
        
        let pixels = new Uint32Array(8);
        for (var offset = 0; offset < 8; offset++) {
            let colorIndex = bitplaneLookup[(pattern << offset) & 0x8080];
            pixels[offset] = colorIndex ? colors[palette[paletteOffset + colorIndex]] : 0x00000000;
        }
        return pixels;
    }
    //== Output =====================================================//
    printFrame() {
        let canvas = this.bus.outputCanvas;
        if (canvas) {
            let context = this.bus.outputContext;
            let width   = canvas.width;
            let height  = canvas.height;
        
            // Backdrop
            context.fillStyle = this.cssColors[this.backdrop];
            context.fillRect(0, 0, width, height);
        
            // Sprites behind background
            context.drawImage(this.sprBehindLayer.frame, 0, 0, 256, 240, 0, 0, width, height);
            this.sprBehindLayer.clear();
            
            // Background
            context.drawImage(this.bkgLayer.frame, 0, 0, 256, 240, 0, 0, width, height);
            this.bkgLayer.clear();
            
            // Sprites in front of background
            context.drawImage(this.sprInFrontLayer.frame, 0, 0, 256, 240, 0, 0, width, height);
            this.sprInFrontLayer.clear();
            
            this.sprite0Layer.clear();
        }
    }
    clearFrame() {
        if (this.canvas) {
            let canvas = this.bus.outputCanvas;
            let context = this.bus.outputContext;
            context.fillStyle = this.cssColors[this.backdrop];
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

export default PPU;
