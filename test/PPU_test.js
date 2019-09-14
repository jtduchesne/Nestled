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
    beforeEach(function() {
        $subject.vramBank[0].fill($VRAM0Data || $VRAMData);
        $subject.vramBank[1].fill($VRAM1Data || $VRAMData);
        $subject.palette[0].fill($bkgPalData || $PalData);
        $subject.palette[1].fill($sprPalData || $PalData);
    });
    
    beforeEach("PowerOn", function() { $subject.powerOn(); });
        
    //-------------------------------------------------------------------------------//
    
    describe(".powerOn()", function() {
        beforeEach(function() { $subject.powerOn(); });
        
        its('isPowered', () => is.expected.to.be.true);
        
        its('addToXScroll',     () => is.expected.to.equal(0));
        its('addToYScroll',     () => is.expected.to.equal(0));
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
            expect($subject.addToXScroll).to.equal(0);
            expect($subject.addToYScroll).to.equal(0);
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
        });
        it("clears Scroll Register", function() {
            $subject.writeRegister(0x2005, 0xFF);
            $action;
            expect($subject.writeToggle).to.be.false;
            expect($subject.scrollX).to.equal(0);
            expect($subject.scrollY).to.equal(0);
        });
        it("clears the read buffer", function() {
            $subject.readBuffer = 0xFF;
            $action;
            expect($subject.readBuffer).to.equal(0);
        });
    });
    
    describe(".doFrame()", function() {
        def('action', () => $subject.doFrame());
        
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
                    $subject.writeRegister($address, 0xAD);
                });
                
                it("sets scrollX", function() {
                    expect($subject.scrollX).to.equal(0xAD);
                });
            });
            context("the second time", function() {
                beforeEach(function() {
                    $subject.writeRegister($address, 0x00);
                    $subject.writeRegister($address, 0xAD);
                });
                
                it("sets scrollY", function() {
                    expect($subject.scrollY).to.equal(0xAD);
                });
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
});
