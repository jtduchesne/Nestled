/**
 * @typedef {import('../Joypad.js').ButtonName} ButtonName
 * @typedef {import('../Joypad.js').ButtonHandler} ButtonHandler
 * @typedef {keyof KEYS} KeyName
 */

import Joypad from '../Joypad.js';
import { devices } from "../Controller.js";

const KEYS = Object.freeze({
    Backspace: 8, Tab: 9, Enter: 13, Shift: 16, Ctrl: 17, Alt: 18, Pause: 19,
    Escape: 27, Space: 32, 'Page-up': 33, 'Page-down': 34, End: 35, Home: 36,
    Left: 37, Up: 38, Right: 39, Down: 40, Insert: 45, Delete: 46,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73,
    J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82,
    S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
    'Numpad-0': 96,  'Numpad-1': 97,  'Numpad-2': 98,  'Numpad-3': 99,  'Numpad-4': 100,
    'Numpad-5': 101, 'Numpad-6': 102, 'Numpad-7': 103, 'Numpad-8': 104, 'Numpad-9': 105,
    Multiply: 106, Add: 107, Subtract: 109, 'Decimal-point': 110, Divide: 111,
    F1: 112, F2: 113, F3: 114, F4:  115,  F5: 116,  F6: 117,
    F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
    ';': 186,  '=': 187, ',': 188,  '-': 189, '.': 190, '/': 191, '`': 192,
    '[': 219, '\\': 220, ']': 221, '\'': 222,
});

export class Keyboard extends Joypad {
    /**
     * @param {Record<ButtonName,KeyName>=} opts
     */
    constructor(opts) {
        super();
        
        /** @type {Record<string,ButtonHandler>} @private */
        this.keyHandlers = {};
        
        /** @type {Record<string,string>} @private */
        this.assignedKeys = {};
        
        if (opts) this.assignKeys(opts);
        
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => this.pressKey(e, true));
            window.addEventListener('keyup',   (e) => this.pressKey(e, false));
        }
    }
    
    /** @type {devices} @readonly */
    get device() { return devices.KEYBOARD; }
    
    //=======================================================================================//
    /**
     * Assign one or more keyboard keys to Joypad buttons.
     * @param {Record<ButtonName,KeyName>} keys
     */
    assignKeys(keys) {
        Object.entries(keys).forEach(
            /** @param {[any, KeyName]} value */
            ([button, key]) => this.assignKey(button, key)
        );
    }
    
    /**
     * Assign a keyboard key to one of the Joypad button.
     * @param {ButtonName} buttonName
     * @param {KeyName} keyName
     * @private
     */
    assignKey(buttonName, keyName) {
        const handler = this.getButtonHandler(buttonName);
        
        Object.entries(this.keyHandlers).forEach(
            ([keyCode, value]) => { if (value === handler) delete this.keyHandlers[keyCode]; }
        );
        
        if (keyName in KEYS) {
            this.assignedKeys[buttonName] = keyName;
            this.keyHandlers[KEYS[keyName]] = handler;
        }
    }
    
    /**
     * @param {KeyboardEvent} event
     * @param {boolean} keyDown
     * @private
     */
    pressKey(event, keyDown) {
        const key = event.keyCode || event.which;
        const handler = this.keyHandlers[key];
        if (typeof handler === 'function') {
            handler(keyDown);
            event.preventDefault();
        }
    }
    
    //== Buttons ============================================================================//
    /**
     * Get the name of the assigned key for the given button name.
     * @param {ButtonName} buttonName
     */
    getAssignedKey(buttonName) {
        return this.assignedKeys[buttonName] || "";
    }
}

export default Keyboard;
