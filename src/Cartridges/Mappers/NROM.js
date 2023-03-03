import Cartridge from '../Cartridge.js';

/**
 * The generic designation *NROM* refers to the Nintendo cartridge boards *NES-NROM-128*
 * and *NES-NROM-256*.
 * (The suffixes 128/256 refer to kilobits by Nintendo's own designation; not kilobytes.)
 * 
 * The iNES format assigns *Mapper 0* to NROM.
 */
export class NROM extends Cartridge {
    //== CIRAM A10 (Pin22) ==============================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {0|1}
     */
    ciramA10(address) {
        if (address < 0x400)
            return 0;
        else if (this.vertMirroring)
            return (address & 0x400) ? 1 : 0;
        else if (address < 0x800)
            return 0;
        else if (this.horiMirroring)
            return (address & 0x800) ? 1 : 0;
        else
            return 0;
    }
}
export default NROM;
