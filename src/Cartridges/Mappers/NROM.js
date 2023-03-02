import Cartridge from '../Cartridge.js';

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
