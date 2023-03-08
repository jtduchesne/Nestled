/** @enum {string} types */
export const types = Object.freeze({
    EMPTY:  "Empty",
    JOYPAD: "Joypad",
    ZAPPER: "Zapper",
});
/** @enum {string} devices */
export const devices = Object.freeze({
    NONE:  "None",
    KEYBOARD: "Keyboard",
    MOUSE: "Mouse",
});

export class Controller {
    constructor() {
        /** @protected */
        this.strobing = false;
    }
    
    /** @type {types} @readonly */
    get type() { return types.EMPTY; }
    /** @type {devices} @readonly */
    get device() { return devices.NONE; }
    
    get empty()   { return this.type === types.EMPTY; }
    get present() { return this.type !== types.EMPTY; }
    
    //== Input/Output =======================================================================//
    /** @returns {number} 5-bit value */
    read() {
        if (this.strobing) this.strobe();
        
        return 0;
    }
    /** @param {0|1} data 1-bit value */
    write(data) {
        if (this.strobing) this.strobe();
        
        this.strobing = (data !== 0);
    }
    
    /** @protected */
    strobe() {
        return;
    }
}

export default Controller;
