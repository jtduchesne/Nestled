import Cartridge from '../Cartridge.js';

export class NROM extends Cartridge {
    constructor(number) {
        super(number || 0);
    }
    
    //== CIRAM A10 (Pin22) ==========================================//
    ciramA10(address) {
        if (address < 0x400)
            return 0;
        else if (this.vertMirroring)
            return address & 0x400; //Connected to PPU A10
        else if (address < 0x800)
            return 0;
        else if (this.horiMirroring)
            return address & 0x800; //Connected to PPU A11
        else
            return 0;
    }
}
export default NROM;
