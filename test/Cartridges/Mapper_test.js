import Mapper from "../../src/Cartridges/Mapper";
import { NROM, MMC1 } from "../../src/Cartridges/Mappers";

describe("Mapper", function() {
    describe(".supported(number)", function() {
        it("returns -true- when supported", function() {
            expect(Mapper.supported(0)).to.be.true;
        });
        it("returns -false- when unsupported", function() {
            expect(Mapper.supported(1234)).to.be.false;
        });
    });
    
    describe(".name(number)", function() {
        it("returns the name of the mapper if known", function() {
            expect(Mapper.name(1)).to.equal("Nintendo MMC1");
        });
        it("returns 'Unknown' if not known", function() {
            expect(Mapper.name(1234)).to.contain("Unknown");
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    /*global $number */
    subject(() => new Mapper($number));
    
    context("when number=0", function() {
        def('number', () => 0);
        
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(NROM);
        });
    });
    context("when number=1", function() {
        def('number', () => 1);
        
        it("returns a -MMC1-", function() {
            expect($subject).to.be.an.instanceOf(MMC1);
        });
    });
    context("when number is unsupported", function() {
        def('number', () => 1234);
        
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(NROM);
        });
    });
});
