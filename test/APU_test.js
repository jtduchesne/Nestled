describe("APU", function() {
    subject(() => new Nestled.APU($cpu));
    def('cpu', () => new Nestled.CPU);
    
    its('cpu', () => is.expected.to.equal($cpu));
    
    its('cycle',       () => is.expected.to.equal(0));
    its('counterMode', () => is.expected.to.equal(0));
    its('irqDisabled', () => is.expected.to.be.false);
    its('irq',         () => is.expected.to.be.false);
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        
        it("initializes #audio", function() {
            expect(() => $action).to.change($subject, 'audio');
            expect($subject.audio).to.be.an.instanceOf(Nestled.AudioBuffer);
        });
        it("sets #cyclesPerSample", function() {
            expect(() => $action).to.change($subject, 'cyclesPerSample');
            expect($subject.cyclesPerSample).to.be.greaterThan(0);
        });
    });
    describe(".powerOff()", function() {
        def('action', () => $subject.powerOff());
        beforeEach(function() { $subject.powerOn(); });
        
        it("stops the audio", function(done) {
            $subject.audio = { stop: () => done() };
            $action;
        });
        it("destroys #audio", function() {
            expect(() => $action).to.change($subject, 'audio');
            expect($subject.audio).to.be.null;
        });
    });
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        beforeEach(function() {
            $subject.cycle = 1234;
            $subject.counterMode = 1;
            $subject.irqDisabled = true;
            $subject.irq = true;
        });
        
        it("does not reset #cycle immediately", function() {
            expect(() => $action).not.to.change($subject, 'cycle');
            expect($subject.cycle).to.equal(1234);
        });
        it("sets #resetDelay", function() {
            expect(() => $action).to.change($subject, 'resetDelay');
            expect($subject.resetDelay).to.be.greaterThan(0);
        });
        
        it("resets #counterMode to -0-", function() {
            expect(() => $action).to.change($subject, 'counterMode');
            expect($subject.counterMode).to.equal(0);
        });
        it("resets #irqDisabled", function() {
            expect(() => $action).to.change($subject, 'irqDisabled');
            expect($subject.irqDisabled).to.be.false;
        });
        it("resets #irq", function() {
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.false;
        });
    });
    
    describe(".doIRQ()", function() {
        def('action', () => $subject.doIRQ());
        
        context("if #irqDisabled is set", function() {
            beforeEach(function() { $subject.irqDisabled = true; });
            
            it("sets #irq", function() {
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.true;
            });
        });
        context("if #irqDisabled is clear", function() {
            beforeEach(function() {
                $cpu.doIRQ = () => null;
                $subject.irqDisabled = false;
            });
            
            it("sets #irq", function() {
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.true;
            });
            
            it("calls cpu.doIRQ()", function(done) {
                $cpu.doIRQ = () => done();
                $action;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe("#status = value", function() {
        def('action', () => { $subject.status = $value; });
        
        context("when value = null", function() {
            def('value', () => null);
            
        });
    });
    
    describe("#counter = value", function() {
        def('action', () => { $subject.counter = $value; });
        
        context("when value = null", function() {
            def('value', () => null);
            
            it("resets #counterMode to -0-", function() {
                $subject.counterMode = 1;
                expect(() => $action).to.change($subject, 'counterMode');
                expect($subject.counterMode).to.equal(0);
            });
            it("resets #irqDisabled", function() {
                $subject.irqDisabled = true;
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.false;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".readRegister(address)", function() {
        def('action', () => $subject.readRegister($address));
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
            
            context("if #irq is set", function() {
                beforeEach(function() { $subject.irq = true; });
            
                it("returns 0x40", function() {
                    expect($action).to.equal(0x40);
                });
                it("resets #irq", function() {
                    expect(() => $action).to.change($subject, 'irq');
                    expect($subject.irq).to.be.false;
                });
            });
        });
    });
    
    describe(".writeRegister(address, data)", function() {
        def('action', () => $subject.writeRegister($address, $data));
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
        });
        context("when address is 0x4017", function() {
            def('address', () => 0x4017);
            
            it("does not reset #cycle immediately", function() {
                $subject.cycle = 1234;
                expect(() => $action).not.to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(1234);
            });
            it("sets #resetDelay to -4- if on an even cycle", function() {
                $subject.cycle = 10;
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.equal(4);
            });
            it("sets #resetDelay to -3- if on an odd cycle", function() {
                $subject.cycle = 11;
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.equal(3);
            });
        
            context("when data = 0x00", function() {
                def('data', () => 0x00);
            
                it("sets #counterMode to -0-", function() {
                    $subject.counterMode = 1;
                    expect(() => $action).to.change($subject, 'counterMode');
                    expect($subject.counterMode).to.equal(0);
                });
                it("clears #irqDisabled", function() {
                    $subject.irqDisabled = true;
                    expect(() => $action).to.change($subject, 'irqDisabled');
                    expect($subject.irqDisabled).to.be.false;
                });
                it("does not change #irq", function() {
                    $subject.irq = true;
                    expect(() => $action).not.to.change($subject, 'irq');
                    expect($subject.irq).to.be.true;
                });
            });
            context("when data = 0xC0", function() {
                def('data', () => 0xC0);
            
                it("sets #counterMode to -1-", function() {
                    $subject.counterMode = 0;
                    expect(() => $action).to.change($subject, 'counterMode');
                    expect($subject.counterMode).to.equal(1);
                });
                it("sets #irqDisabled", function() {
                    $subject.irqDisabled = false;
                    expect(() => $action).to.change($subject, 'irqDisabled');
                    expect($subject.irqDisabled).to.be.true;
                });
                it("clears #irq", function() {
                    $subject.irq = true;
                    expect(() => $action).to.change($subject, 'irq');
                    expect($subject.irq).to.be.false;
                });
            
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".doCycles(count)", function() {
        def('action', () => $subject.doCycles($count));
        def('count', () => 6);
        
        it("increases #cycle by [count]/2", function() {
            expect(() => $action).to.increase($subject, 'cycle').by($count/2);
        });
        it("calls .doCycle() [count]/2 times", function(done) {
            var count = 0;
            $subject.doCycle = () => { if (++count === $count/2) done(); };
            $action;
        });
        
        context("if #resetDelay is set", function() {
            beforeEach(function() { $subject.cycle = 1234; });
            
            it("resets #cycle after delay", function() {
                $subject.resetDelay = $count/2;
                expect(() => $action).to.decrease($subject, 'cycle');
                expect($subject.cycle).to.equal(0 +1);
            });
            it("continues counting after delay", function() {
                $subject.resetDelay = $count/2 - 2;
                expect(() => $action).to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(2 +1);
            });
            
            it("still call .doCycle() [count]/2 times", function(done) {
                var count = 0;
                $subject.doCycle = () => { if (++count === $count/2) done(); };
                $action;
            });
        });
    });
    
    describe(".doCycle()", function() {
        def('action', () => $subject.doCycle());
        
        it("increases #cycle by 1", function() {
            expect(() => $action).to.increase($subject, 'cycle').by(1);
        });
        
        context("when #counterMode = 0", function() {
            beforeEach(function() { $subject.counterMode = 0; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
                it("calls .doIRQ()", function(done) {
                    $subject.doIRQ = () => done();
                    $action;
                });
                it("resets cycle", function() {
                    $cpu.doIRQ = () => null;
                    expect(() => $action).to.change($subject, 'cycle');
                    expect($subject.cycle).to.equal(0);
                });
            });
        });
        
        context("when #counterMode = 1", function() {
            beforeEach(function() { $subject.counterMode = 1; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("does not reset cycle", function() {
                    $cpu.doIRQ = () => null;
                    expect(() => $action).to.increase($subject, 'cycle');
                    expect($subject.cycle).to.equal(29829);
                });
            });
            context("on the 37281th cycle", function() {
                beforeEach(function() { $subject.cycle = 37281; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
                it("resets cycle", function() {
                    expect(() => $action).to.change($subject, 'cycle');
                    expect($subject.cycle).to.equal(0);
                });
            });
        });
        
        context("when it reaches #cyclesPerSample", function() {
            beforeEach(function() {
                $subject.cyclesPerSample = 40.5;
                $subject.cycle = 40;
            });
            
            it("writes a sample to #audio", function(done) {
                $subject.audio = new class { set sample(v) { done(); } };
                $action;
            });
            it("decreases #cycle by #cyclesPerSample", function() {
                expect(() => $action).to.decrease($subject, 'cycle');
                expect($subject.cycle).to.equal(0.5);
            });
        });
    });
    
    describe(".writeSample()", function() {
        def('action', () => $subject.writeSample($value));
        def('value', () => 0.1234);
        
        it("writes a sample to #audio", function(done) {
            $subject.audio = new class {
                set sample(value) {
                    expect(value).to.equal($value);
                    done();
                }
            };
            $action;
        });
    });
});
