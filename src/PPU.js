export class PPU {
    constructor(nes) {
        this.bus = nes;
                
        this.vblank = false;
        
        //Internal Video RAM (or Character Internal RAM (CI-RAM) )
        this.vram = new Uint8Array(0x800);
        this.vramBank = [this.vram.subarray(0x000, 0x400), this.vram.subarray(0x400, 0x800)];
        
        //Object Attribute Memory
        this.oam = new Uint8Array(64*4);
        
        //Palettes
        this.palette = [new Uint8Array(4*4), new Uint8Array(4*4)];
        
        this.isPowered = false;
    }
    
    powerOn() {        
        this.isPowered = true;
        
        this.control    = null; //$2000 Control
        this.mask       = null; //$2001 Mask
        this.status     = null; //$2002 Status
        this.OAMAddress = null; //$2003 OAM address
        this.oam.fill(0);       //$2004 OAM data
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
    
    //== Rendering ==================================================//
    doFrame() {
        this.vblank = true;
        if (this.nmiEnabled) this.bus.cpu.doNMI();
    }
    
    //== Registers ==================================================//
    //= 0x2000 Control =//
    set control(value) {
        if (value !== null) {
            this.addToXScroll =     (value & 0x01) ? 256 : 0;
            this.addToYScroll =     (value & 0x02) ? 240 : 0;
            this.addressIncrement = (value & 0x04) ? 32 : 1;
            this.sprPatternTable =  (value & 0x08) ? 0x1000 : 0x0000;
            this.bkgPatternTable =  (value & 0x10) ? 0x1000 : 0x0000;
            this.sprite8x16 =     !!(value & 0x20);
            this.nmiEnabled =     !!(value & 0x80);
        } else {
            this.addToXScroll = 0;
            this.addToYScroll = 0;
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
        } else {
            this.grayscale       = false;
            this.showLeftMostBkg = false;
            this.showLeftMostSpr = false;
            this.showBackground  = false;
            this.showSprites     = false;
            this.emphasizeRed    = false;
            this.emphasizeGreen  = false;
            this.emphasizeBlue   = false;
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
        this.vblank = false;
    }
    
    //= 0x2003 OAM address =//
    set OAMAddress(value) {
        this.oamAddress = value || 0x00;
    }
    
    //= 0x2004 OAM data =//
    get OAMData() {
        return this.oam[this.oamAddress];
    }
    set OAMData(value) {
        this.oam[this.oamAddress++] = value;
        if (this.oamAddress > 0xFF) this.oamAddress = 0x00;
    }
    
    //= 0x2005 Scroll =//
    set scroll(value) {
        if (value !== null) {
            let toggle = this.writeToggle;
            if (toggle)
                this.scrollY = value;
            else
                this.scrollX = value;
            this.writeToggle = !toggle;
        } else {
            this.writeToggle = false;
            this.scrollX = 0x0;
            this.scrollY = 0x0;
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
        var cartridge = this.bus.cartridge;
        if (cartridge.ciramEnabled(address))
            return this.vramBank[cartridge.ciramA10(address) ? 1 : 0][address & 0x3FF];
        else
            return cartridge.ppuRead(address);
    }
    write(address, data) {
        var cartridge = this.bus.cartridge;
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
}

export default PPU;
