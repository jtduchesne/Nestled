import Mapper from './Mapper.js';

export class NROM extends Mapper {
    constructor(number, cartridge) {
        super(number || 0, cartridge);
        
        this.CHRBank[1] = this.CHRBank[0];
        
        this.vertMirroring = cartridge.vertMirroring;
        this.horiMirroring = cartridge.horiMirroring;
    }
    
    //== CIRAM A10 (Pin22) ==========================================//
    ciramA10(address) {
        if (this.vertMirroring)
            return address & 0x400; //Connected to PPU A10
        else if (this.horiMirroring)
            return address & 0x800; //Connected to PPU A11
        else
            return 0;
    }
}
export default NROM;
