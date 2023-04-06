/** @typedef {import('./Header.js').Header} Header */

export const PRGROMBANKSIZE = 0x4000;
export const CHRROMBANKSIZE = 0x1000;

export class Cartridge {
    constructor() {
        this.PRGRAM = new Uint8Array(PRGROMBANKSIZE);
        this.CHRRAM = new Uint8Array(CHRROMBANKSIZE);
        
        /** @type {Uint8Array[]} */
        this.PRGROM = [];
        /** @protected */
        this.firstPRGBank = this.PRGRAM;
        /** @protected */
        this.lastPRGBank  = this.PRGRAM;
        this.PRGBank = [this.firstPRGBank, this.lastPRGBank];
        
        /** @type {Uint8Array[]} */
        this.CHRROM = [];
        /** @protected */
        this.firstCHRBank  = this.CHRRAM;
        /** @protected */
        this.secondCHRBank = this.CHRRAM;
        this.CHRBank = [this.firstCHRBank, this.secondCHRBank];
        
        this.horiMirroring = false;
        this.vertMirroring = false;
    }
    
    //===================================================================================//
    /**
     * Load cartridge data from a file, and set circuitry (mirroring) from header data.
     * @param {Header} header Already parsed header information
     * @param {ArrayBuffer} data The whole file, including the header data
     */
    load(header, data) {
        let offset = header.byteLength;
        
        this.horiMirroring = header.horiMirroring;
        this.vertMirroring = header.vertMirroring;
        
        if (header.trainer) {
            this.PRGRAM.set(new Uint8Array(data, offset, 0x200), 0x1000);
            offset += 0x200;
        }
        
        const numPRGBank = header.PRGROMByteLength / PRGROMBANKSIZE;
        if (numPRGBank > 0) {
            for (let bank = 0; bank < numPRGBank; bank++) {
                this.PRGROM.push(new Uint8Array(data, offset, PRGROMBANKSIZE));
                offset += PRGROMBANKSIZE;
            }
            this.firstPRGBank = this.PRGROM[0];
            this.lastPRGBank  = this.PRGROM[this.PRGROM.length-1];
        }
        this.PRGBank = [this.firstPRGBank, this.lastPRGBank];
        
        const numCHRBank = header.CHRROMByteLength / CHRROMBANKSIZE;
        if (numCHRBank > 0) {
            for (let bank = 0; bank < numCHRBank; bank++) {
                this.CHRROM.push(new Uint8Array(data, offset, CHRROMBANKSIZE));
                offset += CHRROMBANKSIZE;
            }
            this.firstCHRBank  = this.CHRROM[0];
            this.secondCHRBank = this.CHRROM[1];
        }
        this.CHRBank = [this.firstCHRBank, this.secondCHRBank];
    }
    
    //== Memory access from CPU =========================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit value
     */
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
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     */
    cpuWrite(address, data) {
        if (address >= 0x6000)   address -= 0x6000;
        while (address > 0x1FFF) address -= 0x2000;
        this.PRGRAM[address] = data;
    }
    
    //== Memory access from PPU =========================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit value
     */
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
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     */
    ppuWrite(address, data) {
        while (address > 0x0FFF) address -= 0x1000;
        this.CHRRAM[address] = data;
    }
    
    //== CIRAM A10 (Pin22) ==============================================================//
    /**
     * This is the 1k bank selection input for PPU's internal RAM, derived from the
     * address bus.
     * 
     * This is used to control how the name tables are banked; in other words, this
     * selects nametable mirroring.
     * @param {number} address 16-bit address
     * @returns {0|1}
     */
    ciramA10(address) { /* eslint-disable-line no-unused-vars */
        //Not connected by default
        return 0;
    }
    
    //== CIRAM /CE (Pin57) ==============================================================//
    /**
     * This is the video memory selection input, derived from the address bus.
     * 
     * When set, this tells the PPU to use its own internal 2kb of RAM instead of
     * cartridge's CHR-ROM.
     * @param {number} address 16-bit address
     * @returns {boolean}
     */
    ciramEnabled(address) {
        //Connected to PPU /A13 (0x2000) by default
        if (address < 0x2000)
            return false;
        else if (address < 0x4000)
            return true;
        else
            return (address & 0x2000) > 0;
    }
}

export default Cartridge;
