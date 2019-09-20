describe("NES", function() {
    subject(() => new Nestled.NES);
    
    def('powerOn',  () => { $subject.powerOn(); });
    def('powerOff', () => { $subject.powerOff(); });
    
    its('isPowered', () => is.expected.to.be.false);
    its('isRunning', () => is.expected.to.be.false);
    its('isPaused',  () => is.expected.to.be.false);
    
    describe(".pressPower()", function() {
        def('action', () => $subject.pressPower());
        
        context("when it is off", function() {
            beforeEach(function() { $powerOff; });
            afterEach(function() { $subject.stopEmulation(); });
            
            it("returns -true-", function() {
                expect($action).to.be.true; });
            
            it("becomes powered on", function() {
                expect(() => $action).to.change($subject, 'isPowered');
                expect($subject.isPowered).to.be.true;
            });
            it("turns on the Front LED", function() {
                expect(() => $action).to.change($subject, 'frontLEDState');
                expect($subject.frontLEDState).to.equal('on');
            });
            
            it("turns on the CPU", function() {
                expect(() => $action).to.change($subject.cpu, 'isPowered');
                expect($subject.cpu.isPowered).to.be.true;
            });
            it("turns on the PPU", function() {
                expect(() => $action).to.change($subject.ppu, 'isPowered');
                expect($subject.ppu.isPowered).to.be.true;
            });
            
            it("triggers 'onpower' event with itself as argument", function(done) {
                $subject.onpower = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isPowered', true);
                    done();
                };
                $action;
            });
        });
        context("when it is on", function() {
            beforeEach(function() { $powerOn; });
            afterEach(function() { $subject.stopEmulation(); });
            
            it("returns -false-", function() {
                expect($action).to.be.false; });
            
            it("becomes powered off", function() {
                expect(() => $action).to.change($subject, 'isPowered');
                expect($subject.isPowered).to.be.false;
            });
            it("turns off the Front LED", function() {
                expect(() => $action).to.change($subject, 'frontLEDState');
                expect($subject.frontLEDState).to.equal('off');
            });
            
            it("turns off the CPU", function() {
                expect(() => $action).to.change($subject.cpu, 'isPowered');
                expect($subject.cpu.isPowered).to.be.false;
            });
            it("turns off the PPU", function() {
                expect(() => $action).to.change($subject.ppu, 'isPowered');
                expect($subject.ppu.isPowered).to.be.false;
            });
            
            it("triggers 'onpower' event with itself as argument", function(done) {
                $subject.onpower = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isPowered', false);
                    done();
                };
                $action;
            });
        });
    });
    
    describe(".pressReset()", function() {
        def('action', () => $subject.pressReset());
        
        it("calls cpu.doReset()", function(done) {
            $subject.cpu.doReset = () => done();
            $action;
        });
        it("calls ppu.doReset()", function(done) {
            $subject.ppu.doReset = () => done();
            $action;
        });
        
        it("triggers 'onreset' event with itself as argument", function(done) {
            $subject.onreset = (e) => {
                expect(e.target).to.equal($subject);
                done();
            };
            $action;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $powerOff; });
        afterEach(function() { $subject.stopEmulation(); });
        
        def('action', () => $subject.powerOn());
        
        it("sets #isPowered to -true-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
        
        it("triggers 'onpower' event with itself as argument", function(done) {
            $subject.onpower = (e) => {
                expect(e.target).to.equal($subject).and.have.property('isPowered', true);
                done();
            };
            $action;
        });
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $powerOn; });
        afterEach(function() { $subject.stopEmulation(); });
        
        def('action', () => $subject.powerOff());
        
        it("sets #isPowered to -false-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
        
        it("triggers 'onpower' event with itself as argument", function(done) {
            $subject.onpower = (e) => {
                expect(e.target).to.equal($subject).and.have.property('isPowered', false);
                done();
            };
            $action;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".startEmulation()", function() {
        def('action', () => $subject.startEmulation());
        afterEach(function() { $subject.stopEmulation(); });
        
        context("if already running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 1234; });
            
            it("does not change #isRunning", function() {
                expect(() => $action).not.to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.true;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = -1; });
            
            it("sets #isRunning to -true-", function() {
                expect(() => $action).to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.true;
            });
            
            it("triggers 'onemulation' event with itself as argument", function(done) {
                $subject.onemulation = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isRunning', true);
                    done();
                };
                $action;
                $subject.onemulation = undefined; //Otherwise 'onemulation' is called also in the afterEach
                                                  //hook, then calls done() and screws up Mocha...
            });
        });
    });
    
    describe(".stopEmulation()", function() {
        def('action', () => $subject.stopEmulation());
        
        context("if running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 1234; });
            
            it("sets #isRunning to -false-", function() {
                expect(() => $action).to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.false;
            });
            
            it("triggers 'onemulation' event with itself as argument", function(done) {
                $subject.onemulation = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isRunning', false);
                    done();
                };
                $action;
                $subject.onemulation = undefined;
            });
        context("if not running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = -1; });
            
            it("does not change #isRunning", function() {
                expect(() => $action).not.to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.false;
            });
        });
        });
    });
    
    describe(".pauseEmulation()", function() {
        def('action', () => $subject.pauseEmulation());
        
        context("if running and not paused", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 1234; });
            
            it("sets #isPaused to -true-", function() {
                expect(() => $action).to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.true;
            });
            
            it("triggers 'onpause' event with itself as argument", function(done) {
                $subject.onpause = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isPaused', true);
                    done();
                };
                $action;
            });
        });
        context("if already paused", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 0; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.true;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = -1; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
        });
    });
    
    describe(".resumeEmulation()", function() {
        def('action', () => $subject.resumeEmulation());
        afterEach(function() { $subject.stopEmulation(); });
        
        context("if running and not paused", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 1234; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
        });
        context("if running and paused", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = 0; });
            
            it("sets #isPaused to -false-", function() {
                expect(() => $action).to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
            
            it("triggers 'onpause' event with itself as argument", function(done) {
                $subject.onpause = (e) => {
                    expect(e.target).to.equal($subject).and.have.property('isPaused', false);
                    done();
                };
                $action;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.mainLoop.runningLoop = -1; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe("#frontLEDState", function() {
        context("when the NES is on", function() {
            beforeEach(function() { $powerOn; });
            afterEach(function() { $subject.stopEmulation(); });
            
            its('frontLEDState', () => is.expected.to.equal("on"));
        });
        context("when the NES is off", function() {
            beforeEach(function() { $powerOff; });
            afterEach(function() { $subject.stopEmulation(); });
            
            its('frontLEDState', () => is.expected.to.equal("off"));
        });
    });
    
    //-------------------------------------------------------------------------------//
    //- NESFile Fixture
    def('validNESFile', () => Object.assign(new Nestled.NESFile, {
        name: "Valid", isValid: true,
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, 0,0,0,0,0,0,0,0,0,0,0,0]).buffer
    }));
    def('invalidNESFile', () => Object.assign(new Nestled.NESFile, {
        name: "Invalid", isValid: false
    }));
    //-------------------------------------------------------------------------------//
    //- Cartridge Fixture
    def('cartridge', () => new Nestled.Cartridge($validNESFile));
    //-------------------------------------------------------------------------------//
    
    describe(".insertCartridge(argument)", function() {
        def('action', () => $subject.insertCartridge($argument));
        
        context("when argument is an invalid -NESFile- object", function() {
            def('argument', () => $invalidNESFile);
            
            it("sets #cartridge to -NoCartridge-", function() {
                expect(() => $action).to.change($subject, 'cartridge');
                expect($subject.cartridge).to.be.an.instanceof(Nestled.NoCartridge);
            });
            it("returns a -NoCartridge-", function() {
                expect($action).to.be.an.instanceof(Nestled.NoCartridge);
            });
        });
        
        context("when argument is a valid -NESFile- object", function() {
            def('argument', () => $validNESFile);
            
            it("sets #cartridge", function() {
                expect(() => $action).to.change($subject, 'cartridge');
            });
            it("returns #cartridge", function() {
                expect($action).to.equal($subject.cartridge);
            });
            it("triggers 'oninsertcartridge' event with itself as argument", function(done) {
                $subject.oninsertcartridge = (e) => {
                    expect(e.target).to.equal($subject);
                    done();
                };
                $action;
            });
        });
        
        context("when argument is a -Cartridge- object", function() {
            def('argument', () => $cartridge);
            
            it("sets #cartridge", function() {
                expect(() => $action).to.change($subject, 'cartridge');
                expect($subject.cartridge).to.equal($cartridge);
            });
            it("returns #cartridge", function() {
                expect($action).to.equal($subject.cartridge);
            });
            it("triggers 'oninsertcartridge' event with itself as argument", function(done) {
                $subject.oninsertcartridge = (e) => {
                    expect(e.target).to.equal($subject);
                    done();
                };
                $action;
            });
        });
    });
    
    describe(".removeCartridge()", function() {
        beforeEach(function() {
            $subject.cartridge = $cartridge;
        });
        def('action', () => $subject.removeCartridge());
        
        it("sets #cartridge to -NoCartridge-", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceof(Nestled.NoCartridge);
        });
        it("returns the removed cartridge", function() {
            expect($action).to.equal($cartridge);
        });
        it("triggers 'onremovecartridge' event with itself as argument", function(done) {
            $subject.onremovecartridge = (e) => {
                expect(e.target).to.equal($subject);
                done();
            };
            $action;
        });
    });
});
