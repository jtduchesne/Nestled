import NROM from "../../../src/Cartridges/Mappers/NROM";

import { INESHeader } from "../../../src/Cartridges/FileFormats";

import INESFile_factory from "../../Fixtures/INESFile_factory";

describe("NROM", function() {
    subject(() => new NROM);
    
    its('PRGBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    its('CHRBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    
    //-------------------------------------------------------------------------------//
    
    /* global $header, $data, $attrs */
    def('header', () => new INESHeader($data));
    def('data',   () => INESFile_factory($attrs));
    def('attrs',  () => undefined);
    
    describe(".load(header, data)", function() {
        def('action', () => $subject.load($header, $data));
        
        context("with PRG data", function() {
            def('attrs', () => ( { numPRG: $numPRG } )); /* global $numPRG */
            
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
        });
        
        context("with CHR data", function() {
            def('attrs', () => ( { numCHR: $numCHR } )); /* global $numCHR */
            
            context("using only 1 bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('numCHR', () => 1);
                
                it("sets CHRBanks to that bank", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[0]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[1]);
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Memory Access", function() {
        beforeEach(() => $subject.load($header, $data));
        def(['numPRG', 'numCHR'], () => 0);
        def('attrs', () => ({
            numPRG: $numPRG,
            numCHR: $numCHR,
        }));
        
        describe(".cpuRead(address)", function() {
            context("with only 1 PRG bank", function() {
                def('numPRG', () => 1);
                
                it("always reads from the same bank", function() {
                    expect($subject.cpuRead(0x8000)).to.equal(1);
                    expect($subject.cpuRead(0xFFFF)).to.equal(1);
                });
            });
            
            context("with 2 PRG banks", function() {
                def('numPRG', () => 2);
                
                it("reads from both banks", function() {
                    expect($subject.cpuRead(0x8000)).to.equal(1);
                    expect($subject.cpuRead(0xFFFF)).to.equal(2);
                });
            });
        });
        
        describe(".ppuRead(address)", function() {
            context("without CHR data", function() {
                it("always returns -0-", function() {
                    expect($subject.ppuRead(0x0000)).to.equal(0);
                    expect($subject.ppuRead(0x1FFF)).to.equal(0);
                });
            });
            
            context("with 1 CHR bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('numCHR', () => 1);
                
                it("reads from those banks", function() {
                    expect($subject.ppuRead(0x0000)).to.equal(1);
                    expect($subject.ppuRead(0x1FFF)).to.equal(2);
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
            
            it("is set when address & 0x800", function() {
                expect($subject.ciramA10(0x8888)).to.be.ok;
                expect($subject.ciramA10(0x7777)).to.not.be.ok;
            });
        });
        context("with vertical mirroring", function() {
            beforeEach(() => { $subject.vertMirroring = true; });
            
            it("is set when address & 0x400", function() {
                expect($subject.ciramA10(0x4444)).to.be.ok;
                expect($subject.ciramA10(0xBBBB)).to.not.be.ok;
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
