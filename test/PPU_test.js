describe("Ppu", function() {
    //------------------------------------------------------------------------------------//
    //- NESFile Fixture
    def('CHRROMData', () => 0xA5); // b10100101
    def('NESFile', () => Object.assign(new Nestled.NESFile, {
        name: "Whatever", isValid: true, 
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, 0, 1, 0, 0, 0,0,0,0,0,0,0,0]
                              .concat(new Array(0x2000).fill($CHRROMData))).buffer
    }));
    //------------------------------------------------------------------------------------//
    
    def('cartridge', () => new Nestled.Cartridge($NESFile));
    def('nes', () => new Nestled.NES($cartridge));
    
    subject(() => $nes.ppu);
    
    def('VRAMData', () => 0xC3); // b11000011
    def(['VRAM0Data','VRAM1Data']);
    def('PalData', () => 0x99); // b10011001
    def(['bkgPalData','sprPalData']);
    def('CHRROMPattern1'); //If set, this pattern is set at the beginning of CHR-ROM
    def('CHRROMPattern2'); //If set, this pattern is set at CHR-ROM[0x1000]
    beforeEach(function() {
        $subject.vramBank[0].fill($VRAM0Data || $VRAMData);
        $subject.vramBank[1].fill($VRAM1Data || $VRAMData);
        $subject.palette[0].fill($bkgPalData || $PalData);
        $subject.palette[1].fill($sprPalData || $PalData);
        if ($CHRROMPattern1) $cartridge.CHRBank[0].set($CHRROMPattern1, 0x0000);
        if ($CHRROMPattern2) $cartridge.CHRBank[0].set($CHRROMPattern2, 0x1000);
    });
    
    beforeEach("PowerOn", function() { $subject.powerOn(); });
    
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $subject.powerOn(); });
        
        its('isPowered', () => is.expected.to.be.true);
        
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
        
        its('isPowered', () => is.expected.to.be.false);
    });
    
    describe(".doReset()", function() {
        def('action', () => $subject.doReset());
        
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
    
    describe(".doVBlank()", function() {
        def('action', () => $subject.doVBlank());
        beforeEach(function() { $subject.renderingEnabled = true; });
        
        it("sets #vblank", function() {
            expect(() => $action).to.change($subject, 'vblank');
            expect($subject.vblank).to.be.true;
        });
        it("disables rendering", function() {
            expect(() => $action).to.change($subject, 'renderingEnabled');
            expect($subject.renderingEnabled).to.be.false;
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
            $subject.renderingEnabled = false;
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
        
        context("if neither #showBackground nor #showSprites were set", function() {
            beforeEach(function() {
                $subject.showBackground = false;
                $subject.showSprites = false;
            });
            
            it("keeps rendering disabled", function() {
                expect(() => $action).not.to.change($subject, 'renderingEnabled');
                expect($subject.renderingEnabled).to.be.false;
            });
        });
        context("if #showBackground was set", function() {
            beforeEach(function() {
                $subject.showBackground = true;
                $subject.showSprites = false;
            });
            
            it("reenables rendering", function() {
                expect(() => $action).to.change($subject, 'renderingEnabled');
                expect($subject.renderingEnabled).to.be.true;
            });
        });
        context("if #showSprites was set", function() {
            beforeEach(function() {
                $subject.showBackground = false;
                $subject.showSprites = true;
            });
            
            it("reenables rendering", function() {
                expect(() => $action).to.change($subject, 'renderingEnabled');
                expect($subject.renderingEnabled).to.be.true;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".readRegister(address)", function() {
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
                $subject.oam[0] = 0x50;
                $subject.oamAddress = 0x00;
            });
            
            it("returns the value of oam[oamAddress]", function() {
                expect($action).to.equal(0x50); });
            it("does not increment oamAddress", function() {
                expect(() => $action).not.to.change($subject, 'oamAddress');
            });
        });
        
        context("when address is 0x2007", function() {
            def('address', () => 0x2007);
            
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
                    expect($action).to.equal($PalData);
                });
                it("still put the VRAM data into readBuffer", function() {
                    $subject.readBuffer = 0;
                    expect($action).to.equal($PalData);
                    expect($subject.readBuffer).to.equal($VRAMData);
                });
            });
        });
    });
    
    describe(".writeRegister(address, data)", function() {
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
            
            def('oamAddress', () => 0x80);
            beforeEach(function() { $subject.oamAddress = $oamAddress; });
            
            it("writes data to oam[oamAddress]", function() {
                expect(() => $action).to.change($subject.oam, $oamAddress);
                expect($subject.oam[$oamAddress]).to.equal($data);
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
                    expect(() => $action).not.to.change($nes.cartridge.CHRROM[0], '0');
                    expect($nes.cartridge.CHRROM[0][0]).to.equal($CHRROMData);
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
    
    //-------------------------------------------------------------------------------//
    
    describe(".read(address)", function() {
        def('VRAM0Data', () => 0xA5); // b10100101
        def('VRAM1Data', () => 0xC3); // b11000011
        
        it("reads from cartridge (CHR-ROM) when address < 0x2000", function() {
            expect($subject.read(0x0000)).to.equal($CHRROMData);
        });
        it("reads from VRAM when address >= 0x2000", function() {
            expect($subject.read(0x2001)).to.equal($VRAM0Data);
        });
        context("when cartridge has horizontal mirroring", function() {
            beforeEach(function() { $nes.cartridge.horiMirroring = true; });
            
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
            beforeEach(function() { $nes.cartridge.vertMirroring = true; });
            
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
            expect(() => $subject.write(0x0001, 0xFF)).not.to.change($nes.cartridge.CHRROM[0], '1');
            expect($nes.cartridge.CHRROM[0][0]).to.equal($CHRROMData);
        });
        it("writes to VRAM when address >= 0x2000", function() {
            expect(() => $subject.write(0x2002, 0xFF)).to.change($subject.vramBank[0], '2');
            expect($subject.vramBank[0][0x2]).to.equal(0xFF);
        });
        context("when cartridge has horizontal mirroring", function() {
            beforeEach(function() { $nes.cartridge.horiMirroring = true; });
            
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
            beforeEach(function() { $nes.cartridge.vertMirroring = true; });
            
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
    
    //-------------------------------------------------------------------------------//
    
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
    
    //-------------------------------------------------------------------------------//
    
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
    
    //-------------------------------------------------------------------------------//
    
    describe(".fetchNameTable(bus)", function() {
        def('action', () => $subject.fetchNameTable(0xFFFF));
        
        context("when cartridge.ciramEnabled() returns -false-", function() {
            beforeEach(function() { $nes.cartridge.ciramEnabled = () => false; });
            
            it("reads from Cartridge", function() {
                expect($action).to.equal($CHRROMData);
            });
            it("calls cartridge.ppuRead() with a modified address (0x2xxx)", function(done) {
                $nes.cartridge.ppuRead = (address) => {
                    expect(address).to.equal(0x2FFF);
                    done();
                };
                $action;
            });
        });
        context("when cartridge.ciramEnabled() returns -true-", function() {
            beforeEach(function() { $nes.cartridge.ciramEnabled = () => true; });
            
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
                beforeEach(function() { $nes.cartridge.horiMirroring = true; });
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
                beforeEach(function() { $nes.cartridge.vertMirroring = true; });
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
            beforeEach(function() { $nes.cartridge.ciramEnabled = () => false; });
            
            it("calls cartridge.ppuRead() with a modified address", function(done) {
                $nes.cartridge.ppuRead = (address) => {
                    expect(address).to.equal(0x2FFF);
                    done();
                };
                $action;
            });
        });
        context("when cartridge.ciramEnabled() returns -true-", function() {
            beforeEach(function() { $nes.cartridge.ciramEnabled = () => true; });
            
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
                beforeEach(function() { $nes.cartridge.horiMirroring = true; });
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
                beforeEach(function() { $nes.cartridge.vertMirroring = true; });
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
    
    describe(".fetchBkgPatternTable(patternIndex)", function() {
        def('action', () => $subject.fetchBkgPatternTable(0));
        def('CHRROMPattern1', () => [ 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,16,
                                     17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
        def('CHRROMPattern2', () => [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]);
        
        it("reads twice from the cartridge", function(done) {
            var count = 0;
            $nes.cartridge.ppuRead = () => { if (++count === 2) done(); };
            $action;
        });
        it("builds a word from 2 bytes at 8 bytes distance", function() {
            expect($action).to.equal(0x0109);
        });
        
        it("reads according to #bkgPatternTable", function() {
            $subject.bkgPatternTable = 0x0000;
            expect($subject.fetchBkgPatternTable(0)).to.equal(0x0109);
            $subject.bkgPatternTable = 0x1000;
            expect($subject.fetchBkgPatternTable(0)).to.equal(0x2129);
        });
        it("reads according to patternIndex", function() {
            expect($subject.fetchBkgPatternTable(0)).to.equal(0x0109);
            expect($subject.fetchBkgPatternTable(1)).to.equal(0x1119);
        });
        it("reads according to #fineScrollY", function() {
            $subject.fineScrollY = 0x0;
            expect($subject.fetchBkgPatternTable(0)).to.equal(0x0109);
            $subject.fineScrollY = 0x1;
            expect($subject.fetchBkgPatternTable(0)).to.equal(0x020A);
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
            var count = 0;
            $subject.fetchNameTable = () => { if (++count === 2) done(); };
            $action;
        });
    });
});
