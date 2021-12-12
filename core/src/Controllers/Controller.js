export class Controller {
    constructor(type) {
        this.type = type || "";
        
        this.strobing = false;
        this.states = new Array(8).fill(0);
        this.strobe();
    }
    
    get empty()   { return  !this.type; }
    get present() { return !!this.type; }
    
    strobe() {
        this.data = [...this.states];
    }
    
    //== Input/Output ===============================================//
    read() {
        if (this.strobing) this.strobe();
        
        let data = this.data.shift();
        return data !== undefined ? data : 1;
    }
    write(data) {
        this.strobing = !!(data & 0x01);
        if (this.strobing) this.strobe();
    }
}

export default Controller;
