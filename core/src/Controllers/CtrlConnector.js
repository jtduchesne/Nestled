import { Controller } from "./Controller";

export class CtrlConnector {
    constructor(...controllers) {
        this.controllers = [new Controller, new Controller];
        controllers.forEach((controller) => this.insert(controller));
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
