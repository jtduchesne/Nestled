import { expect } from "chai";
import sinon from "sinon";

import NES from "../../src";
import { DMC } from "../../src/Audio";

describe("DMC", function() {
    def('nes', () => new NES); /*global $nes*/
    subject(() => new DMC($nes));
    
    its('bus', () => is.expected.to.equal($nes));
    
    its('timerCycle',  () => is.expected.to.equal(0));
    its('timerPeriod', () => is.expected.to.equal(428));
    
    its('sampleBuffer',  () => is.expected.to.equal(-1));
    its('sampleAddress', () => is.expected.to.equal(0xC000));
    its('sampleLength',  () => is.expected.to.equal(1));
    its('sampleLeft',    () => is.expected.to.equal(0));
    its('sampleLoop',    () => is.expected.to.be.false);
    
    its('shiftRegister',      () => is.expected.to.equal(-1));
    its('shiftRegisterCycle', () => is.expected.to.equal(0));
    
    its('irqEnabled', () => is.expected.to.be.false);
    its('irq',        () => is.expected.to.be.false);
    
    its('output', () => is.expected.to.equal(0));
    
    //-----------------------------------------------------------------------------------//
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("clears #enabled", function() {
            $subject.enabled    = true;
            $subject.sampleLeft = 1;
            expect(() => $action).to.change($subject, 'enabled');
            expect($subject.enabled).to.be.false;
        });
        
        it("does NOT clear #shiftRegister", function() {
            $subject.shiftRegister = 0x1234;
            expect(() => $action).not.to.change($subject, 'shiftRegister');
        });
        
        it("resets #timerCycle", function() {
            $subject.timerCycle = 1234;
            expect(() => $action).to.change($subject, 'timerCycle');
            expect($subject.timerCycle).to.equal(0);
        });
        it("sets #timerPeriod to its max (428)", function() {
            $subject.timerPeriod = 1234;
            expect(() => $action).to.change($subject, 'timerPeriod');
            expect($subject.timerPeriod).to.equal(428);
        });
        
        it("resets #irqEnabled", function() {
            $subject.irqEnabled = true;
            expect(() => $action).to.change($subject, 'irqEnabled');
            expect($subject.irqEnabled).to.be.false;
        });
        it("resets #irq", function() {
            $subject.irq = true;
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.false;
        });
        
        it("resets #sampleLoop", function() {
            $subject.sampleLoop = true;
            expect(() => $action).to.change($subject, 'sampleLoop');
            expect($subject.sampleLoop).to.be.false;
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $value*/
    
    describe("#enabled", function() {
        it("is -false- when #sampleLeft == 0", function() {
            $subject.sampleLeft = 0;
            expect($subject.enabled).to.be.false;
        });
        it("is -true- when #sampleLeft > 0", function() {
            $subject.sampleLeft = 1;
            expect($subject.enabled).to.be.true;
        });
    });
    describe("#enabled = value", function() {
        def('action', () => { $subject.enabled = $value; });
        
        context("when value = true", function() {
            beforeEach(() => { $subject.enabled = false; });
            def('value', () => true);
            
            it("has an immediate effect", function() {
                expect(() => $action).to.change($subject, 'enabled');
                expect($subject.enabled).to.be.true;
            });
            
            it("does NOT clear #shiftRegister", function() {
                $subject.shiftRegister = 0x1234;
                expect(() => $action).not.to.change($subject, 'shiftRegister');
            });
            
            it("clears #irq", function() {
                $subject.irq = true;
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.false;
            });
            it("resets #sampleLeft to #sampleLength", function() {
                $subject.sampleLength = 0x321;
                expect(() => $action).to.change($subject, 'sampleLeft');
                expect($subject.sampleLeft).to.equal(0x321);
            });
        });
        context("when value = false", function() {
            beforeEach(() => { $subject.enabled = true; });
            def('value', () => false);
            
            it("has an immediate effect", function() {
                expect(() => $action).to.change($subject, 'enabled');
                expect($subject.enabled).to.be.false;
            });
            
            it("does NOT clear #shiftRegister", function() {
                $subject.shiftRegister = 0x1234;
                expect(() => $action).not.to.change($subject, 'shiftRegister');
            });
            
            it("clears #irq", function() {
                $subject.irq = true;
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.false;
            });
            it("clears #sampleLeft", function() {
                $subject.sampleLeft = 0x321;
                expect(() => $action).to.change($subject, 'sampleLeft');
                expect($subject.sampleLeft).to.equal(0);
            });
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe(".doIRQ()", function() {
        def('action', () => $subject.doIRQ());
        
        it(".sets #irq", function() {
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.true;
        });
        it("calls NES.cpu.doIRQ()", function() {
            sinon.stub($nes.cpu, 'doIRQ');
            $action;
            expect($nes.cpu.doIRQ).to.be.calledOnce;
        });
    });
    
    //-----------------------------------------------------------------------------------//
    
    describe("#rate", function() {
        it("is the timer period", function() {
            $subject.timerPeriod = 1234;
            expect($subject.rate).to.equal(1234);
        });
    });
    describe("#rate = value", function() {
        def('action', () => { $subject.rate = 0xFF; });
        
        it("sets #irqEnabled", function() {
            expect(() => $action).to.change($subject, 'irqEnabled');
            expect($subject.irqEnabled).to.be.true;
        });
        it("sets #sampleLoop", function() {
            expect(() => $action).to.change($subject, 'sampleLoop');
            expect($subject.sampleLoop).to.be.true;
        });
        it("sets #timerPeriod but according to a lookup table", function() {
            expect(() => $action).to.change($subject, 'timerPeriod');
            expect($subject.timerPeriod).not.to.equal(0x0F);
        });
        it("clears #irq only when < 0x80", function() {
            $subject.irq = true;
            expect(() => { $subject.rate = 0x8F; }).not.to.change($subject, 'irq');
            expect(() => { $subject.rate = 0x4F; }).to.change($subject, 'irq');
            expect($subject.irq).to.be.false;
        });
    });
    
    describe("#load", function() {
        it("is the output", function() {
            $subject.output = 0xAB;
            expect($subject.load).to.equal(0xAB);
        });
    });
    describe("#load = value", function() {
        def('action', () => { $subject.load = 0xFF; });
        
        it("sets #output (7-bit max)", function() {
            expect(() => $action).to.change($subject, 'output');
            expect($subject.output).to.equal(0x7F);
        });
    });
    
    describe("#address", function() {
        it("is #sampleAddress", function() {
            $subject.sampleAddress = 0xCCC0;
            expect($subject.address).to.equal(0xCCC0);
        });
    });
    describe("#address = value", function() {
        def('action', () => { $subject.address = 0xFF; });
        
        it("sets #sampleAddress to 0xC000+(value << 6)", function() {
            expect(() => $action).to.change($subject, 'sampleAddress');
            expect($subject.sampleAddress).to.equal(0xFFC0);
        });
    });
    
    describe("#length", function() {
        it("is #sampleLength", function() {
            $subject.sampleLength = 0xFF1;
            expect($subject.length).to.equal(0xFF1);
        });
    });
    describe("#length = value", function() {
        def('action', () => { $subject.length = 0xFF; });
        
        it("sets #sampleLength to (value << 4)+1", function() {
            expect(() => $action).to.change($subject, 'sampleLength');
            expect($subject.sampleLength).to.equal(0xFF1);
        });
    });
    
    //-----------------------------------------------------------------------------------//
    /*global $address, $data*/
    
    describe(".write(address, data)", function() {
        def('action', () => $subject.write($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x4010", function() {
            def('address', () => 0x4010);
            
            it("delegates to #rate", function() {
                const spy = sinon.spy($subject, 'rate', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4011", function() {
            def('address', () => 0x4011);
            
            it("delegates to #load", function() {
                const spy = sinon.spy($subject, 'load', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4012", function() {
            def('address', () => 0x4012);
            
            it("delegates to #address", function() {
                const spy = sinon.spy($subject, 'address', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4013", function() {
            def('address', () => 0x4013);
            
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
            });
            
            it("resets #timerCycle to #timerPeriod", function() {
                $subject.timerPeriod = 1234;
                expect(() => $action).to.change($subject, 'timerCycle');
                expect($subject.timerCycle).to.equal(1234);
            });
            
            it("calls .updateSampleBuffer()", function() {
                const stub = sinon.stub($subject, 'updateSampleBuffer');
                $action;
                expect(stub).to.be.calledOnce;
            });
            it("calls .updateShiftRegister()", function() {
                const stub = sinon.stub($subject, 'updateShiftRegister');
                $action;
                expect(stub).to.be.calledOnce;
            });
            it("calls .updateOutput()", function() {
                const stub = sinon.stub($subject, 'updateOutput');
                $action;
                expect(stub).to.be.calledOnce;
            });
        });
    });
    
    describe(".updateSampleBuffer()", function() {
        beforeEach(function() {
            sinon.stub($subject, 'doIRQ');
            sinon.stub($nes.cpu, 'read');
            $subject.sampleLength  = 10;
            $subject.enabled       = true;
        });
        def('action', () => $subject.updateSampleBuffer());
        
        context("when sample buffer is empty", function() {
            beforeEach(() => { $subject.sampleBuffer = -1; });
            
            it("reads a new sample from memory", function() {
                $subject.sampleAddress = 0xC000;
                $action;
                expect($nes.cpu.read).to.be.calledOnceWith(0xC000);
            });
            it("sets #sampleBuffer to the value read from memory", function() {
                $nes.cpu.read.returns(0xAB);
                expect(() => $action).to.change($subject, 'sampleBuffer');
                expect($subject.sampleBuffer).to.equal(0xAB);
            });
            it("decrements #sampleLeft", function() {
                expect(() => $action).to.decrease($subject, 'sampleLeft').by(1);
            });
            
            context("and there is only one sample left", function() {
                beforeEach(() => { $subject.sampleLeft = 1; });
                
                context("if #sampleLoop is set", function() {
                    beforeEach(() => { $subject.sampleLoop = true; });
                    
                    it("resets #sampleLeft to #sampleLength", function() {
                        expect(() => $action).to.change($subject, 'sampleLeft');
                        expect($subject.sampleLeft).to.equal($subject.sampleLength);
                    });
                    
                    it("does not call .doIRQ() even if #irqEnabled is set", function() {
                        $subject.irqEnabled = true;
                        $action;
                        expect($subject.doIRQ).not.to.be.called;
                    });
                });
                context("if #sampleLoop is clear", function() {
                    beforeEach(() => { $subject.sampleLoop = false; });
                    
                    it("continues to decrement #sampleLeft", function() {
                        expect(() => $action).to.decrease($subject, 'sampleLeft').by(1);
                        expect($subject.sampleLeft).to.equal(0);
                    });
                    it("clears #enabled", function() {
                        expect(() => $action).to.change($subject, 'enabled');
                        expect($subject.enabled).to.be.false;
                    });
                    
                    it("calls .doIRQ() if #irqEnabled is set", function() {
                        $subject.irqEnabled = true;
                        $action;
                        expect($subject.doIRQ).to.be.calledOnce;
                    });
                    it("does not call .doIRQ() if #irqEnabled is clear", function() {
                        $subject.irqEnabled = false;
                        $action;
                        expect($subject.doIRQ).not.to.be.called;
                    });
                });
            });
            context("when disabled", function() {
                beforeEach(() => { $subject.enabled = false; });
                
                it("does not read from memory", function() {
                    $action;
                    expect($nes.cpu.read).not.to.be.called;
                });
                it("does not decrement #sampleLeft", function() {
                    expect(() => $action).not.to.change($subject, 'sampleLeft');
                });
            });
        });
    });
    
    describe(".updateShiftRegister()", function() {
        def('action', () => $subject.updateShiftRegister());
        
        context("the first time", function() {
            it("initializes #shiftRegisterCycle to -8-", function() {
                expect(() => $action).to.increase($subject, 'shiftRegisterCycle');
                expect($subject.shiftRegisterCycle).to.equal(8);
            });
            
            it("does not change #shiftRegister", function() {
                expect(() => $action).not.to.change($subject, 'shiftRegister');
                expect($subject.shiftRegister).to.equal(-1);
            });
            it("does not change #sampleBuffer", function() {
                expect(() => $action).not.to.change($subject, 'sampleBuffer');
                expect($subject.sampleBuffer).to.equal(-1);
            });
        });
        context("when #shiftRegisterCycle > 1", function() {
            beforeEach(() => { $subject.shiftRegisterCycle = 8; });
            
            it("decrements #shiftRegisterCycle", function() {
                expect(() => $action).to.decrease($subject, 'shiftRegisterCycle').by(1);
            });
        });
        context("when #shiftRegisterCycle == 1", function() {
            it("resets #shiftRegisterCycle to -8-", function() {
                expect(() => $action).to.increase($subject, 'shiftRegisterCycle');
                expect($subject.shiftRegisterCycle).to.equal(8);
            });
            
            it("sets #shiftRegister to the value of #sampleBuffer", function() {
                $subject.sampleBuffer = 0xAB;
                expect(() => $action).to.change($subject, 'shiftRegister');
                expect($subject.shiftRegister).to.equal(0xAB);
            });
            it("empties #sampleBuffer", function() {
                $subject.sampleBuffer = 0xAB;
                expect(() => $action).to.change($subject, 'sampleBuffer');
                expect($subject.sampleBuffer).to.equal(-1);
            });
        });
    });
    
    describe(".updateOutput()", function() {
        beforeEach(function() {
            $subject.output = 64;
        });
        def('action', () => $subject.updateOutput());
        
        context("if #shiftRegister == 0xAA", function() {
            beforeEach(() => { $subject.shiftRegister = 0xAA; });
            
            it("shifts #shiftRegister right 1-bit", function() {
                expect(() => $action).to.change($subject, 'shiftRegister');
                expect($subject.shiftRegister).to.equal(0x55);
            });
            it("decreases #output by 2", function() {
                expect(() => $action).to.decrease($subject, 'output').by(2);
            });
            it("cannot drop #output lower than 0", function() {
                $subject.output = 1;
                expect(() => $action).not.to.change($subject, 'output');
            });
        });
        context("if #shiftRegister == 0x55", function() {
            beforeEach(() => { $subject.shiftRegister = 0x55; });
            
            it("shifts #shiftRegister right 1-bit", function() {
                expect(() => $action).to.change($subject, 'shiftRegister');
                expect($subject.shiftRegister).to.equal(0x2A);
            });
            it("increases #output by 2", function() {
                expect(() => $action).to.increase($subject, 'output').by(2);
            });
            it("cannot raise #output higher than 127", function() {
                $subject.output = 126;
                expect(() => $action).not.to.change($subject, 'output');
            });
        });
        context("if #shiftRegister is empty", function() {
            beforeEach(() => { $subject.shiftRegister = -1; });
            
            it("does not change #shiftRegister", function() {
                expect(() => $action).not.to.change($subject, 'shiftRegister');
            });
            it("does not change #output", function() {
                expect(() => $action).not.to.change($subject, 'output');
            });
        });
    });
});
