export class CartConnector {
    reset(): void;
    cartridge: Cartridge | Mapper;
    name: string;
    tvSystem: string;
    statuses: string[];
    fileLoaded: boolean;
    fileValid: boolean;
    fileSupported: boolean;
    parseFilename(filename: string): void;
    parseData(data: ArrayBufferLike): void;
    load(file: File): Promise<CartConnector>;
    unload(): Promise<CartConnector>;
}
export default CartConnector;
import Cartridge from "./Cartridge.js";
import Mapper from "./Mapper.js";
//# sourceMappingURL=CartConnector.d.ts.map