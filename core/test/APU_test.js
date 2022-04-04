import { NES } from "../src";
import { AudioBuffer } from "../src/Audio";

describe("APU", function() {
    def('nes', () => new NES);  /*global $nes*/
    def('cpu', () => $nes.cpu); /*global $cpu*/

    subject(() => $nes.apu);
    
    its('cpu', () => is.expected.to.equal($cpu));
    
    its('cycle',       () => is.expected.to.equal(0));
    its('counterMode', () => is.expected.to.equal(0));
    its('irqDisabled', () => is.expected.to.be.false);
    its('irq',         () => is.expected.to.be.false);
    its('resetDelay',  () => is.expected.to.equal(0));
    
    describe(".powerOn()", function() {
        def('action', () => $subject.powerOn());
        
        it("starts the audioOutput", function(done) {
            $nes.audioOutput.start = () => done();
            $action;
        });
        it("initializes #audioBuffer", function() {
            expect(() => $action).to.change($subject, 'audioBuffer');
            expect($subject.audioBuffer).to.be.an.instanceOf(AudioBuffer);
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
        def('action', () => $subject.powerOff());
        beforeEach(function() { $subject.powerOn(); });
        
        it("stops the audioOutput", function(done) {
            $nes.audioOutput.stop = () => done();
            $action;
        });
        it("destroys #audioBuffer", function() {
            expect(() => $action).to.change($subject, 'audioBuffer');
            expect($subject.audioBuffer).to.be.null;
        });
    });
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        beforeEach(function() {
            $subject.cycle = 1234;
            $subject.counterMode = 1;
            $subject.irqDisabled = true;
            $subject.irq = true;
        });
        
        it("does not reset #cycle immediately", function() {
            expect(() => $action).not.to.change($subject, 'cycle');
            expect($subject.cycle).to.equal(1234);
        });
        it("sets #resetDelay", function() {
            expect(() => $action).to.change($subject, 'resetDelay');
            expect($subject.resetDelay).to.be.greaterThan(0);
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
        def('action', () => $subject.doIRQ());
        
        it("sets #irq", function() {
            expect(() => $action).to.change($subject, 'irq');
            expect($subject.irq).to.be.true;
        });
        
        it("calls cpu.doIRQ()", function(done) {
            $cpu.doIRQ = () => done();
            $action;
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $value*/
    
    describe("#status", function() {
        beforeEach(function() {
            $subject.pulse1.enabled   = true;
            $subject.pulse2.enabled   = true;
            $subject.triangle.enabled = true;
            $subject.noise.enabled    = true;
        });
        
        it("returns 0x00 if no channels are active", function() {
            expect($subject.status).to.eq(0x00);
        });
        it("returns 0x01 if Pulse1 is active", function() {
            $subject.pulse1.length = 0xFF;
            expect($subject.status).to.eq(0x01);
        });
        it("returns 0x01 if Pulse2 is active", function() {
            $subject.pulse2.length = 0xFF;
            expect($subject.status).to.eq(0x02);
        });
        it("returns 0x04 if Triangle is active", function() {
            $subject.triangle.length = 0xFF;
            expect($subject.status).to.eq(0x04);
        });
        it("returns 0x08 if Noise is active", function() {
            $subject.noise.length = 0xFF;
            expect($subject.status).to.eq(0x08);
        });
        it("returns 0x10 if DMC is active", function() {
            $subject.dmc.length = 0xFF;
            $subject.dmc.enabled = true;
            expect($subject.status).to.eq(0x10);
        });
        
        context("when #irq is set", function() {
            beforeEach(function() {
                $subject.irq = true;
            });
            
            it("returns 0x40", function() {
                expect($subject.status).to.eq(0x40);
            });
            it("resets #irq afterwards", function() {
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
            it("resets DMC#irq afterwards", function() {
                expect(() => $subject.status).to.change($subject.dmc, 'irq');
                expect($subject.status).to.eq(0x00);
            });
        });
    });
    
    describe("#status = value", function() {
        def('action', () => { $subject.status = $value; });
        
        context("when value = null", function() {
            beforeEach(function() {
                $subject.pulse1.enabled   = true;
                $subject.pulse2.enabled   = true;
                $subject.triangle.enabled = true;
                $subject.noise.enabled    = true;
                $subject.dmc.enabled      = true;
            });
            def('value', () => null);
            
            it("disables Pulse1 channel", function() {
                expect(() => $action).to.change($subject.pulse1, 'enabled');
                expect($subject.pulse1.enabled).to.be.false;
            });
            it("disables Pulse2 channel", function() {
                expect(() => $action).to.change($subject.pulse2, 'enabled');
                expect($subject.pulse2.enabled).to.be.false;
            });
            it("disables Triangle channel", function() {
                expect(() => $action).to.change($subject.triangle, 'enabled');
                expect($subject.triangle.enabled).to.be.false;
            });
            it("disables Noise channel", function() {
                expect(() => $action).to.change($subject.noise, 'enabled');
                expect($subject.noise.enabled).to.be.false;
            });
            it("disables DMC channel", function() {
                expect(() => $action).to.change($subject.dmc, 'enabled');
                expect($subject.dmc.enabled).to.be.false;
            });
        });
        context("when value = 0x00", function() {
            beforeEach(function() {
                $subject.pulse1.enabled   = true;
                $subject.pulse2.enabled   = true;
                $subject.triangle.enabled = true;
                $subject.noise.enabled    = true;
                $subject.dmc.enabled      = true;
            });
            def('value', () => 0x00);
            
            it("disables Pulse1 channel", function() {
                expect(() => $action).to.change($subject.pulse1, 'enabled');
                expect($subject.pulse1.enabled).to.be.false;
            });
            it("disables Pulse2 channel", function() {
                expect(() => $action).to.change($subject.pulse2, 'enabled');
                expect($subject.pulse2.enabled).to.be.false;
            });
            it("disables Triangle channel", function() {
                expect(() => $action).to.change($subject.triangle, 'enabled');
                expect($subject.triangle.enabled).to.be.false;
            });
            it("disables Noise channel", function() {
                expect(() => $action).to.change($subject.noise, 'enabled');
                expect($subject.noise.enabled).to.be.false;
            });
            it("disables DMC channel", function() {
                expect(() => $action).to.change($subject.dmc, 'enabled');
                expect($subject.dmc.enabled).to.be.false;
            });
        });
        context("when value = 0xFF", function() {
            def('value', () => 0xFF);
            
            it("enables Pulse1 channel", function() {
                expect(() => $action).to.change($subject.pulse1, 'enabled');
                expect($subject.pulse1.enabled).to.be.true;
            });
            it("enables Pulse2 channel", function() {
                expect(() => $action).to.change($subject.pulse2, 'enabled');
                expect($subject.pulse2.enabled).to.be.true;
            });
            it("enables Triangle channel", function() {
                expect(() => $action).to.change($subject.triangle, 'enabled');
                expect($subject.triangle.enabled).to.be.true;
            });
            it("enables Noise channel", function() {
                expect(() => $action).to.change($subject.noise, 'enabled');
                expect($subject.noise.enabled).to.be.true;
            });
            it("enables DMC channel", function() {
                expect(() => $action).to.change($subject.dmc, 'enabled');
                expect($subject.dmc.enabled).to.be.true;
            });
        });
    });
    
    describe("#counter = value", function() {
        def('action', () => { $subject.counter = $value; });
        
        context("when value = null", function() {
            def('value', () => null);
            
            it("resets #counterMode to -0-", function() {
                $subject.counterMode = 1;
                expect(() => $action).to.change($subject, 'counterMode');
                expect($subject.counterMode).to.equal(0);
            });
            it("resets #irqDisabled", function() {
                $subject.irqDisabled = true;
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.false;
            });
        });
        
        context("when value = 0x00", function() {
            def('value', () => 0x00);
            
            it("sets #counterMode to -0-", function() {
                $subject.counterMode = 1;
                expect(() => $action).to.change($subject, 'counterMode');
                expect($subject.counterMode).to.equal(0);
            });
            it("sets #irqDisabled to -false-", function() {
                $subject.irqDisabled = true;
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.false;
            });
            it("sets #resetDelay", function() {
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.be.greaterThan(0);
            });
        });
        context("when value = 0xC0", function() {
            def('value', () => 0xC0);
            
            it("sets #counterMode to -1-", function() {
                expect(() => $action).to.change($subject, 'counterMode');
                expect($subject.counterMode).to.equal(1);
            });
            it("sets #irqDisabled to -true-", function() {
                expect(() => $action).to.change($subject, 'irqDisabled');
                expect($subject.irqDisabled).to.be.true;
            });
            it("resets #irq", function() {
                $subject.irq = true;
                expect(() => $action).to.change($subject, 'irq');
                expect($subject.irq).to.be.false;
            });
            it("sets #resetDelay", function() {
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.be.greaterThan(0);
            });
            
            it("calls .doQuarter()", function(done) {
                $subject.doQuarter = () => done();
                $action;
            });
            it("calls .doHalf()", function(done) {
                $subject.doHalf = () => done();
                $action;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $address, $data*/
    
    describe(".readRegister(address)", function() {
        def('action', () => $subject.readRegister($address));
        def('address', () => 0x0000);
        
        it("returns 0x00 if address is invalid", function() {
            expect($action).to.equal(0x00);
        });
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
            
            context("if no channels are active", function() {
                it("returns 0x00", function() {
                    expect($action).to.equal(0x00);
                });
            });
            context("if all channels are active", function() {
                beforeEach(function() {
                    $subject.pulse1.enabled   = true;
                    $subject.pulse1.length    = 0xFF;
                    $subject.pulse2.enabled   = true;
                    $subject.pulse2.length    = 0xFF;
                    $subject.triangle.enabled = true;
                    $subject.triangle.length  = 0xFF;
                    $subject.noise.enabled    = true;
                    $subject.noise.length     = 0xFF;
                    
                    $subject.dmc.length  = 0xFF;
                    $subject.dmc.enabled = true;
                });
                
                it("returns 0x1F", function() {
                    expect($action).to.equal(0x1F);
                });
            });
            
            context("if #irq is set", function() {
                beforeEach(function() { $subject.irq = true; });
                
                it("returns 0x40", function() {
                    expect($action).to.equal(0x40);
                });
                it("resets #irq afterwards", function() {
                    expect(() => $action).to.change($subject, 'irq');
                    expect($subject.irq).to.be.false;
                });
            });
            
            context("if DMC#irq is set", function() {
                beforeEach(function() { $subject.dmc.irq = true; });
                
                it("returns 0x80", function() {
                    expect($subject.status).to.eq(0x80);
                });
                it("resets DMC#irq afterwards", function() {
                    expect(() => $subject.status).to.change($subject.dmc, 'irq');
                    expect($subject.dmc.irq).to.false;
                });
            });
        });
    });
    
    describe(".writeRegister(address, data)", function() {
        def('action', () => $subject.writeRegister($address, $data));
        def('data', () => 0xAA);
        
        context("when address is 0x4000", function() {
            def('address', () => 0x4000);
            
            it("delegates to Pulse1.writeRegister(address, data)", function(done) {
                $subject.pulse1.writeRegister = (a,d) => {
                    if (a === $address && d === $data) done();
                    else done(false);
                };
                $action;
            });
        });
        context("when address is 0x4004", function() {
            def('address', () => 0x4004);
            
            it("delegates to Pulse2.writeRegister(address, data)", function(done) {
                $subject.pulse2.writeRegister = (a,d) => {
                    if (a === $address && d === $data) done();
                    else done(false);
                };
                $action;
            });
        });
        context("when address is 0x4008", function() {
            def('address', () => 0x4008);
            
            it("delegates to Triangle.writeRegister(address, data)", function(done) {
                $subject.triangle.writeRegister = (a,d) => {
                    if (a === $address && d === $data) done();
                    else done(false);
                };
                $action;
            });
        });
        context("when address is 0x400C", function() {
            def('address', () => 0x400C);
            
            it("delegates to Noise.writeRegister(address, data)", function(done) {
                $subject.noise.writeRegister = (a,d) => {
                    if (a === $address && d === $data) done();
                    else done(false);
                };
                $action;
            });
        });
        context("when address is 0x4010", function() {
            def('address', () => 0x4010);
            
            it("delegates to DMC.writeRegister(address, data)", function(done) {
                $subject.dmc.writeRegister = (a,d) => {
                    if (a === $address && d === $data) done();
                    else done(false);
                };
                $action;
            });
        });
        
        context("when address is 0x4015", function() {
            def('address', () => 0x4015);
            
            context("when data = 0x00", function() {
                beforeEach(function() {
                    $subject.pulse1.enabled   = true;
                    $subject.pulse2.enabled   = true;
                    $subject.triangle.enabled = true;
                    $subject.noise.enabled    = true;
                    $subject.dmc.enabled      = true;
                });
                def('data', () => 0x00);
                
                it("disables Pulse1 channel", function() {
                    expect(() => $action).to.change($subject.pulse1, 'enabled');
                    expect($subject.pulse1.enabled).to.be.false;
                });
                it("disables Pulse2 channel", function() {
                    expect(() => $action).to.change($subject.pulse2, 'enabled');
                    expect($subject.pulse2.enabled).to.be.false;
                });
                it("disables Triangle channel", function() {
                    expect(() => $action).to.change($subject.triangle, 'enabled');
                    expect($subject.triangle.enabled).to.be.false;
                });
                it("disables Noise channel", function() {
                    expect(() => $action).to.change($subject.noise, 'enabled');
                    expect($subject.noise.enabled).to.be.false;
                });
                it("disables DMC channel", function() {
                    expect(() => $action).to.change($subject.dmc, 'enabled');
                    expect($subject.dmc.enabled).to.be.false;
                });
            });
            context("when data = 0xFF", function() {
                def('data', () => 0xFF);
                
                it("enables Pulse1 channel", function() {
                    expect(() => $action).to.change($subject.pulse1, 'enabled');
                    expect($subject.pulse1.enabled).to.be.true;
                });
                it("enables Pulse2 channel", function() {
                    expect(() => $action).to.change($subject.pulse2, 'enabled');
                    expect($subject.pulse2.enabled).to.be.true;
                });
                it("enables Triangle channel", function() {
                    expect(() => $action).to.change($subject.triangle, 'enabled');
                    expect($subject.triangle.enabled).to.be.true;
                });
                it("enables Noise channel", function() {
                    expect(() => $action).to.change($subject.noise, 'enabled');
                    expect($subject.noise.enabled).to.be.true;
                });
                it("enables DMC channel", function() {
                    expect(() => $action).to.change($subject.dmc, 'enabled');
                    expect($subject.dmc.enabled).to.be.true;
                });
            });
        });
        context("when address is 0x4017", function() {
            def('address', () => 0x4017);
            
            it("does not reset #cycle immediately", function() {
                $subject.cycle = 1234;
                expect(() => $action).not.to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(1234);
            });
            it("sets #resetDelay to -4- if on an even cycle", function() {
                $subject.carry = 0;
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.equal(4);
            });
            it("sets #resetDelay to -3- if on an odd cycle", function() {
                $subject.carry = 1;
                expect(() => $action).to.change($subject, 'resetDelay');
                expect($subject.resetDelay).to.equal(3);
            });
            
            context("when data = 0x00", function() {
                def('data', () => 0x00);
                
                it("sets #counterMode to -0-", function() {
                    $subject.counterMode = 1;
                    expect(() => $action).to.change($subject, 'counterMode');
                    expect($subject.counterMode).to.equal(0);
                });
                it("clears #irqDisabled", function() {
                    $subject.irqDisabled = true;
                    expect(() => $action).to.change($subject, 'irqDisabled');
                    expect($subject.irqDisabled).to.be.false;
                });
                it("does not change #irq", function() {
                    $subject.irq = true;
                    expect(() => $action).not.to.change($subject, 'irq');
                    expect($subject.irq).to.be.true;
                });
            });
            context("when data = 0xC0", function() {
                def('data', () => 0xC0);
                
                it("sets #counterMode to -1-", function() {
                    $subject.counterMode = 0;
                    expect(() => $action).to.change($subject, 'counterMode');
                    expect($subject.counterMode).to.equal(1);
                });
                it("sets #irqDisabled", function() {
                    $subject.irqDisabled = false;
                    expect(() => $action).to.change($subject, 'irqDisabled');
                    expect($subject.irqDisabled).to.be.true;
                });
                it("clears #irq", function() {
                    $subject.irq = true;
                    expect(() => $action).to.change($subject, 'irq');
                    expect($subject.irq).to.be.false;
                });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $count*/
    
    describe(".doCycles(count)", function() {
        def('action', () => $subject.doCycles($count));
        def('count', () => 6);
        
        beforeEach(function() { $subject.powerOn(); });
        
        it("increases #cycle by [count]/2", function() {
            expect(() => $action).to.increase($subject, 'cycle').by($count/2);
        });
        it("calls .doCycle() [count]/2 times", function(done) {
            var count = 0;
            $subject.doCycle = () => { if (++count === $count/2) done(); };
            $action;
        });
        
        context("if #resetDelay is set", function() {
            beforeEach(function() { $subject.cycle = 1234; });
            
            it("resets #cycle after delay", function() {
                $subject.resetDelay = $count/2;
                expect(() => $action).to.decrease($subject, 'cycle');
                expect($subject.cycle).to.equal(0 +1);
            });
            it("continues counting after delay", function() {
                $subject.resetDelay = $count/2 - 2;
                expect(() => $action).to.change($subject, 'cycle');
                expect($subject.cycle).to.equal(2 +1);
            });
            
            it("still call .doCycle() [count]/2 times", function(done) {
                var count = 0;
                $subject.doCycle = () => { if (++count === $count/2) done(); };
                $action;
            });
        });
    });
    
    describe(".doCycle()", function() {
        def('action', () => $subject.doCycle());
        
        beforeEach(function() { $subject.powerOn(); });
        
        it("increases #cycle by 1", function() {
            expect(() => $action).to.increase($subject, 'cycle').by(1);
        });
        
        context("when #counterMode = 0", function() {
            beforeEach(function() { $subject.counterMode = 0; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
                it("calls .doIRQ()", function(done) {
                    $subject.doIRQ = () => done();
                    $action;
                });
                it("resets cycle", function() {
                    $cpu.doIRQ = () => null;
                    expect(() => $action).to.change($subject, 'cycle');
                    expect($subject.cycle).to.equal(0);
                });
            });
        });
        
        context("when #counterMode = 1", function() {
            beforeEach(function() { $subject.counterMode = 1; });
            
            context("on the 7457th cycle", function() {
                beforeEach(function() { $subject.cycle = 7457; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 14914th cycle", function() {
                beforeEach(function() { $subject.cycle = 14914; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
                });
            });
            context("on the 22371th cycle", function() {
                beforeEach(function() { $subject.cycle = 22371; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
            });
            context("on the 29828th cycle", function() {
                beforeEach(function() { $subject.cycle = 29828; });
                
                it("does not reset cycle", function() {
                    $cpu.doIRQ = () => null;
                    expect(() => $action).to.increase($subject, 'cycle');
                    expect($subject.cycle).to.equal(29829);
                });
            });
            context("on the 37281th cycle", function() {
                beforeEach(function() { $subject.cycle = 37281; });
                
                it("calls .doQuarter()", function(done) {
                    $subject.doQuarter = () => done();
                    $action;
                });
                it("calls .doHalf()", function(done) {
                    $subject.doHalf = () => done();
                    $action;
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
            
            it("writes a sample to #audioBuffer", function(done) {
                $subject.audioBuffer = { writeSample: () => done() };
                $action;
            });
            it("resets #cyclesUntilSample to #cyclesPerSample", function() {
                expect(() => $action).to.change($subject, 'cyclesUntilSample');
                expect($subject.cyclesUntilSample).to.equal($subject.cyclesPerSample);
            });
        });
    });
});
