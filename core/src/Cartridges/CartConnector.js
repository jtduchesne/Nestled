import Cartridge from './Cartridge';
import Mapper, * as Mappers from "./Mappers";

export class CartConnector {
    constructor() {
        this.name = "No Cartridge";
        this.cartridge = new Cartridge;
        
        this.reset();
    }
    
    get empty()   { return this.cartridge.empty; }
    get present() { return this.cartridge.present; }
    
    reset() {
        this.isLoaded = false;
        this.isValid = false;
        this.statuses = [];
        
        this.tvSystem = "NTSC";
        
        this.cartridge.reset();
    }
    
    parseData(data) {
        let header = new DataView(data, 0, 0x10);
        var offset = 0x10;
        
        if (header.getUint32(0) === 0x4E45531A) { //"NES" + MS-DOS end-of-file
            this.statuses.push("iNES format");
        } else {
            throw new Error("Invalid format");
        }
        
        let flags6 = header.getUint8(6);
        let flags7 = header.getUint8(7);
        
        let mapperNumber = (flags6 >> 4) | (flags7 & 0xF0);
        if (Mappers.supported(mapperNumber)) {
            this.statuses.push(
                `Mapper #${mapperNumber}: ${Mappers.name(mapperNumber)}`
            );
            this.isValid = true;
        } else {
            this.statuses.push(
                `Unsupported mapper (#${mapperNumber}: ${Mappers.name(mapperNumber)})`
            );
            this.isValid = false;
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
    parseFilename(filename) {
        const countryCodes = /\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/.exec(filename);
        if (countryCodes) {
            if (countryCodes[0].search(/A|B|[^F]C|NL|E|S|SW|FN|G|UK|GR|I|H/) > 0)
                this.tvSystem = "PAL";
            else if (countryCodes[0].search(/F[^C]/) > 0)
                this.tvSystem = "SECAM"; //wtf la France ?
        }
        
        this.name = filename.replace(
            /\.[A-Za-z0-9_]+$/, ""
        ).replace(
            /\s?\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)|\s?\[(!|a|p|b|t|f|T[+-]|h|o)+\]/g, ""
        ).replace(
            /_+/g, " "
        ).trim();
        
        this.name = this.name && (this.name[0].toUpperCase() + this.name.slice(1));
    }
    
    load(file) {
        this.parseFilename(file.name);
        
        return new Promise(
            (resolve, reject) => {
                if (file.size) {
                    const reader = new FileReader;
                    reader.onabort = () => reject(new DOMException);
                    reader.onerror = () => reject(reader.error);
                    reader.onload = () => resolve(reader.result);
                    
                    reader.readAsArrayBuffer(file);
                } else {
                    reject(new Error("File is empty"));
                }
            }
        ).then(
            (data) => {
                this.parseData(data);
                this.isLoaded = true;
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
