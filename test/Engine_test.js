import { expect } from "chai";
import sinon from "sinon";

import NES from "../src";

describe("Engine", function() {
    def('nes', () => new NES); /*global $nes */
    
    subject(() => $nes.engine);
    beforeEach(function() {
        sinon.stub($nes.audioOutput);
        sinon.stub($nes.cpu, 'doInstructions');
        $nes.cpu.powerOn();
        $nes.ppu.powerOn();
        sinon.stub($subject, 'firstLoop');
    });
    
    its('fps',         () => is.expected.to.equal(60));
    its('performance', () => is.expected.to.equal(1));
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        afterEach(function() { $subject.powerOff(); });
        
        beforeEach(function() {
            $subject.fps = 59;
            $subject.performance = 0.983;
        });
        
        it("resets #fps to 60", function() {
            expect(() => $action).to.change($subject, 'fps');
            expect($subject.fps).to.equal(60);
        });
        it("resets #performance to 1.0", function() {
            expect(() => $action).to.change($subject, 'performance');
            expect($subject.performance).to.equal(1.0);
        });
        
        it("calls .init()", function() {
            const spy = sinon.spy($subject, 'init');
            $action;
            expect(spy).to.be.calledOnce;
        });
        it("calls .coldBoot()", function() {
            const spy = sinon.spy($subject, 'coldBoot');
            $action;
            expect(spy).to.be.calledOnce;
        });
        
        it("calls .firstLoop() (asynchronously)", function() {
            const clock = sinon.useFakeTimers();
            
            $action;
            expect($subject.firstLoop).not.to.be.called;
            clock.next();
            expect($subject.firstLoop).to.be.calledOnce;
            
            clock.restore();
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
            
            $subject.fps = 59;
            $subject.performance = 0.983;
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
            
            $subject.fps = 59;
            $subject.performance = 0.983;
        });
        afterEach(function() { $subject.powerOff(); });
        
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
            
            it("does not change #fps", function() {
                expect(() => $action).not.to.change($subject, 'fps');
                expect($subject.fps).to.equal(59);
            });
            it("does not change #performance", function() {
                expect(() => $action).not.to.change($subject, 'performance');
                expect($subject.performance).to.equal(0.983);
            });
            
            it("calls .firstLoop() (asynchronously)", function() {
                const clock = sinon.useFakeTimers();
                
                $action;
                expect(() => clock.next()).to.increase($subject.firstLoop, 'callCount').by(1);
                
                clock.restore();
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
        
        it("sets ppu#vblank 3 times", function(done) {
            let count = 0;
            Object.defineProperty($nes.ppu, 'vblank', {
                set: (value) => {
                    expect(value).to.be.true;
                    if (++count >= 3) done();
                }
            });
            $action;
        });
        it("calls ppu.doVBlank()", function() {
            const spy = sinon.spy($nes.ppu, 'doVBlank');
            $action;
            expect(spy).to.be.calledOnce;
        });
        it("calls ppu.endVBlank()", function() {
            const spy = sinon.spy($nes.ppu, 'endVBlank');
            $action;
            expect(spy).to.be.calledOnce;
        });
    });
});
