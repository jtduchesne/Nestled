describe("Cpu", function() {
    //------------------------------------------------------------------------------------//
    //- NESFile Fixture
    def('PRGROMData', () => 0xA5); // b10100101
    def(['NMIvector','RESETvector','IRQvector']);
    def('NESFile', () => Object.assign(new Nestled.NESFile, {
        name: "Whatever", isValid: true, 
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, 1, 0, 0, 0, 0,0,0,0,0,0,0,0]
                              .concat(new Array(0x4000-6).fill($PRGROMData))
                              .concat(Array.of($NMIvector&0xFF, $NMIvector>>8))
                              .concat(Array.of($RESETvector&0xFF, $RESETvector>>8))
                              .concat(Array.of($IRQvector&0xFF, $IRQvector>>8))).buffer
    }));
    //------------------------------------------------------------------------------------//
    
    def('cartridge', () => new Nestled.Cartridge($NESFile));
    def('nes',       () => new Nestled.NES($cartridge));
    
    subject(() => $nes.cpu);
    
    def('PRGRAMData', () => 0xC3); // b11000011
    def('RAMData',    () => 0x99); // b10011001
    beforeEach("fill RAM", function() {
        $cartridge.PRGRAM.fill($PRGRAMData);
        $subject.ram.fill($RAMData);
    });
    beforeEach("PowerOn", function() { $subject.powerOn(); });
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $subject.powerOn(); });
        
        it("sets isPowered to -true-", function() {
            expect($subject.isPowered).to.be.true; });
        
        it("sets A to 0", function() { expect($subject.A).to.equal(0); });
        it("sets X to 0", function() { expect($subject.X).to.equal(0); });
        it("sets Y to 0", function() { expect($subject.Y).to.equal(0); });
        it("sets P to 0x34", function()  { expect($subject.P).to.equal(0x34); });
        it("sets SP to 0xFD", function() { expect($subject.SP).to.equal(0xFD); });
        
        its('cycle',       () => is.expected.to.equal(0));
        its('instruction', () => is.expected.to.equal(0));
        its('frame',       () => is.expected.to.equal(0));
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $subject.powerOff(); });
        
        it("sets isPowered to -false-", function() {
            expect($subject.isPowered).to.be.false; });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Interrupts", function() {
        def('NMIvector',   () => 0x1234);
        def('RESETvector', () => 0x5678);
        def('IRQvector',   () => 0x9ABC);
        
        describe(".doNMI()", function() {
            def('action', () => $subject.doNMI());
            
            it("pushes P with BRK flag cleared", function() {
                $action;
                expect($subject.pullByte() & 0x10).to.equal(0);
            });
            it("sets PC to NMI vector (0xFFFA)", function() {
                expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($NMIvector);
            });
        });
        describe(".doRESET()", function() {
            def('action', () => $subject.doRESET());
            
            it("sets PC to RESET vector (0xFFFC)", function() {
                //expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($RESETvector);
            });
        });
        describe(".doIRQ()", function() {
            def('action', () => $subject.doIRQ());
            
            it("pushes P with BRK flag cleared", function() {
                $action;
                expect($subject.pullByte() & 0x10).to.equal(0);
            });
            it("sets PC to IRQ vector (0xFFFE)", function() {
                expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($IRQvector);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Memory access", function() {
        describe(".read(address)", function() {
            it("reads from RAM when address is between [0x0000-1FFF]", function() {
                expect($subject.read(0x0000)).to.equal($RAMData);
                expect($subject.read(0x1FFF)).to.equal($RAMData);
            });
            it("reads from PRG-RAM when address is between [0x6000-7FFF]", function() {
                expect($subject.read(0x6000)).to.equal($PRGRAMData);
                expect($subject.read(0x7FFF)).to.equal($PRGRAMData);
            });
            it("reads from PRG-ROM when address is between [0x8000-FFFF]", function() {
                expect($subject.read(0x8000)).to.equal($PRGROMData);
                expect($subject.read(0xFFF0)).to.equal($PRGROMData);
            });
        
            context("if there is no Cartridge", function() {
                def('cartridge', () => new Nestled.NoCartridge);
                it("returns zero when address is between [0x8000-FFFF]", function() {
                    expect($subject.read(0x8000)).to.equal(0);
                    expect($subject.read(0xFFF0)).to.equal(0);
                });
            });
        });
        describe(".write(address,data)", function() {
            it("writes to RAM when address is between [0x0000, 0x07FF]", function() {
                $subject.write(0x0000, 0xFF);
                expect($subject.ram[0]).to.equal(0xFF); });
            it("writes to PRG-RAM when address is between [0x6000, 0x7FFF]", function() {
                $subject.write(0x6000, 0xFF);
                expect($nes.cartridge.PRGRAM[0]).to.equal(0xFF); });
            it("cannot writes to PRG-ROM when address is between [0x8000, 0xFFFF]", function() {
                $subject.write(0x8000, 0xFF);
                expect($nes.cartridge.PRGROM[0]).not.to.equal(0xFF); });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Stack", function() {
        // The stack pointer always needs to be initialized
        beforeEach(function() { $subject.SP = 0xFF; });
        
        describe(".pushByte(value)", function() {
            def('pushOnce',  () => $subject.pushByte(0xEF));
            def('pushTwice', () => $subject.pushByte(0xEF) || $subject.pushByte(0xCD));
            
            it("decrements SP", function() {
                expect(() => $pushOnce ).to.decrease($subject, 'SP').by(1);
                expect(() => $pushTwice).to.decrease($subject, 'SP').by(2);
            });
            it("writes to 0x1FF the first time", function() {
                $pushOnce;
                expect($subject.ram[0x1FF]).to.equal(0xEF);
            });
            it("writes to 0x1FE the second time", function() {
                $pushTwice;
                expect($subject.ram[0x1FF]).to.equal(0xEF);
                expect($subject.ram[0x1FE]).to.equal(0xCD);
            });
        });
        describe(".pushWord(value)", function() {
            def('pushOnce',  () => $subject.pushWord(0x5678));
            def('pushTwice', () => $subject.pushWord(0x5678) || $subject.pushWord(0x1234));
            
            it("decrements SP twice", function() {
                expect(() => $pushOnce ).to.decrease($subject, 'SP').by(2);
                expect(() => $pushTwice).to.decrease($subject, 'SP').by(4);
            });
            it("writes to [0x1FE-1FF] the first time", function() {
                $pushOnce;
                expect($subject.ram[0x1FF]).to.equal(0x56);
                expect($subject.ram[0x1FE]).to.equal(0x78);
            });
            it("writes to [0x1FC-1FD] the second time", function() {
                $pushTwice;
                expect($subject.ram[0x1FD]).to.equal(0x12);
                expect($subject.ram[0x1FC]).to.equal(0x34);
            });
        });
        describe(".pullByte()", function() {
            beforeEach(function() {
                $subject.pushByte(0xEF);
                $subject.pushByte(0xCD);
                $subject.pushByte(0xAB);
            });
            def('pullOnce',  () => $subject.pullByte());
            def('pullTwice', () => $subject.pullByte() && $subject.pullByte());
            
            it("increments SP", function() {
                expect(() => $pullOnce ).to.increase($subject, 'SP').by(1);
                expect(() => $pullTwice).to.increase($subject, 'SP').by(2);
            });
            it("returns the last pushed byte the first time", function() {
                expect($pullOnce).to.equal(0xAB);
            });
            it("returns the previous pushed byte the second time", function() {
                expect($pullTwice).to.equal(0xCD);
            });
        });
        describe(".pullWord()", function() {
            beforeEach(function() {
                $subject.pushWord(0x9ABC);
                $subject.pushWord(0x5678);
                $subject.pushWord(0x1234);
            });
            def('pullOnce',  () => $subject.pullWord());
            def('pullTwice', () => $subject.pullWord() && $subject.pullWord());
            
            it("increments SP twice", function() {
                expect(() => $pullOnce ).to.increase($subject, 'SP').by(2);
                expect(() => $pullTwice).to.increase($subject, 'SP').by(4);
            });
            it("returns the last pushed word the first time", function() {
                expect($pullOnce).to.equal(0x1234);
            });
            it("returns the previous pushed word the second time", function() {
                expect($pullTwice).to.equal(0x5678);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Status register", function() {
        beforeEach(function() { $subject.P = 0x00; });
        
        describe("#Carry", function() {
            it("is truthy if Carry flag is set", function() {
                $subject.P = 0x01;
                expect($subject.Carry).to.be.ok; });
            it("is not truthy if Carry flag is clear", function() {
                $subject.P = ~0x01;
                expect($subject.Carry).not.to.be.ok; });
        });
        describe("#Zero", function() {
            it("is truthy if Zero flag is set", function() {
                $subject.P = 0x02;
                expect($subject.Zero).to.be.ok; });
            it("is not truthy if Zero flag is clear", function() {
                $subject.P = ~0x02;
                expect($subject.Zero).not.to.be.ok; });
        });
        describe("#Interrupt", function() {
            it("is truthy if Interrupt Disable flag is set", function() {
                $subject.P = 0x04;
                expect($subject.Interrupt).to.be.ok; });
            it("is not truthy if Interrupt Disable flag is clear", function() {
                $subject.P = ~0x04;
                expect($subject.Interrupt).not.to.be.ok; });
        });
        describe("#Decimal", function() {
            it("is truthy if Decimal flag is set", function() {
                $subject.P = 0x08;
                expect($subject.Decimal).to.be.ok; });
            it("is not truthy if Decimal flag is clear", function() {
                $subject.P = ~0x08;
                expect($subject.Decimal).not.to.be.ok; });
        });
        describe("#Overflow", function() {
            it("is truthy if Overflow flag is set", function() {
                $subject.P = 0x40;
                expect($subject.Overflow).to.be.ok; });
            it("is not truthy if Overflow flag is clear", function() {
                $subject.P = ~0x40;
                expect($subject.Overflow).not.to.be.ok; });
        });
        describe("#Negative", function() {
            it("is truthy if Negative flag is set", function() {
                $subject.P = 0x80;
                expect($subject.Negative).to.be.ok; });
            it("is not truthy if Negative flag is clear", function() {
                $subject.P = ~0x80;
                expect($subject.Negative).not.to.be.ok; });
        });
        
        describe("#Carry = value", function() {
            it("sets Carry flag to the given value", function() {
                $subject.Carry = true;
                expect($subject.P & 0x01).to.be.ok;
                $subject.Carry = false;
                expect($subject.P & 0x01).not.to.be.ok;
            });
        });
        describe("#Zero = value", function() {
            it("sets Zero flag to the given value", function() {
                $subject.Zero = true;
                expect($subject.P & 0x02).to.be.ok;
                $subject.Zero = false;
                expect($subject.P & 0x02).not.to.be.ok;
            });
        });
        describe("#Interrupt = ", function() {
            it("sets Interrupt Disable flag to the given value", function() {
                $subject.Interrupt = true;
                expect($subject.P & 0x04).to.be.ok;
                $subject.Interrupt = false;
                expect($subject.P & 0x04).not.to.be.ok;
            });
        });
        describe("#Decimal = ", function() {
            it("sets Decimal flag to the given value", function() {
                $subject.Decimal = true;
                expect($subject.P & 0x08).to.be.ok;
                $subject.Decimal = false;
                expect($subject.P & 0x08).not.to.be.ok;
            });
        });
        describe("#Overflow = value", function() {
            it("sets Overflow flag to the given value", function() {
                $subject.Overflow = true;
                expect($subject.P & 0x40).to.be.ok;
                $subject.Overflow = false;
                expect($subject.P & 0x40).not.to.be.ok;
            });
        });
        describe("#Negative = value", function() {
            it("sets Negative flag to the given value", function() {
                $subject.Negative = true;
                expect($subject.Negative).to.be.ok;
                $subject.Negative = false;
                expect($subject.Negative).not.to.be.ok;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Registers", function() {
        describe("Accumulator", function() {
            def('action', () => { $subject.A = $value; });
            beforeEach(function() { $action; });
            
            context("when value > 0xFF", function() {
                def('value', () => 0x199);
                
                its('Carry', () => is.expected.to.be.ok);
                its('A', () => is.expected.to.equal(0x99));
            });
            context("when value > 0x80", function() {
                def('value', () => 0xF6);
                
                its('Negative', () => is.expected.to.be.ok);
            });
            context("when value < 0", function() {
                def('value', () => -10);
                
                its('Negative', () => is.expected.to.be.ok);
                its('A', () => is.expected.to.equal(0xF6));
            });
            context("when value = 0", function() {
                def('value', () => 0);
                
                its('Zero', () => is.expected.to.be.ok);
            });
        });
        describe("Index X", function() {
            def('action', () => { $subject.X = $value; });
            beforeEach(function() { $action; });
            
            context("when value > 0xFF", function() {
                def('value', () => 0x199);
                
                its('Carry', () => is.expected.to.be.ok);
                its('X', () => is.expected.to.equal(0x99));
            });
            context("when value > 0x80", function() {
                def('value', () => 0xF6);
                
                its('Negative', () => is.expected.to.be.ok);
            });
            context("when value < 0", function() {
                def('value', () => -10);
                
                its('Negative', () => is.expected.to.be.ok);
                its('X', () => is.expected.to.equal(0xF6));
            });
            context("when value = 0", function() {
                def('value', () => 0);
                
                its('Zero', () => is.expected.to.be.ok);
            });
        });
        describe("Index Y", function() {
            def('action', () => { $subject.Y = $value; });
            beforeEach(function() { $action; });
            
            context("when value > 0xFF", function() {
                def('value', () => 0x199);
                
                its('Carry', () => is.expected.to.be.ok);
                its('Y', () => is.expected.to.equal(0x99));
            });
            context("when value > 0x80", function() {
                def('value', () => 0xF6);
                
                its('Negative', () => is.expected.to.be.ok);
            });
            context("when value < 0", function() {
                def('value', () => -10);
                
                its('Negative', () => is.expected.to.be.ok);
                its('Y', () => is.expected.to.equal(0xF6));
            });
            context("when value = 0", function() {
                def('value', () => 0);
                
                its('Zero', () => is.expected.to.be.ok);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
});
