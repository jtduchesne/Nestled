import CtrlConnector, { Controller } from "../../src/Controllers";

describe("CtrlConnector", function() {
    subject(() => new CtrlConnector);
    
    its('controllers', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    
    it("has 2 empty controllers on creation", function() {
        expect($subject.controllers[0]).to.be.an.instanceOf(Controller).and.have.property('empty', true);
        expect($subject.controllers[1]).to.be.an.instanceOf(Controller).and.have.property('empty', true);
    });
});
