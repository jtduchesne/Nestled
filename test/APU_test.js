import { expect } from "chai";
import sinon from "sinon";

import NES from "../src";

describe("APU", function() {
    def('nes', () => new NES);  /*global $nes*/
    def('cpu', () => $nes.cpu); /*global $cpu*/
    
    subject(() => $nes.apu);
    
    its('bus', () => is.expected.to.equal($nes));
    
    its('cycle',       () => is.expected.to.equal(0));
    its('toggle',      () => is.expected.to.be.false);
    its('counterMode', () => is.expected.to.equal(0));
    its('irqDisabled', () => is.expected.to.be.false);
    its('irq',         () => is.expected.to.be.false);
    its('resetDelay',  () => is.expected.to.equal(0));
    
    describe(".powerOn()", function() {
        beforeEach(function() {
            sinon.stub($nes.audioOutput, 'start');
        });

        def('action', () => $subject.powerOn());
        
        it("starts the audioOutput", function() {
            $action;
            expect($nes.audioOutput.start).to.be.calledOnce;
        });
        it("sets #cyclesPerSample", function() {
            expect(() => $action).to.change($subject, 'cyclesPerSample');
            expect($subject.cyclesPerSample).to.be.greaterThan(0);
        });
        it("sets #cyclesUntilSample", function() {
            expect(() => $action).to.change($subject, 'cyclesUntilSample');
            expect($subject.cyclesUntilSample).to.equal($subject.cyclesPerSample);
        });
    });
    describe(".powerOff()", function() {
        beforeEach(function() {
            sinon.stub($nes.audioOutput, 'stop');
        });
        
        def('action', () => $subject.powerOff());
        
        it("stops the audioOutput", function() {
            $action;
            expect($nes.audioOutput.stop).to.be.calledOnce;
        });
    });
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        beforeEach(function() {
            $subject.cycle = 1234;
            $subject.counterMode = 0x80;
            $subject.irqDisabled = true;
            $subject.irq = true;
        });
        
        it("does not reset #cycle immediately", function() {
            expect(() => $action).not.to.change($subject, 'cycle');
            expect($subject.cycle).to.equal(1234);
        });
        it("sets #resetDelay to -2-", function() {
            expect(() => $action).to.change($subject, 'resetDelay');
            expect($subject.resetDelay).to.equal(2);
        });
        it("does reset #cycle after 2 cycles (3 or 4 CPU cycles)", function() {
            $action;
            expect(() => $subject.doCycles(4)).to.decrease($subject, 'cycle');
            expect($subject.cycle).to.equal(1);
        });
        
        it("resets #counterMode to -0-", function() {
            expect(() => $action).to.change($subject, 'counterMode');
            expect($subject.counterMode).to.equal(0);
        });
        it("resets #irqDisabled", function() {
            expect(() => $action).to.change($subject, 'irqDisabled');
            expect($subject.irqDisabled).to.be.false;
        });
        it("resets #irq", function() {
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.false;
        });
    });
    
    describe(".doIRQ()", function() {
        beforeEach(function() {
            sinon.stub($cpu, 'doIRQ');
        });
        def('action', () => $subject.doIRQ());
        
        it("sets #irq", function() {
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.true;
        });
        
        it("calls cpu.doIRQ()", function() {
            $action;
            expect($cpu.doIRQ).to.be.calledOnce;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $value*/
    
    describe("#status", function() {
        it("returns 0x00 if no channels are enabled", function() {
            expect($subject.status).to.eq(0x00);
        });
        it("returns 0x01 if Pulse1 is enabled", function() {
            sinon.stub($subject.pulse1, 'enabled').value(true);
            expect($subject.status).to.eq(0x01);
        });
        it("returns 0x02 if Pulse2 is enabled", function() {
            sinon.stub($subject.pulse2, 'enabled').value(true);
            expect($subject.status).to.eq(0x02);
        });
        it("returns 0x04 if Triangle is enabled", function() {
            sinon.stub($subject.triangle, 'enabled').value(true);
            expect($subject.status).to.eq(0x04);
        });
        it("returns 0x08 if Noise is enabled", function() {
            sinon.stub($subject.noise, 'enabled').value(true);
            expect($subject.status).to.eq(0x08);
        });
        it("returns 0x10 if DMC is enabled", function() {
            sinon.stub($subject.dmc, 'enabled').value(true);
            expect($subject.status).to.eq(0x10);
        });
        
        context("when #irq is set", function() {
            beforeEach(function() {
                $subject.irq = true;
            });
            
            it("returns 0x40", function() {
                expect($subject.status).to.eq(0x40);
            });
            it("clears #irq afterwards", function() {
                expect(() => $subject.status).to.change($subject, 'irq');
                expect($subject.status).to.eq(0x00);
            });
        });
        
        context("when DMC#irq is set", function() {
            beforeEach(function() {
                $subject.dmc.irq = true;
            });
            
            it("returns 0x80", function() {
                expect($subject.status).to.eq(0x80);
            });
            it("does NOT clear DMC#irq afterwards", function() {
                expect(() => $subject.status).not.to.change($subject.dmc, 'irq');
                expect($subject.status).to.eq(0x80);
            });
        });
    });
    
    describe("#status = value", function() {
        def('action', () => { $subject.status = $value; });
        
        context("when value = 0x00", function() {
            def('value', () => 0x00);
            
            it("disables Pulse1 channel", function() {
                const spy = sinon.spy($subject.pulse1, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(false);
            });
            it("disables Pulse2 channel", function() {
                const spy = sinon.spy($subject.pulse2, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(false);
            });
            it("disables Triangle channel", function() {
                const spy = sinon.spy($subject.triangle, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(false);
            });
            it("disables Noise channel", function() {
                const spy = sinon.spy($subject.noise, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(false);
            });
            it("disables DMC channel", function() {
                const spy = sinon.spy($subject.dmc, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(false);
            });
            it("clears DMC#irq", function() {
                $subject.dmc.irq = true;
                expect(() => $action).to.change($subject.dmc, 'irq');
                expect($subject.dmc.irq).to.be.false;
            });
        });
        context("when value = 0xFF", function() {
            def('value', () => 0xFF);
            
            it("enables Pulse1 channel", function() {
                const spy = sinon.spy($subject.pulse1, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(true);
            });
            it("enables Pulse2 channel", function() {
                const spy = sinon.spy($subject.pulse2, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(true);
            });
            it("enables Triangle channel", function() {
                const spy = sinon.spy($subject.triangle, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(true);
            });
            it("enables Noise channel", function() {
                const spy = sinon.spy($subject.noise, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(true);
            });
            it("enables DMC channel", function() {
                const spy = sinon.spy($subject.dmc, 'enabled', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith(true);
            });
            it("clears DMC#irq", function() {
                $subject.dmc.irq = true;
                expect(() => $action).to.change($subject.dmc, 'irq');
                expect($subject.dmc.irq).to.be.false;
            });
        });
    });
    
    describe("#counter", function() {
        it("returns #counterMode", function() {
            $subject.counterMode = 0x00;
            expect($subject.counter).to.eq(0x00);
            $subject.counterMode = 0x80;
            expect($subject.counter).to.eq(0x80);
        });
    });
    
    describe("#counter = value", function() {
        beforeEach(function() {
            $subject.cycle = 1234;
            $subject.irq   = true;
            sinon.spy($subject, 'doQuarter');
            sinon.spy($subject, 'doHalf');
        });
        def('action', () => { $subject.counter = $value; });
        
        context("when value = 0x00", function() {
            beforeEach(function() {
                $subject.counterMode = 0x80;
                $subject.irqDisabled = true;
            });
            def('value', () => 0x00);
            
            it("sets #fourStepCounterMode", function() {
                expect(() => $action).to.change($subject, 'fourStepCounterMode');
                expect($subject.fourStepCounterMode).to.be.true;
            });
            it("sets #irqDisabled to -false-", function() {
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.false;
            });
            it("does not change #irq", function() {
                expect(() => $action).not.to.change($subject, 'irq');
                expect($subject.irq).to.be.true;
            });
            it("does not reset #cycle immediately", function() {
                expect(() => $action).not.to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(1234);
            });
            it("sets #resetDelay", function() {
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.be.greaterThan(0);
            });
            
            it("does not call .doQuarter()", function() {
                $action;
                expect($subject.doQuarter).not.to.be.called;
            });
            it("does not call .doHalf()", function() {
                $action;
                expect($subject.doHalf).not.to.be.called;
            });
        });
        context("when value = 0xC0", function() {
            beforeEach(function() {
                $subject.counterMode = 0x00;
                $subject.irqDisabled = false;
            });
            def('value', () => 0xC0);
            
            it("sets #fiveStepCounterMode", function() {
                expect(() => $action).to.change($subject, 'fiveStepCounterMode');
                expect($subject.fiveStepCounterMode).to.be.true;
            });
            it("sets #irqDisabled to -true-", function() {
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.true;
            });
            it("resets #irq", function() {
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.false;
            });
            it("does not reset #cycle immediately", function() {
                expect(() => $action).not.to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(1234);
            });
            it("sets #resetDelay", function() {
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.be.greaterThan(0);
            });
            
            it("calls .doQuarter()", function() {
                $action;
                expect($subject.doQuarter).to.be.calledOnce;
            });
            it("calls .doHalf()", function() {
                $action;
                expect($subject.doHalf).to.be.calledOnce;
            });
        });
    });
    
    describe("#fourStepCounterMode", function() {
        it("returns -true- when #counterMode = 0x00", function() {
            $subject.counterMode = 0x00;
            expect($subject.fourStepCounterMode).to.be.true;
        });
        it("returns -false- when #counterMode = 0x80", function() {
            $subject.counterMode = 0x80;
            expect($subject.fourStepCounterMode).to.be.false;
        });
    });
    describe("#fiveStepCounterMode", function() {
        it("returns -true- when #counterMode = 0x80", function() {
            $subject.counterMode = 0x80;
            expect($subject.fiveStepCounterMode).to.be.true;
        });
        it("returns -false- when #counterMode = 0x00", function() {
            $subject.counterMode = 0x00;
            expect($subject.fiveStepCounterMode).to.be.false;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $address, $data*/
    
    describe(".readRegister(address)", function() {
        beforeEach(function() {
            sinon.stub($subject, 'status').get(() => 0xAA);
        });
        def('action', () => $subject.readRegister($address));
        
        context("when address is invalid", function() {
            def('address', () => 0x0000);
            
            it("returns 0x00", function() {
                expect($action).to.equal(0x00);
            });
        });
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
            
            it("delegates to #status", function() {
                const spy = sinon.spy($subject, 'status', ['get']);
                expect($action).to.equal(0xAA);
                expect(spy.get).to.be.calledOnce;
            });
        });
    });
    
    describe(".writeRegister(address, data)", function() {
        def('action', () => $subject.writeRegister($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x4000", function() {
            def('address', () => 0x4000);
            
            it("delegates to Pulse1.writeRegister(address, data)", function() {
                const spy = sinon.spy($subject.pulse1, 'writeRegister');
                $action;
                expect(spy).to.be.calledOnceWith($address, $data);
            });
        });
        context("when address is 0x4004", function() {
            def('address', () => 0x4004);
            
            it("delegates to Pulse2.writeRegister(address, data)", function() {
                const spy = sinon.spy($subject.pulse2, 'writeRegister');
                $action;
                expect(spy).to.be.calledOnceWith($address, $data);
            });
        });
        context("when address is 0x4008", function() {
            def('address', () => 0x4008);
            
            it("delegates to Triangle.writeRegister(address, data)", function() {
                const spy = sinon.spy($subject.triangle, 'writeRegister');
                $action;
                expect(spy).to.be.calledOnceWith($address, $data);
            });
        });
        context("when address is 0x400C", function() {
            def('address', () => 0x400C);
            
            it("delegates to Noise.writeRegister(address, data)", function() {
                const spy = sinon.spy($subject.noise, 'writeRegister');
                $action;
                expect(spy).to.be.calledOnceWith($address, $data);
            });
        });
        context("when address is 0x4010", function() {
            def('address', () => 0x4010);
            
            it("delegates to DMC.writeRegister(address, data)", function() {
                const spy = sinon.spy($subject.dmc, 'writeRegister');
                $action;
                expect(spy).to.be.calledOnceWith($address, $data);
            });
        });
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
            
            it("delegates to #status", function() {
                const spy = sinon.spy($subject, 'status', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
        context("when address is 0x4017", function() {
            def('address', () => 0x4017);
            
            it("delegates to #counter", function() {
                const spy = sinon.spy($subject, 'counter', ['set']);
                $action;
                expect(spy.set).to.be.calledOnceWith($data);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $count, $expected*/
    
    describe(".doCycles(count)", function() {
        beforeEach(function() {
            $subject.cycle = 1234;
            sinon.spy($subject, 'doCycle');
        });
        
        def('action', () => $subject.doCycles($count));
        
        context("if [count] is even", function() {
            def('count',    () => 6);
            def('expected', () => 3);
            
            it("increases #cycle by [count]/2", function() {
                expect(() => $action).to.increase($subject, 'cycle').by($expected);
            });
            it("does not set #toggle", function() {
                expect(() => $action).not.to.change($subject, 'toggle');
                expect($subject.toggle).to.be.false;
            });
            it("calls .doCycle() [count]/2 times", function() {
                $action;
                expect($subject.doCycle.callCount).to.equal($expected);
            });
            
            context("and #toggle is set", function() {
                beforeEach(() => { $subject.toggle = true; });
                
                it("still increases #cycle by [count]/2", function() {
                    expect(() => $action).to.increase($subject, 'cycle').by($expected);
                });
                it("does not clear #toggle", function() {
                    expect(() => $action).not.to.change($subject, 'toggle');
                    expect($subject.toggle).to.be.true;
                });
                it("still calls .doCycle() [count]/2 times", function() {
                    $action;
                    expect($subject.doCycle.callCount).to.equal($expected);
                });
            });
        });
        context("if [count] is odd", function() {
            def('count',    () => 5);
            def('expected', () => 3);
            
            it("increases #cycle by [count]/2", function() {
                expect(() => $action).to.increase($subject, 'cycle').by($expected);
            });
            it("sets #toggle", function() {
                expect(() => $action).to.change($subject, 'toggle');
                expect($subject.toggle).to.be.true;
            });
            it("calls .doCycle() [count]/2 times", function() {
                $action;
                expect($subject.doCycle.callCount).to.equal($expected);
            });
            
            context("and #toggle is set", function() {
                beforeEach(() => { $subject.toggle = true; });
                
                it("increases #cycle by [count]/2 -1", function() {
                    expect(() => $action).to.increase($subject, 'cycle').by($expected - 1);
                });
                it("clears #toggle", function() {
                    expect(() => $action).to.change($subject, 'toggle');
                    expect($subject.toggle).to.be.false;
                });
                it("calls .doCycle() [count]/2 -1 times", function() {
                    $action;
                    expect($subject.doCycle.callCount).to.equal($expected - 1);
                });
            });
        });
        
        context("if #resetDelay is set", function() {
            def('count', () => 6);
            
            it("resets #cycle after delay", function() {
                $subject.resetDelay = $count/2;
                expect(() => $action).to.decrease($subject, 'cycle');
                expect($subject.cycle).to.equal(0 +1);
            });
            it("continues counting after delay", function() {
                $subject.resetDelay = $count/2 - 2;
                expect(() => $action).to.decrease($subject, 'cycle');
                expect($subject.cycle).to.equal(2 +1);
            });
        });
    });
    
    describe(".doCycle()", function() {
        beforeEach(function() {
            sinon.spy($subject.pulse1,   'doCycle');
            sinon.spy($subject.pulse2,   'doCycle');
            sinon.spy($subject.triangle, 'doCycle');
            sinon.spy($subject.noise,    'doCycle');
            sinon.spy($subject.dmc,      'doCycle');
            
            sinon.stub($subject, 'doIRQ');
            
            sinon.spy($subject, 'doQuarter');
            sinon.spy($subject, 'doHalf');
            sinon.spy($subject, 'doSample');
        });
        def('action', () => $subject.doCycle());
        
        it("increases #cycle by 1", function() {
            expect(() => $action).to.increase($subject, 'cycle').by(1);
        });
        
        it("calls each channel's .doCycle()", function() {
            $action;
            expect($subject.pulse1.doCycle).to.be.calledOnce;
            expect($subject.pulse2.doCycle).to.be.calledOnce;
            expect($subject.triangle.doCycle).to.be.calledOnce;
            expect($subject.noise.doCycle).to.be.calledOnce;
            expect($subject.dmc.doCycle).to.be.calledOnce;
        });
        
        context("when #counterMode = 0x00", function() {
            beforeEach(function() { $subject.counterMode = 0x00; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
                it("calls .doHalf()", function() {
                    $action;
                    expect($subject.doHalf).to.be.calledOnce;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
                it("calls .doHalf()", function() {
                    $action;
                    expect($subject.doHalf).to.be.calledOnce;
                });
                it("calls .doIRQ()", function() {
                    $action;
                    expect($subject.doIRQ).to.be.calledOnce;
                });
                it("resets cycle", function() {
                    expect(() => $action).to.change($subject, 'cycle');
                    expect($subject.cycle).to.equal(0);
                });
            });
        });
        
        context("when #counterMode = 0x80", function() {
            beforeEach(function() { $subject.counterMode = 0x80; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
                it("calls .doHalf()", function() {
                    $action;
                    expect($subject.doHalf).to.be.calledOnce;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("does not reset cycle", function() {
                    expect(() => $action).to.increase($subject, 'cycle');
                    expect($subject.cycle).to.equal(29829);
                });
            });
            context("on the 37281th cycle", function() {
                beforeEach(function() { $subject.cycle = 37281; });
                
                it("calls .doQuarter()", function() {
                    $action;
                    expect($subject.doQuarter).to.be.calledOnce;
                });
                it("calls .doHalf()", function() {
                    $action;
                    expect($subject.doHalf).to.be.calledOnce;
                });
                it("resets cycle", function() {
                    expect(() => $action).to.change($subject, 'cycle');
                    expect($subject.cycle).to.equal(0);
                });
            });
        });
        
        context("when #cyclesUntilSample reaches -0-", function() {
            beforeEach(function() {
                $subject.cyclesUntilSample = 1;
            });
            
            it("calls .doSample()", function() {
                $action;
                expect($subject.doSample).to.be.calledOnce;
            });
            it("resets #cyclesUntilSample to #cyclesPerSample", function() {
                expect(() => $action).to.change($subject, 'cyclesUntilSample');
                expect($subject.cyclesUntilSample).to.equal($subject.cyclesPerSample);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".doQuarter()", function() {
        beforeEach(function() {
            sinon.stub($subject.pulse1,   'doQuarter');
            sinon.stub($subject.pulse2,   'doQuarter');
            sinon.stub($subject.triangle, 'doQuarter');
            sinon.stub($subject.noise,    'doQuarter');
        });
        def('action', () => $subject.doQuarter());
        
        it("calls each channel's .doQuarter()", function() {
            $action;
            expect($subject.pulse1.doQuarter).to.be.calledOnce;
            expect($subject.pulse2.doQuarter).to.be.calledOnce;
            expect($subject.triangle.doQuarter).to.be.calledOnce;
            expect($subject.noise.doQuarter).to.be.calledOnce;
        });
    });
    
    describe(".doHalf()", function() {
        beforeEach(function() {
            sinon.stub($subject.pulse1,   'doHalf');
            sinon.stub($subject.pulse2,   'doHalf');
            sinon.stub($subject.triangle, 'doHalf');
            sinon.stub($subject.noise,    'doHalf');
        });
        def('action', () => $subject.doHalf());
        
        it("calls each channel's .doHalf()", function() {
            $action;
            expect($subject.pulse1.doHalf).to.be.calledOnce;
            expect($subject.pulse2.doHalf).to.be.calledOnce;
            expect($subject.triangle.doHalf).to.be.calledOnce;
            expect($subject.noise.doHalf).to.be.calledOnce;
        });
    });
});
