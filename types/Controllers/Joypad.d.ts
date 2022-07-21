type ButtonHandler = (pressed: boolean) => void;
type ButtonIdentifier = "a" | "b" | "select" | "start" | "up" | "down" | "left" | "right";

export class Joypad extends Controller {
    constructor();
    buttonHandlers: ButtonHandler[];
    getButtonHandler(name: ButtonIdentifier): ButtonHandler;
}
export default Joypad;
import Controller from "./Controller.js";
//# sourceMappingURL=Joypad.d.ts.map