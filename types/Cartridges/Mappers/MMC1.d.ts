/**
 * The *Nintendo MMC1* is a mapper ASIC used in Nintendo's SxROM boards.
 *
 * Most common SxROM boards are assigned to *iNES Mapper 1*.
 */
export class MMC1 extends Cartridge {
    mirroring: number;
    PRGBankMode: number;
    CHRBankMode: number;
    buffer: number;
    index: number;
    /** @protected @param {number} value */
    protected set control(arg: number);
    /** @protected @param {number} value */
    protected set CHR0(arg: number);
    /** @protected @param {number} value */
    protected set CHR1(arg: number);
    /** @protected @param {number} value */
    protected set PRG(arg: number);
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit value
     * @protected
     */
    protected write(address: number, data: number): void;
}
export default MMC1;
import Cartridge from "../Cartridge.js";
//# sourceMappingURL=MMC1.d.ts.map