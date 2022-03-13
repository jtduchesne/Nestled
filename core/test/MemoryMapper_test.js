import { MemoryMapper, Cartridge, NROM, MMC1 } from "../src/main.js";

describe("MemoryMapper", function() {
    describe(".isSupported(number)", function() {
        it("returns -true- when supported", function() {
            expect(MemoryMapper.isSupported(0)).to.be.true;
        });
        it("returns -false- when unsupported", function() {
            expect(MemoryMapper.isSupported(1234)).to.be.false;
        });
    });
    
    describe(".getName(number)", function() {
        it("returns the name of the mapper if known", function() {
            expect(MemoryMapper.getName(1)).to.equal("Nintendo MMC1");
        });
        it("returns 'Unknown' if not known", function() {
            expect(MemoryMapper.getName(1234)).to.contain("Unknown");
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $mapperNumber, $cartridge */
    def('cartridge', () => new Cartridge);
    subject(() => new MemoryMapper($mapperNumber, $cartridge));
    
    context("when mapperNumber=0", function() {
        def('mapperNumber', () => 0);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(NROM);
        });
    });
    context("when mapperNumber=1", function() {
        def('mapperNumber', () => 1);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -MMC1-", function() {
            expect($subject).to.be.an.instanceOf(MMC1);
        });
    });
    context("when mapperNumber is unsupported", function() {
        def('mapperNumber', () => 1234);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(NROM);
        });
    });
});
