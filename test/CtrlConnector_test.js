import CtrlConnector from "../src/CtrlConnector";

import { Controller } from "../src/Controllers";

describe("CtrlConnector", function() {
    subject(() => new CtrlConnector);
    
    its('controllers', () => is.expected.to.be.an('object').that.has.keys(1, 2));
    
    it("has 2 empty controllers on creation", function() {
        expect($subject.controllers[1]).to.be.an.instanceOf(Controller).and.have.property('empty', true);
        expect($subject.controllers[2]).to.be.an.instanceOf(Controller).and.have.property('empty', true);
    });
});
