/** @typedef {1|2} ControllerPort */

import { Controller } from "./Controllers/index.js";

export class CtrlConnector {
    constructor() {
        this.controllers = Object.seal({1: new Controller, 2: new Controller});
    }
    
    //=======================================================================================//
    /**
     * Insert a *Controller-derived* class into given port.
     * @param {Controller} controller
     * @param {ControllerPort} port
     */
    insert(controller, port = 1) {
        this.controllers[port] = controller;
    }
    /**
     * Remove the controller from the given port.
     * @param {ControllerPort} port
     */
    remove(port) {
        this.controllers[port] = new Controller;
    }
    
    //=======================================================================================//
    /**
     * @param {number} address 16-bit address
     * @returns {number} 5-bit value (*OR*ed with the higher 3-bits of address bus)
     */
    read(address) {
        if (address === 0x4016)
            return 0x40 + this.controllers[1].read();
        else if (address === 0x4017)
            return 0x40 + this.controllers[2].read();
        else
            return (address >>> 8) & 0xE0;
    }
    /**
     * @param {number} address 16-bit value
     * @param {number} data 3-bit value
     */
    write(address, data) {
        if (data === 0x0 || data === 0x1) {
            this.controllers[1].write(data);
            this.controllers[2].write(data);
            //this.expansion.write(data);
        } else {
            const bit0 = (data & 0x1) ? 1 : 0;
            this.controllers[1].write(bit0);
            this.controllers[2].write(bit0);
            //this.expansion.write(data & 0x7);
        }
    }
}

export default CtrlConnector;
