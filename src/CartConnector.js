import { Cartridge, Header, Mapper, Metadata } from './Cartridges/index.js';
import {
    INESHeader,
    UNIFHeader,
} from './Cartridges/FileFormats/index.js';

export class CartConnector {
    constructor() {
        /** Raw information parsed from the file. */
        this.file = new Header;
        /** Interpreted information about the file, in human-readable format. */
        this.metadata = new Metadata;
        /**
         * The cartridge itself, as seen by the NES hardware, including I/O functions,
         * memory mapping and nametable mirroring logic.
         */
        this.cartridge = new Cartridge;
    }
    
    /** @private */
    reset() {
        this.file = new Header;
        this.metadata = new Metadata;
        this.cartridge = new Cartridge;
    }
    
    //=======================================================================================//
    
    /** @readonly */
    get name() { return this.metadata.name;}
    
    /** @readonly */
    get supported() { return this.metadata.supported; }
    /** @readonly */
    get valid() { return this.metadata.valid; }
    
    //=======================================================================================//
    
    /**
     * Load a file, parse its filename and header for `metadata`, and fill `cartridge`
     * with its content.
     * @param {File} file
     */
    load(file) {
        this.reset();
        
        return new Promise(
            /**
             * @param {(value: ArrayBuffer) => void} resolve
             * @param {(reason: Error) => void} reject
             */
            (resolve, reject) => {
                if (file) {
                    this.metadata.parseFilename(file.name);
                    
                    if (file.size) {
                        const reader = new FileReader;
                        reader.onabort = () => reject(new DOMException);
                        reader.onerror = () => reject(reader.error || new Error);
                        reader.onload = () => {
                            if (reader.result && typeof reader.result === 'object')
                                resolve(reader.result);
                            else
                                reject(new Error);
                        };
                        
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
            /** @param {Error} error */
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
    /**
     * Unload current file, also resetting `metadata` and `cartridge`.
     */
    unload() {
        this.reset();
        
        return Promise.resolve(this);
    }
}

export default CartConnector;
