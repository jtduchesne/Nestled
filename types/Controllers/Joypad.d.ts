export class Joypad extends Controller {
    /** @type {(0|1)[]} @private */
    private states;
    /** @type {(0|1)[]} @private */
    private data;
    /** @type {ButtonHandler[]} */
    buttonHandlers: ButtonHandler[];
    /** @returns {0|1} 1-bit value */
    read(): 0 | 1;
    /**
     * Get the handler function for the given button name.
     * @param {ButtonName} name
     * @protected
     */
    protected getButtonHandler(name: ButtonName): ButtonHandler;
    /**
     * Manually press/release one Joypad button.
     * @param {ButtonName} name
     * @param {boolean} pressDown
     */
    pressButton(name: ButtonName, pressDown: boolean): void;
}
export default Joypad;
export type ButtonHandler = (pressed: boolean) => void;
export type ButtonName = keyof {
    readonly a: 0;
    readonly b: 1;
    readonly select: 2;
    readonly start: 3;
    readonly up: 4;
    readonly down: 5;
    readonly left: 6;
    readonly right: 7;
};
import Controller from "./Controller.js";
//# sourceMappingURL=Joypad.d.ts.map