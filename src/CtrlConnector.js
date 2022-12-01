import { Controller } from "./Controllers/index.js";

export class CtrlConnector {
    constructor() {
        this.controllers = [new Controller, new Controller];
    }
    
    insert(controller) {
        if (this.controllers.indexOf(controller) > -1)
            return controller;
        else if (this.controllers[0].empty)
            this.controllers[0] = controller;
        else if (this.controllers[1].empty)
            this.controllers[1] = controller;
        else
            return;
        
        return controller;
    }
    remove(controller) {
        let index = this.controllers.indexOf(controller);
        if (index > -1) {
            this.controllers[index] = new Controller;
            
            return controller;
        }
    }
}

export default CtrlConnector;
