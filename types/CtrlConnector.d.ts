export class CtrlConnector {
    controllers: {
        1: Controller;
        2: Controller;
    };
    /**
     * Insert a *Controller-derived* class into given port.
     * @param {Controller} controller
     * @param {ControllerPort} port
     */
    insert(controller: Controller, port?: ControllerPort): void;
    /**
     * Remove the controller from the given port.
     * @param {ControllerPort} port
     */
    remove(port: ControllerPort): void;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 5-bit value (*OR*ed with the higher 3-bits of address bus)
     */
    read(address: number): number;
    /**
     * @param {number} address 16-bit value
     * @param {number} data 3-bit value
     */
    write(address: number, data: number): void;
}
export default CtrlConnector;
export type ControllerPort = 1 | 2;
import { Controller } from "./Controllers/index.js";
//# sourceMappingURL=CtrlConnector.d.ts.map