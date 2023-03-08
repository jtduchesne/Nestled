/**
 * @typedef {import('../Joypad.js').ButtonName} ButtonName
 * @typedef {import('../Joypad.js').ButtonHandler} ButtonHandler
 * @typedef {keyof KEYS} KeyCode
 */

import Joypad from '../Joypad.js';

const KEYS = Object.freeze({
    8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt', 19: 'Pause',
    27: 'Escape', 32: 'Space', 33: 'Page-up', 34: 'Page-down', 35: 'End', 36: 'Home',
    37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down',
    45: 'Insert', 46: 'Delete',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I',
    74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R',
    83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
    96:  'Numpad-0',  97: 'Numpad-1',  98: 'Numpad-2',  99: 'Numpad-3', 100: 'Numpad-4',
    101: 'Numpad-5', 102: 'Numpad-6', 103: 'Numpad-7', 104: 'Numpad-8', 105: 'Numpad-9',
    106: 'Multiply', 107: 'Add', 109: 'Subtract', 110: 'Decimal-point', 111: 'Divide',
    112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4',  116: 'F5',  117: 'F6',
    118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
    186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`',
    219: '[', 220: '\\', 221: ']', 222: '\'',
});

export class Keyboard extends Joypad {
    /**
     * @param {Record<ButtonName,KeyCode>=} opts
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
    
    //=======================================================================================//
    /**
     * Assign one or more keyboard keys to Joypad buttons.
     * @param {Record<ButtonName,KeyCode>} keys
     */
    assignKeys(keys) {
        Object.entries(keys).forEach(
            /** @param {[any, KeyCode]} value */
            ([button, key]) => this.assignKey(button, key)
        );
    }
    
    /**
     * Assign a keyboard key to one of the Joypad button.
     * @param {ButtonName} buttonName
     * @param {KeyCode} keyCode
     * @private
     */
    assignKey(buttonName, keyCode) {
        const handler = this.getButtonHandler(buttonName);
        
        this.assignedKeys[buttonName] = KEYS[keyCode];
        
        Object.entries(this.keyHandlers).forEach(
            ([key, value]) => { if (value === handler) delete this.keyHandlers[key]; }
        );
        this.keyHandlers[keyCode] = handler;
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
     * @param {ButtonName} name
     */
    getAssignedKey(name) {
        return this.assignedKeys[name] || "";
    }
}

export default Keyboard;
