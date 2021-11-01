const JOYPAD = Object.freeze({
    a: 0, b: 1, select: 2, start: 3, up: 4, down: 5, left: 6, right: 7
});

export class Controller {
    constructor() {
        this.a      = false;
        this.b      = false;
        this.select = false;
        this.start  = false;
        this.up     = false;
        this.down   = false;
        this.left   = false;
        this.right  = false;
        
        this.empty  = 1;
        
        this.buttonHandlers = [(keyDown) => { this.a      = keyDown; },
                               (keyDown) => { this.b      = keyDown; },
                               (keyDown) => { this.select = keyDown; },
                               (keyDown) => { this.start  = keyDown; },
                               (keyDown) => { this.up     = keyDown; },
                               (keyDown) => { this.down   = keyDown; },
                               (keyDown) => { this.left   = keyDown; },
                               (keyDown) => { this.right  = keyDown; }];
        this.data = [];
        
        this.strobing = false;
        this.strobe();
    }
    
    //== Input/Output ===============================================//
    read() {
        if (this.strobing) this.strobe();
        
        let data = this.data;
        if (data.length)
            return data.shift();
        else
            return this.empty;
    }
    write(data) {
        this.strobing = !!(data & 0x01);
        if (this.strobing) this.strobe();
    }
    
    strobe() {
        this.data = [
            this.a, this.b, this.select, this.start,
            this.up, this.down, this.left, this.right
        ].map((v) => { return v ? 1 : 0; });
    }
    
    //== Joypad =====================================================//
    getButtonHandler(name) {
        let index = JOYPAD[name.toLowerCase()];
        if (index != null)
            return this.buttonHandlers[index];
        else
            throw new Error("'"+name+"' is not a valid button name");
    }
}
export default Controller;

export class NoController extends Controller {
    read()      { return 0; }
    write(data) { return; } // eslint-disable-line no-unused-vars
}
