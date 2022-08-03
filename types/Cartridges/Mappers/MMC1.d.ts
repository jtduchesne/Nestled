export class MMC1 extends Cartridge {
    mirroring: number;
    PRGBankMode: number;
    CHRBankMode: number;
    buffer: number;
    index: number;
    firstPRGBank: number;
    lastPRGBank: number;
    set control(arg: number);
    set CHR0(arg: number);
    set CHR1(arg: number);
    set PRG(arg: number);
    write(address: number, data: number): void;
}
export default MMC1;
import Cartridge from "../Cartridge.js";
//# sourceMappingURL=MMC1.d.ts.map