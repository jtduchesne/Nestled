export class Keyboard extends Joypad {
    /**
     * @param {Record<ButtonName,KeyName>=} opts
     */
    constructor(opts?: Record<ButtonName, KeyName> | undefined);
    /** @type {Record<string,ButtonHandler>} @private */
    private keyHandlers;
    /** @type {Record<string,string>} @private */
    private assignedKeys;
    /**
     * Assign one or more keyboard keys to Joypad buttons.
     * @param {Record<ButtonName,KeyName>} keys
     */
    assignKeys(keys: Record<ButtonName, KeyName>): void;
    /**
     * Assign a keyboard key to one of the Joypad button.
     * @param {ButtonName} buttonName
     * @param {KeyName} keyName
     * @private
     */
    private assignKey;
    /**
     * @param {KeyboardEvent} event
     * @param {boolean} keyDown
     * @private
     */
    private pressKey;
    /**
     * Get the name of the assigned key for the given button name.
     * @param {ButtonName} name
     */
    getAssignedKey(name: ButtonName): string;
}
export default Keyboard;
export type ButtonName = import('../Joypad.js').ButtonName;
export type ButtonHandler = import('../Joypad.js').ButtonHandler;
export type KeyName = keyof {
    readonly Backspace: 8;
    readonly Tab: 9;
    readonly Enter: 13;
    readonly Shift: 16;
    readonly Ctrl: 17;
    readonly Alt: 18;
    readonly Pause: 19;
    readonly Escape: 27;
    readonly Space: 32;
    readonly 'Page-up': 33;
    readonly 'Page-down': 34;
    readonly End: 35;
    readonly Home: 36;
    readonly Left: 37;
    readonly Up: 38;
    readonly Right: 39;
    readonly Down: 40;
    readonly Insert: 45;
    readonly Delete: 46;
    readonly 0: 48;
    readonly 1: 49;
    readonly 2: 50;
    readonly 3: 51;
    readonly 4: 52;
    readonly 5: 53;
    readonly 6: 54;
    readonly 7: 55;
    readonly 8: 56;
    readonly 9: 57;
    readonly A: 65;
    readonly B: 66;
    readonly C: 67;
    readonly D: 68;
    readonly E: 69;
    readonly F: 70;
    readonly G: 71;
    readonly H: 72;
    readonly I: 73;
    readonly J: 74;
    readonly K: 75;
    readonly L: 76;
    readonly M: 77;
    readonly N: 78;
    readonly O: 79;
    readonly P: 80;
    readonly Q: 81;
    readonly R: 82;
    readonly S: 83;
    readonly T: 84;
    readonly U: 85;
    readonly V: 86;
    readonly W: 87;
    readonly X: 88;
    readonly Y: 89;
    readonly Z: 90;
    readonly 'Numpad-0': 96;
    readonly 'Numpad-1': 97;
    readonly 'Numpad-2': 98;
    readonly 'Numpad-3': 99;
    readonly 'Numpad-4': 100;
    readonly 'Numpad-5': 101;
    readonly 'Numpad-6': 102;
    readonly 'Numpad-7': 103;
    readonly 'Numpad-8': 104;
    readonly 'Numpad-9': 105;
    readonly Multiply: 106;
    readonly Add: 107;
    readonly Subtract: 109;
    readonly 'Decimal-point': 110;
    readonly Divide: 111;
    readonly F1: 112;
    readonly F2: 113;
    readonly F3: 114;
    readonly F4: 115;
    readonly F5: 116;
    readonly F6: 117;
    readonly F7: 118;
    readonly F8: 119;
    readonly F9: 120;
    readonly F10: 121;
    readonly F11: 122;
    readonly F12: 123;
    readonly ';': 186;
    readonly '=': 187;
    readonly ',': 188;
    readonly '-': 189;
    readonly '.': 190;
    readonly '/': 191;
    readonly '`': 192;
    readonly '[': 219;
    readonly '\\': 220;
    readonly ']': 221;
    readonly '\'': 222;
};
import Joypad from "../Joypad.js";
//# sourceMappingURL=Keyboard.d.ts.map