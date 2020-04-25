describe("MemoryMapper", function() {
    describe(".isSupported(number)", function() {
        it("returns -true- when supported", function() {
            expect(Nestled.MemoryMapper.isSupported(0)).to.be.true;
        });
        it("returns -false- when unsupported", function() {
            expect(Nestled.MemoryMapper.isSupported(1234)).to.be.false;
        });
    });
    
    describe(".getName(number)", function() {
        it("returns the name of the mapper if known", function() {
            expect(Nestled.MemoryMapper.getName(1)).to.equal("Nintendo MMC1");
        });
        it("returns 'Unknown' if not known", function() {
            expect(Nestled.MemoryMapper.getName(1234)).to.contain("Unknown");
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    def('cartridge', () => new Nestled.Cartridge);
    subject(() => new Nestled.MemoryMapper($mapperNumber, $cartridge));
    
    context("when mapperNumber=0", function() {
        def('mapperNumber', () => 0);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(Nestled.NROM);
        });
    });
    context("when mapperNumber=1", function() {
        def('mapperNumber', () => 1);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -MMC1-", function() {
            expect($subject).to.be.an.instanceOf(Nestled.MMC1);
        });
    });
    context("when mapperNumber is unsupported", function() {
        def('mapperNumber', () => 1234);
        
        its('number', () => is.expected.to.equal($mapperNumber));
        it("returns a -NROM-", function() {
            expect($subject).to.be.an.instanceOf(Nestled.NROM);
        });
    });
});
