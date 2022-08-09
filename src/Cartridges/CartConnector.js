import Cartridge from './Cartridge.js';
import Mapper from "./Mapper.js";
import Metadata from './Metadata.js';
import {
    Header,
    INESHeader,
    UNIFHeader,
} from './FileFormats.js';

export class CartConnector {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.file = new Header;
        this.metadata = new Metadata;
        this.cartridge = new Cartridge;
    }
    
    //=======================================================================================//
    
    parseData(data) {
        const signature = (new DataView(data, 0, 4)).getUint32(0);
        
        if (signature === 0x4E45531A) // "NES[EOF]"
            this.file = new INESHeader(data);
        else if (signature === 0x554E4946) // "UNIF"
            this.file = new UNIFHeader(data);
        else
            throw new Error("Invalid format");
        
        if (!this.file.valid)
            throw new Error(`Unsupported format (${this.file.format})`);
        
        this.metadata.load(this.file);
        
        this.cartridge = new Mapper(this.file.mapperNumber);
        
        if (!this.file.horiMirroring && !this.file.vertMirroring) {
            this.cartridge.horiMirroring = false;
            this.cartridge.vertMirroring = false;
        } else if (this.file.vertMirroring) {
            this.cartridge.horiMirroring = false;
            this.cartridge.vertMirroring = true;
        } else {
            this.cartridge.horiMirroring = true;
            this.cartridge.vertMirroring = false;
        }
        
        if (this.file.battery) {
            this.cartridge.battery = true;
        }
        
        let offset = this.file.byteLength;
        
        if (this.file.trainer) {
            this.cartridge.PRGRAM.set(new Uint8Array(data, offset, 0x200), 0x1000);
            offset += 0x200;
        }
        
        const numPRGBank = this.file.PRGROMByteLength / 0x4000;
        const numCHRBank = this.file.CHRROMByteLength / 0x1000;
        
        for (let curBank = 0; curBank < numPRGBank; curBank++) {
            this.cartridge.PRGROM.push(new Uint8Array(data, offset, 0x4000));
            offset += 0x4000;
        }
        
        for (let curBank = 0; curBank < numCHRBank; curBank++) {
            this.cartridge.CHRROM.push(new Uint8Array(data, offset, 0x1000));
            offset += 0x1000;
        }
        
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
                    this.metadata.parseFilename(file.name);
                    
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
                this.parseData(data);
                
                return this;
            }
        ).catch(
            (error) => {
                if (error instanceof DOMException)
                    this.metadata.error("Loading aborted");
                else if (error.message)
                    this.metadata.error(error.message);
                else
                    this.metadata.error("Loading failed");
                
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
