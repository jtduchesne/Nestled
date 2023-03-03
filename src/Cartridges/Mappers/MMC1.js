import Cartridge from '../Cartridge.js';

/**
 * The *Nintendo MMC1* is a mapper ASIC used in Nintendo's SxROM boards.
 * 
 * Most common SxROM boards are assigned to *iNES Mapper 1*.
 */
export class MMC1 extends Cartridge {
    constructor() {
        super();
        
        this.mirroring   = 0;
        this.PRGBankMode = 3;
        this.CHRBankMode = 0;
        
        this.buffer = 0;
        this.index = 0;
    }
    
    //== Internal registers =============================================================//
    /** @protected @param {number} value */
    set control(value) {
        this.mirroring   = (value & 0x03);
        this.PRGBankMode = (value & 0x0C) >> 2;
        this.CHRBankMode = (value & 0x10) >> 4;
    }
    
    /** @protected @param {number} value */
    set CHR0(value) {
        if (this.CHRBankMode === 1) {
            this.CHRBank[0] = this.CHRROM[value];
        } else {
            const bank = value & ~1;
            this.CHRBank[0] = this.CHRROM[bank+0];
            this.CHRBank[1] = this.CHRROM[bank+1];
        }
    }
    /** @protected @param {number} value */
    set CHR1(value) {
        if (this.CHRBankMode === 1) {
            this.CHRBank[1] = this.CHRROM[value];
        }
    }
    
    /** @protected @param {number} value */
    set PRG(value) {
        if (this.PRGBankMode === 3) {
            while (value >= 0x10) value -= 0x10;
            this.PRGBank[0] = this.PRGROM[value];
            this.PRGBank[1] = this.lastPRGBank;
        } else if (this.PRGBankMode === 2) {
            while (value >= 0x10) value -= 0x10;
            this.PRGBank[0] = this.firstPRGBank;
            this.PRGBank[1] = this.PRGROM[value];
        } else {
            const bank = value & 0x0E;
            this.PRGBank[0] = this.PRGROM[bank+0];
            this.PRGBank[1] = this.PRGROM[bank+1];
        }
    }
    
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     * @protected
     */
    write(address, data) {
        switch (address - 0x8000) {
        case 0x0000: this.control = data; break;
        case 0x2000: this.CHR0    = data; break;
        case 0x4000: this.CHR1    = data; break;
        case 0x6000: this.PRG     = data; break;
        default: this.write(address & 0xE000, data);
        }
    }
    
    //== Memory access from CPU =========================================================//
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     */
    cpuWrite(address, data) {
        if (address >= 0x8000) {
            if (data >= 0x80) {
                this.buffer = 0;
                this.index = 0;
                this.mirroring = 0;
                this.CHRBankMode = 0;
            } else {
                this.buffer += ((data & 0x1) << this.index);
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
    
    //== CIRAM A10 (Pin22) ==============================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {0|1}
     */
    ciramA10(address) {
        if (this.mirroring === 3) {
            if (address < 0x800)
                return 0;
            else
                return (address & 0x800) ? 1 : 0;
        } else if (this.mirroring === 2) {
            if (address < 0x400)
                return 0;
            else
                return (address & 0x400) ? 1 : 0;
        } else
            return this.mirroring ? 1 : 0;
    }
}
export default MMC1;
