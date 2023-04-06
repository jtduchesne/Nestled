export class CartConnector {
    /** Raw information parsed from the file. */
    file: Header;
    /** Interpreted information about the file, in human-readable format. */
    metadata: Metadata;
    /**
     * The cartridge itself, as seen by the NES hardware, including I/O functions,
     * memory mapping and nametable mirroring logic.
     */
    cartridge: Cartridge;
    /** @private */
    private reset;
    /** @readonly */
    readonly get name(): string;
    /** @readonly */
    readonly get supported(): boolean;
    /** @readonly */
    readonly get valid(): boolean;
    /**
     * Load a file, parse its filename and header for `metadata`, and fill `cartridge`
     * with its content.
     * @param {File} file
     */
    load(file: File): Promise<CartConnector>;
    /**
     * Unload current file, also resetting `metadata` and `cartridge`.
     */
    unload(): Promise<CartConnector>;
}
export default CartConnector;
import { Header } from "./Cartridges/index.js";
import { Metadata } from "./Cartridges/index.js";
import { Cartridge } from "./Cartridges/index.js";
//# sourceMappingURL=CartConnector.d.ts.map