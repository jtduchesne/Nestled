/**
 * @typedef {(pressed:boolean) => void} ButtonHandler
 * @typedef {keyof BUTTONS} ButtonName
 */

import Controller, { types } from "./Controller.js";

const BUTTONS = Object.freeze({
    a: 0, b: 1, select: 2, start: 3, up: 4, down: 5, left: 6, right: 7
});

export class Joypad extends Controller {
    constructor() {
        super();
        
        /** @type {(0|1)[]} @private */
        this.states = Object.seal(new Array(8).fill(0));
        /** @type {(0|1)[]} @private */
        this.data   = [...this.states];
        
        /** @type {ButtonHandler[]} */
        this.buttonHandlers = this.states.map((v, i, a) => (
            (pressed) => { a[i] = pressed ? 1 : 0; }
        ));
    }
    
    /** @type {types} @readonly */
    get type() { return types.JOYPAD; }
    
    //== Input/Output =======================================================================//
    /** @returns {0|1} 1-bit value */
    read() {
        super.read();
        
        const data = this.data.shift();
        return (data !== undefined) ? data : 1;
    }
    
    /** @protected */
    strobe() {
        this.data = [...this.states];
    }
    
    //== Buttons ============================================================================//
    /**
     * Get the handler function for the given button name.
     * @param {ButtonName} name
     * @protected
     */
    getButtonHandler(name) {
        const index = BUTTONS[name];
        if (index != null)
            return this.buttonHandlers[index];
        else
            throw new Error(`'${name}' is not a valid button name`);
    }
    
    /**
     * Manually press/release one Joypad button.
     * @param {ButtonName} name
     * @param {boolean} pressDown
     */
    pressButton(name, pressDown) {
        this.getButtonHandler(name)(pressDown);
    }
}

export default Joypad;
