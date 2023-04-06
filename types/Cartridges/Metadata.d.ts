export class Metadata {
    name: string;
    format: string;
    /** @type {string} */
    consoleType: string;
    /** @type {string} */
    tvSystem: string;
    mapper: string;
    PRGROM: string;
    CHRROM: string;
    scrolling: string;
    SRAM: string;
    PRGRAM: string;
    CHRRAM: string;
    misc: string;
    /** @type {string[]} */
    warnings: string[];
    /** @type {string[]} */
    errors: string[];
    /** @readonly */
    readonly get supported(): boolean;
    /** @readonly */
    readonly get valid(): boolean;
    /**
     * Pushes a new message to the *warnings* list.
     *
     * This automatically tags the game as __*unsupported*__.
     * @param {string} message
     */
    warn(message: string): void;
    /**
     * Pushes a new message to the *errors* list.
     *
     * This automatically tags the game as __*invalid*__.
     * @param {string} message
     */
    error(message: string): void;
    /**
     * Extracts the name, and potentially *tvSystem* infos, from the filename.
     * @param {string} filename
     */
    parseFilename(filename: string): void;
    /**
     * Extract all the information from a parsed file header.
     * @param {Header} header
     */
    load(header: Header): void;
    /**
     * Create a simple object containing only the relevant file information.
     */
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
export type Header = import('./Header.js').Header;
//# sourceMappingURL=Metadata.d.ts.map