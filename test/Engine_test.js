import { expect } from "chai";
import sinon from "sinon";

import { NES } from "../src";

describe("Engine", function() {
    def('nes', () => new NES); /*global $nes */
    
    subject(() => $nes.engine);
    
    beforeEach(function() {
        // Avoid getting trapped in an infinite loop
        sinon.stub($subject, 'firstLoop');
        sinon.stub($subject, 'mainLoop');
        
        // Avoid expensive operations
        sinon.stub($subject, 'doBoot');
        sinon.stub($subject, 'doFrame');
        sinon.stub($subject, 'skipFrame');
        // Expensive AND not useful here anyway...
        sinon.stub($cpu, 'doInstructions');
    });
    /*global $firstLoop, $mainLoop */
    def('firstLoop', () => $subject.firstLoop);
    def('mainLoop', () => $subject.mainLoop);
    
    //-------------------------------------------------------------------------------//
    
    its('bus', () => is.expected.to.equal($nes));
    
    its('runningLoop', () => is.expected.to.equal(0));
    
    its('isPowered', () => is.expected.to.be.false);
    its('isPaused',  () => is.expected.to.be.false);
    
    its('fps',         () => is.expected.to.equal(60));
    its('performance', () => is.expected.to.equal(1.0));
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        
        it("calls .coldBoot()", function() {
            const spy = sinon.spy($subject, 'coldBoot');
            $action;
            expect(spy).to.be.calledOnce;
        });
        
        it("starts emulation (asynchronously)", function() {
            const clock = sinon.useFakeTimers();
            
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).not.to.equal(0);
            
            expect($firstLoop).has.not.been.called;
            clock.next();
            expect($firstLoop).has.been.calledOnce;
            
            clock.restore();
        });
        
        it("sets #isPowered to -true-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
    });
    
    describe(".powerOff()", function() {
        beforeEach(() => { $subject.powerOn(); });
        
        def('action', () => $subject.powerOff());
        
        it("stops emulation", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).to.equal(0);
        });
        
        it("sets #isPowered to -false-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
        it("sets #isPaused to -false-", function() {
            $subject.isPaused = true;
            expect(() => $action).to.change($subject, 'isPaused');
            expect($subject.isPowered).to.be.false;
        });
    });
    
    describe(".pause()", function() {
        def('action', () => $subject.pause());
        
        context("when powered", function() {
            beforeEach(() => $subject.powerOn());
            
            it("stops emulation", function() {
                expect(() => $action).to.change($subject, 'runningLoop');
                expect($subject.runningLoop).to.equal(0);
            });
            
            it("sets #isPaused to -true-", function() {
                expect(() => $action).to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.true;
            });
            it("does not change #isPowered", function() {
                expect(() => $action).not.to.change($subject, 'isPowered');
                expect($subject.isPowered).to.be.true;
            });
            
            it("returns -true-", function() {
                expect($action).to.be.true;
            });
            
            context("but already paused", function() {
                beforeEach(() => $subject.pause());
                
                it("resumes emulation (asynchronously)", function() {
                    const clock = sinon.useFakeTimers();
                    
                    expect(() => $action).to.change($subject, 'runningLoop');
                    expect($subject.runningLoop).not.to.equal(0);
                    
                    expect(() => (
                        clock.next()
                    )).to.increase($firstLoop, 'callCount').by(1);
                    
                    clock.restore();
                });
                
                it("does not call .coldBoot()", function() {
                    const spy = sinon.spy($subject, 'coldBoot');
                    $action;
                    expect(spy).not.to.be.called;
                });
                
                it("sets #isPaused to -false-", function() {
                    expect(() => $action).to.change($subject, 'isPaused');
                    expect($subject.isPaused).to.be.false;
                });
                it("does not change #isPowered", function() {
                    expect(() => $action).not.to.change($subject, 'isPowered');
                    expect($subject.isPowered).to.be.true;
                });
                
                it("returns -false-", function() {
                    expect($action).to.be.false;
                });
            });
        });
        context("when not powered", function() {
            beforeEach(() => $subject.powerOff());
            
            it("does not resume emulation", function() {
                expect(() => $action).not.to.change($subject, 'runningLoop');
                expect($subject.runningLoop).to.equal(0);
                
                expect($firstLoop).not.to.be.called;
                expect($mainLoop).not.to.be.called;
            });
            
            it("does not change #isPaused", function() {
                expect(() => $action).not.to.change($subject, 'isPaused');
                expect($subject.isPaused).to.be.false;
            });
            it("does not change #isPowered", function() {
                expect(() => $action).not.to.change($subject, 'isPowered');
                expect($subject.isPowered).to.be.false;
            });
            
            it("returns -false-", function() {
                expect($action).to.be.false;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".coldBoot()", function() {
        def('action', () => $subject.coldBoot());
        
        it("calls .doBoot()", function() {
            $action;
            expect($subject.doBoot).to.be.calledOnce;
        });
        
        it("starts emulation (asynchronously)", function() {
            const clock = sinon.useFakeTimers();
            
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).not.to.equal(0);
            
            expect($firstLoop).has.not.been.called;
            clock.next();
            expect($firstLoop).has.been.calledOnce;
            
            clock.restore();
        });
    });
    
    def('time', () => 1000/60); /*global $time */
    
    describe(".firstLoop(time)", function() {
        beforeEach(function() {
            $subject.firstLoop.restore();
        });
        def('action', () => $subject.firstLoop($time));
        
        it("calls .doFrame()", function() {
            $action;
            expect($subject.doFrame).to.be.calledOnce;
        });
        
        it("sets #lastTime", function() {
            expect(() => $action).to.change($subject, 'lastTime');
            expect($subject.lastTime).to.equal($time);
        });
        
        it("runs emulation (asynchronously)", function() {
            const clock = sinon.useFakeTimers();
            
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).not.to.equal(0);
            
            expect($mainLoop).has.not.been.called;
            clock.next();
            expect($mainLoop).has.been.calledOnce;
            
            clock.restore();
        });
    });
    
    describe(".mainLoop(time)", function() {
        /*global $clock */
        def('clock', () => sinon.useFakeTimers());
        
        beforeEach(function() {
            $clock.loopLimit = 2;
            $subject.mainLoop.restore();
            sinon.spy($subject, 'mainLoop');
        });
        afterEach(function() {
            $clock.reset();
            $clock.restore();
        });
        
        def('action', () => $subject.mainLoop($time));
        
        it("does not call .skipFrame()", function() {
            $action;
            expect($subject.skipFrame).not.to.be.called;
        });
        it("calls .doFrame()", function() {
            $action;
            expect($subject.doFrame).to.be.calledOnce;
        });
        
        it("sets #lastTime", function() {
            expect(() => $action).to.change($subject, 'lastTime');
            expect($subject.lastTime).to.equal($time);
        });
        
        it("runs emulation (asynchronously)", function() {
            expect(() => $action).to.change($subject, 'runningLoop');
            expect($subject.runningLoop).not.to.equal(0);
            
            expect(() => $clock.next()).to.increase($mainLoop, 'callCount').by(1);
        });
        
        context("if -time- is greater than 2x 16.7ms", function() {
            def('time', () => 1000/30);
            
            it("calls .skipFrame()", function() {
                $action;
                expect($subject.skipFrame).to.be.calledOnce;
            });
            it("still calls .doFrame()", function() {
                $action;
                expect($subject.doFrame).to.be.calledOnce;
            });
        });
        context("if -time- is greater than 1s", function() {
            def('time', () => 1500);
            
            it("does not call .skipFrame()", function() {
                $action;
                expect($subject.skipFrame).not.to.be.called;
            });
            it("does not call .doFrame()", function() {
                $action;
                expect($subject.doFrame).not.to.be.called;
            });
            
            it("does not run emulation", function() {
                expect(() => $action).not.to.change($subject, 'runningLoop');
                expect($subject.runningLoop).to.equal(0);
                
                expect(() => $clock.next()).not.to.change($mainLoop, 'callCount');
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $cpu, $ppu */
    def('cpu', () => $nes.cpu);
    def('ppu', () => $nes.ppu);
    
    context("High-level operations", function() {
        beforeEach(function() {
            sinon.stub($subject, 'doScanline');
            sinon.spy($subject, 'doVBlank');
            sinon.spy($subject, 'doPreRenderLine');
            
            sinon.stub($ppu, 'printFrame');
        });
        
        describe(".doBoot(cpu, ppu)", function() {
            def('vblank', () => sinon.spy()); /*global $vblank */
            beforeEach(() => Object.defineProperty($ppu, 'vblank', { set: $vblank }));
            
            beforeEach(function() {
                $subject.doBoot.restore();
                $action;
            });
            def('action', () => $subject.doBoot($cpu, $ppu));
            
            it("executes a frames worth of CPU instructions", function() {
                expect($cpu.doInstructions).to.be.called;
                expect($cpu.doInstructions.lastCall).to.be.calledWith(29780.5);
            });
            
            it("sets ppu#vblank 3 times then clears it", function() {
                expect($vblank.callCount).to.equal(4);
                
                expect($vblank.firstCall).to.be.calledWith(true);
                expect($vblank.secondCall).to.be.calledWith(true);
                expect($vblank.thirdCall).to.be.calledWith(true);
                
                expect($vblank.lastCall).to.be.calledWith(false);
            });
            
            it("does not render any scanline", function() {
                expect($subject.doScanline).not.to.be.called;
            });
            it("does not render the frame on screen", function() {
                expect($ppu.printFrame).not.to.be.called;
            });
            
            it("does the vertical blanking", function() {
                expect($subject.doVBlank).to.be.calledOnce;
            });
            it("does the pre-render line", function() {
                expect($subject.doPreRenderLine).to.be.calledOnce;
            });
        });
        
        describe(".doFrame(cpu, ppu)", function() {
            beforeEach(function() {
                $subject.doFrame.restore();
                $action;
            });
            def('action', () => $subject.doFrame($cpu, $ppu));
            
            it("executes a frames worth of CPU instructions", function() {
                expect($cpu.doInstructions).to.be.called;
                expect($cpu.doInstructions.lastCall).to.be.calledWith(29780.5);
            });
            
            it("renders 240 scanlines", function() {
                expect($subject.doScanline).to.be.called.callCount(240);
            });
            it("renders the frame on screen", function() {
                expect($ppu.printFrame).to.be.calledOnce;
            });
            
            it("does the vertical blanking", function() {
                expect($subject.doVBlank).to.be.calledOnce;
            });
            it("does the pre-render line", function() {
                expect($subject.doPreRenderLine).to.be.calledOnce;
            });
        });
        
        describe(".skipFrame(cpu, ppu)", function() {
            beforeEach(function() {
                $subject.skipFrame.restore();
                $action;
            });
            def('action', () => $subject.skipFrame($cpu, $ppu));
            
            it("executes a frames worth of CPU instructions", function() {
                expect($cpu.doInstructions).to.be.called;
                expect($cpu.doInstructions.lastCall).to.be.calledWith(29780.5);
            });
            
            it("does not render any scanline", function() {
                expect($subject.doScanline).not.to.be.called;
            });
            it("does not render the frame on screen", function() {
                expect($ppu.printFrame).not.to.be.called;
            });
            
            it("does the vertical blanking", function() {
                expect($subject.doVBlank).to.be.calledOnce;
            });
            it("does not pre-render next line", function() {
                expect($subject.doPreRenderLine).not.to.be.called;
            });
        });
    });
    
    describe(".doVBlank(cpu, ppu)", function() {
        beforeEach(function() {
            sinon.spy($ppu, 'doVBlank');
            sinon.spy($ppu, 'endVBlank');
            sinon.spy($cpu, 'doNMI');
            $ppu.nmiEnabled = $nmiEnabled; /*global $nmiEnabled */
            $action;
        });
        def('action', () => $subject.doVBlank($cpu, $ppu));
        
        it("calls ppu.doBlank()", function() {
            expect($ppu.doVBlank).to.be.calledOnce;
        });
        it("calls ppu.endBlank()", function() {
            expect($ppu.endVBlank).to.be.calledOnce;
        });
        
        context("if ppu#nmiEnabled is clear", function() {
            def('nmiEnabled', () => false);
            
            it("does not trigger an NMI", function() {
                expect($cpu.doNMI).not.to.be.called;
            });
        });
        context("if ppu#nmiEnabled is set", function() {
            def('nmiEnabled', () => true);
            
            it("does trigger an NMI", function() {
                expect($cpu.doNMI).to.be.calledOnce;
            });
        });
    });
    
    context("Low-level operations", function() {
        beforeEach(function() {
            sinon.stub($ppu, 'renderTile');
            sinon.stub($ppu, 'fetchTile');
            sinon.stub($ppu, 'fetchNullTile');
            sinon.stub($ppu, 'fetchNullNTs');
            sinon.stub($ppu, 'incrementX');
            sinon.stub($ppu, 'incrementY');
            sinon.stub($ppu, 'resetX');
            sinon.stub($ppu, 'resetY');
            
            sinon.stub($ppu, 'clearSecondaryOAM');
            sinon.stub($ppu, 'evaluateSprites');
            sinon.stub($ppu, 'fetchSprite');
            sinon.stub($ppu, 'fetchNullSprite');
            
            $action;
        });
        
        describe(".doScanline(cpu, ppu, scanline)", function() {
            def('action', () => $subject.doScanline($cpu, $ppu, 0));
            
            it("renders 32 tiles", function() {
                expect($ppu.renderTile).to.be.called.callCount(32);
            });
            it("fetches 34 tiles (including 1 not used)", function() {
                expect($ppu.fetchTile).to.be.called.callCount(33);
                expect($ppu.fetchNullTile).to.be.calledOnce;
            });
            it("fetches unused NTs", function() {
                expect($ppu.fetchNullNTs).to.be.calledOnce;
            });
            
            it("increments -X- 34 times", function() {
                expect($ppu.incrementX).to.be.called.callCount(34);
            });
            it("resets -X-", function() {
                expect($ppu.resetX).to.be.calledOnce;
            });
            it("increments -Y-", function() {
                expect($ppu.incrementY).to.be.calledOnce;
            });
            it("does not reset -Y-", function() {
                expect($ppu.resetY).not.to.be.called;
            });
            
            it("clears secondary OAM", function() {
                expect($ppu.clearSecondaryOAM).to.be.calledOnce;
            });
            it("evaluates sprites", function() {
                expect($ppu.evaluateSprites).to.be.calledOnce;
            });
            it("fetches 8 sprites", function() {
                expect($ppu.fetchSprite).to.be.called.callCount(8);
            });
        });
        
        describe(".doPreRenderLine(cpu, ppu)", function() {
            def('action', () => $subject.doPreRenderLine($cpu, $ppu));
            
            it("does not render any tile", function() {
                expect($ppu.renderTile).not.to.be.called;
            });
            it("fetches 34 tiles (only the last 2 being used)", function() {
                expect($ppu.fetchNullTile).to.be.called.callCount(32);
                expect($ppu.fetchTile).to.be.calledTwice.and
                                            .calledAfter($ppu.fetchNullTile);
            });
            it("fetches unused NTs", function() {
                expect($ppu.fetchNullNTs).to.be.calledOnce;
            });
            
            it("increments -X- 34 times", function() {
                expect($ppu.incrementX).to.be.called.callCount(34);
            });
            it("resets -X-", function() {
                expect($ppu.resetX).to.be.calledOnce;
            });
            it("increments -Y-", function() {
                expect($ppu.incrementY).to.be.calledOnce;
            });
            it("does reset -Y-", function() {
                expect($ppu.resetY).to.be.called;
            });
            
            it("does not clear secondary OAM", function() {
                expect($ppu.clearSecondaryOAM).not.to.be.called;
            });
            it("does not evaluate sprites", function() {
                expect($ppu.evaluateSprites).not.to.be.called;
            });
            it("fetches 8 unused sprites", function() {
                expect($ppu.fetchNullSprite).to.be.called.callCount(8);
            });
        });
    });
});
