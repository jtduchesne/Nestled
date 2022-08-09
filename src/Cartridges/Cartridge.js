export class Cartridge {
    constructor() {
        this.PRGRAM = new Uint8Array(0x4000);
        this.CHRRAM = new Uint8Array(0x2000);
        
        this.PRGROM = [];
        this.CHRROM = [];
        this.PRGBank = [this.PRGRAM, this.PRGRAM];
        this.CHRBank = [this.CHRRAM, this.CHRRAM];
        
        this.horiMirroring = false;
        this.vertMirroring = false;
        
        this.battery = false;
    }
    
    get empty()   { return !this.present; }
    get present() { return this.PRGROM.length > 0; }
    
    init() {
        if (this.PRGROM.length > 0)
            this.PRGBank = [this.PRGROM[0], this.PRGROM[this.PRGROM.length-1]];
        else
            this.PRGBank = [this.PRGRAM, this.PRGRAM];
        
        if (this.CHRROM.length === 0)
            this.CHRROM = [this.CHRRAM.subarray(0, 0x1000), this.CHRRAM.subarray(0x1000)];
        this.CHRBank = [this.CHRROM[0], this.CHRROM[1]];
    }
    
    //== Memory access from CPU =====================================//
    cpuRead(address) {
        if (address >= 0xC000) {
            return this.PRGBank[1][address - 0xC000];
        } else if (address >= 0x8000) {
            return this.PRGBank[0][address - 0x8000];
        } else {
            if (address >= 0x6000)   address -= 0x6000;
            while (address > 0x1FFF) address -= 0x2000;
            return this.PRGRAM[address];
        }
    }
    cpuWrite(address, data) {
        if (address >= 0x6000)   address -= 0x6000;
        while (address > 0x1FFF) address -= 0x2000;
        this.PRGRAM[address] = data;
    }
    
    //== Memory access from PPU =====================================//
    ppuRead(address) {
        if (address < 0x1000)
            return this.CHRBank[0][address];
        else if (address < 0x2000)
            return this.CHRBank[1][address - 0x1000];
        else {
            address -= 0x2000;
            while (address > 0x0FFF) address -= 0x1000;
            return this.CHRBank[1][address];
        }
    }
    ppuWrite(address, data) {
        while (address > 0x1FFF) address -= 0x2000;
        this.CHRRAM[address] = data;
    }
    
    //== CIRAM A10 (Pin22) ==========================================//
    ciramA10(address) { /* eslint-disable-line no-unused-vars */
        //Not connected by default
        return 0x0000;
    }
    //== CIRAM /CE (Pin57) ==========================================//
    ciramEnabled(address) {
        //Connected to PPU /A13 (0x2000) by default
        if (address < 0x2000)
            return 0x0000;
        else if (address < 0x4000)
            return 0x2000;
        else
            return address & 0x2000;
    }
}

export default Cartridge;
