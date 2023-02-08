export class Metadata {
    name: string;
    format: string;
    consoleType: string;
    tvSystem: string;
    mapper: string;
    PRGROM: string;
    CHRROM: string;
    scrolling: string;
    SRAM: string;
    PRGRAM: string;
    CHRRAM: string;
    misc: string;
    warnings: string[];
    errors: string[];
    get supported(): boolean;
    get valid(): boolean;
    warn(message: string): void;
    error(message: string): void;
    parseFilename(filename: string): void;
    load(header: Header): void;
    serialize(): {
        name: string;
        format: string;
        consoleType: string;
        tvSystem: string;
        mapper: string;
        PRGROM: string;
        CHRROM: string;
        scrolling: string;
        SRAM: string;
        PRGRAM: string;
        CHRRAM: string;
        misc: string;
    };
}
export default Metadata;
import Header from "./FileFormats/Header.js";
//# sourceMappingURL=Metadata.d.ts.map