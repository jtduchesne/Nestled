export class CartConnector {
    reset(): void;
    cartridge: Cartridge | Mapper;
    name: any;
    tvSystem: string;
    statuses: any[];
    fileLoaded: boolean;
    fileValid: boolean;
    fileSupported: boolean;
    parseFilename(filename: any): void;
    parseData(data: any): void;
    load(file: any): Promise<CartConnector>;
    unload(): Promise<CartConnector>;
}
export default CartConnector;
import Cartridge from "./Cartridge.js";
import Mapper from "./Mapper.js";
//# sourceMappingURL=CartConnector.d.ts.map