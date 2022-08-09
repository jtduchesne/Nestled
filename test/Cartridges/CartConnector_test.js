import CartConnector, { Cartridge, Metadata } from "../../src/Cartridges";
import { Header } from "../../src/Cartridges/FileFormats";

describe("CartConnector", function() {
    subject(() => new CartConnector);
    
    its('file',      () => is.expected.to.be.an.instanceOf(Header));
    its('metadata',  () => is.expected.to.be.an.instanceOf(Metadata));
    its('cartridge', () => is.expected.to.be.an.instanceOf(Cartridge));
    
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
        
        context("with an invalid file signature", function() {
            def('signature', () => [0x42,0x41,0x44,0x1A]); // BAD_
            
            it("throws an Error", function() {
                expect(() => $action).to.throw(/invalid format/i);
            });
        });
        
        context("with an unsupported file signature", function() {
            def('signature', () => [0x55,0x4E,0x49,0x46]); // UNIF
            
            it("throws an Error", function() {
                expect(() => $action).to.throw(/unsupported format/i);
            });
        });
        
        context("with a valid file signature", function() {
            def('signature', () => [0x4E,0x45,0x53,0x1A]); // NES_
            
            it("sets #file", function() {
                expect(() => $action).to.change($subject, 'file');
                expect($subject.file).to.be.an.instanceOf(Header);
            });
            it("sets #cartridge", function() {
                expect(() => $action).to.change($subject, 'cartridge');
                expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
            });
        });
        
        context("with", function() {
            beforeEach(() => $action);
            def('cartridge', () => $subject.cartridge); /*global $cartridge */
            
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
        
        it("resets #file", function() {
            expect(() => $action).to.change($subject, 'file');
            expect($subject.file).to.be.an.instanceOf(Header);
        });
        it("resets #metadata", function() {
            expect(() => $action).to.change($subject, 'metadata');
            expect($subject.metadata).to.be.an.instanceOf(Metadata);
        });
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        
        it("resets #file", function() {
            expect(() => $action).to.change($subject, 'file');
            expect($subject.file).to.be.an.instanceOf(Header);
        });
        it("resets #metadata", function() {
            expect(() => $action).to.change($subject, 'metadata');
            expect($subject.metadata).to.be.an.instanceOf(Metadata);
        });
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
    });
});
