import CartConnector, { Cartridge } from "../src/Cartridges";

describe("CartConnector", function() {
    subject(() => new CartConnector);
    
    its('cartridge', () => is.expected.to.be.an.instanceOf(Cartridge));
    
    its('name',     () => is.expected.to.be.a('string'));
    its('tvSystem', () => is.expected.to.be.a('string').and.equal("NTSC"));
    
    // #statuses is not tested by purpose, since it's just a temporary solution...
    
    its('fileLoaded',    () => is.expected.to.be.false);
    its('fileValid',     () => is.expected.to.be.false);
    its('fileSupported', () => is.expected.to.be.false);
    
    describe(".parseFilename(filename)", function() {
        def('action', () => $subject.parseFilename($filename));
        
        def('filename', () => "a_pretty_good_Game (U)[!b].nes"); /*global $filename */
        
        it("sets #name", function() {
            expect(() => $action).to.change($subject, 'name');
        });
        it("removes the file extension", function() {
            $action;
            expect($subject.name).not.to.match(/\.(nes)?$/);
        });
        it("removes the country code", function() {
            $action;
            expect($subject.name).not.to.match(/\([A-Z]*\)/);
        });
        it("removes dump infos", function() {
            $action;
            expect($subject.name).not.to.match(/\[.*?\]/);
        });
        it("properly format the name", function() {
            $action;
            expect($subject.name).to.equal("A pretty good Game");
        });
        
        context("when no country code is in the filename", function() {
            def('filename', () => "Game name.nes");
            
            it("keeps #tvSystem as 'NTSC'(default)", function() {
                expect(() => $action).not.to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("NTSC");
            });
        });
        context("when a NTSC country code is in the filename", function() {
            def('filename', () => "Game name (U).nes");
            
            it("sets #tvSystem to 'NTSC'", function() {
                $subject.tvSystem = "PAL";
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("NTSC");
            });
        });
        context("when a PAL country code is in the filename", function() {
            def('filename', () => "Game name (UK).nes");
            
            it("sets #tvSystem to 'PAL'", function() {
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("PAL");
            });
        });
        context("when a SECAM country code is in the filename", function() {
            def('filename', () => "Game name (F).nes");
            
            it("sets #tvSystem to 'SECAM'", function() {
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("SECAM");
            });
        });
    });
    
    describe(".parseData(data)", function() {
        def('action', () => $subject.parseData($data));
        
        /*global $numPRG, $numCHR, $flags6, $flags7, $name */
        def(['numPRG','numCHR','flags6','flags7','name']);
        /*global $trainerData, $PRGROMData, $CHRROMData */
        def('trainerData', () => 0x99);// b10011001
        def('PRGROMData', () => 0xA5); // b10100101
        def('CHRROMData', () => 0xC3); // b11000011
        /*global $data, $signature */
        def('signature', () => [0x4E,0x45,0x53,0x1A]);
        def('data', () => (
            new Uint8Array($signature
                           .concat([$numPRG,$numCHR,$flags6,$flags7, 0,0,0,0,0,0,0,0])
                           .concat(new Array($flags6&0x4 ? 0x200 : 0).fill($trainerData))
                           .concat(new Array(($numPRG || 0)*0x4000).fill($PRGROMData))
                           .concat(new Array(($numCHR || 0)*0x2000).fill($CHRROMData))
                           .concat($name ? Array.from($name, v => v.charCodeAt(0)) : [])).buffer
        ));
        
        context("with the wrong file signature", function() {
            def('signature', () => [0x42,0x41,0x44,0x1A]); // BAD_
            
            it("throws an Error", function() {
                expect(() => $action).to.throw(/invalid format/i);
            });
        });
        
        context("with the right file signature", function() {
            def('signature', () => [0x4E,0x45,0x53,0x1A]); // NES_
            
            it("sets #cartridge", function() {
                expect(() => $action).to.change($subject, 'cartridge');
                expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
            });
            it("sets #fileValid", function() {
                expect(() => $action).to.change($subject, 'fileValid');
                expect($subject.fileValid).to.be.true;
            });
        });
        
        context("with", function() {
            beforeEach(() => $action);
            def('cartridge', () => $subject.cartridge); /*global $cartridge */
            
            context("a supported Mapper (#1)", function() {
                def('flags6', () => (1 << 4));
                
                its('fileSupported', () => is.expected.to.be.true);
                
                it("sets cartridge#mapperNumber", function() {
                    expect($cartridge.mapperNumber).to.equal(1);
                });
            });
            context("an unsupported Mapper (#15)", function() {
                def('flags6', () => (15 << 4));
                
                its('fileSupported', () => is.expected.to.be.false);
                
                it("sets cartridge#mapperNumber", function() {
                    expect($cartridge.mapperNumber).to.equal(15);
                });
            });
            context("an extended Mapper number (#16)", function() {
                def('flags7', () => (1 << 4));
                
                it("sets cartridge#mapperNumber", function() {
                    expect($cartridge.mapperNumber).to.equal(16);
                });
            });
            
            context("horizontal mirroring", function() {
                def('flags6', () => 0x00);
                
                it("sets cartridge#horiMirroring", function() {
                    expect($cartridge.horiMirroring).to.be.true;
                });
                it("clears cartridge#vertMirroring", function() {
                    expect($cartridge.vertMirroring).to.be.false;
                });
            });
            context("vertical mirroring", function() {
                def('flags6', () => 0x01);
                
                it("clears cartridge#horiMirroring", function() {
                    expect($cartridge.horiMirroring).to.be.false;
                });
                it("sets cartridge#vertMirroring", function() {
                    expect($cartridge.vertMirroring).to.be.true;
                });
            });
            context("4 screens scrolling", function() {
                def('flags6', () => 0x08);
                
                it("clears cartridge#horiMirroring", function() {
                    expect($cartridge.horiMirroring).to.be.false;
                });
                it("clears cartridge#vertMirroring", function() {
                    expect($cartridge.vertMirroring).to.be.false;
                });
            });
            
            context("battery-backed PRG-RAM enabled", function() {
                def('flags6', () => 0x02);
                
                it("sets cartridge#battery", function() {
                    expect($cartridge.battery).to.be.true;
                });
            });
            
            context("a 512 bytes trainer", function() {
                def('flags6', () => 0x04);
                
                it("copies the trainer data to [0x7000-0x71FF]", function() {
                    expect($cartridge.cpuRead(0x7000)).to.equal($trainerData);
                    expect($cartridge.cpuRead(0x71FF)).to.equal($trainerData);
                    expect($cartridge.cpuRead(0x7200)).not.to.equal($trainerData);
                });
                it("does not affect PRGROM data", function() {
                    expect($cartridge.cpuRead(0x8000)).not.to.equal($trainerData);
                    expect($cartridge.cpuRead(0xFFFF)).not.to.equal($trainerData);
                });
            });
            
            context("PRGROM data", function() {
                def('numPRG', () => 2);
                
                it("sets PRGROM data", function() {
                    expect($cartridge.cpuRead(0x8000)).to.equal($PRGROMData);
                    expect($cartridge.cpuRead(0xFFFF)).to.equal($PRGROMData);
                });
            });
            context("CHRROM data", function() {
                def('numCHR', () => 1);
                
                it("sets CHRROM data", function() {
                    expect($cartridge.ppuRead(0x0000)).to.equal($CHRROMData);
                    expect($cartridge.ppuRead(0x1FFF)).to.equal($CHRROMData);
                });
            });
        
            context("a name at the end of the file", function() {
                def('name', () => "A good 'Mapper #0' game");
                
                its('name', () => is.expected.to.equal($name));
            });
        });
    });
    
    describe(".load(file)", function() {
        def('action', () => $subject.load($file));
        
        def('file', () => undefined); /*global $file */
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        
        it("resets #fileLoaded", function() {
            $subject.fileLoaded = true;
            expect(() => $action).to.change($subject, 'fileLoaded');
            expect($subject.fileLoaded).to.be.false;
        });
        it("resets #fileValid", function() {
            $subject.fileValid = true;
            expect(() => $action).to.change($subject, 'fileValid');
            expect($subject.fileValid).to.be.false;
        });
        it("resets #fileSupported", function() {
            $subject.fileSupported = true;
            expect(() => $action).to.change($subject, 'fileSupported');
            expect($subject.fileSupported).to.be.false;
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
        
        it("resets #fileLoaded", function() {
            $subject.fileLoaded = true;
            expect(() => $action).to.change($subject, 'fileLoaded');
            expect($subject.fileLoaded).to.be.false;
        });
        it("resets #fileValid", function() {
            $subject.fileValid = true;
            expect(() => $action).to.change($subject, 'fileValid');
            expect($subject.fileValid).to.be.false;
        });
        it("resets #fileSupported", function() {
            $subject.fileSupported = true;
            expect(() => $action).to.change($subject, 'fileSupported');
            expect($subject.fileSupported).to.be.false;
        });
    });
});
