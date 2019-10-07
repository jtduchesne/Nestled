describe("Controller", function() {
    subject(() => new Nestled.Controller);
    
    function press(buttonName) {
        $subject.getButtonHandler(buttonName)(true);
    }
    
    its('a',      () => is.expected.to.equal(false));
    its('b',      () => is.expected.to.equal(false));
    its('select', () => is.expected.to.equal(false));
    its('start',  () => is.expected.to.equal(false));
    its('up',     () => is.expected.to.equal(false));
    its('down',   () => is.expected.to.equal(false));
    its('left',   () => is.expected.to.equal(false));
    its('right',  () => is.expected.to.equal(false));
    
    its('empty',  () => is.expected.to.equal(1));
    
    its('strobing', () => is.expected.to.be.false);
    
    describe(".read()", function() {
        def('halfStrobe', () => {
            $subject.write(1);
        });
        def('fullStrobe', () => {
            $subject.write(1);
            $subject.write(0);
        });
        
        context("if strobe is not done correctly", function() {
            it("keeps reading the state of the first button (A)", function() {
                press('a');
                $halfStrobe;
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
            });
        });
        context("if strobe is done correctly", function() {
            it("reads #a the 1st time", function() {
                press('a');
                $fullStrobe;
                
                expect($subject.read()).to.equal(1);
            });
            it("reads #b the 2nd time", function() {
                press('b');
                $fullStrobe;
                
                for (var i=1; i<2; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #select the 3rd time", function() {
                press('select');
                $fullStrobe;
                
                for (var i=1; i<3; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #start the 4th time", function() {
                press('start');
                $fullStrobe;
                
                for (var i=1; i<4; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #up the 5th time", function() {
                press('up');
                $fullStrobe;
                
                for (var i=1; i<5; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #down the 6th time", function() {
                press('down');
                $fullStrobe;
                
                for (var i=1; i<6; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #left the 7th time", function() {
                press('left');
                $fullStrobe;
                
                for (var i=1; i<7; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #right the 8th time", function() {
                press('right');
                $fullStrobe;
                
                for (var i=1; i<8; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
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
        def('action', () => $subject.write($data));
        beforeEach(function() {
            press('a');
            press('up');
        });
        
        context("if data is 0", function() {
            def('data', () => 0);
            beforeEach(function() { $subject.strobing = true; });
            
            it("does not load button states into #data", function() {
                expect(() => $action).not.to.change($subject, 'data');
                expect($subject.data).to.have.ordered.members([0,0,0,0,0,0,0,0]);
            });
            it("clears #strobing", function() {
                expect(() => $action).to.change($subject, 'strobing');
                expect($subject.strobing).to.be.false;
            });
        });
        context("if data is 1", function() {
            def('data', () => 1);
            beforeEach(function() { $subject.strobing = false; });
            
            it("loads button states into #data", function() {
                expect(() => $action).to.change($subject, 'data');
                expect($subject.data).to.have.ordered.members([1,0,0,0,1,0,0,0]);
            });
            it("sets #strobing", function() {
                expect(() => $action).to.change($subject, 'strobing');
                expect($subject.strobing).to.be.true;
            });
        });
    });
    
    describe(".strobe()", function() {
        def('action', () => $subject.strobe());
        beforeEach(function() {
            press('a');
            press('select');
            press('up');
            press('left');
        });
        
        it("loads button states into #data", function() {
            expect(() => $action).to.change($subject, 'data');
            expect($subject.data).to.have.ordered.members([1,0,1,0,1,0,1,0]);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".getButtonHandler(name)", function() {
        def('action', () => $subject.getButtonHandler($name));
        
        context("if a name is valid", function() {
            def('name', () => 'a');
            
            it("returns the corresponding handler", function() {
                expect($action).to.equal($subject.buttonHandlers[0]);
            });
        });
        context("if a name is not valid", function() {
            def('name', () => 'invalid');
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw($name);
            });
        });
    });
});

describe("NoController", function() {
    subject(() => new Nestled.NoController);
    
    describe(".read()", function() {
        def('action', () => $subject.read());
        
        it("returns -0-", function() {
            expect($action).to.equal(0);
        });
    });
    
    describe(".write(data)", function() {
        def('action', () => $subject.write(1));
        
        it("does nothing", function() {
            expect(() => $action).not.to.change($subject, 'strobe');
        });
    });
});
