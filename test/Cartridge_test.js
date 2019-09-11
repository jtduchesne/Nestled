describe("Cartridge", function() {
    //----------------------------------------------------------------------------------------------------//
    //- NESFile Fixtures
    def('filename', () => $name ? $name.replace(/[\W ]+/g, " ")+" (U)[!].nes" : "A Game Name (Unk)[b].nes")
    
    def(['numPRG','numCHR','flags6','flags7','trainerData','name']);
    def('PRGROMData', () => 0xA5); // b10100101
    def('CHRROMData', () => 0xC3); // b11000011
    def('validNESFile', () => Object.assign(new Nestled.NESFile, {
        name: $filename, isValid: true, 
        data: new Uint8Array([0x4E,0x45,0x53,0x1A, $numPRG, $numCHR, $flags6, $flags7, 0,0,0,0,0,0,0,0]
                              .concat(new Array($flags6&0x4 ? 0x200 : 0).fill($trainerData))
                              .concat(new Array(($numPRG || 0)*0x4000).fill($PRGROMData))
                              .concat(new Array(($numCHR || 0)*0x2000).fill($CHRROMData))
                              .concat($name ? Array.from($name, v => v.charCodeAt(0)) : [])).buffer
    }));
    def('invalidNESFile', () => Object.assign(new Nestled.NESFile, { 
        name: $filename, isValid: false
    }));
    //----------------------------------------------------------------------------------------------------//
    
    def('opts', () => $validNESFile);
    subject(() => new Nestled.Cartridge($opts));
    
    def(['PRGRAMData','CHRRAMData']);
    beforeEach(function() {
        if ($PRGRAMData) $subject.PRGRAM.fill($PRGRAMData);
        if ($CHRRAMData) $subject.CHRRAM.fill($CHRRAMData);
    });
    
    describe("constructor(opts)", function() {
        context("given an invalid -NESFile- object in opts['file']", function() {
            def('opts', () => ({ file: $invalidNESFile }));
            
            it("returns a new -NoCartridge- object", function() {
                expect($subject).to.be.an.instanceof(Nestled.NoCartridge);
            });
        });
        
        context("given a valid -NESFile- object in opts['file']", function() {
            def('opts', () => ({ file: $validNESFile }));
            
            it("returns a new -Cartridge- object", function() {
                expect($subject).to.be.an.instanceof(Nestled.Cartridge);
                expect($subject).not.to.be.an.instanceof(Nestled.NoCartridge);
            });
        });
        
        context("given a valid -NESFile- object as opts", function() {
            def('opts', () => $validNESFile);
            
            it("returns a new -Cartridge- object", function() {
                expect($subject).to.be.an.instanceof(Nestled.Cartridge);
                expect($subject).not.to.be.an.instanceof(Nestled.NoCartridge);
            });
        });
    });
        
    describe(".load(argument)", function() {
        def('action', () => $subject.load($argument));
        
        context("when argument is an invalid -NESFile-", function() {
            def('argument', () => $invalidNESFile);
            
            beforeEach(() => $action);
            
            its('name', () => is.expected.to.be.empty);
            its('file', () => is.expected.to.be.null);
            
            it("returns a -NoCartridge- object", function() {
                expect($action).to.be.an.instanceof(Nestled.NoCartridge);
            });
        });
        
        context("when argument is a valid -NESFile-", function() {
            def('argument', () => $validNESFile);
            
            def('filename', () => "mapper_0_game (U)[!].nes");
            def('numPRG', () => 2);
            def('numCHR', () => 1);
            def('flags6', () => 0x00);
            def('flags7', () => 0x00);
            
            beforeEach(() => $action);
            
            its('name', () => is.expected.to.equal("Mapper 0 game"));
            its('file', () => is.expected.to.equal($validNESFile));
            
            its('mapperNumber', () => is.expected.to.equal(0));
            
            context("with vertical mirroring", function() {
                def('flags6', () => 0x00);
                
                its('horiMirroring', () => is.expected.to.be.false);
                its('vertMirroring', () => is.expected.to.be.true);
            });
            context("with horizontal mirroring", function() {
                def('flags6', () => 0x01);
                
                its('horiMirroring', () => is.expected.to.be.true);
                its('vertMirroring', () => is.expected.to.be.false);
            });
            context("with 4 screens mirroring", function() {
                def('flags6', () => 0x08);
                
                its('horiMirroring', () => is.expected.to.be.false);
                its('vertMirroring', () => is.expected.to.be.false);
            });
            
            context("with battery-backed PRG-RAM enabled", function() {
                def('flags6', () => 0x02);
                
                its('battery', () => is.expected.to.be.true);
            });
            
            context("with a 512 bytes trainer", function() {
                def('flags6',      () => 0x04);
                
                def('trainerData', () => 0xAA);
                def('PRGROMData',  () => 0xC3);
                
                it("copies the trainer data to [0x7000-0x71FF]", function() {
                    expect($subject.cpuRead(0x7000)).to.equal($trainerData)
                    expect($subject.cpuRead(0x71FF)).to.equal($trainerData)
                    expect($subject.cpuRead(0x7200)).not.to.equal($trainerData)
                });
                it("does not affect PRGROM data", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGROMData);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData);
                });
            });
            
            its('PRGROM', () => is.expected.to.have.a.lengthOf($numPRG));
            its('PRGBank', () => is.expected.to.have.a.lengthOf(2));
            it("sets PRGROM data", function() {
                expect($subject.PRGBank[0][0x0000]).to.equal($PRGROMData);
                expect($subject.PRGBank[1][0x3FFF]).to.equal($PRGROMData);
            });
            
            its('CHRROM', () => is.expected.to.have.a.lengthOf($numCHR));
            its('CHRBank', () => is.expected.to.have.a.lengthOf(2));
            it("sets CHRROM data", function() {
                expect($subject.CHRBank[0][0x0000]).to.equal($CHRROMData);
                expect($subject.CHRBank[1][0x1FFF]).to.equal($CHRROMData);
            });
            
            context("with a name at the end of the file", function() {
                def('name', () => "A good 'Mapper #0' game");
                
                its('name', () => is.expected.to.equal($name));
            });
            
            describe("#tvSystem", function() {
                context("when no country code is in the filename", function() {
                    def('filename', () => "Game name.nes");
                    
                    its('tvSystem', () => is.expected.to.equal("NTSC"));
                });
                context("when a PAL country code is in the filename", function() {
                    def('filename', () => "Game name (UK).nes");
                    
                    its('tvSystem', () => is.expected.to.equal("PAL"));
                });
                context("when a SECAM country code is in the filename", function() {
                    def('filename', () => "Game name (F).nes");
                    
                    its('tvSystem', () => is.expected.to.equal("SECAM"));
                });
                context("when a NTSC country code is in the filename", function() {
                    def('filename', () => "Game name (U).nes");
                    
                    its('tvSystem', () => is.expected.to.equal("NTSC"));
                });
            });
            
            it("returns a -Cartridge- object", function() {
                expect($action).to.be.an.instanceof(Nestled.Cartridge);
            });
            it("returns -this-", function() {
                expect($action).to.equal($subject);
            });
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        def('numPRG', () => 1);
        def('numCHR', () => 1);
        
        beforeEach(() => $action);
        
        its('file', () => is.expected.to.be.null);
        
        its('PRGROM', () => is.expected.to.be.empty);
        its('CHRROM', () => is.expected.to.be.empty);
        
        it("returns a -NoCartridge- object", function() {
            expect($action).to.be.an.instanceof(Nestled.NoCartridge);
        });
    });
    
    describe(".cpuRead(address)", function() {
        def('valid', () => true);
        
        def('numPRG', () => 1);
        
        def('PRGRAMData', () => 0x12);
        def('PRGROMData', () => 0x34);
        
        it("reads from PRG-RAM when address is between [0x6000-7FFF]", function() {
            expect($subject.cpuRead(0x6000)).to.equal($PRGRAMData);
            expect($subject.cpuRead(0x7FFF)).to.equal($PRGRAMData);
        });
        it("reads from PRG-ROM when address is between [0x8000-FFFF]", function() {
            expect($subject.cpuRead(0x8000)).to.equal($PRGROMData);
            expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData);
        });
        
        context("if there is no PRG-ROM data", function() {
            def('numPRG', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.cpuRead(0x8000)).to.not.throw();
                expect(() => $subject.cpuRead(0xFFFF)).to.not.throw();
            });
            it("reads from PRG-RAM instead", function() {
                expect($subject.cpuRead(0x8000)).to.equal($PRGRAMData);
                expect($subject.cpuRead(0xFFFF)).to.equal($PRGRAMData);
            });
        });
        
        context("if no valid game loaded", function() {
            def('valid', () => false);
            
            it("does not throw any errors", function() {
                expect(() => $subject.cpuRead(0x8000)).to.not.throw();
                expect(() => $subject.cpuRead(0xFFFF)).to.not.throw();
            });
        });
    });
    
    describe(".cpuWrite(address,data)", function() {
        def('valid', () => true);
        
        def('numPRG', () => 2);
        
        def('PRGRAMData', () => 0x9A);
        def('PRGROMData', () => 0xBC);
        
        it("writes to PRG-RAM when address is between [0x6000-7FFF]", function() {
            expect(() => $subject.cpuWrite(0x6000, 0xFF)).to.change($subject.PRGRAM, '0');
            expect($subject.cpuRead(0x6000)).to.equal(0xFF);
        });
        it("cannot write to PRG-ROM", function() {
            expect(() => $subject.cpuWrite(0x8000, 0xFF)).not.to.change($subject.PRGROM[0], '0');
            expect($subject.cpuRead(0x8000)).to.equal(0xBC);
            expect(() => $subject.cpuWrite(0xC000, 0xFF)).not.to.change($subject.PRGROM[1], '0');
            expect($subject.cpuRead(0xC000)).to.equal(0xBC);
        });
        
        context("if there is no PRG-ROM data", function() {
            def('numPRG', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.cpuWrite(0x8000, 0xFF)).to.not.throw();
                expect(() => $subject.cpuWrite(0xFFFF, 0xFF)).to.not.throw();
            });
            it("writes to PRG-RAM instead", function() {
                expect(() => $subject.cpuWrite(0x8000, 0xFF)).to.change($subject.PRGRAM, '0');
                expect($subject.cpuRead(0x6000)).to.equal(0xFF);
            });
        });
        
        context("if no valid game loaded", function() {
            def('valid', () => false);
            
            it("does not throw any errors", function() {
                expect(() => $subject.cpuWrite(0x8000)).to.not.throw();
                expect(() => $subject.cpuWrite(0xFFFF)).to.not.throw();
            });
        });
    });
    
    describe(".ppuRead(address)", function() {
        def('valid', () => true);
        
        def('numPRG', () => 1);
        def('numCHR', () => 1);
        
        def('CHRRAMData', () => 0xDE);
        def('CHRROMData', () => 0xF0);
        
        it("reads from CHR-ROM", function() {
            expect($subject.ppuRead(0x0000)).to.equal($CHRROMData);
            expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData);
        });
        
        context("if there is no CHR-ROM data", function() {
            def('numCHR', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuRead(0x0000)).to.not.throw();
                expect(() => $subject.ppuRead(0x3FFF)).to.not.throw();
            });
            it("reads from CHR-RAM instead", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRRAMData);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRRAMData);
            });
        });
        
        context("if no valid game loaded", function() {
            def('valid', () => false);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuRead(0x0000)).to.not.throw();
                expect(() => $subject.ppuRead(0x3FFF)).to.not.throw();
            });
        });
    });
    
    describe(".ppuWrite(address,data)", function() {
        def('valid', () => true);
        
        def('numPRG', () => 1);
        def('numCHR', () => 1);
        
        def('CHRRAMData', () => 0xDE);
        def('CHRROMData', () => 0xF0);
        
        it("cannot write to CHR-ROM", function() {
            expect(() => $subject.ppuWrite(0x0000, 0xFF)).not.to.change($subject.CHRROM[0], '0');
            expect($subject.ppuRead(0x0000)).to.equal($CHRROMData);
        });
        
        context("if there is no CHR-ROM data", function() {
            def('numCHR', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuWrite(0x0000, 0xFF)).to.not.throw();
                expect(() => $subject.ppuWrite(0x3FFF, 0xFF)).to.not.throw();
            });
            it("writes to CHR-RAM instead", function() {
                expect(() => $subject.ppuWrite(0x0000, 0xFF)).to.change($subject.CHRRAM, '0');
                expect($subject.ppuRead(0x0000)).to.equal(0xFF);
            });
        });
        
        context("if no valid game loaded", function() {
            def('valid', () => false);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuWrite(0x0000)).to.not.throw();
                expect(() => $subject.ppuWrite(0x3FFF)).to.not.throw();
            });
        });
    });
    
    describe(".ciramA10(address)", function() {
        context("with vertical mirroring", function() {
            def('flags6', () => 0x00);
            
            it("is not set when address & 0x400", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
            });
            it("is set when address & 0x800", function() {
                expect($subject.ciramA10(0xAAAA)).to.be.ok;
            });
        });
        context("with horizontal mirroring", function() {
            def('flags6', () => 0x01);
            
            it("is set when address & 0x400", function() {
                expect($subject.ciramA10(0x5555)).to.be.ok;
            });
            it("is not set when address & 0x800", function() {
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
        context("with four screens mirroring", function() {
            def('flags6', () => 0x08);
            
            it("is never set", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
    });
    
    describe(".ciramEnabled(address)", function() {
        it("is not set when address < 0x2000", function() {
            expect($subject.ciramEnabled(0x0000)).to.not.be.ok;
            expect($subject.ciramEnabled(0x1000)).to.not.be.ok;
        });
        it("is set when address >= 0x2000", function() {
            expect($subject.ciramEnabled(0x2000)).to.be.ok;
            expect($subject.ciramEnabled(0x3000)).to.be.ok;
        });
    });
});
