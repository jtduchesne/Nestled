import { Cartridge } from "../../src";

describe("Cartridge", function() {
    subject(() => new Cartridge);
    
    its('mapperNumber', () => is.expected.to.equal(-1));
    
    its('PRGROM', () => is.expected.to.be.an('array').and.be.empty);
    its('CHRROM', () => is.expected.to.be.an('array').and.be.empty);
    
    its('PRGBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    it("should already have PRG data to read from", function() {
        expect($subject.PRGBank[0]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x4000);
        expect($subject.PRGBank[1]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x4000);
    });
    
    its('CHRBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    it("should already have CHR data to read from", function() {
        expect($subject.CHRBank[0]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x2000);
        expect($subject.CHRBank[1]).to.be.an.instanceOf(Uint8Array).and.have.lengthOf(0x2000);
    });
    
    its('horiMirroring', () => is.expected.to.be.false);
    its('vertMirroring', () => is.expected.to.be.false);
    its('battery',       () => is.expected.to.be.false);
    
    its('empty',   () => is.expected.to.be.true);
    its('present', () => is.expected.to.be.false);
        
    //-------------------------------------------------------------------------------//
    
    describe(".init()", function() {
        def('action', () => $subject.init());
        
        context("PRG", function() {
            /*global $PRGROM */
            beforeEach(function() {
                $subject.PRGBank = null;
                $subject.PRGROM = $PRGROM;
            });
            
            context("without Data", function() {
                def('PRGROM', () => ( [] ));
                
                it("sets both PRGBanks to PRGRAM", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGRAM);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGRAM);
                });
            });
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
            context("with more than 2 banks", function() {
                def('PRGROM', () => ( [[1],[2],[3]] ));
                
                it("sets PRGBanks to the first and last banks", function() {
                    expect(() => $action).to.change($subject, 'PRGBank');
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[0]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[2]);
                });
            });
        });
        
        context("CHR", function() {
            /*global $CHRROM */
            beforeEach(function() {
                $subject.CHRBank = null;
                $subject.CHRROM = $CHRROM;
            });
            
            context("without Data", function() {
                /*global $CHRRAMData1, $CHRRAMData2 */
                def('CHRRAMData1', () => 1);
                def('CHRRAMData2', () => 2);
                beforeEach(function() {
                    $subject.CHRRAM.fill($CHRRAMData1, 0, 0x1000);
                    $subject.CHRRAM.fill($CHRRAMData2, 0x1000);
                });
                
                def('CHRROM', () => ( [] ));
                
                it("sets CHRBanks to subsets of CHRRAM", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0][0]).to.equal($CHRRAMData1);
                    expect($subject.CHRBank[1][0]).to.equal($CHRRAMData2);
                });
            });
            context("with only 1 bank (of 8kb, which mean 2x 4kb banks...)", function() {
                def('CHRROM', () => ( [[1],[2]] ));
                
                it("sets CHRBanks to that bank", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[0]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[1]);
                });
            });
            context("with more than 1 bank", function() {
                def('CHRROM', () => ( [[1],[2],[3],[4]] ));
                
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
        
        beforeEach(() => $subject.init());
        
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
