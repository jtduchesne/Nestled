import mapperNames, {
    NROM,
    MMC1,
} from './Mappers.js';

const constructors = Object.freeze([
    NROM,
    MMC1,
]);

export class Mapper {
    constructor(number) {
        return new (constructors[number] || NROM);
    }
    
    static supported(number) {
        return typeof constructors[number] !== 'undefined';
    }
    static name(number) {
        return mapperNames[number] || "Unknown";
    }
}

export default Mapper;
