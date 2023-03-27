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
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        afterEach(function() { $subject.powerOff(); });
        
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
            expect($subject.runningLoop).not.to.equal(0);
        });
    });
    
    describe(".powerOff()", function() {
        def('action', () => $subject.powerOff());
        beforeEach(function() { $subject.powerOn(); });
        
        it("sets #runningLoop to -0-", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.equal(0);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".pause()", function() {
        def('action', () => $subject.pause());
        beforeEach(function() { $subject.powerOn(); });
        afterEach(function() { $subject.powerOff(); });
        
        it("sets #runningLoop to -0-", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.equal(0);
        });
        
        describe("when already paused", function() {
            beforeEach(function() {
                $subject.pause();
            });
            
            it("calls .firstLoop() (asynchronously)", function() {
                const clock = sinon.useFakeTimers();
                
                $action;
                expect(() => clock.next()).to.increase($subject.firstLoop, 'callCount').by(1);
                
                clock.restore();
            });
            
            it("sets #runningLoop", function() {
                expect(() => $action).to.change($subject, 'runningLoop');
                expect($subject.runningLoop).not.to.equal(0);
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
