export class Controller {
    constructor() {
        this.a      = 0;
        this.b      = 0;
        this.select = 0;
        this.start  = 0;
        this.up     = 0;
        this.down   = 0;
        this.left   = 0;
        this.right  = 0;
        
        this.empty  = 1;
        
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
        this.data = [this.a, this.b, this.select, this.start,
                     this.up, this.down, this.left, this.right];
    }
}
export default Controller;

export class NoController extends Controller {
    read()      { return 0; }
    write(data) { return; } // eslint-disable-line no-unused-vars
}
