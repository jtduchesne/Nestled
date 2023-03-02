import Cartridge from './Cartridge.js';
import mapperNames, {
    NROM,
    MMC1,
} from './Mappers/index.js';

const constructors = Object.freeze([
    NROM,
    MMC1,
]);

export const Mapper = {
    /**
     * Create a new cartridge instance implementing the given mapper number's circuitry.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {Cartridge}
     */
    create(number) {
        return new (constructors[number] || Cartridge);
    },
    
    /**
     * If the given mapper number is supported by the Nestled emulator.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {boolean}
     */
    supported(number) {
        return typeof constructors[number] !== 'undefined';
    },
    
    /**
     * The name corresponding to the given mapper number.
     * @param {number} number iNES 1.0 mapper number (0-255)
     * @returns {string}
     */
    name(number) {
        return mapperNames[number] || "Unknown";
    },
};

export default Mapper;
