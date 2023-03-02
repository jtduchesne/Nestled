import { expect } from "chai";
import sinon from "sinon";

import { TriangleChannel } from "../../src/Audio";

describe("TriangleChannel", function() {
    subject(() => new TriangleChannel());
    
    its('phase', () => is.expected.to.equal(0));
    
    its('enabled', () => is.expected.to.be.false);
    
    its('counter', () => is.expected.to.equal(0));
    its('timer',   () => is.expected.to.equal(0));
    its('length',  () => is.expected.to.equal(0));
    
    its('linearCounter', () => is.expected.to.equal(0));
    its('timerCycle',    () => is.expected.to.equal(0));
    
    its('output', () => is.expected.to.equal(15));
    
    //-----------------------------------------------------------------------------------//
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("resets #phase", function() {
            $subject.phase = 30;
            expect(() => $action).to.change($subject, 'phase');
            expect($subject.phase).to.equal(0);
        });
        
        it("clears #enabled", function() {
            $subject.enabled = true;
            $subject.length  = 0xFF;
            expect(() => $action).to.change($subject, 'enabled');
            expect($subject.enabled).to.be.false;
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
        
        it("resets #linearCounter", function() {
            $subject.linearCounter = 123;
            expect(() => $action).to.change($subject, 'linearCounter');
            expect($subject.linearCounter).to.equal(0);
        });
        it("resets #timerCycle", function() {
            $subject.timerCycle = 1234;
            expect(() => $action).to.change($subject, 'timerCycle');
            expect($subject.timerCycle).to.equal(0);
        });
        
        it("sets #output to its max (15)", function() {
            $subject.phase = 30;
            expect(() => $action).to.change($subject, 'output');
            expect($subject.output).to.equal(15);
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
    
    describe("#counter", function() {
        it("is the linear counter", function() {
            $subject.linearCounter = 123;
            expect($subject.counter).to.equal(123);
        });
    });
    describe("#counter = value", function() {
        def('action', () => { $subject.counter = 0xFF; });
        
        it("sets #lengthCounterHalt", function() {
            expect(() => $action).to.change($subject, 'lengthCounterHalt');
            expect($subject.lengthCounterHalt).to.be.true;
        });
        it("sets #linearCounterControl", function() {
            expect(() => $action).to.change($subject, 'linearCounterControl');
            expect($subject.linearCounterControl).to.be.true;
        });
        it("sets #linearCounterMax", function() {
            expect(() => $action).to.change($subject, 'linearCounterMax');
            expect($subject.linearCounterMax).to.equal(127);
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
            it("sets #linearCounterReset", function() {
                expect(() => $action).to.change($subject, 'linearCounterReset');
                expect($subject.linearCounterReset).to.be.true;
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
            it("sets #linearCounterReset", function() {
                expect(() => $action).to.change($subject, 'linearCounterReset');
                expect($subject.linearCounterReset).to.be.true;
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $address, $data*/
    
    describe(".writeRegister(address, data)", function() {
        def('action', () => $subject.writeRegister($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x4008", function() {
            def('address', () => 0x4008);
            
            it("delegates to #counter", function() {
                const spy = sinon.spy($subject, 'counter', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x400A", function() {
            def('address', () => 0x400A);
            
            it("delegates to #timer", function() {
                const spy = sinon.spy($subject, 'timer', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x400B", function() {
            def('address', () => 0x400B);
            
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
        
        it("decreases #timerCycle by 2", function() {
            $subject.timerCycle = 10;
            expect(() => $action).to.decrease($subject, 'timerCycle').by(2);
        });
        
        context("when #timerCycle becomes 0", function() {
            beforeEach(function() {
                $subject.timerCycle = 1;
                
                $subject.enabled = true;
                $subject.lengthCounter = 1;
                $subject.linearCounter = 1;
                $subject.timerPeriod = 4;
            });
            
            it("resets #timerCycle to #timerPeriod + 1", function() {
                $subject.timerPeriod = 1234;
                expect(() => $action).to.change($subject, 'timerCycle');
                expect($subject.timerCycle).to.equal(1234 +1);
            });
            
            it("increments #phase", function() {
                expect(() => $action).to.increase($subject, 'phase').by(1);
            });
            it("resets #phase when it reaches 32", function() {
                $subject.phase = 31;
                expect(() => $action).to.decrease($subject, 'phase');
                expect($subject.phase).to.equal(0);
            });
            
            it("does not increment #phase when #lengthCounter == 0", function() {
                $subject.lengthCounter = 0;
                expect(() => $action).not.to.change($subject, 'phase');
            });
            it("does not increment #phase when #linearCounter == 0", function() {
                $subject.linearCounter = 0;
                expect(() => $action).not.to.change($subject, 'phase');
            });
            it("does not increment #phase when #timer < 3", function() {
                $subject.timerPeriod = 2;
                expect(() => $action).not.to.change($subject, 'phase');
            });
        });
    });
    
    describe(".doQuarter()", function() {
        def('action', () => $subject.doQuarter());
        
        it("decrements #linearCounter", function() {
            $subject.linearCounter = 10;
            expect(() => $action).to.decrease($subject, 'linearCounter').by(1);
        });
        
        context("when #linearCounter is 0", function() {
            beforeEach(() => { $subject.linearCounter = 0; });
            
            it("does not decrement #linearCounter", function() {
                expect(() => $action).not.to.change($subject, 'linearCounter');
            });
        });
        
        context("when #linearCounterReset is set", function() {
            beforeEach(() => { $subject.linearCounterReset = true; });
            
            it("resets #linearCounter to #linearCounterMax", function() {
                $subject.linearCounterMax = 123;
                expect(() => $action).to.change($subject, 'linearCounter');
                expect($subject.linearCounter).to.equal(123);
            });
            
            it("does clear #linearCounterReset if #linearCounterControl is clear", function() {
                $subject.linearCounterControl = false;
                expect(() => $action).to.change($subject, 'linearCounterReset');
                expect($subject.linearCounterReset).to.be.false;
            });
            it("does not clear #linearCounterReset if #linearCounterControl is set", function() {
                $subject.linearCounterControl = true;
                expect(() => $action).not.to.change($subject, 'linearCounterReset');
                expect($subject.linearCounterReset).to.be.true;
            });
        });
    });
    
    describe(".doHalf()", function() {
        def('action', () => $subject.doHalf());
        
        it("decrements #lengthCounter", function() {
            $subject.lengthCounter = 10;
            expect(() => $action).to.decrease($subject, 'lengthCounter').by(1);
        });
        it("does not decrement #lengthCounter if #lengthCounterHalt is set", function() {
            $subject.lengthCounterHalt = true;
            $subject.lengthCounter = 10;
            expect(() => $action).not.to.change($subject, 'lengthCounter');
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe("#output", function() {
        it("starts at its max (15)", function() {
            expect($subject.output).to.equal(15);
        });
        
        it("keeps its value when disabled", function() {
            $subject.enabled = false;
            expect($subject.output).to.equal(15);
        });
    });
});
