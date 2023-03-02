import { expect } from "chai";
import sinon from "sinon";

import { PulseChannel } from "../../src/Audio";

describe("Pulsechannel", function() {
    def('id', () => 1); /*global $id*/
    subject(() => new PulseChannel($id));
    
    its('enabled', () => is.expected.to.be.false);
    
    its('volume', () => is.expected.to.equal(0));
    its('sweep',  () => is.expected.to.equal(0));
    its('timer',  () => is.expected.to.equal(0));
    its('length', () => is.expected.to.equal(0));
    
    its('dutyCycle',     () => is.expected.to.equal(0));
    its('envelopeCycle', () => is.expected.to.equal(0));
    its('sweepCycle',    () => is.expected.to.equal(0));
    its('timerCycle',    () => is.expected.to.equal(0));
    
    //-----------------------------------------------------------------------------------//
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("clears #enabled", function() {
            $subject.enabled = true;
            $subject.length  = 0xFF;
            expect(() => $action).to.change($subject, 'enabled');
            expect($subject.enabled).to.be.false;
        });
        
        it("resets #volume", function() {
            $subject.volume = 0xFF;
            expect(() => $action).to.change($subject, 'volume');
            expect($subject.volume).to.equal(0);
        });
        it("resets #sweep", function() {
            $subject.sweep = 0xFF;
            expect(() => $action).to.change($subject, 'sweep');
            expect($subject.sweep).to.equal(0);
        });
        it("resets #timer", function() {
            $subject.timer = 0xFF;
            expect(() => $action).to.change($subject, 'timer');
            expect($subject.timer).to.equal(0);
        });
        it("resets #length", function() {
            $subject.enabled = true;
            $subject.length  = 0xFF;
            expect(() => $action).to.change($subject, 'length');
            expect($subject.length).to.equal(0);
        });
        
        it("resets #dutyCycle", function() {
            $subject.dutyCycle = 1234;
            expect(() => $action).to.change($subject, 'dutyCycle');
            expect($subject.dutyCycle).to.equal(0);
        });
        it("resets #envelopeCycle", function() {
            $subject.envelopeCycle = 1234;
            expect(() => $action).to.change($subject, 'envelopeCycle');
            expect($subject.envelopeCycle).to.equal(0);
        });
        it("resets #sweepCycle", function() {
            $subject.sweepCycle = 1234;
            expect(() => $action).to.change($subject, 'sweepCycle');
            expect($subject.sweepCycle).to.equal(0);
        });
        it("resets #timerCycle", function() {
            $subject.timerCycle = 1234;
            expect(() => $action).to.change($subject, 'timerCycle');
            expect($subject.timerCycle).to.equal(0);
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $value*/
    
    describe("#enabled", function() {
        it("is -false- when #lengthCounter == 0", function() {
            $subject.lengthCounter = 0;
            expect($subject.enabled).to.be.false;
        });
        it("is -true- when #lengthCounter > 0", function() {
            $subject.lengthCounter = 1;
            expect($subject.enabled).to.be.true;
        });
    });
    describe("#enabled = value", function() {
        def('action', () => { $subject.enabled = $value; });
        
        context("when value = true", function() {
            beforeEach(function() {
                $subject.enabled = false;
            });
            def('value', () => true);
            
            it("has no immediate effect", function() {
                expect(() => $action).not.to.change($subject, 'enabled');
                expect($subject.enabled).to.be.false;
            });
            it("is effective only after setting #length", function() {
                expect(() => $action).not.to.change($subject, 'enabled');
                expect(() => { $subject.length = 0xFF; }).to.change($subject, 'enabled');
                expect($subject.enabled).to.be.true;
            });
        });
        context("when value = false", function() {
            beforeEach(function() {
                $subject.enabled = true;
                $subject.length = 0x88;
            });
            def('value', () => false);
            
            it("has an immediate effect", function() {
                expect(() => $action).to.change($subject, 'enabled');
                expect($subject.enabled).to.be.false;
            });
            it("resets #length", function() {
                expect(() => $action).to.change($subject, 'length');
                expect($subject.length).to.equal(0);
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe("#volume", function() {
        beforeEach(function() {
            $subject.constantVolume = 0xA;
            $subject.envelopeVolume = 0xB;
        });
        
        it("is the constant volume when #envelopeEnabled is clear", function() {
            $subject.envelopeEnabled = false;
            expect($subject.volume).to.equal(0xA);
        });
        it("is the envelope volume when #envelopeEnabled is set", function() {
            $subject.envelopeEnabled = true;
            expect($subject.volume).to.equal(0xB);
        });
    });
    describe("#volume = value", function() {
        def('action', () => { $subject.volume = 0xFF; });
        
        it("sets #duty", function() {
            expect(() => $action).to.change($subject, 'duty');
        });
        it("sets #lengthCounterHalt", function() {
            expect(() => $action).to.change($subject, 'lengthCounterHalt');
            expect($subject.lengthCounterHalt).to.be.true;
        });
        it("sets #envelopeLoop", function() {
            expect(() => $action).to.change($subject, 'envelopeLoop');
            expect($subject.envelopeLoop).to.be.true;
        });
        it("clears #envelopeEnabled", function() {
            expect(() => $action).to.change($subject, 'envelopeEnabled');
            expect($subject.envelopeEnabled).to.be.false;
        });
        it("sets #envelopePeriod", function() {
            expect(() => $action).to.change($subject, 'envelopePeriod');
            expect($subject.envelopePeriod).to.equal(15);
        });
        it("sets #constantVolume", function() {
            expect(() => $action).to.change($subject, 'constantVolume');
            expect($subject.constantVolume).to.equal(15);
        });
    });
    
    describe("#sweep", function() {
        beforeEach(function() {
            $subject.timerPeriod = 0x18;
        });
        
        context("when #sweepShift = 0", function() {
            beforeEach(() => { $subject.sweepShift = 0; });
            
            it("is twice the timer period", function() {
                expect($subject.sweep).to.equal(0x30);
            });
            
            context("and it is negated", function() {
                beforeEach(() => { $subject.sweepNegate = true; });
                
                context("(with Pulse1)", function() {
                    def('id', () => 1);
                    
                    it("is 0x timer period minus 1", function() {
                        expect($subject.sweep).to.equal(0 -1);
                    });
                });
                context("(with Pulse2)", function() {
                    def('id', () => 2);
                    
                    it("is 0x timer period", function() {
                        expect($subject.sweep).to.equal(0);
                    });
                });
            });
        });
        context("when #sweepShift = 2", function() {
            beforeEach(() => { $subject.sweepShift = 2; });
            
            it("is 1.25x the timer period", function() {
                expect($subject.sweep).to.equal(0x1E);
            });
            
            context("and it is negated", function() {
                beforeEach(() => { $subject.sweepNegate = true; });
                
                context("(with Pulse1)", function() {
                    def('id', () => 1);
                    
                    it("is .75x the timer period minus 1", function() {
                        expect($subject.sweep).to.equal(0x12 -1);
                    });
                });
                context("(with Pulse2)", function() {
                    def('id', () => 2);
                    
                    it("is .75x the timer period", function() {
                        expect($subject.sweep).to.equal(0x12);
                    });
                });
            });
        });
    });
    describe("#sweep = value", function() {
        def('action', () => { $subject.sweep = 0xFF; });
        
        it("sets #sweepEnabled", function() {
            expect(() => $action).to.change($subject, 'sweepEnabled');
            expect($subject.sweepEnabled).to.be.true;
        });
        it("sets #sweepPeriod", function() {
            expect(() => $action).to.change($subject, 'sweepPeriod');
            expect($subject.sweepPeriod).to.equal(7);
        });
        it("sets #sweepNegate", function() {
            expect(() => $action).to.change($subject, 'sweepNegate');
            expect($subject.sweepNegate).to.be.true;
        });
        it("sets #sweepShift", function() {
            expect(() => $action).to.change($subject, 'sweepShift');
            expect($subject.sweepShift).to.equal(7);
        });
        it("sets #sweepReset", function() {
            expect(() => $action).to.change($subject, 'sweepReset');
            expect($subject.sweepReset).to.be.true;
        });
    });
    
    describe("#timer", function() {
        it("is the timer period", function() {
            $subject.timerPeriod = 1234;
            expect($subject.timer).to.equal(1234);
        });
    });
    describe("#timer = value", function() {
        def('action', () => { $subject.timer = 0xFF; });
        
        it("sets the lower 8-bits of #timerPeriod", function() {
            $subject.timerPeriod = 0x123;
            expect(() => $action).to.change($subject, 'timerPeriod');
            expect($subject.timerPeriod).to.equal(0x1FF);
        });
    });
    
    describe("#length", function() {
        it("is the length counter", function() {
            $subject.lengthCounter = 1234;
            expect($subject.length).to.equal(1234);
        });
    });
    describe("#length = value", function() {
        def('action', () => { $subject.length = 0x0F; });
        
        context("when #enabled is set", function() {
            beforeEach(() => { $subject.enabled = true; });
            
            it("sets #lengthCounter", function() {
                expect(() => $action).to.change($subject, 'lengthCounter');
                expect($subject.lengthCounter).to.equal(254);
            });
            it("sets the higher 3-bits of #timerPeriod", function() {
                $subject.timerPeriod = 0x123;
                expect(() => $action).to.change($subject, 'timerPeriod');
                expect($subject.timerPeriod).to.equal(0x723);
            });
            it("resets #dutyCycle", function() {
                $subject.dutyCycle = 7;
                expect(() => $action).to.change($subject, 'dutyCycle');
                expect($subject.dutyCycle).to.equal(0);
            });
            it("sets #envelopeReset", function() {
                expect(() => $action).to.change($subject, 'envelopeReset');
                expect($subject.envelopeReset).to.be.true;
            });
        });
        context("when #enabled is clear", function() {
            beforeEach(() => { $subject.enabled = false; });
            
            it("cannot set #lengthCounter", function() {
                expect(() => $action).not.to.change($subject, 'lengthCounter');
                expect($subject.lengthCounter).to.equal(0);
            });
            it("sets the higher 3-bits of #timerPeriod", function() {
                $subject.timerPeriod = 0x123;
                expect(() => $action).to.change($subject, 'timerPeriod');
                expect($subject.timerPeriod).to.equal(0x723);
            });
            it("resets #dutyCycle", function() {
                $subject.dutyCycle = 7;
                expect(() => $action).to.change($subject, 'dutyCycle');
                expect($subject.dutyCycle).to.equal(0);
            });
            it("sets #envelopeReset", function() {
                expect(() => $action).to.change($subject, 'envelopeReset');
                expect($subject.envelopeReset).to.be.true;
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $address, $data*/
    
    describe(".writeRegister(address, data)", function() {
        def('action', () => $subject.writeRegister($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x4000", function() {
            def('address', () => 0x4000);
            
            it("delegates to #volume", function() {
                const spy = sinon.spy($subject, 'volume', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4001", function() {
            def('address', () => 0x4001);
            
            it("delegates to #sweep", function() {
                const spy = sinon.spy($subject, 'sweep', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4002", function() {
            def('address', () => 0x4002);
            
            it("delegates to #timer", function() {
                const spy = sinon.spy($subject, 'timer', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4003", function() {
            def('address', () => 0x4003);
            
            it("delegates to #length", function() {
                const spy = sinon.spy($subject, 'length', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4004", function() {
            def('address', () => 0x4004);
            
            it("delegates to #volume", function() {
                const spy = sinon.spy($subject, 'volume', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4005", function() {
            def('address', () => 0x4005);
            
            it("delegates to #sweep", function() {
                const spy = sinon.spy($subject, 'sweep', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4006", function() {
            def('address', () => 0x4006);
            
            it("delegates to #timer", function() {
                const spy = sinon.spy($subject, 'timer', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4007", function() {
            def('address', () => 0x4007);
            
            it("delegates to #length", function() {
                const spy = sinon.spy($subject, 'length', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe(".doCycle()", function() {
        def('action', () => $subject.doCycle());
        
        it("decrements #timerCycle", function() {
            $subject.timerCycle = 10;
            expect(() => $action).to.decrease($subject, 'timerCycle').by(1);
        });
        
        context("when #timerCycle becomes 0", function() {
            beforeEach(() => { $subject.timerCycle = 1; });
            
            it("resets #timerCycle to #timerPeriod + 1", function() {
                $subject.timerPeriod = 1234;
                expect(() => $action).to.change($subject, 'timerCycle');
                expect($subject.timerCycle).to.equal(1234 +1);
            });
            it("increments #dutyCycle", function() {
                expect(() => $action).to.increase($subject, 'dutyCycle').by(1);
            });
            it("resets #dutyCycle when it reaches 8", function() {
                $subject.dutyCycle = 7;
                expect(() => $action).to.decrease($subject, 'dutyCycle');
                expect($subject.dutyCycle).to.equal(0);
            });
        });
    });
    
    describe(".doQuarter()", function() {
        def('action', () => $subject.doQuarter());
        
        it("decrements #envelopeCycle", function() {
            $subject.envelopeCycle = 10;
            expect(() => $action).to.decrease($subject, 'envelopeCycle').by(1);
        });
        
        context("when #envelopeCycle is 0", function() {
            beforeEach(() => { $subject.envelopeCycle = 0; });
            
            it("resets #envelopeCycle to #envelopePeriod", function() {
                $subject.envelopePeriod = 1234;
                expect(() => $action).to.change($subject, 'envelopeCycle');
                expect($subject.envelopeCycle).to.equal(1234);
            });
            it("decrements #envelopeVolume", function() {
                $subject.envelopeVolume = 10;
                expect(() => $action).to.decrease($subject, 'envelopeVolume');
                expect($subject.envelopeVolume).to.equal(9);
            });
            
            context("and #envelopeVolume == 0", function() {
                beforeEach(() => { $subject.envelopeVolume = 0; });
                
                it("does not decrement #envelopeVolume", function() {
                    expect(() => $action).not.to.decrease($subject, 'envelopeVolume');
                    expect($subject.envelopeVolume).to.equal(0);
                });
                it("resets #envelopeVolume to 15 if #envelopeLoop is set", function() {
                    $subject.envelopeLoop = true;
                    expect(() => $action).to.change($subject, 'envelopeVolume');
                    expect($subject.envelopeVolume).to.equal(15);
                });
            });
        });
        
        context("when #envelopeReset is set", function() {
            beforeEach(() => { $subject.envelopeReset = true; });
            
            it("resets #envelopeCycle to #envelopePeriod", function() {
                $subject.envelopePeriod = 1234;
                expect(() => $action).to.change($subject, 'envelopeCycle');
                expect($subject.envelopeCycle).to.equal(1234);
            });
            it("resets #envelopeVolume to 15", function() {
                expect(() => $action).to.change($subject, 'envelopeVolume');
                expect($subject.envelopeVolume).to.equal(15);
            });
            it("clears #envelopeReset", function() {
                expect(() => $action).to.change($subject, 'envelopeReset');
                expect($subject.envelopeReset).to.be.false;
            });
        });
    });
    
    describe(".doHalf()", function() {
        beforeEach(function() {
            $subject.sweepEnabled = true;
            $subject.sweepShift   = 2;
            $subject.timerPeriod  = 0x600;
        });
        def('action', () => $subject.doHalf());
        
        it("decrements #sweepCycle", function() {
            $subject.sweepCycle = 10;
            expect(() => $action).to.decrease($subject, 'sweepCycle').by(1);
        });
        it("decrements #lengthCounter", function() {
            $subject.lengthCounter = 10;
            expect(() => $action).to.decrease($subject, 'lengthCounter').by(1);
        });
        it("does not decrement #lengthCounter if #lengthCounterHalt is set", function() {
            $subject.lengthCounterHalt = true;
            $subject.lengthCounter = 10;
            expect(() => $action).not.to.change($subject, 'lengthCounter');
        });
        
        context("when #sweepCycle is 0", function() {
            beforeEach(() => { $subject.sweepCycle = 0; });
            
            it("resets #sweepCycle to #sweepPeriod", function() {
                $subject.sweepPeriod = 1234;
                expect(() => $action).to.change($subject, 'sweepCycle');
                expect($subject.sweepCycle).to.equal(1234);
            });
            
            it("applies sweep to #timerPeriod", function() {
                expect(() => $action).to.change($subject, 'timerPeriod');
                expect($subject.timerPeriod).to.equal(0x780);
            });
            it("does not apply sweep if #sweepEnabled is clear", function() {
                $subject.sweepEnabled = false;
                expect(() => $action).not.to.change($subject, 'timerPeriod');
            });
            it("does not apply sweep if #sweepShift == 0", function() {
                $subject.sweepShift = 0;
                expect(() => $action).not.to.change($subject, 'timerPeriod');
            });
            it("does not apply sweep if #timerPeriod < 8", function() {
                $subject.timerPeriod = 7;
                expect(() => $action).not.to.change($subject, 'timerPeriod');
            });
            it("does not apply sweep if > 0x800", function() {
                $subject.sweepShift = 1; //Would give 0x900
                expect(() => $action).not.to.change($subject, 'timerPeriod');
            });
        });
        
        context("when #sweepReset is set", function() {
            beforeEach(() => { $subject.sweepReset = true; });
            
            it("resets #sweepCycle to #sweepPeriod", function() {
                $subject.sweepPeriod = 1234;
                expect(() => $action).to.change($subject, 'sweepCycle');
                expect($subject.sweepCycle).to.equal(1234);
            });
            it("clears #sweepReset", function() {
                expect(() => $action).to.change($subject, 'sweepReset');
                expect($subject.sweepReset).to.be.false;
            });
            
            it("does apply sweep if #sweepCycle was already 0", function() {
                $subject.sweepCycle = 0;
                expect(() => $action).to.change($subject, 'timerPeriod');
                expect($subject.timerPeriod).to.equal(0x780);
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe("#output", function() {
        beforeEach(function() {
            $subject.duty = [1,1,1,1,1,1,1,1];
            
            $subject.enabled       = true;
            $subject.lengthCounter = 1;
            
            $subject.constantVolume = 0xA;
            $subject.envelopeVolume = 0xB;
            $subject.sweepEnabled   = true;
            $subject.sweepShift     = 2;
            $subject.timerPeriod    = 0x600;
        });
        
        it("is #volume", function() {
            $subject.envelopeEnabled = false;
            expect($subject.output).to.equal(0xA);
            $subject.envelopeEnabled = true;
            expect($subject.output).to.equal(0xB);
        });
        
        it("is -0- if #enabled is clear", function() {
            $subject.enabled = false;
            expect($subject.output).to.equal(0);
        });
        it("is -0- if #lengthCounter == 0", function() {
            $subject.lengthCounter = 0;
            expect($subject.output).to.equal(0);
        });
        it("is -0- if #timerPeriod < 8", function() {
            $subject.timerPeriod = 7;
            expect($subject.output).to.equal(0);
        });
        it("is -0- if #sweep overflows", function() {
            $subject.sweepShift = 1;
            expect($subject.output).to.equal(0);
        });
        it("is -0- if #sweep overflows even when disabled", function() {
            $subject.sweepEnabled = false;
            $subject.sweepShift = 1;
            expect($subject.output).to.equal(0);
        });
    });
});
