describe.only("Controller", function() {
    subject(() => new Nestled.Controller);
    
    its('a',      () => is.expected.to.equal(0));
    its('b',      () => is.expected.to.equal(0));
    its('select', () => is.expected.to.equal(0));
    its('start',  () => is.expected.to.equal(0));
    its('up',     () => is.expected.to.equal(0));
    its('down',   () => is.expected.to.equal(0));
    its('left',   () => is.expected.to.equal(0));
    its('right',  () => is.expected.to.equal(0));
    
    its('empty',  () => is.expected.to.equal(1));
    
    its('strobing', () => is.expected.to.be.false);
    
    describe(".read()", function() {
        def('halfStrobe', () => {
            $subject.write(1)
        });
        def('fullStrobe', () => {
            $subject.write(1);
            $subject.write(0);
        });
        
        context("if strobe is not done correctly", function() {
            it("keeps reading the state of the first button (A)", function() {
                $subject.a = 1;
                $subject.b = 0;
                $halfStrobe
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
            });
        });
        context("if strobe is done correctly", function() {
            it("reads #a the 1st time", function() {
                $subject.a = 1;
                $fullStrobe
                
                expect($subject.read()).to.equal(1);
            });
            it("reads #b the 2nd time", function() {
                $subject.b = 1;
                $fullStrobe
                
                for (var i=1; i<2; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #select the 3rd time", function() {
                $subject.select = 1;
                $fullStrobe
                
                for (var i=1; i<3; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #start the 4th time", function() {
                $subject.start = 1;
                $fullStrobe
                
                for (var i=1; i<4; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #up the 5th time", function() {
                $subject.up = 1;
                $fullStrobe
                
                for (var i=1; i<5; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #down the 6th time", function() {
                $subject.down = 1;
                $fullStrobe
                
                for (var i=1; i<6; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #left the 7th time", function() {
                $subject.left = 1;
                $fullStrobe
                
                for (var i=1; i<7; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads #right the 8th time", function() {
                $subject.right = 1;
                $fullStrobe
                
                for (var i=1; i<8; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
            it("reads -1- after the 8th time", function() {
                $fullStrobe
                
                for (var i=1; i<=8; i++)
                    expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
            });
        });
    });
    
    describe(".write(data)", function() {
        def('action', () => $subject.write($data));
        beforeEach(function() {
            $subject.a = 1;
            $subject.up = 1;
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
            $subject.a = 1;
            $subject.select = 1;
            $subject.up = 1;
            $subject.left = 1;
        });
        
        it("loads button states into #data", function() {
            expect(() => $action).to.change($subject, 'data');
            expect($subject.data).to.have.ordered.members([1,0,1,0,1,0,1,0]);
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
