import { Cartridge, Mapper, Metadata } from './Cartridges/index.js';
import {
    Header,
    INESHeader,
    UNIFHeader,
} from './Cartridges/FileFormats/index.js';

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
                const signature = (new DataView(data)).getUint32(0);
                
                if (signature === 0x4E45531A) // "NES[EOF]"
                    this.file = new INESHeader(data);
                else if (signature === 0x554E4946) // "UNIF"
                    this.file = new UNIFHeader(data);
                else
                    throw new Error("Invalid format");
                
                if (!this.file.valid)
                    throw new Error(`Unsupported format (${this.file.format})`);
                
                this.metadata.load(this.file);
                
                this.cartridge = Mapper.create(this.file.mapperNumber);
                this.cartridge.load(this.file, data);
                
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
