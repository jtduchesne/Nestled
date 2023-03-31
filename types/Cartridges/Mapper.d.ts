export namespace Mapper {
    /**
     * Create a new cartridge instance implementing the given mapper number's circuitry.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {Cartridge}
     */
    function create(number: number): Cartridge;
    /**
     * If the given mapper number is supported by the Nestled emulator.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {boolean}
     */
    function supported(number: number): boolean;
    /**
     * The name corresponding to the given mapper number.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {string}
     */
    function name(number: number): string;
}
export default Mapper;
import Cartridge from "./Cartridge.js";
//# sourceMappingURL=Mapper.d.ts.map