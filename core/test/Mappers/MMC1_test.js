import { MMC1 } from "../../src/Mappers/MMC1.js";

describe("MMC1", function() {
    //----------------------------------------------------------------------------------------------------//
    //- Cartridge Fixtures

    /*global $numPRG, $PRGROM */
    def('numPRG', () => 2);
    def('PRGROM', () => new Array($numPRG).fill(0).map(() => new Uint8Array(0x4000)));
    
    /*global $numCHR, $CHRROM */
    def('numCHR', () => 1);
    def('CHRROM', () => new Array($numCHR*2).fill(0).map(() => new Uint8Array(0x2000)));
    
    /*global $vertMirroring, $horiMirroring, $cartridge */
    def('vertMirroring', () => true);
    def('horiMirroring', () => true);
    def('cartridge', () => ({
        PRGRAM: new Uint8Array(0),
        CHRRAM: new Uint8Array(0),
        PRGROM: $PRGROM, CHRROM: $CHRROM,
        vertMirroring: $vertMirroring || false,
        horiMirroring: $horiMirroring || false,
    }));
    
    /*global $PRGROMData0, $PRGROMData1, $CHRROMData0, $CHRROMData1 */
    def('PRGROMData0','PRGROMData1');
    def('CHRROMData0','CHRROMData1');
    beforeEach(function() {
        if ($PRGROMData0 && $numPRG > 0) $PRGROM[0].fill($PRGROMData0);
        if ($PRGROMData1 && $numPRG > 1) $PRGROM[1].fill($PRGROMData1);
        if ($CHRROMData0 && $numCHR > 0) {
            $CHRROM[0].fill($CHRROMData0);
            $CHRROM[1].fill($CHRROMData1);
        }
    });
    //----------------------------------------------------------------------------------------------------//
    subject(() => new MMC1($number, $cartridge));
    def('number', () => 0); /*global $number */
    
    its('number', () => is.expected.to.equal($number));
    
    its('vertMirroring', () => is.expected.to.equal($vertMirroring));
    its('horiMirroring', () => is.expected.to.equal($horiMirroring));
            
    //-------------------------------------------------------------------------------//
    
    describe(".cpuRead(address)", function() {
        def('PRGROMData0', () => 0x34);
        def('PRGROMData1', () => 0x56);
        
        context("if there is no PRG-ROM data", function() {
            def('numPRG', () => 0);
        
            it("does not throw any errors", function() {
                expect(() => $subject.cpuRead(0x8000)).to.not.throw();
                expect(() => $subject.cpuRead(0xFFFF)).to.not.throw();
            });
        });
        context("if there is only 1 PRG-ROM bank", function() {
            def('numPRG', () => 1);
        
            it("always reads from the same bank", function() {
                expect($subject.cpuRead(0x8000)).to.equal($PRGROMData0);
                expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData0);
            });
        });
        context("if there are 2 PRG-ROM banks", function() {
            def('numPRG', () => 2);
        
            it("reads from both banks", function() {
                expect($subject.cpuRead(0x8000)).to.equal($PRGROMData0);
                expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData1);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".ppuRead(address)", function() {
        def('CHRROMData0', () => 0x34);
        def('CHRROMData1', () => 0x56);
        
        context("if there is no CHR-ROM data", function() {
            def('numCHR', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuRead(0x0000)).to.not.throw();
                expect(() => $subject.ppuRead(0x3FFF)).to.not.throw();
            });
        });
        context("if there is 1 CHR-ROM bank", function() {
            def('numCHR', () => 1);
            
            it("always reads from the same bank", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData0);
            });
        });
        context("if there is more than 1 CHR-ROM bank", function() {
            def('numCHR', () => 2);
        
            it("always reads from the same bank", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData0);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".ciramA10(address)", function() {
        context("with vertical mirroring", function() {
            def('vertMirroring', () => true);
            def('horiMirroring', () => false);
            
            it("is set when address & 0x400", function() {
                expect($subject.ciramA10(0x5555)).to.be.ok;
            });
            it("is not set when address & 0x800", function() {
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
        context("with horizontal mirroring", function() {
            def('vertMirroring', () => false);
            def('horiMirroring', () => true);
            
            it("is not set when address & 0x400", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
            });
            it("is set when address & 0x800", function() {
                expect($subject.ciramA10(0xAAAA)).to.be.ok;
            });
        });
        context("with no mirroring", function() {
            def('vertMirroring', () => false);
            def('horiMirroring', () => false);
            
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
