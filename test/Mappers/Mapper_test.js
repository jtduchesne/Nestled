describe("Mapper", function() {
    //----------------------------------------------------------------------------------------------------//
    //- Cartridge Fixtures
    def('numPRG', () => 2);
    def('PRGROM', () => new Array($numPRG).fill(0).map(() => new Uint8Array(0x4000)));
    
    def('numCHR', () => 1);
    def('CHRROM', () => new Array($numCHR).fill(0).map(() => new Uint8Array(0x2000)));
    
    def('PRGRAMData','CHRRAMData')
    def('vertMirroring','horiMirroring');
    def('cartridge', () => ({
        PRGRAM: new Uint8Array(0x4000).fill($PRGRAMData),
        CHRRAM: new Uint8Array(0x2000).fill($CHRRAMData),
        PRGROM: $PRGROM, CHRROM: $CHRROM,
        vertMirroring: $vertMirroring || false,
        horiMirroring: $horiMirroring || false,
    }));
    
    def('PRGROMData0','PRGROMData1');
    def('CHRROMData0','CHRROMData1');
    beforeEach(function() {
        if ($PRGROMData0 && $numPRG > 0) $PRGROM[0].fill($PRGROMData0);
        if ($PRGROMData1 && $numPRG > 1) $PRGROM[$numPRG-1].fill($PRGROMData1);
        if ($CHRROMData0 && $numCHR > 0) $CHRROM[0].fill($CHRROMData0);
        if ($CHRROMData1 && $numCHR > 1) $CHRROM[$numCHR-1].fill($CHRROMData1);
    });
    //----------------------------------------------------------------------------------------------------//
    subject(() => new Nestled.Mapper($number, $cartridge));
    def('number', () => 123);
    
    its('number', () => is.expected.to.equal($number));
            
    its('PRGRAM', () => is.expected.to.equal($cartridge.PRGRAM));
    its('CHRRAM', () => is.expected.to.equal($cartridge.CHRRAM));
    
    its('PRGROM', () => is.expected.to.equal($cartridge.PRGROM));
    its('CHRROM', () => is.expected.to.equal($cartridge.CHRROM));
    
    describe("#PRGBank", function() {
        subject(() => $subject.PRGBank);
        
        it("has a length of 2", function() {
            expect($subject).to.have.lengthOf(2);
        });
        its('0', () => is.expected.to.equal($PRGROM[0]));
        its('1', () => is.expected.to.equal($PRGROM[$PRGROM.length-1]));
    });
    describe("#CHRBank", function() {
        subject(() => $subject.CHRBank);
        
        it("has a length of 2", function() {
            expect($subject).to.have.lengthOf(2);
        });
        its('0', () => is.expected.to.equal($CHRROM[0]));
        its('1', () => is.expected.to.equal($CHRROM[$CHRROM.length-1]));
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".cpuRead(address)", function() {
        def('PRGRAMData',  () => 0x12);
        def('PRGROMData0', () => 0x34);
        def('PRGROMData1', () => 0x56);
        
        it("reads from PRG-RAM when address is between [0x6000-7FFF]", function() {
            expect($subject.cpuRead(0x6000)).to.equal($PRGRAMData);
            expect($subject.cpuRead(0x7FFF)).to.equal($PRGRAMData);
        });
        
        context("when address is between [0x8000-FFFF]", function() {
            context("if there is no PRG-ROM data", function() {
                def('numPRG', () => 0);
            
                it("does not throw any errors", function() {
                    expect(() => $subject.cpuRead(0x8000)).to.not.throw();
                    expect(() => $subject.cpuRead(0xFFFF)).to.not.throw();
                });
                it("reads from PRG-RAM instead", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGRAMData);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGRAMData);
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
            context("if there are more than 2 PRG-ROM banks", function() {
                def('numPRG', () => 3);
            
                it("reads from first and last banks", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGROMData0);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData1);
                });
            });
        });
    });
    
    describe(".cpuWrite(address,data)", function() {
        def('PRGROMData0', () => 0xAB);
        def('PRGROMData1', () => 0xCD);
        
        it("writes to PRG-RAM when address is between [0x6000-7FFF]", function() {
            expect(() => $subject.cpuWrite(0x6000, 0xFF)).to.change($subject.PRGRAM, '0');
            expect($subject.cpuRead(0x6000)).to.equal(0xFF);
        });
        it("cannot write to PRG-ROM", function() {
            expect(() => $subject.cpuWrite(0x8000, 0xFF)).not.to.change($subject.PRGBank[0], '0');
            expect($subject.cpuRead(0x8000)).to.equal($PRGROMData0);
            expect(() => $subject.cpuWrite(0xC000, 0xFF)).not.to.change($subject.PRGBank[1], '0');
            expect($subject.cpuRead(0xC000)).to.equal($PRGROMData1);
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".ppuRead(address)", function() {
        def('CHRRAMData',  () => 0x12);
        def('CHRROMData0', () => 0x34);
        def('CHRROMData1', () => 0x56);
        
        context("if there is no CHR-ROM data", function() {
            def('numCHR', () => 0);
            
            it("does not throw any errors", function() {
                expect(() => $subject.ppuRead(0x0000)).to.not.throw();
                expect(() => $subject.ppuRead(0x3FFF)).to.not.throw();
            });
            it("reads from CHR-RAM instead", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRRAMData);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRRAMData);
            });
        });
        context("if there is 1 CHR-ROM bank", function() {
            def('numCHR', () => 1);
            
            it("always reads from the same bank", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData0);
            });
        });
        context("if there are 2 CHR-ROM banks", function() {
            def('numCHR', () => 2);
        
            it("reads from both banks", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData1);
            });
        });
        context("if there are more than 2 CHR-ROM banks", function() {
            def('numCHR', () => 3);
        
            it("reads from first and last banks", function() {
                expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
                expect($subject.ppuRead(0x3FFF)).to.equal($CHRROMData1);
            });
        });
    });
    
    describe(".ppuWrite(address,data)", function() {
        def('numCHR', () => 2);
        def('CHRROMData0', () => 0xAB);
        def('CHRROMData1', () => 0xCD);
        
        it("cannot write to CHR-ROM", function() {
            expect(() => $subject.ppuWrite(0x0000, 0xFF)).not.to.change($subject.CHRBank[0], '0');
            expect($subject.ppuRead(0x0000)).to.equal($CHRROMData0);
            expect(() => $subject.ppuWrite(0x2000, 0xFF)).not.to.change($subject.CHRBank[1], '0');
            expect($subject.ppuRead(0x2000)).to.equal($CHRROMData1);
        });
    });
});
