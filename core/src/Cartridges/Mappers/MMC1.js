import Cartridge from '../Cartridge';

export class MMC1 extends Cartridge {
    constructor(number) {
        super(number || 1);
        
        this.mirroring   = 0;
        this.PRGBankMode = 3;
        this.CHRBankMode = 0;
        
        this.buffer = 0;
        this.index = 0;
    }
    
    init() {
        super.init();
        
        this.lastPRGBank = this.PRGROM[this.PRGROM.length-1];
        
        this.PRGBank[0] = this.PRGROM[0];
        this.PRGBank[1] = this.lastPRGBank;
    }
    
    //== Internal registers =========================================//
    set control(value) {
        this.flags = value;
        
        this.mirroring   = (value & 0x03);
        this.PRGBankMode = (value & 0x0C) >> 2;
        this.CHRBankMode = (value & 0x10) >> 4;
    }
    
    set CHR0(value) {
        if (this.CHRBankMode === 1) {
            this.CHRBank[0] = this.CHRROM[value];
        } else {
            let bank = value & ~1;
            this.CHRBank[0] = this.CHRROM[bank+0];
            this.CHRBank[1] = this.CHRROM[bank+1];
        }
    }
    set CHR1(value) {
        if (this.CHRBankMode === 1) {
            this.CHRBank[1] = this.CHRROM[value];
        }
    }
    
    set PRG(value) {
        if (value >= 0x10) value -= 0x10;
        if (this.PRGBankMode === 3) {
            this.PRGBank[0] = this.PRGROM[value];
            this.PRGBank[1] = this.lastPRGBank;
        } else if (this.PRGBankMode === 2) {
            this.PRGBank[0] = this.PRGROM[0];
            this.PRGBank[1] = this.PRGROM[value];
        } else {
            let bank = value & ~1;
            this.PRGBank[0] = this.PRGROM[bank+0];
            this.PRGBank[1] = this.PRGROM[bank+1];
        }
    }
    
    write(address, data) {
        switch (address & 0x6000) {
        case 0x0000: this.control = data; break;
        case 0x2000: this.CHR0    = data; break;
        case 0x4000: this.CHR1    = data; break;
        case 0x6000: this.PRG     = data; break;
        }
    }
    
    //== Memory access from CPU =====================================//
    cpuWrite(address, data) {
        if (address >= 0x8000) {
            if (data & 0x80) {
                this.buffer = 0;
                this.index = 0;
                this.control = (this.flags | 0xC);
            } else {
                this.buffer |= ((data & 0x1) << this.index);
                if (++this.index === 5) {
                    this.write(address, this.buffer);
                    this.buffer = 0;
                    this.index = 0;
                }
            }
        } else {
            super.cpuWrite(address, data);
        }
    }
    
    //== CIRAM A10 (Pin22) ==========================================//
    ciramA10(address) {
        if (this.mirroring === 3)
            return address & 0x800;
        else if (this.mirroring === 2)
            return address & 0x400;
        else
            return this.mirroring;
    }
}
export default MMC1;
