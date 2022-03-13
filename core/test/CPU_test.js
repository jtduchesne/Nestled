import { NES, NESFile, Cartridge, NoCartridge, APU } from "../src/main.js";

describe("Cpu", function() {
    //------------------------------------------------------------------------------------//
    //- NESFile Fixture
    
    /*global $PRGROMData, $NMIvector, $RESETvector, $IRQvector */
    def('PRGROMData', () => 0xA5); // b10100101
    def(['NMIvector','RESETvector','IRQvector']);
    /*global $NESFile */
    def('NESFile', () => Object.assign(new NESFile, {
        name: "Whatever", isValid: true, 
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, 1, 0, 0, 0, 0,0,0,0,0,0,0,0]
                              .concat(new Array(0x4000-6).fill($PRGROMData))
                              .concat(Array.of($NMIvector&0xFF, $NMIvector>>8))
                              .concat(Array.of($RESETvector&0xFF, $RESETvector>>8))
                              .concat(Array.of($IRQvector&0xFF, $IRQvector>>8))).buffer
    }));
    //------------------------------------------------------------------------------------//
    
    /*global $cartridge, $nes */
    def('cartridge', () => new Cartridge($NESFile));
    def('nes',       () => new NES($cartridge));
    
    subject(() => $nes.cpu);
    
    /*global $PRGRAMData, $RAMData */
    def('PRGRAMData', () => 0xC3); // b11000011
    def('RAMData',    () => 0x99); // b10011001
    beforeEach("fill RAM", function() {
        $cartridge.PRGRAM.fill($PRGRAMData);
        $subject.ram.fill($RAMData);
    });
    beforeEach("PowerOn", function() { $subject.powerOn(); });
    
    //-------------------------------------------------------------------------------//
    
    its('apu', () => is.expected.to.be.an.instanceOf(APU));
    
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
        its('cycleOffset', () => is.expected.to.equal(0));
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $subject.powerOff(); });
        
        it("sets isPowered to -false-", function() {
            expect($subject.isPowered).to.be.false; });
    });
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("calls apu.reset()", function(done) {
            $subject.apu.reset = () => done();
            $action;
        });
        it("calls .doReset()", function(done) {
            $subject.doReset = () => done();
            $action;
        });
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
            beforeEach(function() { $subject.Interrupt = false; });
            
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
            it("reads from PPU's registers when address is between [0x2000-3FFF]", function(done) {
                var count = 0;
                $nes.ppu.readRegister = () => { if (++count === 2) done(); };
                $subject.read(0x2000);
                $subject.read(0x3FFF);
            });
            it("reads from APU's registers when address is [0x4015]", function(done) {
                $subject.apu.readRegister = () => done();
                $subject.read(0x4015);
            });
            it("reads from Controller 1 when address is [0x4016]", function(done) {
                $nes.controllers[0].read = () => done();
                $subject.read(0x4016);
            });
            it("also reads most significant bits of addressBus (0x40)", function() {
                expect($subject.read(0x4016)).to.equal(0x40);
            });
            it("reads from Controller 2 when address is [0x4017]", function(done) {
                $nes.controllers[1].read = () => done();
                $subject.read(0x4017);
            });
            it("also reads most significant bits of addressBus (0x40)", function() {
                expect($subject.read(0x4017)).to.equal(0x40);
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
                def('cartridge', () => new NoCartridge);
                it("returns zero when address is between [0x8000-FFFF]", function() {
                    expect($subject.read(0x8000)).to.equal(0);
                    expect($subject.read(0xFFF0)).to.equal(0);
                });
            });
        });
        describe(".write(address,data)", function() {
            it("writes to RAM when address is between [0x0000, 0x07FF]", function() {
                $subject.write(0x0000, 0xFF);
                expect($subject.ram[0]).to.equal(0xFF);
            });
            it("writes to PPU's registers when address is between [0x2000-3FFF]", function(done) {
                var count = 0;
                $nes.ppu.writeRegister = () => { if (++count === 2) done(); };
                $subject.write(0x2000);
                $subject.write(0x3FFF);
            });
            it("writes to APU's registers when address is between [0x4000-4015]", function(done) {
                var count = 0;
                $subject.apu.writeRegister = () => { if (++count === 2) done(); };
                $subject.write(0x4000);
                $subject.write(0x4015);
            });
            it("writes (strobe) to both Controllers when address is [0x4016]", function(done) {
                var count = 0;
                const write = (data) => {
                    expect(data).to.equal(0xFF);
                    if (++count === 2) done();
                };
                $nes.controllers[0].write = write;
                $nes.controllers[1].write = write;
                $subject.write(0x4016, 0xFF);
            });
            it("writes to APU's registers when address is [0x4017]", function(done) {
                $subject.apu.writeRegister = () => done();
                $subject.write(0x4017);
            });
            it("writes to PRG-RAM when address is between [0x6000, 0x7FFF]", function() {
                $subject.write(0x6000, 0xFF);
                expect($cartridge.mapper.PRGRAM[0]).to.equal(0xFF);
            });
            it("cannot writes to PRG-ROM when address is between [0x8000, 0xFFFF]", function() {
                $subject.write(0x8000, 0xFF);
                expect($cartridge.mapper.PRGROM[0]).not.to.equal(0xFF);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Stack", function() {
        /*global $pushOnce, $pushTwice, $pullOnce, $pullTwice */
        
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
        /*global $value */
        
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
    
    context("Addressing modes", function() {
        //(They must return the address of the next read)
        
        beforeEach(function() {
            $subject.PC = 0x0010;
            $subject.ram.set([0x34,0x12,0x78,0x56,0xBC,0x9A,0xF0,0xDE], 0x0010);
        });
        //The first byte is read in the main loop just before invoking the addressing mode
        def('byteOperand', () => $subject.read($subject.PC)); /*global $byteOperand */
        
        describe(".imp(operand)", function() {
            it("returns the operand", function() {
                expect($subject.imp(null)).to.be.null;
                expect($subject.imp(0xFF)).to.equal(0xFF);
            });
            it("decrements PC", function() {
                expect(() => $subject.imp(0x00)).to.decrease($subject, 'PC').by(1); });
        });
        describe(".imm()", function() {
            it("returns PC-1", function() {
                expect($subject.imm()).to.equal($PC-1); });
            it("does not actually decrement PC", function() {
                expect(() => $subject.imm()).not.to.change($subject, 'PC'); });
        });
        
        describe(".rel(operand)", function() {
            it("returns PC plus the operand when positive", function() {
                expect($subject.rel(1)).to.equal($PC +1);
                expect($subject.rel(0x01)).to.equal($PC +1); });
            it("returns PC minus the operand when negative", function() {
                expect($subject.rel(-1)).to.equal($PC -1);
                expect($subject.rel(0xFF)).to.equal($PC -1); });
        });
        
        describe(".zero(operand)", function() {
            it("returns the operand", function() {
                expect($subject.zero(0x18)).to.equal(0x0018); });
        });
        describe(".zeroX(operand)", function() {
            beforeEach(function() { $subject.X = 0x80; });
            
            it("returns the operand + X", function() {
                expect($subject.zeroX(0x18)).to.equal(0x0098); });
            it("cannot go out of memory page 0 (0x0000-00FF)", function() {
                expect($subject.zeroX(0x88)).to.equal(0x0008); });
        });
        describe(".zeroY(operand)", function() {
            beforeEach(function() { $subject.Y = 0xC0; });
            
            it("returns the operand + Y", function() {
                expect($subject.zeroY(0x18)).to.equal(0x00D8); });
            it("cannot go out of memory page 0 (0x0000-00FF)", function() {
                expect($subject.zeroY(0x48)).to.equal(0x0008); });
        });
        
        describe(".abs(operand)", function() {
            it("returns the operand(word)", function() {
                expect($subject.abs($byteOperand)).to.equal(0x1234); });
        });
        describe(".absX(operand)", function() {
            beforeEach(function() { $subject.X = 0x11; });
            
            it("returns the operand(word) + X", function() {
                expect($subject.absX($byteOperand)).to.equal(0x1234+$subject.X); });
        });
        describe(".absY(operand)", function() {
            beforeEach(function() { $subject.X = 0x22; });
            
            it("returns the operand(word) + Y", function() {
                expect($subject.absY($byteOperand)).to.equal(0x1234+$subject.Y); });
        });
        
        describe(".ind(operand)", function() {
            beforeEach(function() {
                $subject.ram.set([0x12,0x00,0xDC,0xFE,0x98,0xBA], 0x0010);
            });
            
            it("returns the value read at [operand(word)]", function() {
                expect($subject.ind($byteOperand)).to.equal(0xFEDC); });
        });
        describe(".indX(operand)", function() {
            beforeEach(function() {
                $subject.ram.set([0x12,0x00,0xDC,0xFE,0x98,0xBA], 0x0010);
                $subject.X = 0x02;
            });
            
            it("returns the value read at [operand(byte + X)]", function() {
                expect($subject.indX($byteOperand)).to.equal(0xBA98); });
        });
        describe(".indY(operand)", function() {
            beforeEach(function() {
                $subject.ram.set([0x12,0x00,0xDC,0xFE,0x98,0xBA], 0x0010);
                $subject.Y = 0x02;
            });
            
            it("returns (the value read at [operand(byte)]) + Y", function() {
                expect($subject.indY($byteOperand)).to.equal(0xFEDE); });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Instructions", function() {
        def('RAMData', () => 0x00);
        def('action', () => $subject.doInstruction());
        
        it("never throws an error", function() {
            for (var i=0; i<256; i++)
                $subject.ram[0x200+i] = i;
            
            for (i=0x0200; i<0x0300; i++) {
                $subject.PC = i;
                expect(() => $action).to.not.throw();
            }
        });
        
        describe("#BRK()", function() {
            def('IRQvector', () => 0xABCD);
            beforeEach(function() {
                $subject.ram.set([0x00, 0x00]);
            });
            it("pushes P to the stack with B flag set", function() {
                $action;
                var pushedP = $subject.pullByte();
                expect(pushedP).to.equal($subject.P);
                expect(pushedP&0x10).to.be.ok;
            });
            it("pushes PC of the next opcode to the stack", function() {
                $action;
                $subject.pullByte(); //Pull P first...
                expect($subject.pullWord()).to.equal(0x0002); });
            it("sets I flag", function() {
                $action;
                expect($subject.Interrupt).to.be.ok;
            });
            it("sets PC to the address at 0xFFFE", function() {
                $action;
                expect($subject.PC).to.equal($IRQvector); });
            it("takes 7 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(7); });
        });
        describe("#RTI()", function() {
            beforeEach(function() {
                $subject.ram.set([0x40, 0x00]);
                $subject.pushWord(0x1234);
                $subject.pushByte(0x56);
                $action;
            });
            it("pulls P from stack", function() {
                expect($subject.P).to.equal(0x56); });
            it("pulls PC from stack", function() {
                expect($subject.PC).to.equal(0x1234); });
            it("takes 6 cycles", function() {
                expect($subject.cycle).to.equal(6); });
        });
        describe("#JSR(absolute)", function() {
            beforeEach(function() {
                $subject.ram.set([0x20, 0x34, 0x12]);
            });
            it("pushes PC (before the second byte of operand) to the stack", function() {
                $action;
                expect($subject.pullWord()).to.equal(0x0002); });
            it("sets PC to the operand", function() {
                $action;
                expect($subject.PC).to.equal(0x1234); });
            it("takes 6 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(6); });
        });
        describe("#RTS()", function() {
            beforeEach(function() {
                $subject.ram.set([0x60, 0x00]);
                $subject.pushWord(0x1234);
                $action;
            });
            it("pulls PC from stack (and increments it once)", function() {
                expect($subject.PC).to.equal(0x1235); });
            it("takes 6 cycles", function() {
                expect($subject.cycle).to.equal(6); });
        });
        describe("#JMP(absolute)", function() {
            beforeEach(function() {
                $subject.ram.set([0x4C, 0x34, 0x12]);
            });
            it("sets PC to the operand", function() {
                $action;
                expect($subject.PC).to.equal(0x1234); });
            it("takes 3 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(3); });
        });
        describe("#JMP(indirect)", function() {
            beforeEach(function() {
                $subject.ram.set([0x6C, 0x03, 0x00, 0x78, 0x56]);
            });
            it("sets PC to the address given by the operand", function() {
                $action;
                expect($subject.PC).to.equal(0x5678); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        
        describe("#BPL(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0x10, 0x10]);
            });
            context("if positive", function() {
                beforeEach(function() {
                    $subject.Negative = false;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if not positive", function() {
                beforeEach(function() {
                    $subject.Negative = true;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BMI(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0x30, 0x10]);
            });
            context("if negative", function() {
                beforeEach(function() {
                    $subject.Negative = true;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if not negative", function() {
                beforeEach(function() {
                    $subject.Negative = false;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BVC(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0x50, 0x10]);
            });
            context("if oVerflow clear", function() {
                beforeEach(function() {
                    $subject.Overflow = false;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if oVerflow not clear", function() {
                beforeEach(function() {
                    $subject.Overflow = true;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BVS(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0x70, 0x10]);
            });
            context("if oVerflow set", function() {
                beforeEach(function() {
                    $subject.Overflow = true;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if oVerflow not set", function() {
                beforeEach(function() {
                    $subject.Overflow = false;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BCC(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0x90, 0x10]);
            });
            context("if Carry clear", function() {
                beforeEach(function() {
                    $subject.Carry = false;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if Carry not clear", function() {
                beforeEach(function() {
                    $subject.Carry = true;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BCS(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0xB0, 0x10]);
            });
            context("if Carry set", function() {
                beforeEach(function() {
                    $subject.Carry = true;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if Carry not set", function() {
                beforeEach(function() {
                    $subject.Carry = false;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BNE(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0xD0, 0x10]);
            });
            context("if not equal (Z flag clear)", function() {
                beforeEach(function() {
                    $subject.Zero = false;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if equal (Z flag set)", function() {
                beforeEach(function() {
                    $subject.Zero = true;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe("#BEQ(relative)", function() {
            beforeEach(function() {
                $subject.ram.set([0xF0, 0x10]);
            });
            context("if equal (Z flag set)", function() {
                beforeEach(function() {
                    $subject.Zero = true;
                    $action;
                });
                it("branches", function() {
                    expect($subject.PC).to.equal(0x0012); });
                it("takes 3 cycles", function() {
                    expect($subject.cycle).to.equal(3); });
            });
            context("if not equal (Z flag clear)", function() {
                beforeEach(function() {
                    $subject.Zero = false;
                    $action;
                });
                it("continues to next opcode", function() {
                    expect($subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        
        describe("#PHA()", function() {
            beforeEach(function() {
                $subject.ram.set([0x48, 0x00]);
                $subject.A = 0x05;
                $action;
            });
            it("pushes A to the stack", function() {
                expect($subject.pullByte()).to.equal(0x05); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 3 cycles", function() { expect($subject.cycle).to.equal(3); });
        });
        describe("#PHP()", function() {
            beforeEach(function() {
                $subject.ram.set([0x08, 0x00]);
                $subject.P = 0x35;
                $action;
            });
            it("pushes P to the stack", function() {
                expect($subject.pullByte()).to.equal(0x35); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 3 cycles", function() { expect($subject.cycle).to.equal(3); });
        });
        describe("#PLA()", function() {
            beforeEach(function() {
                $subject.ram.set([0x68, 0x00]);
            });
            it("pulls A from the stack", function() {
                $subject.pushByte(0xAA);
                $action;
                expect($subject.A).to.equal(0xAA); });
            it("sets Z flag if zero", function() {
                $subject.pushByte(0x00);
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if negative", function() {
                $subject.pushByte(-1);
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
        });
        describe("#PLP()", function() {
            beforeEach(function() {
                $subject.ram.set([0x28, 0x00]);
                $subject.pushByte(0x3A);
                $action;
            });
            it("pulls P from the stack", function() {
                expect($subject.P).to.equal(0x3A); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 4 cycles", function() { expect($subject.cycle).to.equal(4); });
        });
        
        describe("#CLC()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0x18, 0x00]);
                $action;
            });
            it("clears Carry flag", function() {
                expect($subject.Carry).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#CLD()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0xD8, 0x00]);
                $action;
            });
            it("clears Decimal flag", function() {
                expect($subject.P & 0x08).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#CLI()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0x58, 0x00]);
                $action;
            });
            it("clears Interrupt Disable flag", function() {
                expect($subject.P & 0x04).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#CLV()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0xB8, 0x00]);
                $action;
            });
            it("clears Overflow flag", function() {
                expect($subject.P & 0x40).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#SEC()", function() {
            beforeEach(function() {
                $subject.ram.set([0x38, 0x00]);
                $action;
            });
            it("sets Carry flag", function() {
                expect($subject.Carry).to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#SED()", function() {
            beforeEach(function() {
                $subject.ram.set([0xF8, 0x00]);
                $action;
            });
            it("sets Decimal flag", function() {
                expect($subject.P & 0x08).to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        describe("#SEI()", function() {
            beforeEach(function() {
                $subject.ram.set([0x78, 0x00]);
                $action;
            });
            it("sets Interrupt Disable flag", function() {
                expect($subject.P & 0x04).to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() { expect($subject.cycle).to.equal(2); });
        });
        
        describe("#TAX()", function() {
            beforeEach(function() {
                $subject.ram.set([0xAA, 0x00]);
            });
            it("transfers A to X", function() {
                $subject.A = 0x0A;
                $action;
                expect($subject.X).to.equal(0x0A); });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if negative", function() {
                $subject.A = 0xFF;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#TXA()", function() {
            beforeEach(function() {
                $subject.ram.set([0x8A, 0x00]);
            });
            it("transfers X to A", function() {
                $subject.X = 0x0B;
                $action;
                expect($subject.A).to.equal(0x0B); });
            it("sets Z flag if zero", function() {
                $subject.X = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if negative", function() {
                $subject.X = 0xFF;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#TAY()", function() {
            beforeEach(function() {
                $subject.ram.set([0xA8, 0x00]);
            });
            it("transfers A to Y", function() {
                $subject.A = 0x0A;
                $action;
                expect($subject.Y).to.equal(0x0A); });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if negative", function() {
                $subject.A = 0xFF;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#TYA()", function() {
            beforeEach(function() {
                $subject.ram.set([0x98, 0x00]);
            });
            it("transfers Y to A", function() {
                $subject.Y = 0x0C;
                $action;
                expect($subject.A).to.equal(0x0C); });
            it("sets Z flag if zero", function() {
                $subject.Y = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if negative", function() {
                $subject.Y = 0xFF;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#TSX()", function() {
            beforeEach(function() {
                $subject.ram.set([0xBA, 0x00]);
            });
            it("transfers Stack Pointer to X", function() {
                $subject.SP = 0x0D;
                $action;
                expect($subject.X).to.equal(0x0D); });
            it("sets Z flag if zero", function() {
                $subject.SP = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.SP = 0xFF;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#TXS()", function() {
            beforeEach(function() {
                $subject.ram.set([0x9A, 0x00]);
            });
            it("transfers X to Stack Pointer", function() {
                $subject.X = 0x0E;
                $action;
                expect($subject.SP).to.equal(0x0E); });
            it("does not set Z flag", function() {
                $subject._X = 0x00;
                $action;
                expect($subject.Zero).not.to.be.ok; });
            it("does not set N flag", function() {
                $subject._X = 0xFF;
                $action;
                expect($subject.Negative).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        //All the addressing modes are tested here with #LDA, #LDX and #LDY
        describe("#LDA(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA9, 0x0A]);
            });
            it("loads a byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#LDA(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA5, 0x02, 0x0A]);
            });
            it("loads the addressed byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 3 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(3); });
        });
        describe("#LDA(absolute)", function() {
            beforeEach(function() {
                $subject.ram.set([0xAD, 0x03, 0x00, 0x0A]);
            });
            it("loads the addressed byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0003); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
        });
        describe("#LDA(indirectX)", function() {
            beforeEach(function() {
                $subject.X = 0x01;
                $subject.ram.set([0xA1, 0x02, 0x00, 0x05, 0x00, 0x0A]);
            });
            it("loads the addressed byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 6 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(6); });
        });
        describe("#LDA(indirectY)", function() {
            beforeEach(function() {
                $subject.Y = 0x01;
                $subject.ram.set([0xB1, 0x03, 0x00, 0x04, 0x00, 0x0A]);
            });
            it("loads the addressed byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
            it("takes 6 cycles if page crossed", function() {
                $subject.Y = 0xFF;
                $action;
                expect($subject.cycle).to.equal(6); });
        });
        describe("#LDX(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA2, 0x0B]);
            });
            it("loads a byte into X", function() {
                $action;
                expect($subject.X).to.equal(0x0B); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#LDX(zeroY)", function() {
            beforeEach(function() {
                $subject.Y = 0x01;
                $subject.ram.set([0xB6, 0x02, 0x00, 0x0B]);
            });
            it("loads the addressed byte into X", function() {
                $action;
                expect($subject.X).to.equal(0x0B); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
        });
        describe("#LDX(absoluteY)", function() {
            beforeEach(function() {
                $subject.Y = 0x01;
                $subject.ram.set([0xBE, 0x03, 0x00, 0x00, 0x0B]);
            });
            it("loads the addressed byte into X", function() {
                $action;
                expect($subject.X).to.equal(0x0B); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0003); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
            it("takes 5 cycles if page crossed", function() {
                $subject.Y = 0xFF;
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#LDY(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA0, 0x0C]);
            });
            it("loads a byte into Y", function() {
                $action;
                expect($subject.Y).to.equal(0x0C); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#LDY(zeroX)", function() {
            beforeEach(function() {
                $subject.X = 0x01;
                $subject.ram.set([0xB4, 0x02, 0x00, 0x0C]);
            });
            it("loads the addressed byte into Y", function() {
                $action;
                expect($subject.Y).to.equal(0x0C); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
        });
        describe("#LDY(absoluteX)", function() {
            beforeEach(function() {
                $subject.X = 0x01;
                $subject.ram.set([0xBC, 0x03, 0x00, 0x00, 0x0C]);
            });
            it("loads the addressed byte into Y", function() {
                $action;
                expect($subject.Y).to.equal(0x0C); });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0003); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
            it("takes 5 cycles if page crossed", function() {
                $subject.X = 0xFF;
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        
        describe("#ADC(immediate)", function() {
            beforeEach(function() {
                $subject.A = 0x10;
                $subject.ram.set([0x69, 0x08]);
            });
            it("adds a byte to A", function() {
                $action;
                expect($subject.A).to.equal(0x18); });
            it("adds the Carry bit if set", function() {
                $subject.Carry = true;
                $action;
                expect($subject.A).to.equal(0x19); });
            it("sets Zero flag if result is zero", function() {
                $subject.A = 0xF8;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
            
            //http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
            context("80 + 16 = 96", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x10-1;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("80 + 80 = 160", function() {
                beforeEach(function() {
                    $subject.P  = 0x3F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x50-1;
                    $action;
                });
                it("sets A to 0xA0",     function() { expect($subject.A).to.equal(0xA0); });
                it("clears Carry flag",  function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag", function() { expect($subject.Negative).to.be.ok; });
                it("sets oVerflow flag", function() { expect($subject.Overflow).to.be.ok; });
            });
            context("80 + -112 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x90-1;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("80 + -48 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFE;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0xD0;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("-48 + 16 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x10-1;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("-48 + 80 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFE;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x50;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("-48 + -112 = [** +96 **]", function() {
                beforeEach(function() {
                    $subject.P  = 0xBE;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x90;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("sets oVerflow flag",   function() { expect($subject.Overflow).to.be.ok; });
            });
            context("-48 + -48 = -96", function() {
                beforeEach(function() {
                    $subject.P  = 0x7E;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xD0;
                    $action;
                });
                it("sets A to 0xA0",       function() { expect($subject.A).to.equal(0xA0); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
        });
        describe("#SBC(immediate)", function() {
            beforeEach(function() {
                $subject.A = 0x50;
                $subject.Carry = true;
                $subject.ram.set([0xE9, 0x38]);
            });
            it("subtracts a byte from A", function() {
                $action;
                expect($subject.A).to.equal(0x18); });
            it("subtracts the Borrow bit (inverse of Carry)", function() {
                $subject.Carry = false;
                $action;
                expect($subject.A).to.equal(0x17); });
            it("sets Zero flag if result is zero", function() {
                $subject.A = 0x38;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
            
            //http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
            context("80 - -16 = 96", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0xF0;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("80 - -80 = [** -96 **]", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0xB0;
                    $action;
                });
                it("sets A to 0xA0",     function() { expect($subject.A).to.equal(0xA0); });
                it("clears Carry flag",  function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag", function() { expect($subject.Negative).to.be.ok; });
                it("sets oVerflow flag", function() { expect($subject.Overflow).to.be.ok; });
            });
            context("80 - 112 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x70;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("80 - 48 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x30;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("-48 - -16 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xF0;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).not.to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("-48 - -80 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xB0;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
            context("208 - 112 = 96", function() {
                beforeEach(function() {
                    $subject.P  = 0xBF;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x70;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("clears Negative flag", function() { expect($subject.Negative).not.to.be.ok; });
                it("sets oVerflow flag",   function() { expect($subject.Overflow).to.be.ok; });
            });
            context("-48 - 48 = -96", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x30;
                    $action;
                });
                it("sets A to 0xA0",       function() { expect($subject.A).to.equal(0xA0); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.ok; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.ok; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).not.to.be.ok; });
            });
        });
        
        describe("#ASL()", function() {
            beforeEach(function() {
                $subject.A = 0x55;
                $subject.ram.set([0x0A, 0x00]);
            });
            it("shifts the bits of A to the left", function() {
                $action;
                expect($subject.A).to.equal(0xAA); });
            it("sets C flag when exceeded", function() {
                $subject.A = 0x80;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.A = 0x40;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#ASL(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x06, 0x02, 0x55]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0xAA); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x80;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#LSR()", function() {
            beforeEach(function() {
                $subject.A = 0xAA;
                $subject.ram.set([0x4A, 0x00]);
            });
            it("shifts the bits of A to the right", function() {
                $action;
                expect($subject.A).to.equal(0x55); });
            it("sets C flag when exceeded", function() {
                $subject.A = 0x01;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#LSR(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x46, 0x02, 0xAA]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0x55); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x01;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#ROL()", function() {
            beforeEach(function() {
                $subject.A = 0x55;
                $subject.ram.set([0x2A, 0x00]);
            });
            it("shifts the bits of A to the left", function() {
                $action;
                expect($subject.A).to.equal(0xAA); });
            it("fills bit0 with the Carry flag", function() {
                $subject.Carry = true;
                $action;
                expect($subject.A).to.equal(0xAB); });
            it("sets C flag when exceeded", function() {
                $subject.A = 0x80;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.A = 0x40;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#ROL(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x26, 0x02, 0x55]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0xAA); });
            it("fills bit0 with the Carry flag", function() {
                $subject.Carry = true;
                $action;
                expect($subject.ram[2]).to.equal(0xAB); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x80;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#ROR()", function() {
            beforeEach(function() {
                $subject.A = 0xAA;
                $subject.ram.set([0x6A, 0x00]);
            });
            it("shifts the bits of A to the right", function() {
                $action;
                expect($subject.A).to.equal(0x55); });
            it("fills bit7 with the Carry flag", function() {
                $subject.Carry = true;
                $action;
                expect($subject.A).to.equal(0xD5); });
            it("sets C flag when exceeded", function() {
                $subject.A = 0x01;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#ROR(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x66, 0x02, 0xAA]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0x55); });
            it("fills bit7 with the Carry flag", function() {
                $subject.Carry = true;
                $action;
                expect($subject.ram[2]).to.equal(0xD5); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x01;
                $action;
                expect($subject.Carry).to.be.ok; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        
        describe("#INC(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0xE6, 0x02, 0x0F]);
            });
            it("adds one to memory location", function() {
                $action;
                expect($subject.ram[2]).to.equal(0x10); });
            it("cannot go higher than 255", function() {
                $subject.ram[2] = 0xFF;
                $action;
                expect($subject.ram[2]).to.equal(0x00); });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0xFF;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x7F;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#DEC(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0xC6, 0x02, 0x11]);
            });
            it("subtracts one from memory location", function() {
                $action;
                expect($subject.ram[2]).to.equal(0x10); });
            it("cannot go lower than 0", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.ram[2]).to.equal(0xFF); });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x01;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x81;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe("#INX()", function() {
            beforeEach(function() {
                $subject.ram.set([0xE8, 0x00]);
            });
            it("adds one to X", function() {
                $subject.X = 0x0F;
                $action;
                expect($subject.X).to.equal(0x10); });
            it("cannot go higher than 255", function() {
                $subject.X = 0xFF;
                $action;
                expect($subject.X).to.equal(0x00); });
            it("sets Z flag if zero", function() {
                $subject.X = -1;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.X = 0x7F;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#DEX()", function() {
            beforeEach(function() {
                $subject.ram.set([0xCA, 0x00]);
            });
            it("subtracts one from X", function() {
                $subject.X = 0x11;
                $action;
                expect($subject.X).to.equal(0x10); });
            it("cannot go lower than 0", function() {
                $subject.X = 0x00;
                $action;
                expect($subject.X).to.equal(0xFF); });
            it("sets Z flag if zero", function() {
                $subject.X = 1;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.X = 0x81;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#INY()", function() {
            beforeEach(function() {
                $subject.ram.set([0xC8, 0x00]);
            });
            it("adds one to Y", function() {
                $subject.Y = 0x0F;
                $action;
                expect($subject.Y).to.equal(0x10); });
            it("cannot go higher than 255", function() {
                $subject.Y = 0xFF;
                $action;
                expect($subject.Y).to.equal(0x00); });
            it("sets Z flag if zero", function() {
                $subject.Y = -1;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.Y = 0x7F;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#DEY()", function() {
            beforeEach(function() {
                $subject.ram.set([0x88, 0x00]);
            });
            it("subtracts one from Y", function() {
                $subject.Y = 0x11;
                $action;
                expect($subject.Y).to.equal(0x10); });
            it("cannot go lower than 0", function() {
                $subject.Y = 0x00;
                $action;
                expect($subject.Y).to.equal(0xFF); });
            it("sets Z flag if zero", function() {
                $subject.Y = 1;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.Y = 0x81;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe("#BIT(zero)",      function() {
            beforeEach(function() {
                $subject.ram.set([0x24, 0x02, 0x55]);
            });
            it("sets Z flag if result of the AND is zero", function() {
                $subject.A = 0xAA;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("clears Z flag if result of the AND is non-zero", function() {
                $subject.A = 0x44;
                $action;
                expect($subject.Zero).not.to.be.ok; });
            it("sets V flag if bit 6 of memory location is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.P & 0x40).to.be.ok; });
            it("sets N flag if bit 7 of memory location is set", function() {
                $subject.ram[2] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 3 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(3); });
        });
        describe("#CMP(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xC9, 0x10]);
            });
            context("when A > Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            context("when A = Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.ok; });
            });
            context("when A < Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).not.to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#CPX(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xE0, 0x10]);
            });
            context("when X > Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            context("when X = Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.ok; });
            });
            context("when X < Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).not.to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#CPY(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xC0, 0x10]);
            });
            context("when Y > Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            context("when Y = Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.ok; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.ok; });
            });
            context("when Y < Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).not.to.be.ok; });
                it("clears Z flag", function() { expect($subject.Zero).not.to.be.ok; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe("#ORA(immediate)", function() {
            beforeEach(function() {
                $subject.A = 0xAA;
                $subject.ram.set([0x09, 0x00]);
            });
            it("does an inclusive OR between A and memory location", function() {
                $subject.ram[1] = 0x0F;
                $action;
                expect($subject.A).to.equal(0xAF); });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#AND(immediate)", function() {
            beforeEach(function() {
                $subject.A = 0xAA;
                $subject.ram.set([0x29, 0x00]);
            });
            it("does a logical AND between A and memory location", function() {
                $subject.ram[1] = 0x0F;
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe("#EOR(immediate)", function() {
            beforeEach(function() {
                $subject.A = 0xAA;
                $subject.ram.set([0x49, 0x00]);
            });
            it("does an exclusive OR between A and memory location", function() {
                $subject.ram[1] = 0x0F;
                $action;
                expect($subject.A).to.equal(0xA5); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0xAA;
                $action;
                expect($subject.Zero).to.be.ok; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x7F;
                $action;
                expect($subject.Negative).to.be.ok; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe("#NOP()", function() {
            beforeEach(function() {
                $subject.ram.set([0xEA, 0x00]);
                $action;
            });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
    });
});
