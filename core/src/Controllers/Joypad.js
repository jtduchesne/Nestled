import Controller from "./Controller";

const BUTTONS = Object.freeze({
    a: 0, b: 1, select: 2, start: 3, up: 4, down: 5, left: 6, right: 7
});

export class Joypad extends Controller {
    constructor() {
        super("Joypad");
        
        this.buttonHandlers = this.states.map((v, i) => (
            (pressed) => { this.states[i] = pressed ? 1 : 0; }
        ));
    }
    
    getButtonHandler(name) {
        let index = BUTTONS[name.toLowerCase()];
        if (index != null)
            return this.buttonHandlers[index];
        else
            throw new Error(`'${name}' is not a valid button name`);
    }
}
export default Joypad;
