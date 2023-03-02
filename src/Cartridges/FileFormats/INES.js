import Header from '../Header.js';
import Mapper from '../Mapper.js';

const PRGROMBANKSIZE = 0x4000;
const CHRROMBANKSIZE = 0x2000;
const PRGRAMBANKSIZE = 0x2000;

const LENGTH = 0x10;

export class INESHeader extends Header {
    get byteLength() {
        return LENGTH;
    }
    
    parse(data) {
        if (super.parse(data)) {
            const header = new DataView(data, 0, LENGTH);
            if (header.getUint32(0) === 0x4E45531A) {
                this.valid = true;
                
                this.format = "Archaic iNES";
                
                const byte4 = header.getUint8(4);
                const byte5 = header.getUint8(5);
                
                this.PRGROMByteLength = getROMByteLength(PRGROMBANKSIZE, byte4);
                this.CHRROMByteLength = getROMByteLength(CHRROMBANKSIZE, byte5);
                
                const byte6 = header.getUint8(6);
                
                this.mapperNumber = byte6 >> 4;
                
                if (byte6 & 0x8) {
                    this.horiMirroring = false;
                    this.vertMirroring = false;
                } else if (byte6 & 0x1) {
                    this.horiMirroring = false;
                    this.vertMirroring = true;
                } else {
                    this.horiMirroring = true;
                    this.vertMirroring = false;
                }
                
                this.battery = !!(byte6 & 0x2);
                this.trainer = !!(byte6 & 0x4);
                
                const byte7 = header.getUint8(7);
                
                if (!(byte7 & 0x04)) {
                    this.mapperNumber += byte7 & 0xF0;
                    this.consoleType = byte7 & 0x03;
                    
                    if (byte7 & 0x08) {
                        const byte9 = header.getUint8(9);
                        
                        const PRGSize = getROMByteLength(PRGROMBANKSIZE, byte4, byte9 & 0x0F);
                        const CHRSize = getROMByteLength(CHRROMBANKSIZE, byte5, byte9 >> 4);
                        if (PRGSize + CHRSize <= data.byteLength) {
                            this.parseV2(header);
                        }
                    } else {
                        if (header.getUint32(12) === 0) {
                            this.parseV1(header);
                        }
                    }
                }
                
                this.mapperName = Mapper.name(this.mapperNumber);
                this.supported  = Mapper.supported(this.mapperNumber);
            }
        }
        return this.loaded;
    }
    
    parseV1(data) {
        this.format = "iNES";
        
        this.PRGRAMByteLength = (data.getUint8(8) || 1) * PRGRAMBANKSIZE;
    }
    
    parseV2(data) {
        this.format = "NES 2.0";
        
        this.mapperNumber += (data.getUint8(8) & 0x0F)*256;
        
        const byte9 = data.getUint8(9);
        this.PRGROMByteLength = getROMByteLength(PRGROMBANKSIZE, data.getUint8(4), byte9 & 0x0F);
        this.CHRROMByteLength = getROMByteLength(CHRROMBANKSIZE, data.getUint8(5), byte9 >> 4);
        
        const byte10 = data.getUint8(10);
        this.PRGRAMByteLength   = getRAMByteLength(byte10 & 0x0F);
        this.PRGNVRAMByteLength = getRAMByteLength(byte10 >> 4);
        
        const byte11 = data.getUint8(11);
        this.CHRRAMByteLength   = getRAMByteLength(byte11 & 0x0F);
        this.CHRNVRAMByteLength = getRAMByteLength(byte11 >> 4);
    }
}

/**
 * Automatically calculate PRG/CHR ROM byte length according to header format.
 * (Supports exponent-multiplier notation of *NES 2.0*)
 * @param {number} bankSize The size of each bank, will multiply the computed value to get the length in bytes
 * @param {number} lsb 8-bit value read from `byte 4` (PRG) or `byte 5` (CHR)
 * @param {number} msb 4-bit value read from `byte 9` if *NES 2.0* (must be `0` or omitted otherwise)
 * @returns {number} Computed length in bytes
 */
function getROMByteLength(bankSize, lsb, msb = 0) {
    if (msb < 0x0F) {
        return (lsb + msb*256) * bankSize;
    } else {
        const multiplier = (lsb & 0x3)*2 + 1;
        const exponent = lsb >> 2;
        return 2^exponent * multiplier;
    }
}

/**
 * Automatically calculate PRG/CHR [NV]RAM byte length from *NES 2.0* header values.
 * @param {number} shiftCount Will shift `64` by this number of bits
 * @returns {number} Computed length in bytes
 */
function getRAMByteLength(shiftCount) {
    return shiftCount ? 0x40 << shiftCount : 0;
}

export default INESHeader;
