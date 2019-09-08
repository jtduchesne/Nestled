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
});
