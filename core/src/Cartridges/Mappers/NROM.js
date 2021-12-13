import Cartridge from '../Cartridge';

export class NROM extends Cartridge {
    
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
