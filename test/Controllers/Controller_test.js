import Controller from "../../src/Controllers/Controller";

describe("Controller", function() {
    subject(() => new Controller);
    
    its('type', () => is.expected.to.be.a('string').and.be.empty);
    
    its('states',   () => is.expected.to.be.an('array').and.have.lengthOf(8));
    its('strobing', () => is.expected.to.be.false);
    
    its('empty',   () => is.expected.to.be.true);
    its('present', () => is.expected.to.be.false);
    
    describe(".read()", function() {
        /*global $halfStrobe, $fullStrobe */
        def('halfStrobe', () => {
            $subject.write(1);
        });
        def('fullStrobe', () => {
            $subject.write(1);
            $subject.write(0);
        });
        
        context("if strobe is not done correctly", function() {
            it("keeps reading -0-", function() {
                $halfStrobe;
                expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(0);
            });
        });
        context("if strobe is done correctly", function() {
            it("keeps reading -0-", function() {
                $fullStrobe;
                expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(0);
            });
            it("reads -1- after the 8th time", function() {
                $fullStrobe;
                
                for (var i=1; i<=8; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
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
        beforeEach(function() {
            $subject.states = [1,0,1,0,1,0,1,0];
        });
        
        it("loads button states into #data", function() {
            expect(() => $action).to.change($subject, 'data');
            expect($subject.data).to.have.ordered.members([1,0,1,0,1,0,1,0]);
        });
    });
});
