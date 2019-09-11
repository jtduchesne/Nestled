describe("NES", function() {
    subject(() => new Nestled.NES);
    
    it("has a power button",  function() { expect($subject).to.respondTo('pressPower'); });
    it("has a reset button",  function() { expect($subject).to.respondTo('pressReset'); });
    
    it("can be turned on",  function() { expect($subject).to.respondTo('powerOn'); });
    it("can be turned off", function() { expect($subject).to.respondTo('powerOff'); });
    
    def('powerOn',  () => { $subject.isPowered = true; });
    def('powerOff', () => { $subject.isPowered = false; });
    
    describe(".pressPower()", function() {
        def('action', () => $subject.pressPower());
        
        context("when it is off", function() {
            beforeEach(function() { $powerOff; });
            
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
        });
        context("when it is on", function() {
            beforeEach(function() { $powerOn; });
            
            it("returns -false-", function() {
                expect($action).to.be.false; });
            
            it("becomes powered off", function() {
                expect(() => $action).to.change($subject, 'isPowered');
                expect($subject.isPowered).to.be.false;
            });
            it("turns off the Front LED", function() {
                debugger;
                expect(() => $action).to.change($subject, 'frontLEDState');
                expect($subject.frontLEDState).to.equal('off');
            });
        });
    });
    
    // describe(".pressReset()", function() {
    //     def('action', () => $subject.pressReset());
    //
    //     });
    // });
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $powerOff; });
        
        def('action', () => $subject.powerOn());
        
        it("sets #isPowered to -true-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $powerOn; });
        
        def('action', () => $subject.powerOff());
        
        it("sets #isPowered to -false-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe("#frontLEDState", function() {
        context("when the NES is on", function() {
            beforeEach(function() { $powerOn; });
            
            its('frontLEDState', () => is.expected.to.equal("on"));
        });
        context("when the NES is off", function() {
            beforeEach(function() { $powerOff; });
            
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
