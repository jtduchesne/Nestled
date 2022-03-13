import { NES, NESFile, Cartridge, NoCartridge } from "../src/main.js";

describe("NES", function() {
    subject(() => new NES);
    
    /*global $powerOn, $powerOff */
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
        });
    });
    
    describe(".pressReset()", function() {
        def('action', () => $subject.pressReset());
        
        it("calls cpu.reset()", function(done) {
            $subject.cpu.reset = () => done();
            $action;
        });
        it("calls ppu.reset()", function(done) {
            $subject.ppu.reset = () => done();
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
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $powerOn; });
        afterEach(function() { $subject.stopEmulation(); });
        
        def('action', () => $subject.powerOff());
        
        it("sets #isPowered to -false-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".startEmulation()", function() {
        def('action', () => $subject.startEmulation());
        afterEach(function() { $subject.stopEmulation(); });
        
        context("if already running", function() {
            beforeEach(function() { $subject.engine.runningLoop = 1234; });
            
            it("does not change #isRunning", function() {
                expect(() => $action).not.to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.true;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.engine.runningLoop = -1; });
            
            it("sets #isRunning to -true-", function() {
                expect(() => $action).to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.true;
            });
        });
    });
    
    describe(".stopEmulation()", function() {
        def('action', () => $subject.stopEmulation());
        
        context("if running", function() {
            beforeEach(function() { $subject.engine.runningLoop = 1234; });
            
            it("sets #isRunning to -false-", function() {
                expect(() => $action).to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.false;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.engine.runningLoop = -1; });
        
            it("does not change #isRunning", function() {
                expect(() => $action).not.to.change($subject, 'isRunning');
                expect($subject.isRunning).to.be.false;
            });
        });
    });
    
    describe(".pauseEmulation()", function() {
        def('action', () => $subject.pauseEmulation());
        
        context("if running and not paused", function() {
            beforeEach(function() { $subject.engine.runningLoop = 1234; });
            
            it("sets #isPaused to -true-", function() {
                expect(() => $action).to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.true;
            });
        });
        context("if already paused", function() {
            beforeEach(function() { $subject.engine.runningLoop = 0; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.true;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.engine.runningLoop = -1; });
            
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
            beforeEach(function() { $subject.engine.runningLoop = 1234; });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
        });
        context("if running and paused", function() {
            beforeEach(function() { $subject.engine.runningLoop = 0; });
            
            it("sets #isPaused to -false-", function() {
                expect(() => $action).to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
        });
        context("if not running", function() {
            beforeEach(function() { $subject.engine.runningLoop = -1; });
            
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

    /*global $validNESFile, $invalidNESFile */
    def('validNESFile', () => Object.assign(new NESFile, {
        name: "Valid", isValid: true,
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, 0,0,0,0,0,0,0,0,0,0,0,0]).buffer
    }));
    def('invalidNESFile', () => Object.assign(new NESFile, {
        name: "Invalid", isValid: false
    }));
    //-------------------------------------------------------------------------------//
    //- Cartridge Fixture

    /*global $cartridge */
    def('cartridge', () => new Cartridge($validNESFile));
    //-------------------------------------------------------------------------------//
    
    describe(".insertCartridge(argument)", function() {
        def('action', () => $subject.insertCartridge($argument));
        
        context("when argument is an invalid -NESFile- object", function() {
            def('argument', () => $invalidNESFile);
            
            it("sets #cartridge to -NoCartridge-", function() {
                expect(() => $action).to.change($subject, 'cartridge');
                expect($subject.cartridge).to.be.an.instanceof(NoCartridge);
            });
            it("returns a -NoCartridge-", function() {
                expect($action).to.be.an.instanceof(NoCartridge);
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
        });
    });
    
    describe(".removeCartridge()", function() {
        beforeEach(function() {
            $subject.cartridge = $cartridge;
        });
        def('action', () => $subject.removeCartridge());
        
        it("sets #cartridge to -NoCartridge-", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceof(NoCartridge);
        });
        it("returns the removed cartridge", function() {
            expect($action).to.equal($cartridge);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".insertController(controller)", function() {
        def('action', () => $subject.insertController($joypad));
        def('joypad', () => 'Joypad'); /*global $joypad */
        
        context("if no controllers are connected", function() {
            it("sets #controllers[0]", function() {
                expect(() => $action).to.change($subject.controllers, '0');
                expect($subject.controllers[0]).to.equal($joypad);
            });
            it("returns the inserted controller", function() {
                expect($action).to.equal($joypad);
            });
        });
        context("if there is already 1 controller connected", function() {
            beforeEach(function() {
                $subject.insertController('Other Joypad');
            });
            
            it("sets #controllers[1]", function() {
                expect(() => $action).to.change($subject.controllers, '1');
                expect($subject.controllers[1]).to.equal($joypad);
            });
            it("returns the inserted controller", function() {
                expect($action).to.equal($joypad);
            });
        });
        context("if there are already 2 controllers connected", function() {
            beforeEach(function() {
                $subject.insertController('Other Joypad');
                $subject.insertController('Zapper');
            });
            
            it("does not change #controllers[]", function() {
                expect(() => $action).not.to.change($subject.controllers, '0');
                expect(() => $action).not.to.change($subject.controllers, '1');
            });
            it("returns -undefined-", function() {
                expect($action).to.be.undefined;
            });
        });
        context("if the given controller is already connected", function() {
            beforeEach(function() {
                $subject.insertController($joypad);
            });
            
            it("does not change #controllers[]", function() {
                expect(() => $action).not.to.change($subject.controllers, '0');
                expect(() => $action).not.to.change($subject.controllers, '1');
            });
            it("returns the given controller", function() {
                expect($action).to.equal($joypad);
            });
        });
    });
    
    describe(".removeController(joypad)", function() {
        def('action', () => $subject.removeController($joypad));
        def('joypad', () => 'Joypad');
        
        context("if the given controller is not connected", function() {
            beforeEach(function() {
                $subject.insertController('Other Joypad');
            });
            
            it("does not change #controllers[]", function() {
                expect(() => $action).not.to.change($subject.controllers, '0');
                expect(() => $action).not.to.change($subject.controllers, '1');
            });
            it("returns -undefined-", function() {
                expect($action).to.be.undefined;
            });
        });
        context("if the given joypad is in #controllers[0]t", function() {
            beforeEach(function() {
                $subject.insertController($joypad);
                $subject.insertController('Zapper');
            });
            
            it("removes it from #controllers[0]", function() {
                expect(() => $action).to.change($subject.controllers, '0');
                expect($subject.controllers[0]).not.to.equal($joypad);
            });
            it("does not change #controllers[1]", function() {
                expect(() => $action).not.to.change($subject.controllers, '1');
                expect($subject.controllers[1]).to.equal('Zapper');
            });
            it("returns the removed joypad", function() {
                expect($action).to.equal($joypad);
            });
        });
        context("if the given joypad is connected second", function() {
            beforeEach(function() {
                $subject.insertController('Other Joypad');
                $subject.insertController($joypad);
            });
            
            it("does not change #controllers[0]", function() {
                expect(() => $action).not.to.change($subject.controllers, '0');
                expect($subject.controllers[0]).not.to.equal('Joypad');
            });
            it("removes it from #controllers[1]", function() {
                expect(() => $action).to.change($subject.controllers, '1');
                expect($subject.controllers[1]).not.to.equal($joypad);
            });
            it("returns the removed joypad", function() {
                expect($action).to.equal($joypad);
            });
            it("does not move the other joypad", function() {
                expect(() => $action).not.to.change($subject.controllers, 'length');
                expect($subject.controllers).to.have.a.lengthOf(2);
            });
        });
    });
});
