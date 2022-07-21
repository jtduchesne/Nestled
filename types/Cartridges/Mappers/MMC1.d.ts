export class MMC1 extends Cartridge {
    mirroring: number;
    PRGBankMode: number;
    CHRBankMode: number;
    buffer: number;
    index: number;
    firstPRGBank: any;
    lastPRGBank: any;
    set control(arg: any);
    set CHR0(arg: any);
    set CHR1(arg: any);
    set PRG(arg: any);
    write(address: any, data: any): void;
}
export default MMC1;
import Cartridge from "../Cartridge.js";
//# sourceMappingURL=MMC1.d.ts.map