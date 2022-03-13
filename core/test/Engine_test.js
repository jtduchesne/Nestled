import { NES } from "../src/main.js";

describe("Engine", function() {
    def('nes', () => new NES()); /*global $nes */
    subject(() => $nes.mainLoop);
    
    its('frame',   () => is.expected.to.equal(0));
    its('dropped', () => is.expected.to.equal(0));
    
    its('delta',         () => is.expected.to.equal(0));
    its('lastFrameTime', () => is.expected.to.equal(0));
    
    describe(".start()", function() {
        def('action', () => $subject.start());
        afterEach(function() { $subject.stop(); });
        
        beforeEach(function() {
            $subject.dropped = 1;
            $subject.fps = 59;
        });
        
        it("resets #dropped", function() {
            expect(() => $action).to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(0);
        });
        it("resets #fps to 60", function() {
            expect(() => $action).to.change($subject, 'fps');
            expect($subject.fps).to.equal(60);
        });
        
        context("when #frame = 0", function() {
            beforeEach(function() { $subject.frame = 0; });
            
            it("calls .initialize()", function(done) {
                $subject.initialize = () => done();
                $action;
            });
            it("calls .loop()", function(done) {
                $subject.loop = () => done();
                $action;
            });
            
            it("sets #runningLoop", function() {
                expect(() => $action).to.change($subject, 'runningLoop');
                expect($subject.runningLoop).to.not.equal(0).and.not.equal(-1);
            });
        });
        context("when #frame > 0", function() {
            beforeEach(function() { $subject.frame = 1; });
            
            it("calls .loop()", function(done) {
                $subject.loop = () => done();
                $action;
            });
            
            it("sets #runningLoop", function() {
                expect(() => $action).to.change($subject, 'runningLoop');
                expect($subject.runningLoop).to.not.equal(0).and.not.equal(-1);
            });
        });
    });
    
    describe(".stop()", function() {
        def('action', () => $subject.stop());
        beforeEach(function() {
            $subject.frame = 100;
            $subject.dropped = 1;
            $subject.fps = 59;
            $subject.runningLoop = 1234;
        });
        
        it("resets #frame", function() {
            expect(() => $action).to.change($subject, 'frame');
            expect($subject.frame).to.equal(0);
        });
        it("does not reset #dropped", function() {
            expect(() => $action).not.to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(1);
        });
        it("does not reset #fps", function() {
            expect(() => $action).not.to.change($subject, 'fps');
            expect($subject.fps).to.equal(59);
        });
        
        it("sets #runningLoop to -1", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.equal(-1);
        });
    });
    
    describe(".pause()", function() {
        def('action', () => $subject.pause());
        beforeEach(function() {
            $subject.frame = 100;
            $subject.dropped = 1;
            $subject.fps = 59;
            $subject.lastFrameTime = 1234.5;
            $subject.runningLoop = 1234;
        });
        
        it("does not change #frame", function() {
            expect(() => $action).not.to.change($subject, 'frame');
            expect($subject.frame).to.equal(100);
        });
        it("does not change #dropped", function() {
            expect(() => $action).not.to.change($subject, 'dropped');
            expect($subject.dropped).to.equal(1);
        });
        it("does not change #fps", function() {
            expect(() => $action).not.to.change($subject, 'fps');
            expect($subject.fps).to.equal(59);
        });
        
        it("resets #lastFrameTime", function() {
            expect(() => $action).to.change($subject, 'lastFrameTime');
            expect($subject.lastFrameTime).to.equal(0.0);
        });
        
        it("sets #runningLoop to 0", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.equal(0);
        });
    });
    
    context("when #runningLoop = -1", function() {
        beforeEach(function() { $subject.runningLoop = -1; });
        
        its('isRunning', () => is.expected.to.be.false);
        its('isPaused',  () => is.expected.to.be.false);
    });
    context("when #runningLoop = 0", function() {
        beforeEach(function() { $subject.runningLoop = 0; });
        
        its('isRunning', () => is.expected.to.be.true);
        its('isPaused',  () => is.expected.to.be.true);
    });
    context("when #runningLoop > 0", function() {
        beforeEach(function() { $subject.runningLoop = 1234; });
        
        its('isRunning', () => is.expected.to.be.true);
        its('isPaused',  () => is.expected.to.be.false);
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".initialize()", function() {
        def('action', () => $subject.initialize());
        
        it("resets cpu#cycleOffset", function() {
            $nes.cpu.cycleOffset = 1234;
            expect(() => $action).to.change($nes.cpu, 'cycleOffset');
            expect($nes.cpu.cycleOffset).to.equal(0);
        });
        it("sets ppu#vblank 3 times", function(done) {
            var count = 0;
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
    
    describe(".loop()", function() {
        /*global $timestampArray, $timestamp */
        def('timestampArray', () => process.hrtime());
        def('timestamp',      () => Math.round($timestampArray[0]*1e3 + $timestampArray[1]/1e6));
        def('action', () => $subject.loop($timestamp));
        
        it("sets #lastFrameTime", function() {
            expect(() => $action).to.change($subject, 'lastFrameTime');
            expect($subject.lastFrameTime).to.equal($timestamp);
        });
        
        context("if #lastFrameTime = 0.0", function() {
            beforeEach(function() { $subject.lastFrameTime = 0.0; });
            
            it("does not change #delta", function() {
                expect(() => $action).not.to.change($subject, 'delta');
            });
        });
        context("if #lastFrameTime != 0.0", function() {
            beforeEach(function() { $subject.lastFrameTime = $timestamp - 1.0; });
            
            it("sets #delta", function() {
                expect(() => $action).to.change($subject, 'delta');
                expect($subject.delta).to.equal(1.0);
            });
        });
        context("if #lastFrameTime is 1/60sec ago", function() {
            beforeEach(function() {
                $subject.lastFrameTime = $timestamp - (1000/60 + 1);
                $subject.frame = 1;
            });
            
            it("resets #delta", function() {
                expect(() => $action).to.change($subject, 'delta');
                expect($subject.delta).to.be.lessThan(3);
            });
            it("sets cpu#cycleOffset according to current frame", function() {
                expect(() => $action).to.change($nes.cpu, 'cycleOffset');
                expect($nes.cpu.cycleOffset).to.equal(29780.5);
            });
            
            it("calls .doFrame()", function(done) {
                $subject.doFrame = () => done();
                $action;
            });
            
            it("increases #frame", function() {
                expect(() => $action).to.increase($subject, 'frame');
            });
            it("does not change #dropped", function() {
                expect(() => $action).not.to.change($subject, 'dropped');
            });
            it("does not change #fps", function() {
                expect(() => $action).not.to.change($subject, 'fps');
                expect($subject.fps).to.be.equal(60);
            });
            it("changes #frameTime", function() {
                expect(() => $action).to.change($subject, 'frameTime');
                expect($subject.frameTime).to.be.lessThan(1000/60);
            });
            it("changes #performance", function() {
                expect(() => $action).to.change($subject, 'performance');
                expect($subject.performance).to.be.greaterThan(1);
            });
        });
        context("if #lastFrameTime is 1/30sec ago", function() {
            beforeEach(function() {
                $subject.lastFrameTime = $timestamp - (1000/30 + 1);
                $subject.frame = 1;
            });
            
            it("resets #delta", function() {
                expect(() => $action).to.change($subject, 'delta');
                expect($subject.delta).to.be.lessThan(3);
            });
            it("sets cpu#cycleOffset according to current frame", function() {
                expect(() => $action).to.change($nes.cpu, 'cycleOffset');
                expect($nes.cpu.cycleOffset).to.equal(59561);
            });
            
            it("calls .cancelFrame()", function(done) {
                $subject.cancelFrame = () => done();
                $action;
            });
            it("calls .doFrame()", function(done) {
                $subject.doFrame = () => done();
                $action;
            });
            
            it("increases #frame by 2", function() {
                expect(() => $action).to.increase($subject, 'frame').by(2);
            });
            it("increases #dropped", function() {
                expect(() => $action).to.increase($subject, 'dropped').by(1);
            });
            
            it("sets #fps to 59", function() {
                expect(() => $action).to.change($subject, 'fps');
                expect($subject.fps).to.be.equal(59);
            });
            
            it("increases #frameTime", function() {
                expect(() => $action).to.increase($subject, 'frameTime');
                expect($subject.frameTime).to.be.greaterThan(1000/60);
            });
            it("decreases #performance", function() {
                expect(() => $action).to.decrease($subject, 'performance');
                expect($subject.performance).to.be.lessThan(1);
            });
        });
        context("if #lastFrameTime is >2sec ago", function() {
            beforeEach(function() { $subject.lastFrameTime = $timestamp - 2016.7; });
            
            it("does not reset #delta", function() {
                expect(() => $action).to.change($subject, 'delta');
                expect($subject.delta).to.be.greaterThan(2000);
            });
            
            it("calls .cancelPendingFrames()", function(done) {
                $subject.cancelPendingFrames = () => done();
                $action;
            });
            it("calls nes.pauseEmulation()", function(done) {
                $nes.pauseEmulation = () => done();
                $action;
            });
            
            it("does NOT change #frame", function() {
                expect(() => $action).not.to.change($subject, 'frame');
            });
            it("does NOT change #dropped", function() {
                expect(() => $action).not.to.change($subject, 'dropped');
            });
            it("does NOT change #fps", function() {
                expect(() => $action).not.to.change($subject, 'fps');
                expect($subject.fps).to.equal(60);
            });
            it("does NOT change #frameTime", function() {
                expect(() => $action).not.to.change($subject, 'frameTime');
                expect($subject.frameTime).to.equal(0);
            });
            it("does NOT change #performance", function() {
                expect(() => $action).not.to.change($subject, 'performance');
                expect($subject.performance).to.equal(1);
            });
        });
    });
    
    describe(".cancelPendingFrames()", function() {
        def('action', () => $subject.cancelPendingFrames());
        beforeEach(function() { $subject.cancelFrame = () => null; }); //To increase speed...
        
        context("when #delta < 1/60sec", function() {
            beforeEach(function() { $subject.delta = 10.0; });
            
            it("does not change it", function() {
                expect(() => $action).not.to.change($subject, 'delta');
            });
        });
        context("when #delta > 1/60sec", function() {
            beforeEach(function() { $subject.delta = 20.0; });
            
            it("cancels the frame", function(done) {
                $subject.cancelFrame = () => done();
                $action;
            });
            
            it("adjusts #delta", function() {
                expect(() => $action).to.change($subject, 'delta');
                expect($subject.delta).to.be.lessThan(1000/60);
            });
        });
    });
});
