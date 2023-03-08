/**
 * types
 */
export type types = string;
/** @enum {string} types */
export const types: Readonly<{
    EMPTY: "Empty";
    JOYPAD: "Joypad";
    ZAPPER: "Zapper";
}>;
/**
 * devices
 */
export type devices = string;
/** @enum {string} devices */
export const devices: Readonly<{
    NONE: "None";
    KEYBOARD: "Keyboard";
    MOUSE: "Mouse";
}>;
export class Controller {
    /** @protected */
    protected strobing: boolean;
    /** @type {types} @readonly */
    readonly get type(): string;
    /** @type {devices} @readonly */
    readonly get device(): string;
    get empty(): boolean;
    get present(): boolean;
    /** @returns {number} 5-bit value */
    read(): number;
    /** @param {0|1} data 1-bit value */
    write(data: 0 | 1): void;
    /** @protected */
    protected strobe(): void;
}
export default Controller;
//# sourceMappingURL=Controller.d.ts.map