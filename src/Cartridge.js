import NESFile from './NESFile.js';

export class Cartridge {
    constructor(opts) {
        this.PRGRAM = new Uint8Array(0x4000);
        this.CHRRAM = new Uint8Array(0x2000);
        
        if (opts && opts['file'] || opts instanceof NESFile)
            return this.load(opts['file'] || opts);
        else
            return this.unload();
    }
    
    reset() {
        this.isValid = false;
        
        this.name = "";
        this.mapperNumber = 0;
        
        this.horiMirroring = null;
        this.vertMirroring = null;
        
        this.battery = null;
        
        this.PRGROM = [];
        this.CHRROM = [];
        this.PRGBank = [this.PRGRAM, this.PRGRAM];
        this.CHRBank = [this.CHRRAM, this.CHRRAM];
        
        this.tvSystem = "NTSC";
        
        this.file = null;
    }
    
    load(file) {
        if (file.isValid) {
            this.reset();
            
            const header = new DataView(file.data, 0, 0x10);
            var offset = 0x10;
            
            if (header.getUint32(0) === 0x4E45531A) { //"NES" + MS-DOS end-of-file
                file.updateStatus("iNES format");
            } else {
                file.updateStatus("Invalid format");
                return this;
            }
            this.file = file;
            
            const numPRGBank = header.getUint8(4);
            const numCHRBank = header.getUint8(5);
            
            const flags6 = header.getUint8(6);
            if (flags6 & 0x8) {
                this.horiMirroring = false;
                this.vertMirroring = false;
            } else {
                this.horiMirroring =  !(flags6 & 0x1);
                this.vertMirroring = !!(flags6 & 0x1);
            }
            
            if (flags6 & 0x4) {
                this.PRGRAM.set(new Uint8Array(file.data, offset, 0x200), 0x1000);
                offset += 0x200;
            }
            
            const flags7 = header.getUint8(7);
            this.mapperNumber = (flags6 >> 4) + (flags7 & 0xF0);
            if (this.mapperNumber > 0) {
                file.updateStatus("Unsupported mapper (" & this.mapperNumber & ")");
                return this;
            }
            
            file.updateStatus(numPRGBank*16 + "kb of PRG-ROM", true);
            for (var curBank = 0; curBank < numPRGBank; curBank++) {
                this.PRGROM.push(new Uint8Array(file.data, offset, 0x4000));
                offset += 0x4000;
            }
            if (this.PRGROM.length > 0)
                this.PRGBank = [this.PRGROM[0], this.PRGROM[this.PRGROM.length-1]];
            else
                this.PRGBank = [this.PRGRAM, this.PRGRAM];
            
            file.updateStatus(numCHRBank*8 + "kb of CHR-ROM", true);
            for (curBank = 0; curBank < numCHRBank; curBank++) {
                this.CHRROM.push(new Uint8Array(file.data, offset, 0x2000));
                offset += 0x2000;
            }
            if (this.CHRROM.length > 0)
                this.CHRBank = [this.CHRROM[0], this.CHRROM[this.CHRROM.length-1]];
            else
                this.CHRBank = [this.CHRRAM, this.CHRRAM];
            
            if (flags6 & 0x2) {
                this.battery = true;
                file.updateStatus("Battery-backed SRAM", true);
            }
            
            if (offset < file.data.byteLength) {
                this.name = String.fromCharCode.apply(null, new Uint8Array(file.data, offset)).replace(/\0/g, '');
            } else {
                var countryCodes = /\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/.exec(file.name);
                if (countryCodes) {
                    if (countryCodes[0].search(/A|B|[^F]C|NL|E|S|SW|FN|G|UK|GR|I|H/) > 0)
                        this.tvSystem = "PAL";
                    else if (countryCodes[0].search(/F[^C]/) > 0)
                        this.tvSystem = "SECAM"; //wtf la France ?
                }
                
                this.name = file.name.replace(
                    /\.[A-Za-z0-9_]+$/, ""
                ).replace(
                    /\s?\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)|\s?\[(!|a|p|b|t|f|T[+-]|h|o)+\]/g, ""
                ).replace(
                    /_+/g, " "
                ).trim();
                this.name = this.name && (this.name[0].toUpperCase() + this.name.slice(1));
            }
            
            file.updateStatus(this.name + " ready");
            return this;
        } else {
            file.updateStatus(file.name + " is not a valid file");
            return this.unload();
        }
    }
    unload() {
        this.reset();
        
        return new NoCartridge;
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
        if (this.vertMirroring)
            return address & 0x400; //Connected to PPU A10
        else if (this.horiMirroring)
            return address & 0x800; //Connected to PPU A11
        else
            return 0;
    }
    //== CIRAM /CE (Pin57) ==========================================//
    ciramEnabled(address) {
        return address & 0x2000; //Connected to PPU /A13 by default
    }
}
export default Cartridge;

export class NoCartridge extends Cartridge {
    constructor(opts) {
        super(opts);
        this.reset();
        this.name = "No Cartridge";
    }
    load(file) {
        return new Cartridge(file); }
    unload() {
        return this; }
    /* eslint-disable no-unused-vars */
    cpuRead(address)        { return 0; }
    cpuWrite(address, data) { return;   }
    ppuRead(address)        { return 0; }
    ppuWrite(address, data) { return;   }
    ciramA10(address)       { return 0; }
    ciramEnabled(address)   { return 0; }
    /* eslint-enable no-unused-vars */
}
