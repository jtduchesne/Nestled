import { expect } from "chai";
import sinon from "sinon";

import NES from "../src";

import { NROM } from "../src/Cartridges/Mappers";

describe("Ppu", function() {
    def('nes', () => new NES); /*global $nes */
    
    subject(() => $nes.ppu);
    
    /*global $cartridge*/
    def('cartridge', () => $nes.cartConnector.cartridge);
    
    /*global $VRAMData, $VRAM0Data, $VRAM1Data */
    def(['VRAMData','VRAM0Data','VRAM1Data']);
    beforeEach("fill VRAM", function() {
        if ([$VRAMData, $VRAM0Data, $VRAM1Data].some(isSet)) {
            $subject.vram[0].fill($VRAM0Data || $VRAMData || 0);
            $subject.vram[1].fill($VRAM1Data || $VRAMData || 0);
        }
    });
    
    /*global $PalData, $bkgPalData, $sprPalData */
    def(['PalData','bkgPalData','sprPalData']);
    beforeEach("fill Palettes", function() {
        if ([$PalData, $bkgPalData, $sprPalData].some(isSet)) {
            $subject.palette[0].fill($bkgPalData || $PalData || 0);
            $subject.palette[1].fill($sprPalData || $PalData || 0);
        }
    });
    
    //-------------------------------------------------------------------------------//
    
    its('bus', () => is.expected.to.equal($nes));
    
    its('ntsc', () => is.expected.to.be.true);
    
    its('vram', () => is.expected.to.be.an('array').with.a.lengthOf(2));
    its('vram', () => is.expected.to.have.property('0').with.a.lengthOf(0x400));
    its('vram', () => is.expected.to.have.property('1').with.a.lengthOf(0x400));
    
    its('palette', () => is.expected.to.be.an('array').with.a.lengthOf(2));
    its('palette', () => is.expected.to.have.property('0').with.a.lengthOf(0x10));
    its('palette', () => is.expected.to.have.property('1').with.a.lengthOf(0x10));
    
    its('addressIncrement', () => is.expected.to.equal(1));
    its('sprPatternTable',  () => is.expected.to.equal(0x0000));
    its('bkgPatternTable',  () => is.expected.to.equal(0x0000));
    its('sprite8x16',       () => is.expected.to.be.false);
    its('nmiEnabled',       () => is.expected.to.be.false);
    its('spriteHeight',     () => is.expected.to.equal(8));
    
    its('grayscale',        () => is.expected.to.be.false);
    its('showLeftMostBkg',  () => is.expected.to.be.false);
    its('showLeftMostSpr',  () => is.expected.to.be.false);
    its('showBackground',   () => is.expected.to.be.false);
    its('showSprites',      () => is.expected.to.be.false);
    its('emphasizeRed',     () => is.expected.to.be.false);
    its('emphasizeGreen',   () => is.expected.to.be.false);
    its('emphasizeBlue',    () => is.expected.to.be.false);
    its('renderingEnabled', () => is.expected.to.be.false);
    
    its('spriteOverflow', () => is.expected.to.be.false);
    its('sprite0Hit',     () => is.expected.to.be.false);
    its('vblank',         () => is.expected.to.be.false);
    
    its('oamPrimary',   () => is.expected.to.have.a.lengthOf(256));
    its('oamAddress',   () => is.expected.to.equal(0x00));
    its('oamSecondary', () => is.expected.to.have.a.lengthOf(32));
    its('oamIndex',     () => is.expected.to.equal(0x00));
    
    its('fineScrollX', () => is.expected.to.equal(0x0));
    its('fineScrollY', () => is.expected.to.equal(0x0));
    its('writeToggle', () => is.expected.to.be.false);
    
    its('addressBus',    () => is.expected.to.equal(0x0000));
    its('addressBuffer', () => is.expected.to.equal(0x0000));
    
    its('readBuffer', () => is.expected.to.equal(0x00));
    
    its('isPowered', () => is.expected.to.be.false);
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() {
            sinon.stub($nes.videoOutput, 'start');
            setEveryProperties($subject);
            $subject.isPowered = false;
        });
        
        def('action', () => $subject.powerOn());
        
        it("resets everything in Control Register", function() {
            expect(() => $action).to.change($subject, 'addressIncrement');
            expect($subject.addressIncrement).to.equal(1);
            expect($subject.sprPatternTable).to.equal(0x0000);
            expect($subject.bkgPatternTable).to.equal(0x0000);
            expect($subject.sprite8x16).to.be.false;
            expect($subject.nmiEnabled).to.be.false;
            expect($subject.spriteHeight).to.equal(8);
        });
        it("resets everything in Mask Register", function() {
            expect(() => $action).to.change($subject, 'grayscale');
            expect($subject.grayscale).to.be.false;
            expect($subject.showLeftMostBkg).to.be.false;
            expect($subject.showLeftMostSpr).to.be.false;
            expect($subject.showBackground).to.be.false;
            expect($subject.showSprites).to.be.false;
            expect($subject.emphasizeRed).to.be.false;
            expect($subject.emphasizeGreen).to.be.false;
            expect($subject.emphasizeBlue).to.be.false;
            expect($subject.renderingEnabled).to.be.false;
        });
        it("clears #sprite0Hit", function() {
            expect(() => $action).to.change($subject, 'sprite0Hit');
            expect($subject.sprite0Hit).to.be.false;
        });
        it("clears #oamAddress", function() {
            expect(() => $action).to.change($subject, 'oamAddress');
            expect($subject.oamAddress).to.equal(0x00);
        });
        it("clears Scroll Register", function() {
            expect(() => $action).to.change($subject, 'fineScrollX');
            expect($subject.fineScrollX).to.equal(0x0);
            expect($subject.fineScrollY).to.equal(0x0);
        });
        it("clears Address Register", function() {
            expect(() => $action).to.change($subject, 'addressBus');
            expect($subject.addressBus).to.equal(0x0000);
        });
        it("clears #writeToggle", function() {
            expect(() => $action).to.change($subject, 'writeToggle');
            expect($subject.writeToggle).to.be.false;
        });
        it("clears #readBuffer", function() {
            expect(() => $action).to.change($subject, 'readBuffer');
            expect($subject.readBuffer).to.equal(0x00);
        });
        
        it("starts the videoOutput", function() {
            $action;
            expect($nes.videoOutput.start).to.be.calledOnce;
        });
        it("sets #isPowered", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() {
            sinon.stub($nes.videoOutput, 'stop');
            $subject.isPowered = true;
        });
        
        def('action', () => $subject.powerOff());
        
        it("stops the videoOutput", function() {
            $action;
            expect($nes.videoOutput.stop).to.be.calledOnce;
        });
        it("clears #isPowered", function() {
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
    });
    
    describe(".reset()", function() {
        beforeEach(function() {
            setEveryProperties($subject);
        });
        
        def('action', () => $subject.reset());
        
        it("resets everything in Control Register", function() {
            expect(() => $action).to.change($subject, 'addressIncrement');
            expect($subject.addressIncrement).to.equal(1);
            expect($subject.sprPatternTable).to.equal(0x0000);
            expect($subject.bkgPatternTable).to.equal(0x0000);
            expect($subject.sprite8x16).to.be.false;
            expect($subject.nmiEnabled).to.be.false;
            expect($subject.spriteHeight).to.equal(8);
        });
        it("resets everything in Mask Register", function() {
            expect(() => $action).to.change($subject, 'grayscale');
            expect($subject.grayscale).to.be.false;
            expect($subject.showLeftMostBkg).to.be.false;
            expect($subject.showLeftMostSpr).to.be.false;
            expect($subject.showBackground).to.be.false;
            expect($subject.showSprites).to.be.false;
            expect($subject.emphasizeRed).to.be.false;
            expect($subject.emphasizeGreen).to.be.false;
            expect($subject.emphasizeBlue).to.be.false;
            expect($subject.renderingEnabled).to.be.false;
        });
        it("does not clear #vblank", function() {
            expect(() => $action).not.to.change($subject, 'vblank');
            expect($subject.vblank).to.be.true;
        });
        it("does not clear #oamAddress", function() {
            expect(() => $action).not.to.change($subject, 'oamAddress');
        });
        it("clears Scroll Register", function() {
            expect(() => $action).to.change($subject, 'fineScrollX');
            expect($subject.fineScrollX).to.equal(0x0);
            expect($subject.fineScrollY).to.equal(0x0);
        });
        it("does not clear Address Register", function() {
            expect(() => $action).not.to.change($subject, 'addressBus');
        });
        it("clears #writeToggle", function() {
            expect(() => $action).to.change($subject, 'writeToggle');
            expect($subject.writeToggle).to.be.false;
        });
        it("clears #readBuffer", function() {
            expect(() => $action).to.change($subject, 'readBuffer');
            expect($subject.readBuffer).to.equal(0x00);
        });
        it("does not clear palette data", function() {
            expect(() => $action).not.to.change($subject.palette[0], '0');
            expect($subject.palette[0][0]).to.be.greaterThan(0x00);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("VBlank", function() {
        describe(".doVBlank()", function() {
            beforeEach(function() {
                sinon.stub($nes.cpu, 'doNMI');
            });
            def('action', () => $subject.doVBlank());
            
            context("when #nmiEnabled is clear", function() {
                beforeEach(() => { $subject.nmiEnabled = false; });
                
                it("sets #vblank", function() {
                    expect(() => $action).to.change($subject, 'vblank');
                    expect($subject.vblank).to.be.true;
                });
                it("does not call cpu.doNMI()", function() {
                    $action;
                    expect($nes.cpu.doNMI).not.to.be.called;
                });
            });
            context("when #nmiEnabled is set", function() {
                beforeEach(() => { $subject.nmiEnabled = true; });
                
                it("sets #vblank", function() {
                    expect(() => $action).to.change($subject, 'vblank');
                    expect($subject.vblank).to.be.true;
                });
                it("calls cpu.doNMI()", function() {
                    $action;
                    expect($nes.cpu.doNMI).to.be.calledOnce;
                });
            });
        });
        describe(".endVBlank()", function() {
            beforeEach(function() {
                $subject.spriteOverflow = true;
                $subject.sprite0Hit = true;
                $subject.vblank = true;
            });
            def('action', () => $subject.endVBlank());
            
            it("resets #spriteOverflow", function() {
                expect(() => $action).to.change($subject, 'spriteOverflow');
                expect($subject.spriteOverflow).to.be.false;
            });
            it("resets #sprite0Hit", function() {
                expect(() => $action).to.change($subject, 'sprite0Hit');
                expect($subject.sprite0Hit).to.be.false;
            });
            it("resets #vblank", function() {
                expect(() => $action).to.change($subject, 'vblank');
                expect($subject.vblank).to.be.false;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("DMA", function() {
        describe(".doDMA(address)", function() {
            beforeEach(function() {
                sinon.stub($nes.cpu, 'read').returns(0xFF);
            });
            def('action', () => $subject.doDMA(0xFF00));
            
            it("calls cpu.read(address) 256 times, incrementing address each time", function() {
                $action;
                expect($nes.cpu.read.callCount).to.equal(256);
                expect($nes.cpu.read.firstCall).to.be.calledWith(0xFF00);
                expect($nes.cpu.read.lastCall).to.be.calledWith(0xFFFF);
            });
            it("sets all OAM bytes", function() {
                expect(() => $action).to.change($subject.oamPrimary, '0');
                expect($subject.oamPrimary).not.to.contain([0x00]);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Registers", function() {
        describe("#control =", function() {
            def('action', () => (value) => { $subject.control = value; });
            
            it("sets bit10+11 of #addressBuffer", function() {
                expect(() => $action(0x03)).to.change($subject, 'addressBuffer');
                expect($subject.addressBuffer).to.equal(0x0C00);
            });
            it("does not touch the remaining bits of #addressBuffer", function() {
                $subject.addressBuffer = 0x3FFF;
                expect(() => $action(0x00)).to.change($subject, 'addressBuffer');
                expect($subject.addressBuffer).to.equal(0x33FF);
            });
            
            it("sets #addressIncrement", function() {
                expect(() => $action(0x04)).to.change($subject, 'addressIncrement');
                expect($subject.addressIncrement).to.equal(32);
            });
            it("sets #sprPatternTable", function() {
                expect(() => $action(0x08)).to.change($subject, 'sprPatternTable');
                expect($subject.sprPatternTable).to.equal(0x1000);
            });
            it("sets #bkgPatternTable", function() {
                expect(() => $action(0x10)).to.change($subject, 'bkgPatternTable');
                expect($subject.bkgPatternTable).to.equal(0x1000);
            });
            it("sets #sprite8x16", function() {
                expect(() => $action(0x20)).to.change($subject, 'sprite8x16');
                expect($subject.sprite8x16).to.be.true;
            });
            it("sets #nmiEnabled", function() {
                expect(() => $action(0x80)).to.change($subject, 'nmiEnabled');
                expect($subject.nmiEnabled).to.be.true;
            });
        });
        
        describe("#mask =", function() {
            def('action', () => (value) => { $subject.mask = value; });
            
            it("sets #grayscale", function() {
                expect(() => $action(0x01)).to.change($subject, 'grayscale');
                expect($subject.grayscale).to.be.true;
            });
            it("sets #showLeftMostBkg", function() {
                expect(() => $action(0x02)).to.change($subject, 'showLeftMostBkg');
                expect($subject.showLeftMostBkg).to.be.true;
            });
            it("sets #showLeftMostSpr", function() {
                expect(() => $action(0x04)).to.change($subject, 'showLeftMostSpr');
                expect($subject.showLeftMostSpr).to.be.true;
            });
            it("sets #showBackground", function() {
                expect(() => $action(0x08)).to.change($subject, 'showBackground');
                expect($subject.showBackground).to.be.true;
            });
            it("sets #renderingEnabled", function() {
                expect(() => $action(0x08)).to.change($subject, 'renderingEnabled');
                expect($subject.renderingEnabled).to.be.true;
            });
            it("sets #showSprites", function() {
                expect(() => $action(0x10)).to.change($subject, 'showSprites');
                expect($subject.showSprites).to.be.true;
            });
            it("sets #renderingEnabled", function() {
                expect(() => $action(0x10)).to.change($subject, 'renderingEnabled');
                expect($subject.renderingEnabled).to.be.true;
            });
            it("sets #emphasizeRed", function() {
                $subject.ntsc = true; // Only test NTSC behavior for now...
                expect(() => $action(0x20)).to.change($subject, 'emphasizeRed');
                expect($subject.emphasizeRed).to.be.true;
            });
            it("sets #emphasizeGreen", function() {
                $subject.ntsc = true; // Only test NTSC behavior for now...
                expect(() => $action(0x40)).to.change($subject, 'emphasizeGreen');
                expect($subject.emphasizeGreen).to.be.true;
            });
            it("sets #emphasizeBlue", function() {
                expect(() => $action(0x80)).to.change($subject, 'emphasizeBlue');
                expect($subject.emphasizeBlue).to.be.true;
            });
        });
        
        describe("#status", function() {
            def('action', () => () => $subject.status);
            
            it("gives the status of #vblank as bit7", function() {
                expect($subject.status).to.equal(0x00);
                $subject.vblank = true;
                expect($subject.status).to.equal(0x80);
            });
            it("gives the status of #sprite0Hit as bit6", function() {
                expect($subject.status).to.equal(0x00);
                $subject.sprite0Hit = true;
                expect($subject.status).to.equal(0x40);
            });
            it("gives the status of #spriteOverflow as bit5", function() {
                expect($subject.status).to.equal(0x00);
                $subject.spriteOverflow = true;
                expect($subject.status).to.equal(0x20);
            });
            
            it("clears #vblank after read", function() {
                $subject.vblank = true;
                expect($action).to.change($subject, 'vblank');
                expect($subject.vblank).to.be.false;
            });
            it("clears #writeToggle if set", function() {
                $subject.writeToggle = false;
                expect($action).not.to.change($subject, 'writeToggle');
                $subject.writeToggle = true;
                expect($action).to.change($subject, 'writeToggle');
                expect($subject.writeToggle).to.be.false;
            });
        });
        
        describe("#OAMAddress =", function() {
            def('action', () => { $subject.OAMAddress = 0xAA; });
            
            it("sets #oamAddress", function() {
                expect(() => $action).to.change($subject, 'oamAddress');
                expect($subject.oamAddress).to.equal(0xAA);
            });
        });
        
        describe("#OAMData", function() {
            def('action', () => $subject.OAMData);
            
            it("reads a byte from #oamPrimary at position #oamAddress", function() {
                $subject.oamPrimary[128] = 0xAA;
                $subject.oamAddress      = 0x80;
                expect($subject.OAMData).to.equal(0xAA);
            });
            
            it("does not increment #oamAddress", function() {
                expect(() => $action).not.to.change($subject, 'oamAddress');
            });
        });
        describe("#OAMData =", function() {
            def('action', () => { $subject.OAMData = 0xAA; });
            
            it("writes to #oamPrimary at position #oamAddress", function() {
                $subject.oamAddress = 0x80;
                expect(() => $action).to.change($subject.oamPrimary, '128');
                expect($subject.oamPrimary[0x80]).to.equal(0xAA);
            });
            it("increments #oamAddress", function() {
                expect(() => $action).to.increase($subject, 'oamAddress').by(1);
            });
            it("limits #oamAddress increment to 8-bit", function() {
                $subject.oamAddress = 0xFF;
                expect(() => $action).not.to.increase($subject, 'oamAddress');
                expect($subject.oamAddress).to.equal(0x00);
            });
        });
        
        describe("#scroll =", function() {
            def('action', () => { $subject.scroll = 0xAD; }); // b10101|101
                                                              // coarse|fine
            context("when #writeToggle is clear (the first time)", function() {
                beforeEach(() => { $subject.writeToggle = false; });
                
                it("sets #fineScrollX", function() {
                    expect(() => $action).to.change($subject, 'fineScrollX');
                    expect($subject.fineScrollX).to.equal(0x5); // b101
                });
                it("sets coarse X scroll in #addressBuffer's bit0-4", function() {
                    expect(() => $action).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x0015); // b0000.0000.0001.0101
                });                                                  //  _yyy.__YY.YYYX.XXXX
                
                it("sets #writeToggle", function() {
                    expect(() => $action).to.change($subject, 'writeToggle');
                    expect($subject.writeToggle).to.be.true;
                });
            });
            context("when #writeToggle is set (the second time)", function() {
                beforeEach(() => { $subject.writeToggle = true; });
                
                it("sets #fineScrollY", function() {
                    expect(() => $action).to.change($subject, 'fineScrollY');
                    expect($subject.fineScrollY).to.equal(0x5); // b101
                });
                it("sets coarse Y (bit5-9) and fine Y (bit12-15) scroll in #addressBuffer", function() {
                    expect(() => $action).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x52A0); // b0101.0010.1010.0000
                });                                                  //  _yyy.__YY.YYYX.XXXX
                
                it("clears #writeToggle", function() {
                    expect(() => $action).to.change($subject, 'writeToggle');
                    expect($subject.writeToggle).to.be.false;
                });
            });
        });
        
        describe("#address =", function() {
            beforeEach(function() {
                $subject.addressBuffer = 0x5555; // b01010101.01010101
            });
            def('action', () => { $subject.address = 0xAA; }); // b10101010
            
            context("when #writeToggle is clear (the first time)", function() {
                beforeEach(() => { $subject.writeToggle = false; });
                
                it("sets the higher byte (only 6-bit actually) of #addressBuffer", function() {
                    expect(() => $action).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x2A55); // b00101010.01010101
                });                                                  //  XX^^^^^^
                it("does not transfer #addressBuffer to #addressBus yet", function() {
                    expect(() => $action).not.to.change($subject, 'addressBus');
                    expect($subject.addressBus).not.to.equal($subject.addressBuffer);
                });
                
                it("sets #writeToggle", function() {
                    expect(() => $action).to.change($subject, 'writeToggle');
                    expect($subject.writeToggle).to.be.true;
                });
            });
            context("when #writeToggle is set (the second time)", function() {
                beforeEach(() => { $subject.writeToggle = true; });
                
                it("sets the lower byte of #addressBuffer", function() {
                    expect(() => $action).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x55AA); // b01010101.10101010
                });                                                  //           ^^^^^^^^
                it("transfers #addressBuffer to #addressBus", function() {
                    expect(() => $action).to.change($subject, 'addressBus');
                    expect($subject.addressBus).to.equal($subject.addressBuffer);
                });
                
                it("clears #writeToggle", function() {
                    expect(() => $action).to.change($subject, 'writeToggle');
                    expect($subject.writeToggle).to.be.false;
                });
            });
        });
        
        /*global $address, $data*/
        
        describe("#data", function() {
            beforeEach(function() {
                $subject.addressBus = $address;
                $subject.readBuffer = $readBuffer;
                sinon.stub($subject, 'readData').returns($readData);
                sinon.stub($subject, 'readPalette').returns($readPalette);
            });
            def('action', () => () => $subject.data);
            
            /*global $readBuffer, $readData, $readPalette*/
            def('readBuffer',  () => 0xC3); // b11000011
            def('readData',    () => 0xA5); // b10100101
            def('readPalette', () => 0x99); // b10011001
            
            context("when #addressBus < 0x3F00", function() {
                def('address', () => 0x2000);
                
                it("calls .readData(address)", function() {
                    $action();
                    expect($subject.readData).to.be.calledOnceWith($address);
                });
                it("increases #addressBus by the value of #addressIncrement", function() {
                    $subject.addressIncrement = 1;
                    expect($action).to.increase($subject, 'addressBus').by(1);
                    $subject.addressIncrement = 32;
                    expect($action).to.increase($subject, 'addressBus').by(32);
                });
                it("returns the content of #readBuffer, not the data just read", function() {
                    expect($subject.data).to.equal($readBuffer).not.to.equal($readData);
                });
                it("fills #readBuffer with the data just read", function() {
                    expect($action).to.change($subject, 'readBuffer');
                    expect($subject.readBuffer).to.equal($readData);
                });
            });
            context("when #addressBus >= 0x3F00", function() {
                def('address', () => 0x3F00);
                
                it("calls .readPalette(address)", function() {
                    $action();
                    expect($subject.readPalette).to.be.calledOnceWith($address);
                });
                it("increases #addressBus by the value of #addressIncrement", function() {
                    $subject.addressIncrement = 1;
                    expect($action).to.increase($subject, 'addressBus').by(1);
                    $subject.addressIncrement = 32;
                    expect($action).to.increase($subject, 'addressBus').by(32);
                });
                it("returns the data just read right-away", function() {
                    expect($subject.data).to.equal($readPalette).not.to.equal($readBuffer);
                });
                
                it("still calls .readData(address)", function() {
                    $action();
                    expect($subject.readData).to.be.calledOnceWith($address);
                });
                it("still fills #readBuffer with the data just read", function() {
                    expect($action).to.change($subject, 'readBuffer');
                    expect($subject.readBuffer).to.equal($readData);
                });
            });
        });
        describe("#data =", function() {
            beforeEach(function() {
                $subject.addressBus = $address;
                sinon.stub($subject, 'writeData');
                sinon.stub($subject, 'writePalette');
            });
            def('action', () => () => { $subject.data = $data; });
            
            def('data', () => 0xAA);
            
            context("when #addressBus < 0x3F00", function() {
                def('address', () => 0x2000);
                
                it("calls .writeData(address, data)", function() {
                    $action();
                    expect($subject.writeData).to.be.calledOnceWith($address, $data);
                });
                it("increases #addressBus by the value of #addressIncrement", function() {
                    $subject.addressIncrement = 1;
                    expect($action).to.increase($subject, 'addressBus').by(1);
                    $subject.addressIncrement = 32;
                    expect($action).to.increase($subject, 'addressBus').by(32);
                });
            });
            context("when #addressBus >= 0x3F00", function() {
                def('address', () => 0x3F00);
                
                it("calls .writePalette(address, data)", function() {
                    $action();
                    expect($subject.writePalette).to.be.calledOnceWith($address, $data);
                });
                it("increases #addressBus by the value of #addressIncrement", function() {
                    $subject.addressIncrement = 1;
                    expect($action).to.increase($subject, 'addressBus').by(1);
                    $subject.addressIncrement = 32;
                    expect($action).to.increase($subject, 'addressBus').by(32);
                });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe(".read(address)", function() {
            beforeEach(function() {
                sinon.stub($subject, 'status').value(0xC3);  // b11000011
                sinon.stub($subject, 'OAMData').value(0xA5); // b10100101
                sinon.stub($subject, 'data').value(0x99);    // b10011001
            });
            def('action', () => (address) => $subject.read(address));
            
            it("reads #status when address & 0x2002", function() {
                expect($action(0x2002)).to.equal(0xC3);
                expect($action(0x2222)).to.equal(0xC3);
            });
            it("reads #OAMData when address & 0x2004", function() {
                expect($action(0x2004)).to.equal(0xA5);
                expect($action(0x2444)).to.equal(0xA5);
            });
            it("reads #data when address & 0x2007", function() {
                expect($action(0x2007)).to.equal(0x99);
                expect($action(0x2777)).to.equal(0x99);
            });
            it("reads -0- otherwise", function() {
                expect($action(0x2000)).to.equal(0x00);
                expect($action(0x2888)).to.equal(0x00);
            });
        });
        describe(".write(address, data)", function() {
            def('action', () => (address) => $subject.write(address, $data));
            
            def('data', () => 0xAA);
            
            it("writes to #control when address & 0x2000", function() {
                const spy = sinon.spy($subject, 'control', ['set']);
                $action(0x2000);
                $action(0x2888);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #mask when address & 0x2001", function() {
                const spy = sinon.spy($subject, 'mask', ['set']);
                $action(0x2001);
                $action(0x2111);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #OAMAddress when address & 0x2003", function() {
                const spy = sinon.spy($subject, 'OAMAddress', ['set']);
                $action(0x2003);
                $action(0x2333);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #OAMData when address & 0x2004", function() {
                const spy = sinon.spy($subject, 'OAMData', ['set']);
                $action(0x2004);
                $action(0x2444);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #scroll when address & 0x2005", function() {
                const spy = sinon.spy($subject, 'scroll', ['set']);
                $action(0x2005);
                $action(0x2555);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #address when address & 0x2006", function() {
                const spy = sinon.spy($subject, 'address', ['set']);
                $action(0x2006);
                $action(0x2666);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
            it("writes to #data when address & 0x2007", function() {
                const spy = sinon.spy($subject, 'data', ['set']);
                $action(0x2007);
                $action(0x2777);
                expect(spy.set).to.be.calledTwice;
                expect(spy.set).to.be.calledWith($data);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $mapper, $horiMirroring, $vertMirroring, $CHRROMData*/
    
    context("Data", function() {
        beforeEach(function() {
            if ($mapper) $nes.cartConnector.cartridge = new $mapper;
            $cartridge.horiMirroring = $horiMirroring || false;
            $cartridge.vertMirroring = $vertMirroring || false;
        });
        
        describe(".readData(address)", function() {
            beforeEach(function() {
                sinon.stub($cartridge, 'ppuRead').returns($CHRROMData);
            });
            
            def('CHRROMData', () => 0x99); // b10011001
            def('VRAM0Data',  () => 0xA5); // b10100101
            def('VRAM1Data',  () => 0xC3); // b11000011
            
            // it("never accesses CHR-ROM when no cartridge is present", function() {
            //     $action(0x0000);
            //     $action(0x1000);
            //     $action(0x2000);
            //     $action(0x2400);
            //     $action(0x2800);
            //     $action(0x2C00);
            //     expect($cartridge.ppuRead).not.to.be.called;
            // });
            
            context("when CI-RAM is disabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(false));
                
                it("reads from cartridge (CHR-ROM)", function() {
                    expect($subject.readData(0x0000)).to.equal($CHRROMData);
                    expect($subject.readData(0x1000)).to.equal($CHRROMData);
                    expect($subject.readData(0x2000)).to.equal($CHRROMData);
                    expect($subject.readData(0x3000)).to.equal($CHRROMData);
                });
            });
            context("when CI-RAM is enabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(true));
                
                context("and cartridge.ciramA10() returns -0-", function() {
                    beforeEach(() => sinon.stub($cartridge, 'ciramA10').returns(0));
                    
                    it("reads from VRAM[0]", function() {
                        expect($subject.readData(0x0000)).to.equal($VRAM0Data);
                        expect($subject.readData(0x1400)).to.equal($VRAM0Data);
                        expect($subject.readData(0x2800)).to.equal($VRAM0Data);
                        expect($subject.readData(0x3C00)).to.equal($VRAM0Data);
                    });
                });
                context("and cartridge.ciramA10() returns -1-", function() {
                    beforeEach(() => sinon.stub($cartridge, 'ciramA10').returns(1));
                    
                    it("reads from VRAM[1]", function() {
                        expect($subject.readData(0x0000)).to.equal($VRAM1Data);
                        expect($subject.readData(0x1400)).to.equal($VRAM1Data);
                        expect($subject.readData(0x2800)).to.equal($VRAM1Data);
                        expect($subject.readData(0x3C00)).to.equal($VRAM1Data);
                    });
                });
            });
            
            context("if cartridge is a NROM mapper", function() {
                def('mapper', () => NROM);
                
                it("reads from cartridge (CHR-ROM) when address < 0x2000", function() {
                    expect($subject.readData(0x0000)).to.equal($CHRROMData);
                    expect($subject.readData(0x1000)).to.equal($CHRROMData);
                });
                it("reads from VRAM[0] when address >= 0x2000", function() {
                    expect($subject.readData(0x2000)).to.equal($VRAM0Data);
                    expect($subject.readData(0x2400)).to.equal($VRAM0Data);
                    expect($subject.readData(0x2800)).to.equal($VRAM0Data);
                    expect($subject.readData(0x2C00)).to.equal($VRAM0Data);
                });
                
                context("when cartridge has horizontal mirroring", function() {
                    def('horiMirroring', () => true);
                    
                    it("reads from vram[0] when address [0x2000-0x23FF]", function() {
                        expect($subject.readData(0x2000)).to.equal($VRAM0Data);
                    });
                    it("reads from vram[0] when address [0x2400-0x27FF]", function() {
                        expect($subject.readData(0x2400)).to.equal($VRAM0Data);
                    });
                    it("reads from vram[1] when address [0x2800-0x2BFF]", function() {
                        expect($subject.readData(0x2800)).to.equal($VRAM1Data);
                    });
                    it("reads from vram[1] when address [0x2C00-0x2FFF]", function() {
                        expect($subject.readData(0x2C00)).to.equal($VRAM1Data);
                    });
                });
                context("when cartridge has vertical mirroring", function() {
                    def('vertMirroring', () => true);
                    
                    it("reads from vram[0] when address [0x2000-0x23FF]", function() {
                        expect($subject.readData(0x2000)).to.equal($VRAM0Data);
                    });
                    it("reads from vram[1] when address [0x2400-0x2BFF]", function() {
                        expect($subject.readData(0x2400)).to.equal($VRAM1Data);
                    });
                    it("reads from vram[0] when address [0x2800-0x2BFF]", function() {
                        expect($subject.readData(0x2800)).to.equal($VRAM0Data);
                    });
                    it("reads from vram[1] when address [0x2C00-0x2FFF]", function() {
                        expect($subject.readData(0x2C00)).to.equal($VRAM1Data);
                    });
                });
            });
        });
        
        describe(".writeData(address, data)", function() {
            beforeEach(function() {
                sinon.stub($cartridge, 'ppuWrite');
            });
            
            // it("never accesses CHR-ROM when no cartridge is present", function() {
            //     $action(0x0000);
            //     $action(0x1000);
            //     $action(0x2000);
            //     $action(0x2400);
            //     $action(0x2800);
            //     $action(0x2C00);
            //     expect($cartridge.ppuWrite).not.to.be.called;
            // });
            
            context("when CI-RAM is disabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(false));
                
                it("(tries to) write to cartridge (CHR-ROM)", function() {
                    $subject.writeData(0x0000, 0x00);
                    $subject.writeData(0x1000, 0x00);
                    $subject.writeData(0x2000, 0x00);
                    expect($cartridge.ppuWrite).to.be.calledThrice;
                });
            });
            context("when CI-RAM is enabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(true));
                
                context("and cartridge.ciramA10() returns -0-", function() {
                    beforeEach(() => sinon.stub($cartridge, 'ciramA10').returns(0));
                    
                    it("writes to VRAM[0]", function() {
                        expect(() => $subject.writeData(0x0000, 0x01))
                            .to.change($subject.vram[0], '0').by(+1);
                        expect(() => $subject.writeData(0x1400, 0x02))
                            .to.change($subject.vram[0], '0').by(+1);
                        expect(() => $subject.writeData(0x2800, 0x03))
                            .to.change($subject.vram[0], '0').by(+1);
                        expect(() => $subject.writeData(0x3C00, 0x04))
                            .to.change($subject.vram[0], '0').by(+1);
                    });
                });
                context("and cartridge.ciramA10() returns -1-", function() {
                    beforeEach(() => sinon.stub($cartridge, 'ciramA10').returns(1));
                    
                    it("writes to VRAM[1]", function() {
                        expect(() => $subject.writeData(0x0000, 0x01))
                            .to.change($subject.vram[1], '0').by(+1);
                        expect(() => $subject.writeData(0x1400, 0x02))
                            .to.change($subject.vram[1], '0').by(+1);
                        expect(() => $subject.writeData(0x2800, 0x03))
                            .to.change($subject.vram[1], '0').by(+1);
                        expect(() => $subject.writeData(0x3C00, 0x04))
                            .to.change($subject.vram[1], '0').by(+1);
                    });
                });
            });
            
            context("if cartridge is a NROM mapper", function() {
                def('mapper', () => NROM);
                
                it("(tries to) write to cartridge (CHR-ROM) when address < 0x2000", function() {
                    $subject.writeData(0x0000, 0x00);
                    $subject.writeData(0x1000, 0x00);
                    expect($cartridge.ppuWrite).to.be.calledTwice;
                });
                it("writes to VRAM[0] when address >= 0x2000", function() {
                    expect(() => $subject.writeData(0x2000, 0x01))
                        .to.change($subject.vram[0], '0').by(+1);
                    expect(() => $subject.writeData(0x2400, 0x02))
                        .to.change($subject.vram[0], '0').by(+1);
                    expect(() => $subject.writeData(0x2800, 0x03))
                        .to.change($subject.vram[0], '0').by(+1);
                    expect(() => $subject.writeData(0x2C00, 0x04))
                        .to.change($subject.vram[0], '0').by(+1);
                });
                
                context("when cartridge has horizontal mirroring", function() {
                    def('horiMirroring', () => true);
                    
                    it("writes to vram[0] when address [0x2000-0x23FF]", function() {
                        expect(() => $subject.writeData(0x2000, 0x01))
                            .to.change($subject.vram[0], '0').by(+1);
                    });
                    it("writes to vram[0] when address [0x2400-0x27FF]", function() {
                        expect(() => $subject.writeData(0x2400, 0x01))
                            .to.change($subject.vram[0], '0').by(+1);
                    });
                    it("writes to vram[1] when address [0x2800-0x2BFF]", function() {
                        expect(() => $subject.writeData(0x2800, 0x01))
                            .to.change($subject.vram[1], '0').by(+1);
                    });
                    it("writes to vram[1] when address [0x2C00-0x2FFF]", function() {
                        expect(() => $subject.writeData(0x2C00, 0x01))
                            .to.change($subject.vram[1], '0').by(+1);
                    });
                });
                context("when cartridge has vertical mirroring", function() {
                    def('vertMirroring', () => true);
                    
                    it("reads from vram[0] when address [0x2000-0x23FF]", function() {
                        expect(() => $subject.writeData(0x2000, 0x01))
                            .to.change($subject.vram[0], '0').by(+1);
                    });
                    it("reads from vram[1] when address [0x2400-0x2BFF]", function() {
                        expect(() => $subject.writeData(0x2400, 0x01))
                            .to.change($subject.vram[1], '0').by(+1);
                    });
                    it("reads from vram[0] when address [0x2800-0x2BFF]", function() {
                        expect(() => $subject.writeData(0x2800, 0x01))
                            .to.change($subject.vram[0], '0').by(+1);
                    });
                    it("reads from vram[1] when address [0x2C00-0x2FFF]", function() {
                        expect(() => $subject.writeData(0x2C00, 0x01))
                            .to.change($subject.vram[1], '0').by(+1);
                    });
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Palette", function() {
        beforeEach(function() {
            $subject.bkgPalette.set([0x3F,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08]);
            $subject.sprPalette.set([0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18]);
        });
        
        describe(".readPalette(address)", function() {
            it("reads from bkgPalette when address [0x3F01-0x3F0F]", function() {
                expect($subject.readPalette(0x3F01)).to.equal(0x01);
            });
            it("reads from sprPalette when address [0x3F11-0x3F1F]", function() {
                expect($subject.readPalette(0x3F11)).to.equal(0x11);
            });
            it("always reads 'Universal background color' when bit0-1 are clear", function() {
                expect($subject.readPalette(0x3F00)).to.equal(0x3F);
                expect($subject.readPalette(0x3F04)).to.equal(0x3F);
                expect($subject.readPalette(0x3F08)).to.equal(0x3F);
                expect($subject.readPalette(0x3F0C)).to.equal(0x3F);
                expect($subject.readPalette(0x3F10)).to.equal(0x3F);
                expect($subject.readPalette(0x3F14)).to.equal(0x3F);
                expect($subject.readPalette(0x3F18)).to.equal(0x3F);
                expect($subject.readPalette(0x3F1C)).to.equal(0x3F);
            });
        });
        
        describe(".writePalette(address, data)", function() {
            it("writes to bkgPalette when address [0x3F01-0x3F0F]", function() {
                $subject.writePalette(0x3F01, 0x20);
                expect($subject.bkgPalette[0x1]).to.equal(0x20);
            });
            it("writes to sprPalette when address [0x3F11-0x3F1F]", function() {
                $subject.writePalette(0x3F11, 0x20);
                expect($subject.sprPalette[0x1]).to.equal(0x20);
            });
            it("writes to bkgPalette when address 0x3F0[0,4,8,C]", function() {
                $subject.writePalette(0x3F00, 0x20);
                expect($subject.bkgPalette[0x0]).to.equal(0x20);
                $subject.writePalette(0x3F04, 0x21);
                expect($subject.bkgPalette[0x4]).to.equal(0x21);
                $subject.writePalette(0x3F08, 0x22);
                expect($subject.bkgPalette[0x8]).to.equal(0x22);
                $subject.writePalette(0x3F0C, 0x23);
                expect($subject.bkgPalette[0xC]).to.equal(0x23);
            });
            it("also writes to bkgPalette when address 0x3F1[0,4,8,C]", function() {
                $subject.writePalette(0x3F10, 0x20);
                expect($subject.bkgPalette[0x0]).to.equal(0x20);
                expect($subject.sprPalette[0x0]).to.equal(0x10);
                
                $subject.writePalette(0x3F14, 0x21);
                expect($subject.bkgPalette[0x4]).to.equal(0x21);
                expect($subject.sprPalette[0x4]).to.equal(0x14);
                
                $subject.writePalette(0x3F18, 0x22);
                expect($subject.bkgPalette[0x8]).to.equal(0x22);
                expect($subject.sprPalette[0x8]).to.equal(0x18);
                
                $subject.writePalette(0x3F1C, 0x23);
                expect($subject.bkgPalette[0xC]).to.equal(0x23);
                expect($subject.sprPalette[0xC]).not.to.equal(0x23);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Scrolling", function() {
        beforeEach(function() {
            $subject.renderingEnabled = true;
        });
        
        describe(".incrementX()", function() {
            it("increments #addressBus by 1 when ScrollX = 0", function() {
                $subject.addressBus = 0x0000;                 // b0000.0000.0000.0000
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x0001); // b0000.0000.0000.0001
            });
            it("toggles bit10 when ScrollX = 31", function() {
                $subject.addressBus = 0x001F;                 // b0000.0000.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x0400); // b0000.0100.0000.0000
                
                $subject.addressBus = 0x041F;                 // b0000.0100.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x0000); // b0000.0000.0000.0000
            });
            
            it("does not change bits5-9", function() {
                $subject.addressBus = 0x03FF;                 // b0000.0011.1111.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x07E0); // b0000.0111.1110.0000
                
                $subject.addressBus = 0x07FF;                 // b0000.0111.1111.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x03E0); // b0000.0011.1110.0000
            });
            it("does not change bits11-14", function() {
                $subject.addressBus = 0x781F;                 // b0111.1000.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x7C00); // b0111.1100.0000.0000
                
                $subject.addressBus = 0x7C1F;                 // b0111.1100.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x7800); // b0111.1000.0000.0000
            });
        });
        
        describe(".incrementY()", function() {
            it("increments #addressBus by 4096 when fineScrollY = 0", function() {
                $subject.addressBus = 0x0000;                 // b0000.0000.0000.0000
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x1000); // b0001.0000.0000.0000
            });
            it("increments #addressBus by 32 when fineScrollY = 7", function() {
                $subject.addressBus = 0x7000;                 // b0111.0000.0000.0000
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0020); // b0000.0000.0010.0000
            });
            it("toggles bit11 when ScrollY = 29", function() {
                $subject.addressBus = 0x73A0;                 // b0111.0011.1010.0000
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0800); // b0000.1000.0000.0000
                
                $subject.addressBus = 0x7BA0;                 // b0111.1011.1010.0000
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0000); // b0000.0000.0000.0000
            });
            it("does not toggle bit11 when ScrollY = 31", function() {
                $subject.addressBus = 0x73E0;                 // b0111.0011.1110.0000
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0000); // b0000.0000.0000.0000
            });
            
            it("does not change bits0-4", function() {
                $subject.addressBus = 0x77BF;                 // b0111.0111.1011.1111
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0C1F); // b0000.1100.0001.1111
                
                $subject.addressBus = 0x7FBF;                 // b0111.1111.1011.1111
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x041F); // b0000.0100.0001.1111
            });
        });
        
        describe(".resetX()", function() {
            beforeEach(function() {
                $subject.addressBuffer = 0x7FFF;
                $subject.addressBus    = 0x0000;
            });
            def('action', () => $subject.resetX());
            
            it("sets ScrollX to its initial value from #addressBuffer", function() {
                expect(() => $action).to.change($subject, 'addressBus'); //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x041F);            // b0000.0100.0001.1111
            });
            it("does not change #addressBuffer", function() {
                expect(() => $action).not.to.change($subject, 'addressBuffer');
            });
        });
        
        describe(".resetY()", function() {
            beforeEach(function() {
                $subject.addressBuffer = 0x7FFF;
                $subject.addressBus    = 0x0000;
            });
            def('action', () => $subject.resetY());
            
            it("sets ScrollY to its initial value from #addressBuffer", function() {
                expect(() => $action).to.change($subject, 'addressBus'); //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x7BE0);            // b0111.1011.1110.0000
            });
            it("does not change #addressBuffer", function() {
                expect(() => $action).not.to.change($subject, 'addressBuffer');
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Background", function() {
        beforeEach(function() {
            sinon.stub($cartridge, 'ppuRead').returns($CHRROMData);
            sinon.spy($subject, 'readData');
        });
        
        def('CHRROMData', () => 0x99); // b10011001
        def('VRAMData',   () => 0xA5); // b10100101
        
        describe(".fetchNameTable(bus)", function() {
            def('action', () => $subject.fetchNameTable(0x7FFF));
            
            context("when CI-RAM is disabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(false));
                
                it("reads from Cartridge", function() {
                    expect($action).to.equal($CHRROMData);
                });
                it("calls cartridge.ppuRead() with a modified address (0x2xxx)", function() {
                    $action;
                    expect($cartridge.ppuRead).to.be.calledOnceWith(0x2FFF);
                });
            });
            context("when CI-RAM is enabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(true));
                
                it("reads from VRAM", function() {
                    expect($action).to.equal($VRAMData);
                });
                it("calls .readData() with a modified address (0x2xxx)", function() {
                    $action;
                    expect($subject.readData).to.be.calledOnceWith(0x2FFF);
                });
            });
        });
        
        describe(".fetchAttributeTable(bus)", function() {
            def('action', () => $subject.fetchAttributeTable(0x7FFF));
            
            def('CHRROMData', () => 0x1B); // b00.01.10.11 => 0-1-2-3
            def('VRAMData',   () => 0xE4); // b11.10.01.00 => 3-2-1-0
            
            context("when CI-RAM is disabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(false));
                
                it("calls cartridge.ppuRead() with a modified address", function() {
                    $action;
                    expect($cartridge.ppuRead).to.be.calledOnceWith(0x2FFF);
                });
                it("returns a 2bit palette index according to position of tile", function() {
                    expect($subject.fetchAttributeTable(0x0000)).to.equal(3);
                    expect($subject.fetchAttributeTable(0x0002)).to.equal(2);
                    expect($subject.fetchAttributeTable(0x0040)).to.equal(1);
                    expect($subject.fetchAttributeTable(0x0042)).to.equal(0);
                });
            });
            context("when CI-RAM is enabled in the cartridge", function() {
                beforeEach(() => sinon.stub($cartridge, 'ciramEnabled').returns(true));
                
                it("calls .readData() with a modified address", function() {
                    $action;
                    expect($subject.readData).to.be.calledOnceWith(0x2FFF);
                });
                it("returns a 2bit palette index according to position of tile", function() {
                    expect($subject.fetchAttributeTable(0x0000)).to.equal(0);
                    expect($subject.fetchAttributeTable(0x0002)).to.equal(1);
                    expect($subject.fetchAttributeTable(0x0040)).to.equal(2);
                    expect($subject.fetchAttributeTable(0x0042)).to.equal(3);
                });
            });
        });
        
        describe(".fetchBkgPatternTable(patternIndex, row)", function() {
            def('action', () => $subject.fetchBkgPatternTable(0x00, 0x0));
            
            it("reads data twice", function() {
                $action;
                expect($subject.readData).to.be.calledTwice;
            });
            it("reads 2 bytes at 8 bytes distance", function() {
                $action;
                expect($subject.readData).to.be.calledWith(0x0000);
                expect($subject.readData).to.be.calledWith(0x0008);
            });
            it("builds a word from the 2 bytes read", function() {
                expect($action).to.equal(0x9999);
            });
            
            it("reads according to #bkgPatternTable", function() {
                $subject.bkgPatternTable = 0x0000;
                $subject.fetchBkgPatternTable(0x00, 0x0);
                expect($subject.readData).to.be.calledWith(0x0000).and.calledWith(0x0008);
                
                $subject.bkgPatternTable = 0x1000;
                $subject.fetchBkgPatternTable(0x00, 0x0);
                expect($subject.readData).to.be.calledWith(0x1000).and.calledWith(0x1008);
            });
            it("reads according to patternIndex", function() {
                $subject.fetchBkgPatternTable(0x01, 0x0);
                expect($subject.readData).to.be.calledWith(0x0010).and.calledWith(0x0018);
                
                $subject.fetchBkgPatternTable(0xFF, 0x0);
                expect($subject.readData).to.be.calledWith(0x0FF0).and.calledWith(0x0FF8);
            });
            it("reads according to row", function() {
                $subject.fetchBkgPatternTable(0x00, 0x1);
                expect($subject.readData).to.be.calledWith(0x0001).and.calledWith(0x0009);
                
                $subject.fetchBkgPatternTable(0x00, 0x7);
                expect($subject.readData).to.be.calledWith(0x0007).and.calledWith(0x000F);
            });
        });
        
        describe(".fillBkgPixelsBuffer(pattern, paletteIndex)", function() {
            beforeEach(function() {
                $subject.bkgPixelsBuffer.set(
                    [0x0,0x1,0x2,0x3,0x4,0x5,0x6,0x7,0x8,0x9,0xA,0xB,0xC,0xD,0xE,0xF]
                );
            });
            def('action', () => $subject.fillBkgPixelsBuffer(0x0000, 0));
            
            it("shifts the content of #bkgPixelsBuffer", function() {
                expect(() => $action).to.change($subject.bkgPixelsBuffer, '0');
                expect($subject.bkgPixelsBuffer[0x0]).to.equal(8);
                expect($subject.bkgPixelsBuffer[0x7]).to.equal(15);
            });
            it("sets the last 8 entries of #bkgPixelsBuffer", function() {
                expect(() => $action).to.change($subject.bkgPixelsBuffer, '8');
                expect($subject.bkgPixelsBuffer[0x8]).to.equal(0);
                expect($subject.bkgPixelsBuffer[0xF]).to.equal(0);
            });
            
            it("does not mutate #bkgPixelsBuffer", function() {
                expect(() => $action).not.to.change($subject, 'bkgPixelsBuffer');
            });
        });
        
        describe(".fetchTile()", function() {
            def('action', () => $subject.fetchTile());
            
            beforeEach(function() {
                sinon.stub($subject, 'fetchNameTable');
                sinon.stub($subject, 'fetchAttributeTable');
                sinon.stub($subject, 'fetchBkgPatternTable');
                sinon.stub($subject, 'fillBkgPixelsBuffer');
            });
            
            context("when background rendering is enabled", function() {
                beforeEach(function() {
                    $subject.showBackground = true;
                    $action;
                });
                
                it("calls .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchAttributeTable);
                });
                it("calls .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchBkgPatternTable);
                });
                it("calls .fetchBkgPatternTable()", function() {
                    expect($subject.fetchBkgPatternTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fillBkgPixelsBuffer);
                });
                
                it("calls .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).to.be.calledOnce;
                });
            });
            context("when background rendering is disabled", function() {
                beforeEach(function() {
                    $subject.showBackground = false;
                    $action;
                });
                
                it("does not call .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).not.to.be.called;
                });
                it("does not call .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).not.to.be.called;
                });
                it("does not call .fetchBkgPatternTable()", function() {
                    expect($subject.fetchBkgPatternTable).not.to.be.called;
                });
                
                it("does not call .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).not.to.be.called;
                });
            });
        });
        
        describe(".fetchNullTile()", function() {
            def('action', () => $subject.fetchNullTile());
            
            beforeEach(function() {
                sinon.stub($subject, 'fetchNameTable');
                sinon.stub($subject, 'fetchAttributeTable');
                sinon.stub($subject, 'fetchBkgPatternTable');
                sinon.stub($subject, 'fillBkgPixelsBuffer');
            });
            
            context("when background rendering is enabled", function() {
                beforeEach(function() {
                    $subject.showBackground = true;
                    $action;
                });
                
                it("calls .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchAttributeTable);
                });
                it("calls .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchBkgPatternTable);
                });
                it("calls .fetchBkgPatternTable()", function() {
                    expect($subject.fetchBkgPatternTable).to.be.calledOnce;
                });
                
                it("does not call .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).not.to.be.called;
                });
            });
            context("when background rendering is disabled", function() {
                beforeEach(function() {
                    $action;
                    $subject.showBackground = false;
                });
                
                it("does not call .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).not.to.be.called;
                });
                it("does not call .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).not.to.be.called;
                });
                it("does not call .fetchBkgPatternTable()", function() {
                    expect($subject.fetchBkgPatternTable).not.to.be.called;
                });
                
                it("does not call .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).not.to.be.called;
                });
            });
        });
        describe(".fetchNullNTs()", function() {
            def('action', () => $subject.fetchNullNTs());
            
            beforeEach(function() {
                sinon.stub($subject, 'fetchNameTable');
                sinon.stub($subject, 'fillBkgPixelsBuffer');
            });
            
            context("when background rendering is enabled", function() {
                beforeEach(function() {
                    $subject.showBackground = true;
                    $action;
                });
                
                it("calls .fetchNameTable() twice", function() {
                    expect($subject.fetchNameTable).to.be.calledTwice;
                });
                
                it("does not call .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).not.to.be.called;
                });
            });
            context("when background rendering is disabled", function() {
                beforeEach(function() {
                    $action;
                    $subject.showBackground = false;
                });
                
                it("does not call .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).not.to.be.called;
                });
                
                it("does not call .fillBkgPixelsBuffer()", function() {
                    expect($subject.fillBkgPixelsBuffer).not.to.be.called;
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Sprites", function() {
        describe(".clearSecondaryOAM()", function() {
            def('action', () => $subject.clearSecondaryOAM());
            
            it("fills #oamSecondary with 0xFF", function() {
                expect(() => $action).to.change($subject.oamSecondary, '0');
                expect($subject.oamSecondary[0]).to.equal(0xFF);
                expect($subject.oamSecondary[31]).to.equal(0xFF);
            });
            it("resets #oamIndex", function() {
                $subject.oamIndex = 0xFF;
                expect(() => $action).to.change($subject, 'oamIndex');
                expect($subject.oamIndex).to.equal(0);
            });
        });
        
        describe(".evaluateSprites(scanline)", function() {
            def('action', () => $subject.evaluateSprites($y+1));
            
            /*global $y, $patternIndex, $attributes, $x*/
            def('y',            () => 0x11);
            def('patternIndex', () => 0x22);
            def('attributes',   () => 0x33);
            def('x',            () => 0x44);
            
            /*global $count*/
            beforeEach(function() {
                $subject.oamPrimary.fill(0xFF);
                $subject.oamSecondary.fill(0xFF);
                for (let i=0; i<$count; i++)
                    $subject.oamPrimary.set([$y,$patternIndex,$attributes,$x], i*4);
            });
            
            context("with a Sprite at (10,10)", function() {
                def('count', () => 1);
                def('y', () => 10);
                def('x', () => 10);
                
                context("of size 8x8", function() {
                    beforeEach(() => { $subject.sprite8x16 = false; });
                    
                    it("is not detected at scanline [9]", function() {
                        $subject.evaluateSprites(9);
                        expect($subject.oamSecondary[0]).to.still.equal(0xFF);
                    });
                    it("is detected between scanlines [10-17]", function() {
                        $subject.evaluateSprites(10);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                        $subject.evaluateSprites(17);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                    });
                    it("is not detected at scanline [18]", function() {
                        $subject.evaluateSprites(18);
                        expect($subject.oamSecondary[0]).to.still.equal(0xFF);
                    });
                });
                context("of size 8x16", function() {
                    beforeEach(() => { $subject.sprite8x16 = true; });
                    
                    it("is not detected at scanline [9]", function() {
                        $subject.evaluateSprites(9);
                        expect($subject.oamSecondary[0]).to.still.equal(0xFF);
                    });
                    it("is detected between scanlines [10-25]", function() {
                        $subject.evaluateSprites(10);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                        $subject.evaluateSprites(25);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                    });
                    it("is not detected at scanline [26]", function() {
                        $subject.evaluateSprites(26);
                        expect($subject.oamSecondary[0]).to.still.equal(0xFF);
                    });
                });
            });
                    
            context("when no sprites are in range", function() {
                def('count', () => 0);
                
                it("transfers nothing to secondary OAM", function() {
                    expect(() => $action).not.to.change($subject.oamSecondary, '0');
                    //oamSecondary[0] not tested by purpose
                    expect($subject.oamSecondary[1]).to.still.equal(0xFF);
                    expect($subject.oamSecondary[2]).to.still.equal(0xFF);
                    expect($subject.oamSecondary[3]).to.still.equal(0xFF);
                });
                it("does not set #spriteOverflow", function() {
                    expect(() => $action).not.to.change($subject, 'spriteOverflow');
                    expect($subject.spriteOverflow).to.be.false;
                });
                it("does not set #sprite0", function() {
                    expect(() => $action).not.to.change($subject, 'sprite0');
                    expect($subject.sprite0).to.be.false;
                });
            });
            context("when a sprite is in range", function() {
                def('count', () => 1);
                
                it("is transfered to secondary OAM", function() {
                    expect(() => $action).to.change($subject.oamSecondary, '0');
                    expect($subject.oamSecondary[0]).to.equal($y);
                    expect($subject.oamSecondary[1]).to.equal($patternIndex);
                    expect($subject.oamSecondary[2]).to.equal($attributes);
                    expect($subject.oamSecondary[3]).to.equal($x);
                });
                it("does not transfer anything else", function() {
                    expect(() => $action).not.to.change($subject.oamSecondary, '5');
                    //oamSecondary[4] not tested by purpose
                    expect($subject.oamSecondary[5]).to.still.equal(0xFF);
                    expect($subject.oamSecondary[6]).to.still.equal(0xFF);
                    expect($subject.oamSecondary[7]).to.still.equal(0xFF);
                });
                it("does not set #spriteOverflow", function() {
                    expect(() => $action).not.to.change($subject, 'spriteOverflow');
                    expect($subject.spriteOverflow).to.be.false;
                });
                
                context("if this is the first Sprite", function() {
                    it("sets #sprite0", function() {
                        expect(() => $action).to.change($subject, 'sprite0');
                        expect($subject.sprite0).to.be.true;
                    });
                });
                context("if this is not the first Sprite", function() {
                    def('count', () => 2);
                    beforeEach(() => { $subject.oamPrimary[0] = 0xFF; });

                    it("does not set #sprite0", function() {
                        expect(() => $action).not.to.change($subject, 'sprite0');
                        expect($subject.sprite0).to.be.false;
                    });
                });
            });
            context("when 8 sprites are in range", function() {
                def('count', () => 8);
                
                it("is transfered to secondary OAM", function() {
                    expect(() => $action).to.change($subject.oamSecondary, '28');
                    expect($subject.oamSecondary[28]).to.equal($y);
                    expect($subject.oamSecondary[29]).to.equal($patternIndex);
                    expect($subject.oamSecondary[30]).to.equal($attributes);
                    expect($subject.oamSecondary[31]).to.equal($x);
                });
                it("does not set #spriteOverflow", function() {
                    expect(() => $action).not.to.change($subject, 'spriteOverflow');
                    expect($subject.spriteOverflow).to.be.false;
                });
            });
            context("when a 9th sprite is in range", function() {
                def('count', () => 9);
                beforeEach(function() {
                    // Make the 9th sprite different
                    $subject.oamPrimary.fill($y+1, 8*4, 8*4 + 4);
                });
                
                it("does NOT replace 8th sprite in secondary OAM", function() {
                    expect(() => $action).to.change($subject.oamSecondary, '28');
                    expect($subject.oamSecondary[28]).to.equal($y);
                    expect($subject.oamSecondary[29]).to.equal($patternIndex);
                    expect($subject.oamSecondary[30]).to.equal($attributes);
                    expect($subject.oamSecondary[31]).to.equal($x);
                });
                it("sets #spriteOverflow", function() {
                    expect(() => $action).to.change($subject, 'spriteOverflow');
                    expect($subject.spriteOverflow).to.be.true;
                });
            });
            
            it("resets #oamIndex afterward", function() {
                expect(() => $action).not.to.change($subject, 'oamIndex');
                expect($subject.oamIndex).to.equal(0);
            });
        });
        
        describe(".fetchSprPatternTable(patternIndex, row)", function() {
            beforeEach(function() {
                sinon.stub($subject, 'readData').returns(0x99);
            });
            def('action', () => $subject.fetchSprPatternTable(0x00, 0x0));
            
            it("reads data twice", function() {
                $action;
                expect($subject.readData).to.be.calledTwice;
            });
            it("reads 2 bytes at 8 bytes distance", function() {
                $action;
                expect($subject.readData).to.be.calledWith(0x0000);
                expect($subject.readData).to.be.calledWith(0x0008);
            });
            it("builds a word from the 2 bytes read", function() {
                expect($action).to.equal(0x9999);
            });
            
            it("reads according to #sprPatternTable", function() {
                $subject.sprPatternTable = 0x0000;
                $subject.fetchSprPatternTable(0x00, 0x0);
                expect($subject.readData).to.be.calledWith(0x0000).and.calledWith(0x0008);
                
                $subject.sprPatternTable = 0x1000;
                $subject.fetchSprPatternTable(0x00, 0x0);
                expect($subject.readData).to.be.calledWith(0x1000).and.calledWith(0x1008);
            });
            it("reads according to #sprite8x16", function() {
                $subject.sprite8x16 = true;
                $subject.fetchSprPatternTable(0x10, 0x0);
                expect($subject.readData).to.be.calledWith(0x0100).and.calledWith(0x0108);
                
                $subject.fetchSprPatternTable(0x11, 0x0);
                expect($subject.readData).to.be.calledWith(0x1100).and.calledWith(0x1108);
            });
            it("reads according to patternIndex", function() {
                $subject.fetchSprPatternTable(0x01, 0x0);
                expect($subject.readData).to.be.calledWith(0x0010).and.calledWith(0x0018);
                
                $subject.fetchSprPatternTable(0xFF, 0x0);
                expect($subject.readData).to.be.calledWith(0x0FF0).and.calledWith(0x0FF8);
            });
            it("reads according to row", function() {
                $subject.fetchSprPatternTable(0x00, 0x1);
                expect($subject.readData).to.be.calledWith(0x0001).and.calledWith(0x0009);
                
                $subject.fetchSprPatternTable(0x00, 0x7);
                expect($subject.readData).to.be.calledWith(0x0007).and.calledWith(0x000F);
            });
        });
        
        describe(".fillSprPixelsBuffer(pattern, paletteIndex)", function() {
            beforeEach(function() {
                $subject.sprPixelsBuffer.fill(0xFFABCDEF);
            });
            def('action', () => $subject.fillSprPixelsBuffer(0x0000, 0));
            
            it("sets all the 8 entries of #sprPixelsBuffer", function() {
                expect(() => $action).to.change($subject.sprPixelsBuffer, '0');
                expect($subject.sprPixelsBuffer[0x0]).to.equal(0);
                expect($subject.sprPixelsBuffer[0x7]).to.equal(0);
            });
            
            it("does not mutate #sprPixelsBuffer", function() {
                expect(() => $action).not.to.change($subject, 'sprPixelsBuffer');
            });
        });
        
        describe(".fetchSprite(scanline)", function() {
            beforeEach(function() {
                sinon.stub($subject, 'fetchNameTable');
                sinon.stub($subject, 'fetchAttributeTable');
                sinon.stub($subject, 'fetchSprPatternTable');
                sinon.stub($subject, 'fillSprPixelsBuffer').returns(new Uint32Array(8));
            });
            def('action', () => $subject.fetchSprite($y));
            
            def('y',            () => 0x11);
            def('patternIndex', () => 0x22);
            def('attributes',   () => 0x33);
            def('x',            () => 0x44);
            
            beforeEach(function() {
                $subject.oamSecondary.fill(0xFF);
                $subject.oamSecondary.set([$y,$patternIndex,$attributes,$x], 0);
            });
            
            context("when sprites rendering is enabled", function() {
                beforeEach(function() {
                    $subject.showSprites = true;
                });
                
                it("calls .fetchNameTable() (garbage fetch)", function() {
                    $action;
                    expect($subject.fetchNameTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchAttributeTable);
                });
                it("calls .fetchAttributeTable() (garbage fetch)", function() {
                    $action;
                    expect($subject.fetchAttributeTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchSprPatternTable);
                });
                it("calls .fetchSprPatternTable()", function() {
                    $action;
                    expect($subject.fetchSprPatternTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fillSprPixelsBuffer);
                });
                
                it("calls .fillSprPixelsBuffer()", function() {
                    $action;
                    expect($subject.fillSprPixelsBuffer).to.be.calledOnce;
                });
                
                it("resets #oamAddress", function() {
                    $subject.oamAddress = 0xFF;
                    expect(() => $action).to.change($subject, 'oamAddress');
                    expect($subject.oamAddress).to.equal(0);
                });
                
                context("if 'Vertical Flip' attribute is set", function() {
                    def('attributes', () => 0x80);
                    
                    it("calls .fetchSprPatternTable(pIndex,row) with row=7", function() {
                        $action;
                        expect($subject.fetchSprPatternTable).to
                            .be.calledOnceWith($patternIndex, 7);
                    });
                    it("increases patternIndex by 1 if #sprite8x16 is set", function() {
                        $subject.sprite8x16 = true;
                        $subject.spriteHeight = 16;
                        $action;
                        expect($subject.fetchSprPatternTable).to
                            .be.calledOnceWith($patternIndex + 1, 7);
                    });
                });
                context("if 'Vertical Flip' attribute is clear", function() {
                    def('attributes', () => ~0x80);
                    
                    it("calls .fetchSprPatternTable(pIndex,row) with row=0", function() {
                        $action;
                        expect($subject.fetchSprPatternTable).to
                            .be.calledOnceWith($patternIndex, 0);
                    });
                });
                
                context("if 'Horizontal Flip' attribute is set", function() {
                    def('attributes', () => 0x40);
                    
                    it("calls .fillSprPixelsBuffer(pattern,palette,flip) with flip set", function() {
                        $subject.fetchSprPatternTable.returns(0x1234);
                        $action;
                        expect($subject.fillSprPixelsBuffer).to
                            .be.calledOnceWith(0x1234, $attributes & 0x3, true);
                    });
                });
                context("if 'Horizontal Flip' attribute is not set", function() {
                    def('attributes', () => ~0x40);
                    
                    it("calls .fillSprPixelsBuffer(pattern,palette,flip) with flip clear", function() {
                        $subject.fetchSprPatternTable.returns(0x1234);
                        $action;
                        expect($subject.fillSprPixelsBuffer).to
                            .be.calledOnceWith(0x1234, $attributes & 0x3, false);
                    });
                });
                
                context("if 'Is Behind' attribute is set", function() {
                    def('attributes', () => 0x20);
                    beforeEach(() => { $subject.sprLayer = null; });
                    
                    it("sets #sprLayer to reference NES.videoOutput.sprBehindLayer", function() {
                        expect(() => $action).to.change($subject, 'sprLayer');
                        expect($subject.sprLayer).to.equal($nes.videoOutput.sprBehindLayer);
                    });
                });
                context("if 'Is Behind' attribute is not set", function() {
                    def('attributes', () => ~0x20);
                    beforeEach(() => { $subject.sprLayer = null; });
                    
                    it("sets #sprLayer to reference NES.videoOutput.sprBeforeLayer", function() {
                        expect(() => $action).to.change($subject, 'sprLayer');
                        expect($subject.sprLayer).to.equal($nes.videoOutput.sprBeforeLayer);
                    });
                });
            });
            context("when sprites rendering is disabled", function() {
                beforeEach(function() {
                    $subject.showSprites = false;
                    $action;
                });
                
                it("does not call .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).not.to.be.called;
                });
                it("does not call .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).not.to.be.called;
                });
                it("does not call .fetchSprPatternTable()", function() {
                    expect($subject.fetchSprPatternTable).not.to.be.called;
                });
                
                it("does not call .fillSprPixelsBuffer()", function() {
                    expect($subject.fillSprPixelsBuffer).not.to.be.called;
                });
            });
        });
        
        describe(".fetchNullSprite()", function() {
            beforeEach(function() {
                sinon.stub($subject, 'fetchNameTable');
                sinon.stub($subject, 'fetchAttributeTable');
                sinon.stub($subject, 'fetchSprPatternTable');
                sinon.stub($subject, 'fillSprPixelsBuffer');
            });
            def('action', () => $subject.fetchNullSprite());
            
            context("when sprites rendering is enabled", function() {
                beforeEach(function() {
                    $subject.showSprites = true;
                    $action;
                });
                
                it("calls .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchAttributeTable);
                });
                it("calls .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).to.be.calledOnce.and
                        .be.calledImmediatelyBefore($subject.fetchSprPatternTable);
                });
                it("calls .fetchSprPatternTable()", function() {
                    expect($subject.fetchSprPatternTable).to.be.calledOnce;
                });
                
                it("does not call .fillSprPixelsBuffer()", function() {
                    expect($subject.fillSprPixelsBuffer).not.to.be.called;
                });
            });
            context("when sprites rendering is disabled", function() {
                beforeEach(function() {
                    $subject.showSprites = false;
                    $action;
                });
                
                it("does not call .fetchNameTable()", function() {
                    expect($subject.fetchNameTable).not.to.be.called;
                });
                it("does not call .fetchAttributeTable()", function() {
                    expect($subject.fetchAttributeTable).not.to.be.called;
                });
                it("does not call .fetchSprPatternTable()", function() {
                    expect($subject.fetchSprPatternTable).not.to.be.called;
                });
                
                it("does not call .fillSprPixelsBuffer()", function() {
                    expect($subject.fillSprPixelsBuffer).not.to.be.called;
                });
            });
        });
    });
});

function setEveryProperties(instance) {
    instance.addressIncrement = 32;
    instance.sprPatternTable  = 0x1000;
    instance.bkgPatternTable  = 0x1000;
    instance.sprite8x16       = true;
    instance.nmiEnabled       = true;
    instance.spriteHeight     = 16;
    
    instance.grayscale        = true;
    instance.showLeftMostBkg  = true;
    instance.showLeftMostSpr  = true;
    instance.showBackground   = true;
    instance.showSprites      = true;
    instance.emphasizeRed     = true;
    instance.emphasizeGreen   = true;
    instance.emphasizeBlue    = true;
    instance.renderingEnabled = true;
    
    instance.spriteOverflow   = true;
    instance.sprite0Hit       = true;
    instance.vblank           = true;
    
    instance.oamAddress       = 0xFF;
    instance.oamIndex         = 0x1F;
    
    instance.fineScrollX      = 0x7;
    instance.fineScrollY      = 0x7;
    instance.writeToggle      = true;
    
    instance.addressBus       = 0x3FFF;
    instance.addressBuffer    = 0x3FFF;
    instance.readBuffer       = 0xFF;
    
    instance.palette.forEach((palette) => {
        palette.fill(0x3F);
    });
}
