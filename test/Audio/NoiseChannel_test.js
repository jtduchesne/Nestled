import { expect } from "chai";
import sinon from "sinon";

import { NoiseChannel } from "../../src/Audio";

describe("NoiseChannel", function() {
    subject(() => new NoiseChannel());
    
    its('enabled', () => is.expected.to.be.false);
    
    its('volume', () => is.expected.to.equal(0));
    its('timer',  () => is.expected.to.equal(0));
    its('length', () => is.expected.to.equal(0));
    
    its('envelopeCycle', () => is.expected.to.equal(0));
    its('timerCycle',    () => is.expected.to.equal(0));
    
    its('timerMode',     () => is.expected.to.be.false);
    its('shiftRegister', () => is.expected.to.equal(1));
    
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
        it("resets #timer to its minimum (4)", function() {
            $subject.timer = 0xFF;
            expect(() => $action).to.change($subject, 'timer');
            expect($subject.timer).to.equal(4);
        });
        it("resets #length", function() {
            $subject.enabled = true;
            $subject.length  = 0xFF;
            expect(() => $action).to.change($subject, 'length');
            expect($subject.length).to.equal(0);
        });
        
        it("resets #envelopeCycle", function() {
            $subject.envelopeCycle = 1234;
            expect(() => $action).to.change($subject, 'envelopeCycle');
            expect($subject.envelopeCycle).to.equal(0);
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
    
    describe("#timer", function() {
        it("is the timer period", function() {
            $subject.timerPeriod = 1234;
            expect($subject.timer).to.equal(1234);
        });
    });
    describe("#timer = value", function() {
        def('action', () => { $subject.timer = 0xFF; });
        
        it("sets #timerMode", function() {
            expect(() => $action).to.change($subject, 'timerMode');
            expect($subject.timerMode).to.be.true;
        });
        it("sets #timerPeriod but according to a lookup table", function() {
            expect(() => $action).to.change($subject, 'timerPeriod');
            expect($subject.timerPeriod).not.to.equal(0xFF);
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
            it("does NOT set the higher 3-bits of #timerPeriod", function() {
                $subject.timerPeriod = 0x123;
                expect(() => $action).not.to.change($subject, 'timerPeriod');
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
            it("does NOT set the higher 3-bits of #timerPeriod", function() {
                $subject.timerPeriod = 0x123;
                expect(() => $action).not.to.change($subject, 'timerPeriod');
            });
            it("sets #envelopeReset", function() {
                expect(() => $action).to.change($subject, 'envelopeReset');
                expect($subject.envelopeReset).to.be.true;
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $address, $data*/
    
    describe(".write(address, data)", function() {
        def('action', () => $subject.write($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x400C", function() {
            def('address', () => 0x400C);
            
            it("delegates to #volume", function() {
                const spy = sinon.spy($subject, 'volume', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x400E", function() {
            def('address', () => 0x400E);
            
            it("delegates to #timer", function() {
                const spy = sinon.spy($subject, 'timer', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x400F", function() {
            def('address', () => 0x400F);
            
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
            
            it("shifts #shiftRegister right one bit", function() {
                $subject.shiftRegister = 0x0003;
                expect(() => $action).to.change($subject, 'shiftRegister');
                expect($subject.shiftRegister).to.equal(1);
            });
            context("when #timerMode is clear", function() {
                beforeEach(() => { $subject.timerMode = false; });
                
                it("applies feedback if bit0~bit1", function() {
                    $subject.shiftRegister = 0x0001;
                    $subject.doCycle();
                    expect($subject.shiftRegister).to.equal(0x4000);
                    $subject.shiftRegister = 0x0002;
                    $subject.doCycle();
                    expect($subject.shiftRegister).to.equal(0x4001);
                });
            });
            context("when #timerMode is set", function() {
                beforeEach(() => { $subject.timerMode = true; });
                
                it("applies feedback if bit0~bit6", function() {
                    $subject.shiftRegister = 0x0001;
                    $subject.doCycle();
                    expect($subject.shiftRegister).to.equal(0x4000);
                    $subject.shiftRegister = 0x0040;
                    $subject.doCycle();
                    expect($subject.shiftRegister).to.equal(0x4020);
                });
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
    
    //-----------------------------------------------------------------------------------//
    
    describe("#output", function() {
        beforeEach(function() {
            $subject.enabled       = true;
            $subject.lengthCounter = 1;
            $subject.shiftRegister = 0x2AAA;
            
            $subject.constantVolume = 0xA;
            $subject.envelopeVolume = 0xB;
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
        it("is -0- if #shiftRegister & 1", function() {
            $subject.shiftRegister = 0x5555;
            expect($subject.output).to.equal(0);
        });
    });
});
