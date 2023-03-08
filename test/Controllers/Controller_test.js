import Controller from "../../src/Controllers/Controller";

describe("Controller", function() {
    subject(() => new Controller);
    
    its('type', () => is.expected.to.be.a('string').and.equal("Empty"));
    
    its('empty',   () => is.expected.to.be.true);
    its('present', () => is.expected.to.be.false);
    
    describe(".read()", function() {
        it("keeps reading -0-", function() {
            expect($subject.read()).to.equal(0);
            expect($subject.read()).to.equal(0);
        });
    });
    
    describe(".write(data)", function() {
        /*global $data */
        def('action', () => $subject.write($data));
        
        context("if data is 0", function() {
            def('data', () => 0);
            beforeEach(function() { $subject.strobing = true; });
            
            it("clears #strobing", function() {
                expect(() => $action).to.change($subject, 'strobing');
                expect($subject.strobing).to.be.false;
            });
        });
        context("if data is 1", function() {
            def('data', () => 1);
            beforeEach(function() { $subject.strobing = false; });
            
            it("sets #strobing", function() {
                expect(() => $action).to.change($subject, 'strobing');
                expect($subject.strobing).to.be.true;
            });
        });
    });
    
    describe(".strobe()", function() {
        def('action', () => $subject.strobe());
        
        it("exists", function() {
            expect(() => $action).not.to.throw;
        });
    });
});
