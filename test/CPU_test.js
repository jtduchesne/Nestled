import { expect } from "chai";
import sinon from "sinon";

import { NES } from "../src";

describe("Cpu", function() {
    def('nes', () => new NES); /*global $nes*/
    
    subject(() => $nes.cpu);
    
    /*global $RAMData */
    def('RAMData');
    beforeEach("fill RAM", function() {
        if (isSet($RAMData))
            $subject.ram.fill($RAMData);
    });
    
    /*global $nmiVector, $resetVector, $irqVector*/
    def('nmiVector',   () => 0x1234);
    def('resetVector', () => 0x5678);
    def('irqVector',   () => 0x9ABC);
    
    //-------------------------------------------------------------------------------//
    
    its('bus', () => is.expected.to.equal($nes));
    
    its('ram',   () => is.expected.to.have.a.lengthOf(0x800));
    its('stack', () => is.expected.to.have.a.lengthOf(0x100));
    
    its('A',  () => is.expected.to.equal(0x00));
    its('X',  () => is.expected.to.equal(0x00));
    its('Y',  () => is.expected.to.equal(0x00));
    its('P',  () => is.expected.to.equal(0x30));
    its('SP', () => is.expected.to.equal(0x00));
    its('PC', () => is.expected.to.equal(0x0000));
    
    its('addressingLookup',  () => is.expected.to.be.an('array').with.a.lengthOf(256));
    its('instructionLookup', () => is.expected.to.be.an('array').with.a.lengthOf(256));
    
    its('cycle', () => is.expected.to.equal(0));
    
    its('isPowered', () => is.expected.to.be.false);
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() {
            setEveryProperties($subject);
            sinon.stub($nes.game.cartridge, 'cpuRead').returns(0xA5);
            $subject.isPowered = false;
        });
        def('action', () => $subject.powerOn());
        
        it("sets #A to 0", function() {
            expect(() => $action).to.change($subject, 'A');
            expect($subject.A).to.equal(0x00);
        });
        it("sets #X to 0", function() {
            expect(() => $action).to.change($subject, 'X');
            expect($subject.X).to.equal(0x00);
        });
        it("sets #Y to 0", function() {
            expect(() => $action).to.change($subject, 'Y');
            expect($subject.Y).to.equal(0x00);
        });
        it("sets #P to 0x34", function()  {
            expect(() => $action).to.change($subject, 'P');
            expect($subject.P).to.equal(0x34);
        });
        it("sets #SP to 0xFD", function() {
            expect(() => $action).to.change($subject, 'SP');
            expect($subject.SP).to.equal(0xFD);
        });
        it("sets #PC to the Reset Vector", function() {
            expect(() => $action).to.change($subject, 'PC');
            expect($subject.PC).to.equal(0xA5A5);
        });
        
        it("resets #cycle", function() {
            expect(() => $action).to.change($subject, 'cycle');
            expect($subject.cycle).to.equal(0);
        });
        
        it("sets #isPowered to -true-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() {
            $subject.isPowered = true;
        });
        def('action', () => $subject.powerOff());
        
        it("sets #isPowered to -false-", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
    });
    
    describe(".reset()", function() {
        beforeEach(function() {
            setEveryProperties($subject);
            sinon.stub($subject, 'resetVector').returns($resetVector);
        });
        def('action', () => $subject.reset());
        
        it("does not change #A", function() {
            expect(() => $action).not.to.change($subject, 'A');
        });
        it("does not change #X", function() {
            expect(() => $action).not.to.change($subject, 'X');
        });
        it("does not change #Y", function() {
            expect(() => $action).not.to.change($subject, 'Y');
        });
        it("sets #Interrupt", function() {
            expect(() => $action).to.change($subject, 'Interrupt');
            expect($subject.Interrupt).to.be.true;
        });
        it("adds 3 to #SP", function() {
            expect(() => $action).to.increase($subject, 'SP').by(3);
        });
        it("sets #PC to the Reset Vector", function() {
            expect(() => $action).to.change($subject, 'PC');
            expect($subject.PC).to.equal($resetVector);
        });
        
        it("does not change #isPowered", function() {
            expect(() => $action).not.to.change($subject, 'isPowered');
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Interrupts", function() {
        beforeEach(function() {
            sinon.stub($subject, 'nmiVector').returns($nmiVector);
            sinon.stub($subject, 'resetVector').returns($resetVector);
            sinon.stub($subject, 'irqVector').returns($irqVector);
        });
        
        describe(".doNMI()", function() {
            def('action', () => $subject.doNMI());
            
            it("pushes P with BRK flag cleared", function() {
                $action;
                expect($subject.pullByte() & 0x10).to.equal(0);
            });
            it("sets PC to NMI vector (at 0xFFFA)", function() {
                expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($nmiVector);
            });
        });
        describe(".doReset()", function() {
            def('action', () => $subject.doReset());
            
            it("sets PC to RESET vector (at 0xFFFC)", function() {
                expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($resetVector);
            });
        });
        describe(".doIRQ()", function() {
            def('action', () => $subject.doIRQ());
            
            it("pushes P with BRK flag cleared", function() {
                $action;
                expect($subject.pullByte() & 0x10).to.equal(0);
            });
            it("sets PC to IRQ vector (at 0xFFFE)", function() {
                expect(() => $action).to.change($subject, 'PC');
                expect($subject.PC).to.equal($irqVector);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Memory access", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
        def('RAMData', () => 0xA5); // b10100101
        
        describe(".read(address)", function() {
            it("reads from RAM when address is between [0x0000-1FFF]", function() {
                expect($subject.read(0x0000)).to.equal($RAMData);
                expect($subject.read(0x1FFF)).to.equal($RAMData);
            });
            it("reads from PPU when address is between [0x2000-3FFF]", function() {
                const stub = sinon.stub($nes.ppu, 'read');
                $subject.read(0x2000);
                $subject.read(0x3FFF);
                expect(stub).to.be.calledTwice;
            });
            it("reads from APU when address is [0x4015]", function() {
                const stub = sinon.stub($nes.apu, 'read');
                $subject.read(0x4015);
                expect(stub).to.be.calledOnce;
            });
            it("reads from Controller 1 when address is [0x4016]", function() {
                const stub = sinon.stub($nes.controllers[1], 'read');
                $subject.read(0x4016);
                expect(stub).to.be.calledOnce;
            });
            it("also reads most significant bits of addressBus (0x40)", function() {
                expect($subject.read(0x4016)).to.equal(0x40);
            });
            it("reads from Controller 2 when address is [0x4017]", function() {
                const stub = sinon.stub($nes.controllers[2], 'read');
                $subject.read(0x4017);
                expect(stub).to.be.calledOnce;
            });
            it("also reads most significant bits of addressBus (0x40)", function() {
                expect($subject.read(0x4017)).to.equal(0x40);
            });
            it("reads from Cartridge when address is between [0x6000-FFFF]", function() {
                const stub = sinon.stub($nes.game.cartridge, 'cpuRead');
                $subject.read(0x6000);
                $subject.read(0x8000);
                $subject.read(0xFFFF);
                expect(stub).to.be.calledThrice;
            });
        });
        describe(".write(address,data)", function() {
            it("writes to RAM when address is between [0x0000, 0x07FF]", function() {
                expect(() => $subject.write(0x0000, 0xFF)).to.change($subject.ram, '0');
                expect($subject.ram[0]).to.equal(0xFF);
            });
            it("writes to PPU when address is between [0x2000-3FFF]", function() {
                const stub = sinon.stub($nes.ppu, 'write');
                $subject.write(0x2000, 0xFF);
                $subject.write(0x3FFF, 0xFF);
                expect(stub).to.be.calledTwice;
            });
            it("writes to APU when address is between [0x4000-4013]", function() {
                const stub = sinon.stub($nes.apu, 'write');
                $subject.write(0x4000, 0xFF);
                $subject.write(0x4013, 0xFF);
                expect(stub).to.be.calledTwice;
            });
            it("calls PPU.doDMA() when address is [0x4014]", function() {
                const stub = sinon.stub($nes.ppu, 'doDMA');
                $subject.write(0x4014, 0xFF);
                expect(stub).to.be.calledOnceWith(0xFF00);
            });
            it("writes to APU when address is [0x4015]", function() {
                const stub = sinon.stub($nes.apu, 'write');
                $subject.write(0x4015, 0xFF);
                expect(stub).to.be.calledOnce;
            });
            it("writes (strobe) to both Controllers when address is [0x4016]", function() {
                const stub1 = sinon.stub($nes.controllers[1], 'write');
                const stub2 = sinon.stub($nes.controllers[2], 'write');
                $subject.write(0x4016, 0xFF);
                expect(stub1).to.be.calledOnceWith(0x1);
                expect(stub2).to.be.calledOnceWith(0x1);
            });
            it("writes to APU when address is [0x4017]", function() {
                const stub = sinon.stub($nes.apu, 'write');
                $subject.write(0x4017, 0xFF);
                expect(stub).to.be.calledOnce;
            });
            it("writes to Cartridge when address is between [0x6000, 0xFFFF]", function() {
                const stub = sinon.stub($nes.game.cartridge, 'cpuWrite');
                $subject.write(0x6000, 0xFF);
                $subject.write(0x8000, 0xFF);
                $subject.write(0xFFFF, 0xFF);
                expect(stub).to.be.calledThrice;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Stack", function() {
        beforeEach(function() {
            $subject.SP = 0xFF;
        });
        
        /*global $pushOnce, $pushTwice */
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
        
        /*global $pullOnce, $pullTwice */
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
        describe("#Carry", function() {
            it("is -true- if Carry flag is set", function() {
                $subject.P = 0x01;
                expect($subject.Carry).to.be.true; });
            it("is -false- if Carry flag is clear", function() {
                $subject.P = ~0x01;
                expect($subject.Carry).to.be.false; });
        });
        describe("#Zero", function() {
            it("is -true- if Zero flag is set", function() {
                $subject.P = 0x02;
                expect($subject.Zero).to.be.true; });
            it("is -false- if Zero flag is clear", function() {
                $subject.P = ~0x02;
                expect($subject.Zero).to.be.false; });
        });
        describe("#Interrupt", function() {
            it("is -true- if Interrupt Disable flag is set", function() {
                $subject.P = 0x04;
                expect($subject.Interrupt).to.be.true; });
            it("is -false- if Interrupt Disable flag is clear", function() {
                $subject.P = ~0x04;
                expect($subject.Interrupt).to.be.false; });
        });
        describe("#Decimal", function() {
            it("is -true- if Decimal flag is set", function() {
                $subject.P = 0x08;
                expect($subject.Decimal).to.be.true; });
            it("is -false- if Decimal flag is clear", function() {
                $subject.P = ~0x08;
                expect($subject.Decimal).to.be.false; });
        });
        describe("#Overflow", function() {
            it("is -true- if Overflow flag is set", function() {
                $subject.P = 0x40;
                expect($subject.Overflow).to.be.true; });
            it("is -false- if Overflow flag is clear", function() {
                $subject.P = ~0x40;
                expect($subject.Overflow).to.be.false; });
        });
        describe("#Negative", function() {
            it("is -true- if Negative flag is set", function() {
                $subject.P = 0x80;
                expect($subject.Negative).to.be.true; });
            it("is -false- if Negative flag is clear", function() {
                $subject.P = ~0x80;
                expect($subject.Negative).to.be.false; });
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
                expect($subject.P & 0x80).to.be.ok;
                $subject.Negative = false;
                expect($subject.P & 0x80).not.to.be.ok;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Arithmetic Logic Unit", function() {
        /*global $value */
        
        describe(".ALU(value)", function() {
            def('action', () => $subject.ALU($value));
            
            context("when value > 0xFF", function() {
                def('value', () => 0x199);
                
                it("sets #Carry", function() {
                    expect(() => $action).to.change($subject, 'Carry');
                    expect($subject.Carry).to.be.true;
                });
                it("returns a wrapped byte value", function() {
                    expect($action).to.equal(0x99);
                });
            });
            context("when value > 0x80", function() {
                def('value', () => 0xF6);
                
                it("sets #Negative", function() {
                    expect(() => $action).to.change($subject, 'Negative');
                    expect($subject.Negative).to.be.true;
                });
                it("returns the same value", function() {
                    expect($action).to.equal(0xF6);
                });
            });
            context("when value < 0", function() {
                def('value', () => -10);
                
                it("sets #Negative", function() {
                    expect(() => $action).to.change($subject, 'Negative');
                    expect($subject.Negative).to.be.true;
                });
                it("returns a wrapped unsigned byte value", function() {
                    expect($action).to.equal(0xF6);
                });
            });
            context("when value = 0", function() {
                def('value', () => 0);
                
                it("sets #Zero", function() {
                    expect(() => $action).to.change($subject, 'Zero');
                    expect($subject.Zero).to.be.true;
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Addressing modes", function() {
        def('PC', () => 0x0010); /*global $PC */
        
        beforeEach(function() {
            $subject.PC = $PC;
        });
        
        describe(".imp(implied)", function() {
            it("does not increment PC", function() {
                expect(() => $subject.imp()).not.to.change($subject, 'PC'); });
        });
        describe(".imm()", function() {
            it("increments PC", function() {
                expect(() => $subject.imm()).to.increase($subject, 'PC').by(1); });
            it("returns operand's address", function() {
                expect($subject.imm()).to.equal($PC); });
        });
        
        describe(".rel()", function() {
            it("increments PC", function() {
                expect(() => $subject.rel()).to.increase($subject, 'PC').by(1); });
            it("returns PC plus the signed operand", function() {
                $subject.operand = 0x01;
                expect($subject.rel()).to.equal($subject.PC +1);
                $subject.operand = 0xFF;
                expect($subject.rel()).to.equal($subject.PC -1);
            });
        });
        
        context("Zero Page", function() {
            beforeEach(function() {
                $subject.ram[$PC] = 0x80;
                $subject.operand = $subject.read($subject.PC);
            });
            
            describe(".zero()", function() {
                it("increments PC", function() {
                    expect(() => $subject.zero()).to.increase($subject, 'PC').by(1); });
                it("returns the operand", function() {
                    expect($subject.zero()).to.equal(0x0080); });
            });
            describe(".zeroX()", function() {
                it("increments PC", function() {
                    expect(() => $subject.zeroX()).to.increase($subject, 'PC').by(1); });
                it("returns the operand + X", function() {
                    $subject.X = 0x18;
                    expect($subject.zeroX()).to.equal(0x0098); });
                it("cannot go out of memory page 0 (0x0000-00FF)", function() {
                    $subject.X = 0x88;
                    expect($subject.zeroX()).to.equal(0x0008); });
            });
            describe(".zeroY()", function() {
                it("increments PC", function() {
                    expect(() => $subject.zeroY()).to.increase($subject, 'PC').by(1); });
                it("returns the operand + Y", function() {
                    $subject.Y = 0x18;
                    expect($subject.zeroY()).to.equal(0x0098); });
                it("cannot go out of memory page 0 (0x0000-00FF)", function() {
                    $subject.Y = 0x88;
                    expect($subject.zeroY()).to.equal(0x0008); });
            });
        });
        
        context("Absolute", function() {
            beforeEach(function() {
                $subject.ram.set([0x34,0x12], $PC);
                $subject.operand = $subject.read($subject.PC);
            });
            
            describe(".abs()", function() {
                it("increments PC twice", function() {
                    expect(() => $subject.abs()).to.increase($subject, 'PC').by(2); });
                it("returns the operand(word)", function() {
                    expect($subject.abs()).to.equal(0x1234); });
            });
            describe(".absX()", function() {
                it("increments PC twice", function() {
                    expect(() => $subject.absX()).to.increase($subject, 'PC').by(2); });
                it("returns the operand(word) + X", function() {
                    $subject.X = 0x11;
                    expect($subject.absX()).to.equal(0x1245); });
                it("takes 1 cycle if it crosses a memory page", function() {
                    $subject.X = 0xDD;
                    expect(() => $subject.absX()).to.increase($subject, 'cycle').by(1);
                    expect($subject.absX()).to.equal(0x1311); });
            });
            describe(".absY()", function() {
                it("increments PC twice", function() {
                    expect(() => $subject.absY()).to.increase($subject, 'PC').by(2); });
                it("returns the operand(word) + Y", function() {
                    $subject.Y = 0x22;
                    expect($subject.absY()).to.equal(0x1256); });
                it("takes 1 cycle if it crosses a memory page", function() {
                    $subject.Y = 0xEE;
                    expect(() => $subject.absY()).to.increase($subject, 'cycle').by(1);
                    expect($subject.absY()).to.equal(0x1322); });
            });
        });
        
        context("Indirect", function() {
            beforeEach(function() {
                $subject.ram.set([$PC+2,0x00,0xDC,0xFE,0x98,0xBA], $PC);
                $subject.operand = $subject.read($subject.PC);
            });
            
            describe(".ind()", function() {
                it("increments PC twice", function() {
                    expect(() => $subject.ind()).to.increase($subject, 'PC').by(2); });
                it("returns the address read at [operand(word)]", function() {
                    expect($subject.ind()).to.equal(0xFEDC); });
            });
            describe(".indX()", function() {
                it("increments PC", function() {
                    expect(() => $subject.indX()).to.increase($subject, 'PC').by(1); });
                it("returns the address read at [operand(byte + X)]", function() {
                    $subject.X = 0x02;
                    expect($subject.indX()).to.equal(0xBA98); });
            });
            describe(".indY()", function() {
                it("increments PC", function() {
                    expect(() => $subject.indY()).to.increase($subject, 'PC').by(1); });
                it("returns (the address read at [operand(byte)]) + Y", function() {
                    $subject.Y = 0x02;
                    expect($subject.indY()).to.equal(0xFEDE); });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Instructions", function() {
        def('action', () => $subject.doInstruction());
        
        it("never throws an error", function() {
            for (let i=0; i<256; i++)
                $subject.ram[0x200+i] = i;
            
            for (let i=0x0200; i<0x0300; i++) {
                $subject.PC = i;
                expect(() => $subject.doInstruction()).not.to.throw();
            }
        });
        
        describe(".BRK()", function() {
            beforeEach(function() {
                sinon.stub($subject, 'irqVector').returns($irqVector);
                $subject.ram.set([0x00, 0x00]);
                $action;
            });
            it("pushes P to the stack with B flag set", function() {
                expect($subject.pullByte() & 0x10).to.be.ok;
            });
            it("pushes PC of the next opcode to the stack", function() {
                $subject.pullByte(); //Pull P first...
                expect($subject.pullWord()).to.equal(0x0002);
            });
            it("sets I flag", function() {
                expect($subject.Interrupt).to.be.true;
            });
            it("sets PC to the address at 0xFFFE", function() {
                expect($subject.PC).to.equal($irqVector); });
            it("takes 7 cycles", function() {
                expect($subject.cycle).to.equal(7); });
        });
        describe(".RTI()", function() {
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
        describe(".JSR(absolute)", function() {
            beforeEach(function() {
                $subject.ram.set([0x20, 0x34, 0x12]);
                $action;
            });
            it("pushes PC (before the second byte of operand) to the stack", function() {
                expect($subject.pullWord()).to.equal(0x0002); });
            it("sets PC to the operand", function() {
                expect($subject.PC).to.equal(0x1234); });
            it("takes 6 cycles", function() {
                expect($subject.cycle).to.equal(6); });
        });
        describe(".RTS()", function() {
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
        describe(".JMP(absolute)", function() {
            beforeEach(function() {
                $subject.ram.set([0x4C, 0x34, 0x12]);
                $action;
            });
            it("sets PC to the operand", function() {
                expect($subject.PC).to.equal(0x1234); });
            it("takes 3 cycles", function() {
                expect($subject.cycle).to.equal(3); });
        });
        describe(".JMP(indirect)", function() {
            beforeEach(function() {
                $subject.ram.set([0x6C, 0x03, 0x00, 0x78, 0x56]);
                $action;
            });
            it("sets PC to the address given by the operand", function() {
                expect($subject.PC).to.equal(0x5678); });
            it("takes 5 cycles", function() {
                expect($subject.cycle).to.equal(5); });
        });
        
        describe(".BPL(relative)", function() {
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
                it("takes 2 cycles", function() {
                    expect($subject.cycle).to.equal(2); });
            });
        });
        describe(".BMI(relative)", function() {
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
        describe(".BVC(relative)", function() {
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
        describe(".BVS(relative)", function() {
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
        describe(".BCC(relative)", function() {
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
        describe(".BCS(relative)", function() {
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
        describe(".BNE(relative)", function() {
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
        describe(".BEQ(relative)", function() {
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
        
        describe(".PHA()", function() {
            beforeEach(function() {
                $subject.ram.set([0x48, 0x00]);
                $subject.A = 0x05;
                $action;
            });
            it("pushes A to the stack", function() {
                expect($subject.pullByte()).to.equal(0x05); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 3 cycles", function() {
                expect($subject.cycle).to.equal(3); });
        });
        describe(".PHP()", function() {
            beforeEach(function() {
                $subject.ram.set([0x08, 0x00]);
                $subject.P = 0x35;
                $action;
            });
            it("pushes P to the stack", function() {
                expect($subject.pullByte()).to.equal(0x35); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 3 cycles", function() {
                expect($subject.cycle).to.equal(3); });
        });
        describe(".PLA()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if negative", function() {
                $subject.pushByte(0xFF);
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 4 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(4); });
        });
        describe(".PLP()", function() {
            beforeEach(function() {
                $subject.ram.set([0x28, 0x00]);
                $subject.pushByte(0x3A);
                $action;
            });
            it("pulls P from the stack", function() {
                expect($subject.P).to.equal(0x3A); });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 4 cycles", function() {
                expect($subject.cycle).to.equal(4); });
        });
        
        describe(".CLC()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0x18, 0x00]);
                $action;
            });
            it("clears Carry flag", function() {
                expect($subject.Carry).not.to.be.true; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".CLD()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0xD8, 0x00]);
                $action;
            });
            it("clears Decimal flag", function() {
                expect($subject.P & 0x08).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".CLI()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0x58, 0x00]);
                $action;
            });
            it("clears Interrupt Disable flag", function() {
                expect($subject.P & 0x04).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".CLV()", function() {
            beforeEach(function() {
                $subject.P = 0xFF;
                $subject.ram.set([0xB8, 0x00]);
                $action;
            });
            it("clears Overflow flag", function() {
                expect($subject.P & 0x40).not.to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".SEC()", function() {
            beforeEach(function() {
                $subject.ram.set([0x38, 0x00]);
                $action;
            });
            it("sets Carry flag", function() {
                expect($subject.Carry).to.be.true; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".SED()", function() {
            beforeEach(function() {
                $subject.ram.set([0xF8, 0x00]);
                $action;
            });
            it("sets Decimal flag", function() {
                expect($subject.P & 0x08).to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        describe(".SEI()", function() {
            beforeEach(function() {
                $subject.ram.set([0x78, 0x00]);
                $action;
            });
            it("sets Interrupt Disable flag", function() {
                expect($subject.P & 0x04).to.be.ok; });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        
        describe(".TAX()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if negative", function() {
                $subject.A = 0xFF;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".TXA()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if negative", function() {
                $subject.X = 0xFF;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".TAY()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if negative", function() {
                $subject.A = 0xFF;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".TYA()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if negative", function() {
                $subject.Y = 0xFF;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".TSX()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.SP = 0xFF;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".TXS()", function() {
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
                expect($subject.Zero).not.to.be.true; });
            it("does not set N flag", function() {
                $subject._X = 0xFF;
                $action;
                expect($subject.Negative).not.to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        //All the addressing modes are tested here with .LDA, .LDX and .LDY
        describe(".LDA(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA9, 0x0A]);
            });
            it("loads a byte into A", function() {
                $action;
                expect($subject.A).to.equal(0x0A); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".LDA(zero)", function() {
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
        describe(".LDA(absolute)", function() {
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
        describe(".LDA(indirectX)", function() {
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
        describe(".LDA(indirectY)", function() {
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
        describe(".LDX(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA2, 0x0B]);
            });
            it("loads a byte into X", function() {
                $action;
                expect($subject.X).to.equal(0x0B); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".LDX(zeroY)", function() {
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
        describe(".LDX(absoluteY)", function() {
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
        describe(".LDY(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xA0, 0x0C]);
            });
            it("loads a byte into Y", function() {
                $action;
                expect($subject.Y).to.equal(0x0C); });
            it("sets Z flag if zero", function() {
                $subject.ram[1] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".LDY(zeroX)", function() {
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
        describe(".LDY(absoluteX)", function() {
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
        
        describe(".ADC(immediate)", function() {
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
                expect($subject.Zero).to.be.true; });
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
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("80 + 80 = 160", function() {
                beforeEach(function() {
                    $subject.P  = 0x3F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x50-1;
                    $action;
                });
                it("sets A to 0xA0",     function() { expect($subject.A).to.equal(0xA0); });
                it("clears Carry flag",  function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag", function() { expect($subject.Negative).to.be.true; });
                it("sets oVerflow flag", function() { expect($subject.Overflow).to.be.true; });
            });
            context("80 + -112 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x90-1;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("80 + -48 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFE;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0xD0;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("-48 + 16 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x10-1;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("-48 + 80 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFE;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x50;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("-48 + -112 = [** +96 **]", function() {
                beforeEach(function() {
                    $subject.P  = 0xBE;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x90;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("sets oVerflow flag",   function() { expect($subject.Overflow).to.be.true; });
            });
            context("-48 + -48 = -96", function() {
                beforeEach(function() {
                    $subject.P  = 0x7E;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xD0;
                    $action;
                });
                it("sets A to 0xA0",       function() { expect($subject.A).to.equal(0xA0); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
        });
        describe(".SBC(immediate)", function() {
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
                expect($subject.Zero).to.be.true; });
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
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("80 - -80 = [** -96 **]", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0xB0;
                    $action;
                });
                it("sets A to 0xA0",     function() { expect($subject.A).to.equal(0xA0); });
                it("clears Carry flag",  function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag", function() { expect($subject.Negative).to.be.true; });
                it("sets oVerflow flag", function() { expect($subject.Overflow).to.be.true; });
            });
            context("80 - 112 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x70;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("80 - 48 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0x50;
                    $subject.ram[1] = 0x30;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("-48 - -16 = -32", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xF0;
                    $action;
                });
                it("sets A to 0xE0",       function() { expect($subject.A).to.equal(0xE0); });
                it("clears Carry flag",    function() { expect($subject.Carry).to.be.false; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("-48 - -80 = 32", function() {
                beforeEach(function() {
                    $subject.P  = 0xFF;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0xB0;
                    $action;
                });
                it("sets A to 0x20",       function() { expect($subject.A).to.equal(0x20); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
            context("208 - 112 = 96", function() {
                beforeEach(function() {
                    $subject.P  = 0xBF;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x70;
                    $action;
                });
                it("sets A to 0x60",       function() { expect($subject.A).to.equal(0x60); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("clears Negative flag", function() { expect($subject.Negative).to.be.false; });
                it("sets oVerflow flag",   function() { expect($subject.Overflow).to.be.true; });
            });
            context("-48 - 48 = -96", function() {
                beforeEach(function() {
                    $subject.P  = 0x7F;
                    $subject.A  = 0xD0;
                    $subject.ram[1] = 0x30;
                    $action;
                });
                it("sets A to 0xA0",       function() { expect($subject.A).to.equal(0xA0); });
                it("sets Carry flag",      function() { expect($subject.Carry).to.be.true; });
                it("sets Negative flag",   function() { expect($subject.Negative).to.be.true; });
                it("clears oVerflow flag", function() { expect($subject.Overflow).to.be.false; });
            });
        });
        
        describe(".ASL()", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.A = 0x40;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".ASL(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x06, 0x02, 0x55]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0xAA); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x80;
                $action;
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe(".LSR()", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".LSR(zero)", function() {
            beforeEach(function() {
                $subject.ram.set([0x46, 0x02, 0xAA]);
            });
            it("shifts the bits of memory location to the left", function() {
                $action;
                expect($subject.ram[2]).to.equal(0x55); });
            it("sets C flag when exceeded", function() {
                $subject.ram[2] = 0x01;
                $action;
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe(".ROL()", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.A = 0x40;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".ROL(zero)", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe(".ROR()", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.A = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".ROR(zero)", function() {
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
                expect($subject.Carry).to.be.true; });
            it("sets Z flag if zero", function() {
                $subject.ram[2] = 0x00;
                $action;
                expect($subject.Zero).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        
        describe(".INC(zero)", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x7F;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe(".DEC(zero)", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[2] = 0x81;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 5 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(5); });
        });
        describe(".INX()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.X = 0x7F;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".DEX()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.X = 0x81;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".INY()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.Y = 0x7F;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".DEY()", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.Y = 0x81;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe(".BIT(zero)",      function() {
            beforeEach(function() {
                $subject.ram.set([0x24, 0x02, 0x55]);
            });
            it("sets Z flag if result of the AND is zero", function() {
                $subject.A = 0xAA;
                $action;
                expect($subject.Zero).to.be.true; });
            it("clears Z flag if result of the AND is non-zero", function() {
                $subject.A = 0x44;
                $action;
                expect($subject.Zero).to.be.false; });
            it("sets V flag if bit 6 of memory location is set", function() {
                $subject.ram[2] = 0x40;
                $action;
                expect($subject.Overflow).to.be.true; });
            it("sets N flag if bit 7 of memory location is set", function() {
                $subject.ram[2] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 3 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(3); });
        });
        describe(".CMP(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xC9, 0x10]);
            });
            context("when A > Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            context("when A = Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.true; });
            });
            context("when A < Memory", function() {
                beforeEach(function() {
                    $subject.A = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).to.be.false; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".CPX(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xE0, 0x10]);
            });
            context("when X > Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            context("when X = Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.true; });
            });
            context("when X < Memory", function() {
                beforeEach(function() {
                    $subject.X = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).to.be.false; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".CPY(immediate)", function() {
            beforeEach(function() {
                $subject.ram.set([0xC0, 0x10]);
            });
            context("when Y > Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x18;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            context("when Y = Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x10;
                    $action;
                });
                it("sets C flag",   function() { expect($subject.Carry).to.be.true; });
                it("sets Z flag",   function() { expect($subject.Zero).to.be.true; });
            });
            context("when Y < Memory", function() {
                beforeEach(function() {
                    $subject.Y = 0x08;
                    $action;
                });
                it("clears C flag", function() { expect($subject.Carry).to.be.false; });
                it("clears Z flag", function() { expect($subject.Zero).to.be.false; });
            });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe(".ORA(immediate)", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".AND(immediate)", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x80;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        describe(".EOR(immediate)", function() {
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
                expect($subject.Zero).to.be.true; });
            it("sets N flag if bit 7 is set", function() {
                $subject.ram[1] = 0x7F;
                $action;
                expect($subject.Negative).to.be.true; });
            it("sets PC to the next opcode", function() {
                $action;
                expect($subject.PC).to.equal(0x0002); });
            it("takes 2 cycles", function() {
                $action;
                expect($subject.cycle).to.equal(2); });
        });
        
        describe(".NOP()", function() {
            beforeEach(function() {
                $subject.ram.set([0xEA, 0x00]);
                $action;
            });
            it("sets PC to the next opcode", function() {
                expect($subject.PC).to.equal(0x0001); });
            it("takes 2 cycles", function() {
                expect($subject.cycle).to.equal(2); });
        });
        
        describe(".doInstruction()", function() {
            beforeEach(function() {
                $subject.ram[0x000] = 0x6C; // JMP indirect
                $subject.ram.set([0x23, 0x01], 0x001);
                $subject.ram.set([0x67, 0x45], 0x123);
                $subject.PC = 0x0000;
            });
            def('action', () => $subject.doInstruction());
            
            it("sets #opcode", function() {
                expect(() => $action).to.change($subject, 'opcode');
                expect($subject.opcode).to.equal(0x6C);
            });
            it("sets #operand", function() {
                expect(() => $action).to.change($subject, 'operand');
                expect($subject.operand).to.equal(0x0123);
            });
            it("sets #addressBus", function() {
                expect(() => $action).to.change($subject, 'addressBus');
                expect($subject.addressBus).to.equal(0x4567);
            });
            it("increases #cycle", function() {
                expect(() => $action).to.increase($subject, 'cycle');
            });
        });
    });
});

function setEveryProperties(instance) {
    instance.A  = 0xFF;
    instance.X  = 0xFF;
    instance.Y  = 0xFF;
    instance.P  = 0xF0;
    instance.SP = 0x7F;
    instance.PC = 0xFFFF;
    
    instance.cycle = 1234;
}
