export class CartConnector {
    /** Raw informations parsed from the file. */
    file: Header;
    /** Interpreted informations about the file, in human-readable format. */
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
     * Loads a file, parses its filename and header for `metadata`, and fills `cartridge`
     * with its content.
     * @param {File} file
     */
    load(file: File): Promise<CartConnector>;
    /**
     * Unloads current file, also resetting `metadata` and `cartridge`.
     */
    unload(): Promise<CartConnector>;
}
export default CartConnector;
import { Header } from "./Cartridges/index.js";
import { Metadata } from "./Cartridges/index.js";
import { Cartridge } from "./Cartridges/index.js";
//# sourceMappingURL=CartConnector.d.ts.map