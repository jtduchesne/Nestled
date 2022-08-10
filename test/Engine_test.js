import { NES } from "../src";

describe("Engine", function() {
    def('nes', () => new NES); /*global $nes */
    
    subject(() => $nes.engine);
    beforeEach(function() {
        $nes.cpu.powerOn();
        $nes.ppu.powerOn();
    });
    
    its('frame',   () => is.expected.to.equal(0));
    its('dropped', () => is.expected.to.equal(0));
    
    its('fps',         () => is.expected.to.equal(60));
    its('performance', () => is.expected.to.equal(1.0));
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        afterEach(function() { $subject.powerOff(); });
        
        beforeEach(function() {
            $subject.frame = 60;
            $subject.dropped = 1;
            $subject.fps = 59;
            $subject.performance = 0.983;
        });
        
        it("resets #frame", function() {
            expect(() => $action).to.change($subject, 'frame');
            expect($subject.dropped).to.equal(0);
        });
        it("resets #dropped", function() {
            expect(() => $action).to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(0);
        });
        it("resets #fps to 60", function() {
            expect(() => $action).to.change($subject, 'fps');
            expect($subject.fps).to.equal(60);
        });
        it("resets #performance to 1.0", function() {
            expect(() => $action).to.change($subject, 'performance');
            expect($subject.performance).to.equal(1.0);
        });
        
        it("calls .init()", function(done) {
            $subject.init = () => done();
            $action;
        });
        it("calls .coldBoot()", function(done) {
            $subject.coldBoot = () => done();
            $action;
        });
        it("calls .firstLoop()", function(done) {
            $subject.firstLoop = () => done();
            $action;
        });
        
        it("sets #runningLoop", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).not.to.be.null;
        });
    });
    
    describe(".powerOff()", function() {
        def('action', () => $subject.powerOff());
        beforeEach(function() {
            $subject.powerOn();
            
            $subject.frame = 60;
            $subject.dropped = 1;
            $subject.fps = 59;
            $subject.performance = 0.983;
        });
        
        it("does not reset #frame", function() {
            expect(() => $action).not.to.change($subject, 'frame');
            expect($subject.frame).to.equal(60);
        });
        it("does not reset #dropped", function() {
            expect(() => $action).not.to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(1);
        });
        it("does not reset #fps", function() {
            expect(() => $action).not.to.change($subject, 'fps');
            expect($subject.fps).to.equal(59);
        });
        it("does not reset #performance", function() {
            expect(() => $action).not.to.change($subject, 'performance');
            expect($subject.performance).to.equal(0.983);
        });
        
        it("sets #runningLoop to -null-", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.be.null;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".pause()", function() {
        def('action', () => $subject.pause());
        beforeEach(function() {
            $subject.powerOn();
            
            $subject.frame = 60;
            $subject.dropped = 1;
            $subject.fps = 59;
            $subject.performance = 0.983;
        });
        afterEach(function() { $subject.powerOff(); });
        
        it("does not change #frame", function() {
            expect(() => $action).not.to.change($subject, 'frame');
            expect($subject.frame).to.equal(60);
        });
        it("does not change #dropped", function() {
            expect(() => $action).not.to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(1);
        });
        it("does not change #fps", function() {
            expect(() => $action).not.to.change($subject, 'fps');
            expect($subject.fps).to.equal(59);
        });
        it("does not change #performance", function() {
            expect(() => $action).not.to.change($subject, 'performance');
            expect($subject.performance).to.equal(0.983);
        });
        
        it("sets #runningLoop to -null-", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.be.null;
        });
        
        describe("when already paused", function() {
            beforeEach(function() {
                $subject.pause();
            });
            
            it("does not change #frame", function() {
                expect(() => $action).not.to.change($subject, 'frame');
                expect($subject.frame).to.equal(60);
            });
            it("does not change #dropped", function() {
                expect(() => $action).not.to.change($subject, 'dropped');
                expect($subject.dropped).to.equal(1);
            });
            it("does not change #fps", function() {
                expect(() => $action).not.to.change($subject, 'fps');
                expect($subject.fps).to.equal(59);
            });
            it("does not change #performance", function() {
                expect(() => $action).not.to.change($subject, 'performance');
                expect($subject.performance).to.equal(0.983);
            });
            
            it("calls .firstLoop()", function(done) {
                $subject.firstLoop = () => done();
                $action;
            });
            
            it("sets #runningLoop", function() {
                expect(() => $action).to.change($subject, 'runningLoop');
                expect($subject.runningLoop).not.to.be.null;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".coldBoot()", function() {
        beforeEach(function() { $subject.powerOn(); });
        afterEach(function() { $subject.powerOff(); });
        
        def('action', () => $subject.coldBoot());
        
        it("resets cpu#cycleOffset", function() {
            $nes.cpu.cycleOffset = 1234;
            expect(() => $action).to.change($nes.cpu, 'cycleOffset');
            expect($nes.cpu.cycleOffset).to.equal(0);
        });
        it("sets ppu#vblank 3 times", function(done) {
            let count = 0;
            Object.defineProperty($nes.ppu, 'vblank', {
                set: (v) => { if (v) if (++count >= 3) done(); }
            });
            $action;
        });
        it("calls ppu.doVBlank()", function(done) {
            $nes.ppu.doVBlank = () => done();
            $action;
        });
        it("calls ppu.endVBlank()", function(done) {
            $nes.ppu.endVBlank = () => done();
            $action;
        });
    });
});