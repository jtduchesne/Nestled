export class Mapper {
    constructor(number, cartridge) {
        this.number = number;
        
        this.PRGRAM = cartridge.PRGRAM;
        this.CHRRAM = cartridge.CHRRAM;
        
        this.PRGROM = cartridge.PRGROM;
        this.CHRROM = cartridge.CHRROM;
        
        if (this.PRGROM.length > 0)
            this.PRGBank = [this.PRGROM[0], this.PRGROM[this.PRGROM.length-1]];
        else
            this.PRGBank = [this.PRGRAM, this.PRGRAM];
        
        if (this.CHRROM.length > 0)
            this.CHRBank = [this.CHRROM[0], this.CHRROM[this.CHRROM.length-1]];
        else
            this.CHRBank = [this.CHRRAM, this.CHRRAM];
    }
    
    //== Memory access from CPU =====================================//
    cpuRead(address) {
        if (address >= 0xC000) {
            return this.PRGBank[1][address & 0x3FFF];
        } else if (address >= 0x8000) {
            return this.PRGBank[0][address & 0x3FFF];
        } else {
            return this.PRGRAM[address & 0x1FFF];
        }
    }
    cpuWrite(address, data) {
        this.PRGRAM[address & 0x1FFF] = data;
    }
    
    //== Memory access from PPU =====================================//
    ppuRead(address) {
        if (address >= 0x2000)
            return this.CHRBank[1][address & 0x1FFF];
        else
            return this.CHRBank[0][address & 0x1FFF];
    }
    ppuWrite(address, data) {
        this.CHRRAM[address & 0x1FFF] = data;
    }
    
    //== CIRAM A10 (Pin22) ==========================================//
    ciramA10(address) {
        return address & 0x0000; //Not connected
    }
    //== CIRAM /CE (Pin57) ==========================================//
    ciramEnabled(address) {
        return address & 0x2000; //Connected to PPU /A13 by default
    }
}
export default Mapper;
