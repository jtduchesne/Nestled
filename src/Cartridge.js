import NESFile from './NESFile.js';
import MemoryMapper from './MemoryMapper.js';

export class Cartridge {
    constructor(opts) {
        this.PRGRAM = new Uint8Array(0x4000);
        this.CHRRAM = new Uint8Array(0x2000);
        
        if (opts && opts['file'] || opts instanceof NESFile)
            return this.load(opts['file'] || opts);
        else
            return this.reset();
    }
    
    reset() {
        this.isValid = false;
        
        this.name = "";
        
        this.mapper = null;
        
        this.horiMirroring = false;
        this.vertMirroring = false;
        
        this.battery = false;
        
        this.PRGROM = [];
        this.CHRROM = [];
        
        this.tvSystem = "NTSC";
        
        this.file = null;
    }
    
    load(file) {
        if (file.isValid) {
            this.reset();
            
            let header = new DataView(file.data, 0, 0x10);
            var offset = 0x10;
            
            if (header.getUint32(0) === 0x4E45531A) { //"NES" + MS-DOS end-of-file
                file.updateStatus("iNES format");
            } else {
                file.updateStatus("Invalid format");
                return this;
            }
            
            let flags6 = header.getUint8(6);
            let flags7 = header.getUint8(7);
            
            let mapperNumber = (flags6 >> 4) | (flags7 & 0xF0);
            if (MemoryMapper.isSupported(mapperNumber)) {
                file.updateStatus(
                    `Mapper #${mapperNumber}: ${MemoryMapper.getName(mapperNumber)}`
                );
                this.isValid = true;
            } else {
                file.updateStatus(
                    `Unsupported mapper (#${mapperNumber}: ${MemoryMapper.getName(mapperNumber)})`
                );
                this.isValid = false;
            }
            
            if (flags6 & 0x8) {
                this.horiMirroring = false;
                this.vertMirroring = false;
                file.updateStatus("4-screens scrolling");
            } else if (flags6 & 0x1) {
                this.horiMirroring = false;
                this.vertMirroring = true;
                file.updateStatus("Horizontal scrolling");
            } else {
                this.horiMirroring = true;
                this.vertMirroring = false;
                file.updateStatus("Vertical scrolling");
            }
            
            if (flags6 & 0x4) {
                this.PRGRAM.set(new Uint8Array(file.data, offset, 0x200), 0x1000);
                offset += 0x200;
            }
            
            let numPRGBank = header.getUint8(4);
            let numCHRBank = header.getUint8(5);
            
            file.updateStatus(`${numPRGBank*16}kb of PRG-ROM`, true);
            for (var curBank = 0; curBank < numPRGBank; curBank++) {
                this.PRGROM.push(new Uint8Array(file.data, offset, 0x4000));
                offset += 0x4000;
            }
            
            file.updateStatus(`${numCHRBank*8}kb of CHR-ROM`, true);
            for (curBank = 0; curBank < numCHRBank; curBank++) {
                this.CHRROM.push(new Uint8Array(file.data, offset, 0x2000));
                offset += 0x2000;
            }
            
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
            
            this.mapper = new MemoryMapper(mapperNumber, this);
            
            this.file = file;
            
            file.updateStatus(`${this.name} ready`);
            return this;
        } else {
            file.updateStatus(`${file.name} is not a valid file`);
            return this.unload();
        }
    }
    unload() {
        this.reset();
        
        return new NoCartridge;
    }
    
    //== Memory I/O =================================================//
    cpuRead(address) { return this.mapper.cpuRead(address); }
    cpuWrite(address, data) { this.mapper.cpuWrite(address, data); }
    
    ppuRead(address) { return this.mapper.ppuRead(address); }
    ppuWrite(address, data) { this.mapper.ppuWrite(address, data); }
    
    ciramA10(address)     { return this.mapper.ciramA10(address); }
    ciramEnabled(address) { return this.mapper.ciramEnabled(address); }
}
export default Cartridge;

export class NoCartridge extends Cartridge {
    constructor(opts) {
        super(opts);
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
