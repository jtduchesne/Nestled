import { NROM } from "../../../src/Cartridges/Mappers";

describe("NROM", function() {
    subject(() => new NROM);
    
    its('mapperNumber', () => is.expected.to.equal(0));
    
    its('PRGBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    its('CHRBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    
    its('empty',   () => is.expected.to.be.false);
    its('present', () => is.expected.to.be.true);
    
    //-------------------------------------------------------------------------------//
    
    describe(".init()", function() {
        def('action', () => $subject.init());
        
        context("PRG", function() {
            /*global $PRGROM */
            beforeEach(() => { $subject.PRGROM = $PRGROM; });
            
            context("with only 1 bank", function() {
                def('PRGROM', () => ( [[1]] ));
                
                it("sets both PRGBanks to that bank", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[0]);
                });
            });
            context("with 2 banks", function() {
                def('PRGROM', () => ( [[1],[2]] ));
                
                it("sets PRGBanks to those banks", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[1]);
                });
            });
        });
        
        context("CHR", function() {
            /*global $CHRROM */
            beforeEach(() => { $subject.CHRROM = $CHRROM; });
            
            context("with only 1 bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('CHRROM', () => ( [[1],[2]] ));
                
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
        /*global $PRGROMData1, $PRGROMData2 */
        def(['PRGROMData1','PRGROMData2']);
        beforeEach(() => {
            if ($PRGROMData1) $subject.PRGROM.push(new Uint8Array(0x4000).fill($PRGROMData1));
            if ($PRGROMData2) $subject.PRGROM.push(new Uint8Array(0x4000).fill($PRGROMData2));
            //$subject.init();
        });
        
        describe(".cpuRead(address)", function() {
            context("with only 1 PRG bank", function() {
                def('PRGROMData1', () => 0xA5); // b10100101
                
                it("always reads from the same bank", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGROMData1);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData1);
                });
            });
            
            context("with 2 PRG banks", function() {
                def('PRGROMData1', () => 0xA5); // b10100101
                def('PRGROMData2', () => 0xC3); // b11000011
                
                it("reads from both banks", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGROMData1);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData2);
                });
            });
        });
        
        /*global $CHRROMData1, $CHRROMData2 */
        def(['CHRROMData1','CHRROMData2']);
        beforeEach(() => {
            if ($CHRROMData1) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData1));
            if ($CHRROMData2) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData2));
            $subject.init();
        });
        
        describe(".ppuRead(address)", function() {
            context("without CHR data", function() {
                it("always returns -0-", function() {
                    expect($subject.ppuRead(0x0000)).to.equal(0);
                    expect($subject.ppuRead(0x1FFF)).to.equal(0);
                });
            });
            
            context("with 1 CHR bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('CHRROMData1', () => 0xA5); // b10100101
                def('CHRROMData2', () => 0xC3); // b11000011
                
                it("reads from those banks", function() {
                    expect($subject.ppuRead(0x0000)).to.equal($CHRROMData1);
                    expect($subject.ppuRead(0x1FFF)).to.equal($CHRROMData2);
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
