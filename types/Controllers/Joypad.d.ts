export class Joypad extends Controller {
    constructor();
    buttonHandlers: ((pressed: any) => void)[];
    getButtonHandler(name: any): (pressed: any) => void;
}
export default Joypad;
import Controller from "./Controller.js";
//# sourceMappingURL=Joypad.d.ts.map