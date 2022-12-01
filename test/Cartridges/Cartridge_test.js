import Cartridge from "../../src/Cartridges/Cartridge";

import { INESHeader } from "../../src/Cartridges/FileFormats";

import INESFile_factory from "../Fixtures/INESFile_factory";

describe("Cartridge", function() {
    subject(() => new Cartridge);
    
    its('PRGROM', () => is.expected.to.be.an('array').and.be.empty);
    its('CHRROM', () => is.expected.to.be.an('array').and.be.empty);
    
    its('PRGBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    it("should already have PRG data to read from", function() {
        expect($subject.PRGBank[0]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x4000);
        expect($subject.PRGBank[1]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x4000);
    });
    
    its('CHRBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    it("should already have CHR data to read from", function() {
        expect($subject.CHRBank[0]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x1000);
        expect($subject.CHRBank[1]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x1000);
    });
    
    its('horiMirroring', () => is.expected.to.be.false);
    its('vertMirroring', () => is.expected.to.be.false);
        
    //-------------------------------------------------------------------------------//
    
    describe(".load(header, data)", function() {
        def('action', () => $subject.load($header, $data));
        /* global $header, $data, $attrs */
        def('header', () => new INESHeader($data));
        def('data',   () => INESFile_factory($attrs));
        
        context("with mirroring", function() {
            def('attrs', () => ( { byte6: $byte6 } )); /* global $byte6 */
            
            context("horizontal", function() {
                def('byte6', () => 0x00);
                
                it("sets #horiMirroring", function() {
                    expect(() => $action).to.change($subject, 'horiMirroring');
                    expect($subject.horiMirroring).to.be.true;
                });
                it("does not set #vertMirroring", function() {
                    expect(() => $action).not.to.change($subject, 'vertMirroring');
                    expect($subject.vertMirroring).to.be.false;
                });
            });
            context("vertical", function() {
                def('byte6', () => 0x01);
                
                it("does not set #horiMirroring", function() {
                    expect(() => $action).not.to.change($subject, 'horiMirroring');
                    expect($subject.horiMirroring).to.be.false;
                });
                it("sets #vertMirroring", function() {
                    expect(() => $action).to.change($subject, 'vertMirroring');
                    expect($subject.vertMirroring).to.be.true;
                });
            });
            context("none (4-screens scrolling)", function() {
                def('byte6', () => 0x08);
                
                it("does not set #horiMirroring", function() {
                    expect(() => $action).not.to.change($subject, 'horiMirroring');
                    expect($subject.horiMirroring).to.be.false;
                });
                it("does not set #vertMirroring", function() {
                    expect(() => $action).not.to.change($subject, 'vertMirroring');
                    expect($subject.vertMirroring).to.be.false;
                });
            });
        });
        
        context("with a 512b trainer present", function() {
            beforeEach(() => $action);
            
            def('attrs', () => ({
                numPRG: 1,
                byte6: 0x04,
                data: { trainer: 0xA5, PRGROM: 0x99 }
            }));
            
            it("sets its content into PRGRAM(0x1000)", function() {
                expect($subject.PRGRAM[0x0000]).to.equal(0x00);
                expect($subject.PRGRAM[0x0FFF]).to.equal(0x00);
                expect($subject.PRGRAM[0x1000]).to.equal(0xA5);
                expect($subject.PRGRAM[0x11FF]).to.equal(0xA5);
                expect($subject.PRGRAM[0x1200]).to.equal(0x00);
            });
            it("does not affect PRGROM", function() {
                expect($subject.PRGROM[0][0x0000]).to.equal(0x99);
                expect($subject.PRGROM[0][0x1000]).to.equal(0x99);
                expect($subject.PRGROM[0][0x3FFF]).to.equal(0x99);
            });
        });
        
        context("with PRG data", function() {
            def('attrs', () => ( { numPRG: $numPRG } )); /* global $numPRG */
            
            context("empty", function() {
                def('numPRG', () => 0);
                
                it("sets both PRGBanks to PRGRAM", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGRAM);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGRAM);
                });
            });
            context("using only 1 bank", function() {
                def('numPRG', () => 1);
                
                it("sets both PRGBanks to that bank", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[0]);
                });
            });
            context("using 2 banks", function() {
                def('numPRG', () => 2);
                
                it("sets PRGBanks to those banks", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[1]);
                });
            });
            context("using more than 2 banks", function() {
                def('numPRG', () => 3);
                
                it("sets PRGBanks to the first and last banks", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[2]);
                });
            });
        });
        
        context("with CHR data", function() {
            def('attrs', () => ( { numCHR: $numCHR } )); /* global $numCHR */
            
            context("empty", function() {
                def('numCHR', () => 0);
                
                it("sets both CHRBanks to CHRRAM", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRRAM);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRRAM);
                });
            });
            context("using only 1 bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('numCHR', () => 1);
                
                it("sets CHRBanks to that bank", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[0]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[1]);
                });
            });
            context("using more than 1 bank", function() {
                def('numCHR', () => 2);
                
                it("sets CHRBanks to the first bank anyway", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[0]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[1]);
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Memory Access", function() {
        // Only test that no errors are thrown when Cartridge is empty
        // Real Memory Access implementations are tested in the Mappers
        
        context("without PRG data", function() {
            before(() => expect($subject.PRGROM).to.be.empty);
            
            describe(".cpuRead(address)", function() {
                it("does not throw any errors", function() {
                    expect(() => $subject.cpuRead(0x0000)).not.to.throw();
                    expect(() => $subject.cpuRead(0x6000)).not.to.throw();
                    expect(() => $subject.cpuRead(0x8000)).not.to.throw();
                    expect(() => $subject.cpuRead(0xFFFF)).not.to.throw();
                });
            });
            describe(".cpuWrite(address,data)", function() {
                it("does not throw any errors", function() {
                    expect(() => $subject.cpuWrite(0x0000, 0xFF)).not.to.throw();
                    expect(() => $subject.cpuWrite(0x6000, 0xFF)).not.to.throw();
                    expect(() => $subject.cpuWrite(0x8000, 0xFF)).not.to.throw();
                    expect(() => $subject.cpuWrite(0xFFFF, 0xFF)).not.to.throw();
                });
            });
        });
        
        context("without CHR data", function() {
            before(() => expect($subject.CHRROM).to.be.empty);
            
            describe(".ppuRead(address)", function() {
                it("does not throw any errors", function() {
                    expect(() => $subject.ppuRead(0x0000)).not.to.throw();
                    expect(() => $subject.ppuRead(0x1000)).not.to.throw();
                    expect(() => $subject.ppuRead(0x2000)).not.to.throw();
                    expect(() => $subject.ppuRead(0x3FFF)).not.to.throw();
                });
            });
            describe(".ppuWrite(address,data)", function() {
                it("does not throw any errors", function() {
                    expect(() => $subject.ppuWrite(0x0000, 0xFF)).not.to.throw();
                    expect(() => $subject.ppuWrite(0x1000, 0xFF)).not.to.throw();
                    expect(() => $subject.ppuWrite(0x2000, 0xFF)).not.to.throw();
                    expect(() => $subject.ppuWrite(0x3FFF, 0xFF)).not.to.throw();
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".ciramA10(address)", function() {
        context("with no mirroring", function() {
            it("is never set", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
        context("with horizontal mirroring", function() {
            beforeEach(() => { $subject.horiMirroring = true; });
            
            it("is never set", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
        context("with vertical mirroring", function() {
            beforeEach(() => { $subject.vertMirroring = true; });
            
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
