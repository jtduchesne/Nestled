export class CartConnector {
    reset(): void;
    file: Header | INESHeader | UNIFHeader;
    metadata: Metadata;
    cartridge: Cartridge | Mapper;
    load(file: File): Promise<CartConnector>;
    unload(): Promise<CartConnector>;
}
export default CartConnector;
import { Header } from "./FileFormats.js";
import { INESHeader } from "./FileFormats.js";
import { UNIFHeader } from "./FileFormats.js";
import Metadata from "./Metadata.js";
import Cartridge from "./Cartridge.js";
import Mapper from "./Mapper.js";
//# sourceMappingURL=CartConnector.d.ts.map