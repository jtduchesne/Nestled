import Cartridge from './Cartridge.js';
import Mapper from "./Mapper.js";

export class CartConnector {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.cartridge = new Cartridge;
        
        this.name = "No Cartridge";
        this.tvSystem = "NTSC";
        
        this.statuses = [];
        
        this.fileLoaded    = false;
        this.fileValid     = false;
        this.fileSupported = false;
    }
    
    //=======================================================================================//
    
    parseFilename(filename) {
        const countryCodes = /\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/.exec(filename);
        if (countryCodes) {
            if (countryCodes[0].search(/U[^Kn]|1|4|J|[^U]K|PD|FC|HK/) > 0)
                this.tvSystem = "NTSC";
            else if (countryCodes[0].search(/E|A|B|[^F]C|NL|S|SW|FN|G|UK|GR|I|H/) > 0)
                this.tvSystem = "PAL";
            else if (countryCodes[0].search(/F[^C]/) > 0)
                this.tvSystem = "SECAM"; //wtf la France ?
        }
        
        this.name = filename.replace(
            /\.[A-Za-z0-9_]+$/, ""
        ).replace(
            /\s?\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/g, ""
        ).replace(
            /\s?\[(!|a|p|b|t|f|T[+-]|h|o)+\]/g, ""
        ).replace(
            /_+/g, " "
        ).trim();
        
        this.name = this.name && (this.name[0].toUpperCase() + this.name.slice(1));
    }
    
    parseData(data) {
        let header = new DataView(data, 0, 0x10);
        var offset = 0x10;
        
        if (header.getUint32(0) === 0x4E45531A) { //"NES" + MS-DOS end-of-file
            this.statuses.push("iNES format");
            this.fileValid = true;
        } else {
            this.fileValid = false;
            throw new Error("Invalid format");
        }
        
        let flags6 = header.getUint8(6);
        let flags7 = header.getUint8(7);
        
        let mapperNumber = (flags6 >> 4) | (flags7 & 0xF0);
        if (Mapper.supported(mapperNumber)) {
            this.statuses.push(
                `Mapper #${mapperNumber}: ${Mapper.name(mapperNumber)}`
            );
            this.fileSupported = true;
        } else {
            this.statuses.push(
                `Unsupported mapper (#${mapperNumber}: ${Mapper.name(mapperNumber)})`
            );
            this.fileSupported = false;
        }
        this.cartridge = new Mapper(mapperNumber);
        
        if (flags6 & 0x8) {
            this.cartridge.horiMirroring = false;
            this.cartridge.vertMirroring = false;
            this.statuses.push("4-screens scrolling");
        } else if (flags6 & 0x1) {
            this.cartridge.horiMirroring = false;
            this.cartridge.vertMirroring = true;
            this.statuses.push("Horizontal scrolling");
        } else {
            this.cartridge.horiMirroring = true;
            this.cartridge.vertMirroring = false;
            this.statuses.push("Vertical scrolling");
        }
        
        if (flags6 & 0x2) {
            this.cartridge.battery = true;
            this.statuses.push("Battery-backed SRAM");
        }
        
        if (flags6 & 0x4) {
            this.cartridge.PRGRAM.set(new Uint8Array(data, offset, 0x200), 0x1000);
            offset += 0x200;
        }
        
        let numPRGBank = header.getUint8(4);
        let numCHRBank = header.getUint8(5) * 2;
        var skipped = 0;
        
        this.statuses.push(`${numPRGBank*16}kb of PRG-ROM`);
        for (var curBank = 0; curBank < numPRGBank; curBank++) {
            if (offset + 0x4000 > data.byteLength) {
                skipped += 4;
                continue;
            }
            this.cartridge.PRGROM.push(new Uint8Array(data, offset, 0x4000));
            offset += 0x4000;
        }
        
        this.statuses.push(`${numCHRBank*4}kb of CHR-ROM`);
        for (curBank = 0; curBank < numCHRBank; curBank++) {
            if (offset + 0x1000 > data.byteLength) {
                skipped++;
                continue;
            }
            this.cartridge.CHRROM.push(new Uint8Array(data, offset, 0x1000));
            offset += 0x1000;
        }
        
        if (skipped > 0) this.statuses.push(`${skipped*4}kb of data skipped...`);
        
        if (offset < data.byteLength) {
            this.name = String.fromCharCode.apply(null, new Uint8Array(data, offset)).replace(/\0/g, '');
        }
        
        this.cartridge.init();
    }
    
    //=======================================================================================//
    
    load(file) {
        this.reset();
        
        return new Promise(
            (resolve, reject) => {
                if (file) {
                    this.parseFilename(file.name);
                    
                    if (file.size) {
                        const reader = new FileReader;
                        reader.onabort = () => reject(new DOMException);
                        reader.onerror = () => reject(reader.error);
                        reader.onload = () => resolve(reader.result);
                        
                        reader.readAsArrayBuffer(file);
                    } else {
                        reject(new Error("File is empty"));
                    }
                } else {
                    reject(new DOMException);
                }
            }
        ).then(
            (data) => {
                this.fileLoaded = true;
                this.parseData(data);
                return this;
            }
        ).catch(
            (error) => {
                if (error instanceof DOMException)
                    this.statuses.push("Loading aborted");
                else if (error.message)
                    this.statuses.push(error.message);
                else
                    this.statuses.push("Loading failed");
                
                this.cartridge = new Cartridge;
                return this;
            }
        );
    }
    unload() {
        this.reset();
        
        return Promise.resolve(this);
    }
}

export default CartConnector;
