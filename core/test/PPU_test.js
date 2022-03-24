import { NES, Cartridge } from "../src";
import { NROM } from "../src/Cartridges/Mappers";

describe("Ppu", function() {
    def('nes', () => new NES); /*global $nes */
    
    subject(() => $nes.ppu);
    
    /*global $VRAMData, $VRAM0Data, $VRAM1Data */
    def(['VRAMData','VRAM0Data','VRAM1Data']);
    beforeEach("fill VRAM", function() {
        if ([$VRAMData, $VRAM0Data, $VRAM1Data].some(isSet)) {
            $subject.vramBank[0].fill($VRAM0Data || $VRAMData || 0);
            $subject.vramBank[1].fill($VRAM1Data || $VRAMData || 0);
        }
    });
    
    /*global $allPalData, $bkgPalData, $sprPalData */
    def(['allPalData','bkgPalData','sprPalData']);
    beforeEach("fill Palettes", function() {
        if ([$allPalData, $bkgPalData, $sprPalData].some(isSet)) {
            $subject.palette[0].fill($bkgPalData || $allPalData || 0);
            $subject.palette[1].fill($sprPalData || $allPalData || 0);
        }
    });
    
    /*global $CHRRAMData, $CHRROMData,
             $CHRROM0Pattern, $CHRROM1Pattern,
             $horiMirroring, $vertMirroring */
    def(['CHRRAMData','CHRROMData']);
    def(['CHRROM0Pattern','CHRROM1Pattern']);
    def(['horiMirroring','vertMirroring']);
    
    /*global $cartridge */
    def('cartridge', () => {
        let cartridge;
        if ([$horiMirroring,$vertMirroring].some(isSet)) {
            cartridge = new NROM;
            cartridge.horiMirroring = $horiMirroring || false;
            cartridge.vertMirroring = $vertMirroring || false;
        } else {
            cartridge = new Cartridge;
        }
        
        if (isSet($CHRRAMData))
            cartridge.CHRRAM.fill($CHRRAMData);
        
        if (isSet($CHRROMData)) {
            cartridge.CHRROM = [new Uint8Array(0x2000).fill($CHRROMData),
                                new Uint8Array(0x2000).fill($CHRROMData)];
        } else {
            cartridge.CHRROM = [new Uint8Array(0x2000),
                                new Uint8Array(0x2000)];
        }
        if (isSet($CHRROM0Pattern)) cartridge.CHRROM[0].set($CHRROM0Pattern);
        if (isSet($CHRROM1Pattern)) cartridge.CHRROM[1].set($CHRROM1Pattern);
        cartridge.init();
        
        return cartridge;
    });
    beforeEach("load Cartridge", function() {
        if ([$CHRRAMData,$CHRROMData,$horiMirroring,$vertMirroring,$CHRROM0Pattern,$CHRROM1Pattern].some(isSet)) {
            $nes.cartConnector.cartridge = $cartridge;
        }
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $subject.powerOn(); });
        
        its('addressIncrement', () => is.expected.to.equal(1));
        its('sprite8x16',       () => is.expected.to.be.false);
        its('nmiEnabled',       () => is.expected.to.be.false);
        
        its('grayscale',        () => is.expected.to.be.false);
        its('showLeftMostBkg',  () => is.expected.to.be.false);
        its('showLeftMostSpr',  () => is.expected.to.be.false);
        its('showBackground',   () => is.expected.to.be.false);
        its('showSprites',      () => is.expected.to.be.false);
        its('emphasizeRed',     () => is.expected.to.be.false);
        its('emphasizeGreen',   () => is.expected.to.be.false);
        its('emphasizeBlue',    () => is.expected.to.be.false);
        
        its('renderingEnabled', () => is.expected.to.be.false);
        
        its('sprite0Hit',       () => is.expected.to.be.false);
        
        its('oamAddress',       () => is.expected.to.equal(0));
    });
    
    describe(".powerOff()", function() {
        beforeEach(function() { $subject.powerOff(); });
        
    });
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("clears Control Register", function() {
            $subject.writeRegister(0x2000, 0xFF);
            $action;
            expect($subject.addressIncrement).to.equal(1);
            expect($subject.sprPatternTable).to.equal(0);
            expect($subject.bkgPatternTable).to.equal(0);
            expect($subject.sprite8x16).to.be.false;
            expect($subject.nmiEnabled).to.be.false;
        });
        it("clears Mask Register", function() {
            $subject.writeRegister(0x2001, 0xFF);
            $action;
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
        it("clears Scroll Register", function() {
            $subject.writeRegister(0x2005, 0xFF);
            $action;
            expect($subject.writeToggle).to.be.false;
            expect($subject.fineScrollX).to.equal(0);
            expect($subject.fineScrollY).to.equal(0);
        });
        it("clears the read buffer", function() {
            $subject.readBuffer = 0xFF;
            $action;
            expect($subject.readBuffer).to.equal(0);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("VBlank", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
        describe(".doVBlank()", function() {
            def('action', () => $subject.doVBlank());
            
            it("sets #vblank", function() {
                expect(() => $action).to.change($subject, 'vblank');
                expect($subject.vblank).to.be.true;
            });
            
            context("when #nmiEnabled=true", function() {
                beforeEach(function() {
                    $subject.nmiEnabled = true;
                });
                
                it("calls cpu.doNMI()", function(done) {
                    $nes.cpu.doNMI = () => done();
                    $action;
                });
            });
        });
        describe(".endVBlank()", function() {
            def('action', () => $subject.endVBlank());
            beforeEach(function() {
                $subject.spriteOverflow = true;
                $subject.sprite0Hit = true;
                $subject.vblank = true;
            });
            
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
    
    context("Registers", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
        describe(".readRegister(address)", function() {
            /*global $actionTwice, $address */
            def('action', () => $subject.readRegister($address));
            def('actionTwice', () => ($action || true) && $subject.readRegister($address));
            
            context("when address is 0x2002", function() {
                def('address', () => 0x2002);
                
                it("resets writeToggle", function() {
                    $subject.writeToggle = true;
                    $action;
                    expect($subject.writeToggle).to.be.false;
                });
                
                context("and VBlank is set", function() {
                    beforeEach(function() { $subject.vblank = true; });
                    
                    it("returns 0x80", function() {
                        expect($action).to.equal(0x80); });
                    it("clears VBlank after read", function() {
                        $action;
                        expect($subject.vblank).to.be.false;
                    });
                });
                context("and Sprite0Hit is set", function() {
                    beforeEach(function() { $subject.sprite0Hit = true; });
                    
                    it("returns 0x40", function() {
                        expect($action).to.equal(0x40); });
                });
                context("and SpriteOverflow is set", function() {
                    beforeEach(function() { $subject.spriteOverflow = true; });
                    
                    it("returns 0x20", function() {
                        expect($action).to.equal(0x20); });
                });
                context("and all are set", function() {
                    beforeEach(function() {
                        $subject.vblank = true;
                        $subject.sprite0Hit = true;
                        $subject.spriteOverflow = true;
                    });
                    
                    it("returns 0xE0", function() {
                        expect($action).to.equal(0xE0); });
                    it("clears VBlank after read", function() {
                        $action;
                        expect($subject.vblank).to.be.false;
                    });
                });
            });
            
            context("when address is 0x2004", function() {
                def('address', () => 0x2004);
                
                beforeEach(function() {
                    $subject.oamPrimary[0] = 0x50;
                    $subject.oamAddress = 0x00;
                });
                
                it("returns the value of oamPrimary[oamAddress]", function() {
                    expect($action).to.equal(0x50); });
                it("does not increment oamAddress", function() {
                    expect(() => $action).not.to.change($subject, 'oamAddress');
                });
            });
            
            context("when address is 0x2007", function() {
                def('address', () => 0x2007);
                
                def('CHRROMData', () => 0xA5); // b10100101
                def('VRAMData',   () => 0x99); // b10011001
                def('allPalData', () => 0xC3); // b11000011
                
                it("increments addressBus by addressIncrement(1)", function() {
                    $subject.addressIncrement = 1;
                    expect(() => $action).to.increase($subject, 'addressBus').by(1);
                });
                it("increments addressBus by addressIncrement(32)", function() {
                    $subject.addressIncrement = 32;
                    expect(() => $action).to.increase($subject, 'addressBus').by(32);
                });
                
                context("and addressBus [0x0000,0x1FFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x0000; });
                    
                    it("first returns the content of readBuffer", function() {
                        let readBuffer = $subject.readBuffer;
                        expect($action).to.equal(readBuffer);
                    });
                    it("then reads from cartridge (CHR-Rom)", function() {
                        expect($actionTwice).to.equal($CHRROMData);
                    });
                });
                context("and addressBus [0x2000,0x3EFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x2000; });
                    
                    it("first returns the content of readBuffer", function() {
                        let readBuffer = $subject.readBuffer;
                        expect($action).to.equal(readBuffer);
                    });
                    it("then reads from VRAM", function() {
                        expect($actionTwice).to.equal($VRAMData);
                    });
                });
                context("and addressBus [0x3F00,0x3FFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x3F00; });
                    
                    def('PalData', () => 0x3F);
                    
                    it("reads immediately from palette data, not readBuffer", function() {
                        $subject.readBuffer = 0;
                        expect($action).to.equal($allPalData);
                    });
                    it("still put the VRAM data into readBuffer", function() {
                        $subject.readBuffer = 0;
                        expect($action).to.equal($allPalData);
                        expect($subject.readBuffer).to.equal($VRAMData);
                    });
                });
            });
        });
        
        describe(".writeRegister(address, data)", function() {
            /*global $actionAgain, $data */
            def('action', () => $subject.writeRegister($address, $data));
            def('actionAgain', () => $subject.writeRegister($address, $data));
            def('actionTwice', () => $action || $actionAgain);
            
            context("when address is 0x2000", function() {
                def('address', () => 0x2000);
                
                context("and data is 0x00", function() {
                    def('data', () => 0x00);
                    
                    beforeEach(() => $action);
                    
                    its('addressIncrement',     () => is.expected.to.equal(1));
                    its('sprPatternTable',      () => is.expected.to.equal(0x0000));
                    its('bkgPatternTable',      () => is.expected.to.equal(0x0000));
                    its('sprite8x16',           () => is.expected.to.be.false);
                    its('nmiEnabled',           () => is.expected.to.be.false);
                });
                context("data is 0xFF", function() {
                    def('data', () => 0xFF);
                    
                    beforeEach(() => $action);
                    
                    its('addressIncrement',     () => is.expected.to.equal(32));
                    its('sprPatternTable',      () => is.expected.to.equal(0x1000));
                    its('bkgPatternTable',      () => is.expected.to.equal(0x1000));
                    its('sprite8x16',           () => is.expected.to.be.true);
                    its('nmiEnabled',           () => is.expected.to.be.true);
                });
            });
            
            context("when address is 0x2001", function() {
                def('address', () => 0x2001);
                
                context("and data is 0x00", function() {
                    def('data', () => 0x00);
                    
                    beforeEach(() => $action);
                    
                    its('grayscale',       () => is.expected.to.be.false);
                    its('showLeftMostBkg', () => is.expected.to.be.false);
                    its('showLeftMostSpr', () => is.expected.to.be.false);
                    its('showBackground',  () => is.expected.to.be.false);
                    its('showSprites',     () => is.expected.to.be.false);
                    its('emphasizeRed',    () => is.expected.to.be.false);
                    its('emphasizeGreen',  () => is.expected.to.be.false);
                    its('emphasizeBlue',   () => is.expected.to.be.false);
                    
                    its('renderingEnabled', () => is.expected.to.be.false);
                });
                context("and data is 0xFF", function() {
                    def('data', () => 0xFF);
                    
                    beforeEach(() => $action);
                    
                    its('grayscale',       () => is.expected.to.be.true);
                    its('showLeftMostBkg', () => is.expected.to.be.true);
                    its('showLeftMostSpr', () => is.expected.to.be.true);
                    its('showBackground',  () => is.expected.to.be.true);
                    its('showSprites',     () => is.expected.to.be.true);
                    its('emphasizeRed',    () => is.expected.to.be.true);
                    its('emphasizeGreen',  () => is.expected.to.be.true);
                    its('emphasizeBlue',   () => is.expected.to.be.true);
                    
                    its('renderingEnabled', () => is.expected.to.be.true);
                });
            });
            
            context("when address is 0x2003", function() {
                def('address', () => 0x2003);
                def('data', () => 0xAA);
                
                it("sets oamAddress", function() {
                    expect(() => $action).to.change($subject, 'oamAddress');
                    expect($subject.oamAddress).to.equal($data);
                });
            });
            
            context("when address is 0x2004", function() {
                def('address', () => 0x2004);
                def('data', () => 0xAA);
                
                def('oamAddress', () => 0x80); /*global $oamAddress */
                beforeEach(function() { $subject.oamAddress = $oamAddress; });
                
                it("writes data to oamPrimary[oamAddress]", function() {
                    expect(() => $action).to.change($subject.oamPrimary, $oamAddress);
                    expect($subject.oamPrimary[$oamAddress]).to.equal($data);
                });
            });
            
            context("when address is 0x2005", function() {
                def('address', () => 0x2005);
                
                context("the first time", function() {
                    beforeEach(function() {
                        $subject.writeRegister($address, 0xAD); // b10101|101
                    });                                         //  XXXXX|xxx
                    
                    it("sets fineScrollX", function() {
                        expect($subject.fineScrollX).to.equal(0x5); // b0101
                    });
                    it("sets coarse X scroll in addressBuffer (bits0-4)", function() {
                        expect($subject.addressBuffer).to.equal(0x0015); // b0000.0000.0001.0101
                    });                                                  //  _yyy.nnYY.YYYX.XXXX
                });
                context("the second time", function() {
                    beforeEach(function() {
                        $subject.writeRegister($address, 0x00);
                        $subject.writeRegister($address, 0xAD); // b10101|101
                    });                                         //  YYYYY|yyy
                    
                    it("sets fineScrollY", function() {
                        expect($subject.fineScrollY).to.equal(0x5); // b0101
                    });
                    it("sets coarse Y (bits5-9) and fine Y (bitsC-E) scroll in addressBuffer", function() {
                        expect($subject.addressBuffer).to.equal(0x52A0); // b0101.0010.1010.0000
                    });                                                  //  _yyy.nnYY.YYYX.XXXX
                });
            });
            
            context("when address is 0x2006", function() {
                def('address', () => 0x2006);
                def('data', () => 0xBA);
                
                beforeEach(function() { $subject.addressBuffer = 0x0000; });
                
                it("writes the upper byte (6-bit only) of addressBuffer the first time", function() {
                    expect(() => $action).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x3A00);
                });
                it("writes the lower byte of addressBuffer the second time", function() {
                    expect(() => $actionTwice).to.change($subject, 'addressBuffer');
                    expect($subject.addressBuffer).to.equal(0x3ABA);
                });
            });
            
            context("when address is 0x2007", function() {
                def('address', () => 0x2007);
                def('data', () => 0xAA);
                
                def('VRAMData',   () => 0x99); // b10011001
                def('CHRROMData', () => 0xA5); // b10100101
                def('allPalData', () => 0xC3); // b11000011
                
                it("increments addressBus by addressIncrement(1)", function() {
                    $subject.addressIncrement = 1;
                    expect(() => $action).to.increase($subject, 'addressBus').by(1);
                });
                it("increments addressBus by addressIncrement(32)", function() {
                    $subject.addressIncrement = 32;
                    expect(() => $action).to.increase($subject, 'addressBus').by(32);
                });
                
                context("and addressBus [0x0000,0x1FFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x0000; });
                    
                    it("cannot write to cartridge (CHR-Rom)", function() {
                        expect(() => $action).not.to.change($nes.cartConnector.cartridge.CHRROM[0], '0');
                        expect($nes.cartConnector.cartridge.CHRROM[0][0]).to.equal($CHRROMData);
                    });
                });
                context("and addressBus [0x2000,0x3EFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x2000; });
                    
                    it("writes to VRAM", function() {
                        expect(() => $action).to.change($subject.vramBank[0], '0');
                        expect($subject.vramBank[0][0]).to.equal($data);
                    });
                });
                context("and addressBus [0x3F00,0x3FFF]", function() {
                    beforeEach(function() { $subject.addressBus = 0x3F01; });
                    
                    it("writes to palette data", function() {
                        expect(() => $action).to.change($subject.palette[0], '1');
                        expect($subject.palette[0][1]).to.equal($data);
                    });
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Data", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
        def('CHRROMData', () => 0x99); // b10011001
        
        describe(".read(address)", function() {
            def('VRAM0Data',  () => 0xA5); // b10100101
            def('VRAM1Data',  () => 0xC3); // b11000011
            
            it("reads from cartridge (CHR-ROM) when address < 0x2000", function() {
                expect($subject.read(0x0000)).to.equal($CHRROMData);
            });
            it("reads from VRAM when address >= 0x2000", function() {
                expect($subject.read(0x2001)).to.equal($VRAM0Data);
            });
            context("when cartridge has horizontal mirroring", function() {
                def('horiMirroring', () => true);
                
                it("reads from vramBank[0] when address [0x2000-0x23FF]", function() {
                    expect($subject.read(0x2002)).to.equal($VRAM0Data);
                });
                it("reads from vramBank[0] when address [0x2400-0x27FF]", function() {
                    expect($subject.read(0x2402)).to.equal($VRAM0Data);
                });
                it("reads from vramBank[1] when address [0x2800-0x2BFF]", function() {
                    expect($subject.read(0x2802)).to.equal($VRAM1Data);
                });
                it("reads from vramBank[1] when address [0x2C00-0x2FFF]", function() {
                    expect($subject.read(0x2C02)).to.equal($VRAM1Data);
                });
            });
            context("when cartridge has vertical mirroring", function() {
                def('vertMirroring', () => true);
                
                it("reads from vramBank[0] when address [0x2000-0x23FF]", function() {
                    expect($subject.read(0x2003)).to.equal($VRAM0Data);
                });
                it("reads from vramBank[1] when address [0x2400-0x2BFF]", function() {
                    expect($subject.read(0x2403)).to.equal($VRAM1Data);
                });
                it("reads from vramBank[0] when address [0x2800-0x2BFF]", function() {
                    expect($subject.read(0x2803)).to.equal($VRAM0Data);
                });
                it("reads from vramBank[1] when address [0x2C00-0x2FFF]", function() {
                    expect($subject.read(0x2C03)).to.equal($VRAM1Data);
                });
            });
        });
        
        describe(".write(address, data)", function() {
            it("cannot write to cartridge (CHR-ROM) when address < 0x2000", function() {
                expect(() => $subject.write(0x0001, 0xFF)).not.to.change($nes.cartConnector.cartridge.CHRROM[0], '1');
                expect($nes.cartConnector.cartridge.CHRROM[0][0]).to.equal($CHRROMData);
            });
            it("writes to VRAM when address >= 0x2000", function() {
                expect(() => $subject.write(0x2002, 0xFF)).to.change($subject.vramBank[0], '2');
                expect($subject.vramBank[0][0x2]).to.equal(0xFF);
            });
            context("when cartridge has horizontal mirroring", function() {
                def('horiMirroring', () => true);
                
                it("writes to vramBank[0] when address [0x2000-0x23FF]", function() {
                    $subject.write(0x2003, 0xFF);
                    expect($subject.vramBank[0][0x3]).to.equal(0xFF);
                });
                it("writes to vramBank[0] when address [0x2400-0x27FF]", function() {
                    $subject.write(0x2403, 0xFF);
                    expect($subject.vramBank[0][0x3]).to.equal(0xFF);
                });
                it("writes to vramBank[1] when address [0x2800-0x2BFF]", function() {
                    $subject.write(0x2803, 0xFF);
                    expect($subject.vramBank[1][0x3]).to.equal(0xFF);
                });
                it("writes to vramBank[1] when address [0x2C00-0x2FFF]", function() {
                    $subject.write(0x2C03, 0xFF);
                    expect($subject.vramBank[1][0x3]).to.equal(0xFF);
                });
            });
            context("when cartridge has vertical mirroring", function() {
                def('vertMirroring', () => true);
                
                it("writes to vramBank[0] when address [0x2000-0x23FF]", function() {
                    $subject.write(0x2004, 0xFF);
                    expect($subject.vramBank[0][0x4]).to.equal(0xFF);
                });
                it("writes to vramBank[1] when address [0x2400-0x27FF]", function() {
                    $subject.write(0x2404, 0xFF);
                    expect($subject.vramBank[1][0x4]).to.equal(0xFF);
                });
                it("writes to vramBank[0] when address [0x2800-0x2BFF]", function() {
                    $subject.write(0x2804, 0xFF);
                    expect($subject.vramBank[0][0x4]).to.equal(0xFF);
                });
                it("writes to vramBank[1] when address [0x2C00-0x2FFF]", function() {
                    $subject.write(0x2C04, 0xFF);
                    expect($subject.vramBank[1][0x4]).to.equal(0xFF);
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Palette", function() {
        describe(".readPalette(address)", function() {
            beforeEach(function() {
                $subject.bkgPalette.set([0x3F,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08]);
                $subject.sprPalette.set([0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18]);
            });
            
            it("reads from bkgPalette when address [0x3F01-0x3F0F]", function() {
                expect($subject.readPalette(0x3F01)).to.equal(0x01);
            });
            it("reads from sprPalette when address [0x3F11-0x3F1F]", function() {
                expect($subject.readPalette(0x3F11)).to.equal(0x11);
            });
            it("always reads 'Universal background color' when bit 0-1 are clear", function() {
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
            beforeEach(function() {
                $subject.bkgPalette.set([0x3F,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08]);
                $subject.sprPalette.set([0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18]);
            });
            
            it("writes to bkgPalette when address [0x3F01-0x3F0F]", function() {
                $subject.writePalette(0x3F01, 0x15);
                expect($subject.bkgPalette[0x1]).to.equal(0x15);
            });
            it("writes to sprPalette when address [0x3F11-0x3F1F]", function() {
                $subject.writePalette(0x3F11, 0x15);
                expect($subject.sprPalette[0x1]).to.equal(0x15);
            });
            it("writes to bkgPalette when address 0x3F0[0,4,8,C]", function() {
                $subject.writePalette(0x3F00, 0x15);
                expect($subject.bkgPalette[0x0]).to.equal(0x15);
                $subject.writePalette(0x3F04, 0x16);
                expect($subject.bkgPalette[0x4]).to.equal(0x16);
                $subject.writePalette(0x3F08, 0x17);
                expect($subject.bkgPalette[0x8]).to.equal(0x17);
                $subject.writePalette(0x3F0C, 0x18);
                expect($subject.bkgPalette[0xC]).to.equal(0x18);
            });
            it("also writes to bkgPalette when address 0x3F1[0,4,8,C]", function() {
                $subject.writePalette(0x3F10, 0x15);
                expect($subject.bkgPalette[0x0]).to.equal(0x15);
                expect($subject.sprPalette[0x0]).to.equal(0x10);
                
                $subject.writePalette(0x3F14, 0x16);
                expect($subject.bkgPalette[0x4]).to.equal(0x16);
                expect($subject.sprPalette[0x4]).to.equal(0x14);
                
                $subject.writePalette(0x3F18, 0x17);
                expect($subject.bkgPalette[0x8]).to.equal(0x17);
                expect($subject.sprPalette[0x8]).to.equal(0x18);
                
                $subject.writePalette(0x3F1C, 0x18);
                expect($subject.bkgPalette[0xC]).to.equal(0x18);
                expect($subject.sprPalette[0xC]).not.to.equal(0x18);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Scrolling", function() {
        describe(".incrementX()", function() {
            beforeEach(function() { $subject.renderingEnabled = true; });
            
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
            
            it("does not change bits[5-9]", function() {
                $subject.addressBus = 0x03FF;                 // b0000.0011.1111.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x07E0); // b0000.0111.1110.0000
                
                $subject.addressBus = 0x07FF;                 // b0000.0111.1111.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x03E0); // b0000.0011.1110.0000
            });
            it("does not change bits[11-14]", function() {
                $subject.addressBus = 0x781F;                 // b0111.1000.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x7C00); // b0111.1100.0000.0000
                
                $subject.addressBus = 0x7C1F;                 // b0111.1100.0001.1111
                $subject.incrementX();                        //   ---.-n--.---X.XXXX
                expect($subject.addressBus).to.equal(0x7800); // b0111.1000.0000.0000
            });
        });
        
        describe(".incrementY()", function() {
            beforeEach(function() { $subject.renderingEnabled = true; });
            
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
            
            it("does not change bits[0-4]", function() {
                $subject.addressBus = 0x77BF;                 // b0111.0111.1011.1111
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x0C1F); // b0000.1100.0001.1111
                
                $subject.addressBus = 0x7FBF;                 // b0111.1111.1011.1111
                $subject.incrementY();                        //   yyy.n-YY.YYY-.----
                expect($subject.addressBus).to.equal(0x041F); // b0000.0100.0001.1111
            });
        });
        
        describe(".resetX()", function() {
            def('action', () => $subject.resetX());
            beforeEach(function() {
                $subject.renderingEnabled = true;
                $subject.addressBuffer = 0xFFFF;
                $subject.addressBus = 0x0000;
            });
            
            it("sets ScrollX to its initial value in #addressBuffer", function() {
                expect(() => $action).to.change($subject, 'addressBus');
                expect($subject.addressBus).to.equal(0x041F);
            });
            it("does not change #addressBuffer", function() {
                expect(() => $action).not.to.change($subject, 'addressBuffer');
            });
        });
        
        describe(".resetY()", function() {
            def('action', () => $subject.resetY());
            beforeEach(function() {
                $subject.renderingEnabled = true;
                $subject.addressBuffer = 0xFFFF;
                $subject.addressBus = 0x0000;
            });
            
            it("sets ScrollY to its initial value in #addressBuffer", function() {
                expect(() => $action).to.change($subject, 'addressBus');
                expect($subject.addressBus).to.equal(0x7BE0);
            });
            it("does not change #addressBuffer", function() {
                expect(() => $action).not.to.change($subject, 'addressBuffer');
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Data Fetch", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
        describe(".fetchNameTable(bus)", function() {
            def('action', () => $subject.fetchNameTable(0xFFFF));
            
            def('CHRROMData', () => 0x99); // b10011001
            def('VRAMData',   () => 0xA5); // b10100101
            
            context("when cartridge.ciramEnabled() returns -false-", function() {
                beforeEach(function() { $nes.cartConnector.cartridge.ciramEnabled = () => false; });
                
                it("reads from Cartridge", function() {
                    expect($action).to.equal($CHRROMData);
                });
                it("calls cartridge.ppuRead() with a modified address (0x2xxx)", function(done) {
                    $nes.cartConnector.cartridge.ppuRead = (address) => {
                        expect(address).to.equal(0x2FFF);
                        done();
                    };
                    $action;
                });
            });
            context("when cartridge.ciramEnabled() returns -true-", function() {
                beforeEach(function() { $nes.cartConnector.cartridge.ciramEnabled = () => true; });
                
                it("reads from VRAM", function() {
                    expect($action).to.equal($VRAMData);
                });
                it("calls .read() with a modified address (0x2xxx)", function(done) {
                    $subject.read = (address) => {
                        expect(address).to.equal(0x2FFF);
                        done();
                    };
                    $action;
                });
                
                context("when mirroring is horizontal", function() {
                    def('horiMirroring', () => true);
                    def('VRAM0Data', () => 0x11);
                    def('VRAM1Data', () => 0x22);
                    
                    it("reads from VRAM[0] when A10 is not set", function() {
                        expect($subject.fetchNameTable(0x0000)).to.equal($VRAM0Data);
                        expect($subject.fetchNameTable(0x0400)).to.equal($VRAM0Data);
                    });
                    it("reads from VRAM[1] when A10 is set", function() {
                        expect($subject.fetchNameTable(0x0800)).to.equal($VRAM1Data);
                        expect($subject.fetchNameTable(0x0C00)).to.equal($VRAM1Data);
                    });
                });
                context("when mirroring is vertical", function() {
                    def('vertMirroring', () => true);
                    def('VRAM0Data', () => 0x33);
                    def('VRAM1Data', () => 0x44);
                    
                    it("reads from VRAM[0] when A11 is not set", function() {
                        expect($subject.fetchNameTable(0x0000)).to.equal($VRAM0Data);
                        expect($subject.fetchNameTable(0x0800)).to.equal($VRAM0Data);
                    });
                    it("reads from VRAM[1] when A11 is set", function() {
                        expect($subject.fetchNameTable(0x0400)).to.equal($VRAM1Data);
                        expect($subject.fetchNameTable(0x0C00)).to.equal($VRAM1Data);
                    });
                });
            });
        });
        
        describe(".fetchAttributeTable(bus)", function() {
            def('action', () => $subject.fetchAttributeTable(0xFFFF));
            def('VRAMData', () => 0xE4); // b11-10-01-00 => 3-2-1-0
            
            context("when cartridge.ciramEnabled() returns -false-", function() {
                beforeEach(function() { $nes.cartConnector.cartridge.ciramEnabled = () => false; });
                
                it("calls cartridge.ppuRead() with a modified address", function(done) {
                    $nes.cartConnector.cartridge.ppuRead = (address) => {
                        expect(address).to.equal(0x2FFF);
                        done();
                    };
                    $action;
                });
            });
            context("when cartridge.ciramEnabled() returns -true-", function() {
                beforeEach(function() { $nes.cartConnector.cartridge.ciramEnabled = () => true; });
                
                it("calls .read() with a modified address", function(done) {
                    $subject.read = (address) => {
                        expect(address).to.equal(0x2FFF);
                        done();
                    };
                    $action;
                });
                it("returns a 2bit palette index according to position of tile", function() {
                    expect($subject.fetchAttributeTable(0x0000)).to.equal(0);
                    expect($subject.fetchAttributeTable(0x0002)).to.equal(1);
                    expect($subject.fetchAttributeTable(0x0040)).to.equal(2);
                    expect($subject.fetchAttributeTable(0x0042)).to.equal(3);
                });
                
                context("when mirroring is horizontal", function() {
                    def('horiMirroring', () => true);
                    def('VRAM0Data', () => 0x00);
                    def('VRAM1Data', () => 0xFF);
                    
                    it("reads from VRAM[0] when A10 is not set", function() {
                        expect($subject.fetchAttributeTable(0x0000)).to.equal(0);
                        expect($subject.fetchAttributeTable(0x0400)).to.equal(0);
                    });
                    it("reads from VRAM[1] when A10 is set", function() {
                        expect($subject.fetchAttributeTable(0x0800)).to.equal(3);
                        expect($subject.fetchAttributeTable(0x0C00)).to.equal(3);
                    });
                });
                context("when mirroring is vertical", function() {
                    def('vertMirroring', () => true);
                    def('VRAM0Data', () => 0x00);
                    def('VRAM1Data', () => 0xFF);
                    
                    it("reads from VRAM[0] when A11 is not set", function() {
                        expect($subject.fetchAttributeTable(0x0000)).to.equal(0);
                        expect($subject.fetchAttributeTable(0x0800)).to.equal(0);
                    });
                    it("reads from VRAM[1] when A11 is set", function() {
                        expect($subject.fetchAttributeTable(0x0400)).to.equal(3);
                        expect($subject.fetchAttributeTable(0x0C00)).to.equal(3);
                    });
                });
            });
        });
        
        describe(".fetchBkgPatternTable(patternIndex, row)", function() {
            def('action', () => $subject.fetchBkgPatternTable(0, 0));
            def('CHRROM0Pattern', () => [1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,16,
                                         17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
            def('CHRROM1Pattern', () => [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]);
            
            it("reads twice from the cartridge", function(done) {
                let count = 0;
                $nes.cartConnector.cartridge.ppuRead = () => { if (++count === 2) done(); };
                $action;
            });
            it("builds a word from 2 bytes at 8 bytes distance", function() {
                expect($action).to.equal(0x0109);
            });
            
            it("reads according to #bkgPatternTable", function() {
                $subject.bkgPatternTable = 0x0000;
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x0109);
                $subject.bkgPatternTable = 0x1000;
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x2129);
            });
            it("reads according to patternIndex", function() {
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x0109);
                expect($subject.fetchBkgPatternTable(1, 0)).to.equal(0x1119);
            });
            it("reads according to row", function() {
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x0109);
                expect($subject.fetchBkgPatternTable(0, 1)).to.equal(0x020A);
            });
        });
        
        describe(".fetchTile()", function() {
            def('action', () => $subject.fetchTile());
            beforeEach(function() { $subject.showBackground = true; });
            
            it("calls .fetchNameTable()", function(done) {
                $subject.fetchNameTable = () => done();
                $action;
            });
            it("calls .fetchAttributeTable()", function(done) {
                $subject.fetchAttributeTable = () => done();
                $action;
            });
            it("calls .fetchBkgPatternTable()", function(done) {
                $subject.fetchBkgPatternTable = () => done();
                $action;
            });
        });
        
        describe(".fetchNullTile()", function() {
            def('action', () => $subject.fetchNullTile());
            beforeEach(function() { $subject.showBackground = true; });
            
            it("calls .fetchNameTable()", function(done) {
                $subject.fetchNameTable = () => done();
                $action;
            });
            it("calls .fetchAttributeTable()", function(done) {
                $subject.fetchAttributeTable = () => done();
                $action;
            });
            it("calls .fetchBkgPatternTable()", function(done) {
                $subject.fetchBkgPatternTable = () => done();
                $action;
            });
        });
        describe(".fetchNullNTs()", function() {
            def('action', () => $subject.fetchNullNTs());
            beforeEach(function() { $subject.showBackground = true; });
            
            it("calls .fetchNameTable() twice", function(done) {
                let count = 0;
                $subject.fetchNameTable = () => { if (++count === 2) done(); };
                $action;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Sprites", function() {
        beforeEach("PowerOn", function() { $subject.powerOn(); });
        
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
            def('action', () => $subject.evaluateSprites($scanline));
            def('scanline', () => 2); /*global $scanline */
            
            /*global $y, $patternIndex, $attributes, $x, $count */
            def('y', () => 1);
            def('patternIndex', () => 0xAA);
            def('attributes',   () => 0xBB);
            def('x', () => 0xCC);
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
                    beforeEach(function() { $subject.sprite8x16 = false; });
                    
                    it("is not detected at scanline [9]", function() {
                        $subject.evaluateSprites(9);
                        expect($subject.oamSecondary[0]).to.equal(0xFF);
                    });
                    it("is detected between scanlines [10-17]", function() {
                        $subject.evaluateSprites(10);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                        $subject.evaluateSprites(17);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                    });
                    it("is not detected at scanline [18]", function() {
                        $subject.evaluateSprites(18);
                        expect($subject.oamSecondary[0]).to.equal(0xFF);
                    });
                });
                context("of size 8x16", function() {
                    beforeEach(function() { $subject.sprite8x16 = true; });
                    
                    it("is not detected at scanline [9]", function() {
                        $subject.evaluateSprites(9);
                        expect($subject.oamSecondary[0]).to.equal(0xFF);
                    });
                    it("is detected between scanlines [10-25]", function() {
                        $subject.evaluateSprites(10);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                        $subject.evaluateSprites(25);
                        expect($subject.oamSecondary[0]).not.to.equal(0xFF);
                    });
                    it("is not detected at scanline [26]", function() {
                        $subject.evaluateSprites(26);
                        expect($subject.oamSecondary[0]).to.equal(0xFF);
                    });
                });
            });
                    
            context("when no sprites are in range", function() {
                def('count', () => 0);
                
                it("nothing is transfered to secondary OAM", function() {
                    expect(() => $action).not.to.change($subject.oamSecondary, '0');
                    //oamSecondary[0] not tested by purpose
                    expect($subject.oamSecondary[1]).to.equal(0xFF);
                    expect($subject.oamSecondary[2]).to.equal(0xFF);
                    expect($subject.oamSecondary[3]).to.equal(0xFF);
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
                    expect($subject.oamSecondary[5]).to.equal(0xFF);
                    expect($subject.oamSecondary[6]).to.equal(0xFF);
                    expect($subject.oamSecondary[7]).to.equal(0xFF);
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
                    beforeEach(function() { $subject.oamPrimary[0] = 0xFF; });

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
                    $subject.oamPrimary.set([2,2,0xAB,0xCD], 8*4);
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
            def('action', () => $subject.fetchSprPatternTable(0, 0));
            def('CHRROM0Pattern', () => [1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,16,
                                         17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
            def('CHRROM1Pattern', () => [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]);
            
            it("reads twice from the cartridge", function(done) {
                let count = 0;
                $nes.cartConnector.cartridge.ppuRead = () => { if (++count === 2) done(); };
                $action;
            });
            it("builds a word from 2 bytes at 8 bytes distance", function() {
                expect($action).to.equal(0x0109);
            });
            
            it("reads according to #sprPatternTable", function() {
                $subject.sprPatternTable = 0x0000;
                expect($subject.fetchSprPatternTable(0, 0)).to.equal(0x0109);
                $subject.sprPatternTable = 0x1000;
                expect($subject.fetchSprPatternTable(0, 0)).to.equal(0x2129);
            });
            it("reads according to #sprite8x16", function() {
                $subject.sprite8x16 = true;
                expect($subject.fetchSprPatternTable(0, 0)).to.equal(0x0109);
                expect($subject.fetchSprPatternTable(1, 0)).to.equal(0x2129);
            });
            it("reads according to patternIndex", function() {
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x0109);
                expect($subject.fetchBkgPatternTable(1, 0)).to.equal(0x1119);
            });
            it("reads according to row", function() {
                expect($subject.fetchBkgPatternTable(0, 0)).to.equal(0x0109);
                expect($subject.fetchBkgPatternTable(0, 1)).to.equal(0x020A);
            });
        });
        
        describe(".fetchSprite(scanline)", function() {
            def('action', () => $subject.fetchSprite(1));
            beforeEach(function() {
                $subject.showSprites = true;
                $subject.oamSecondary.set([$y,$patternIndex,$attributes,$x], 0);
            });
            
            def('y', () => 1);
            def('patternIndex', () => 1);
            def('attributes',   () => 0);
            def('x', () => 1);
            
            it("calls .fetchNameTable()", function(done) {
                $subject.fetchNameTable = () => done();
                $action;
            });
            it("calls .fetchAttributeTable()", function(done) {
                $subject.fetchAttributeTable = () => done();
                $action;
            });
            
            it("resets #oamAddress", function() {
                $subject.oamAddress = 0xFF;
                expect(() => $action).to.change($subject, 'oamAddress');
                expect($subject.oamAddress).to.equal(0);
            });
            
            context("if this is the first sprite of Secondary OAM", function() {
                beforeEach(function() { $subject.oamIndex = 0; });
                
                it("does not change #sprite0 if set", function() {
                    $subject.sprite0 = true;
                    expect(() => $action).not.to.change($subject, 'sprite0');
                    expect($subject.sprite0).to.be.true;
                });
                it("does not change #sprite0 if not set", function() {
                    $subject.sprite0 = false;
                    expect(() => $action).not.to.change($subject, 'sprite0');
                    expect($subject.sprite0).to.be.false;
                });
            });
            context("if this is not the first sprite of Secondary OAM", function() {
                beforeEach(function() { $subject.oamIndex = 4; });
                
                it("unsets #sprite0", function() {
                    $subject.sprite0 = true;
                    expect(() => $action).to.change($subject, 'sprite0');
                    expect($subject.sprite0).to.be.false;
                });
                it("keeps #sprite0 not set", function() {
                    $subject.sprite0 = false;
                    expect(() => $action).not.to.change($subject, 'sprite0');
                    expect($subject.sprite0).to.be.false;
                });
            });
            
            context("if 'Vertical Flip' attribute is set", function() {
                def('attributes', () => 0x80);
                
                it("calls .fetchSprPatternTable(pIndex,row) with row=7", function(done) {
                    $subject.fetchSprPatternTable = (pIndex,row) => {
                        expect(pIndex).to.equal($patternIndex);
                        expect(row).to.equal(7);
                        done();
                    };
                    $action;
                });
                it("increases patternIndex by 1 if #sprite8x16", function(done) {
                    $subject.sprite8x16 = true;
                    $subject.spriteHeight = 16;
                    $subject.fetchSprPatternTable = (pIndex,row) => {
                        expect(pIndex).to.equal($patternIndex + 1);
                        expect(row).to.equal(7);
                        done();
                    };
                    $action;
                });
            });
            context("if 'Vertical Flip' attribute is not set", function() {
                def('attributes', () => ~0x80);
                
                it("calls .fetchSprPatternTable(pIndex,row) with row=0", function(done) {
                    $subject.fetchSprPatternTable = (pIndex,row) => {
                        expect(pIndex).to.equal($patternIndex);
                        expect(row).to.equal(0);
                        done();
                    };
                    $action;
                });
            });
            
            context("if 'Horizontal Flip' attribute is set", function() {
                def('attributes', () => 0x40);
                
                it("calls .setPatternPixels(target,pattern,palette,paletteIndex,flip) with flip set", function(done) {
                    $subject.setPatternPixels = (t,pt,pl,pli,flip) => {
                        expect(flip).to.be.ok;
                        done();
                    };
                    $action;
                });
            });
            context("if 'Horizontal Flip' attribute is not set", function() {
                def('attributes', () => ~0x40);
                
                it("calls .setPatternPixels(target,pattern,palette,paletteIndex,flip) with flip clear", function(done) {
                    $subject.setPatternPixels = (t,pt,pl,pli,flip) => {
                        expect(flip).not.to.be.ok;
                        done();
                    };
                    $action;
                });
            });
            
            context("if 'Is Behind' attribute is set", function() {
                def('attributes', () => 0x20);
                beforeEach(function() { $subject.sprLayer = null; });
                
                it("sets #sprLayer to reference #sprBehindLayer", function() {
                    expect(() => $action).to.change($subject, 'sprLayer');
                    expect($subject.sprLayer).to.equal($subject.sprBehindLayer);
                });
            });
            context("if 'Is Behind' attribute is not set", function() {
                def('attributes', () => ~0x20);
                beforeEach(function() { $subject.sprLayer = null; });
                
                it("sets #sprLayer to reference #sprInFrontLayer", function() {
                    expect(() => $action).to.change($subject, 'sprLayer');
                    expect($subject.sprLayer).to.equal($subject.sprInFrontLayer);
                });
            });
        });
        
        describe(".fetchNullSprite()", function() {
            def('action', () => $subject.fetchNullSprite());
            beforeEach(function() { $subject.showSprites = true; });
            
            it("calls .fetchNameTable()", function(done) {
                $subject.fetchNameTable = () => done();
                $action;
            });
            it("calls .fetchAttributeTable()", function(done) {
                $subject.fetchAttributeTable = () => done();
                $action;
            });
            it("calls .fetchSprPatternTable()", function(done) {
                $subject.fetchSprPatternTable = () => done();
                $action;
            });
        });
    });
});
