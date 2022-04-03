import { MMC1 } from "../../src/Cartridges/Mappers";

describe("MMC1", function() {
    subject(() => new MMC1);
    
    its('mapperNumber', () => is.expected.to.equal(1));
    
    its('PRGBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    its('CHRBank', () => is.expected.to.be.an('array').and.have.lengthOf(2));
    
    its('empty',   () => is.expected.to.be.false);
    its('present', () => is.expected.to.be.true);
    
    //-------------------------------------------------------------------------------//
    
    its('mirroring',   () => is.expected.to.equal(0));
    its('PRGBankMode', () => is.expected.to.equal(3));
    its('CHRBankMode', () => is.expected.to.equal(0));
    
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
            beforeEach(() => { $subject.CHRROM = $CHRROM; });
            
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
                
                it("sets CHRBanks to the first bank", function() {
                    expect(() => $action).to.change($subject, 'CHRBank');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[0]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[1]);
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Internal Registers", function() {
        /*global $value */
        beforeEach(function() {
            $subject.PRGROM = [[1],[2],[3],[4]];
            $subject.CHRROM = [[1],[2],[3],[4]];
            $subject.init();
        });
        
        describe("#control=", function() {
            def('action', () =>  { $subject.control = $value; });
            
            def('value', () => 0xFF);
            
            it("sets #mirroring", function() {
                expect(() => $action).to.change($subject, 'mirroring');
                expect($subject.mirroring).to.equal(3);
            });
            it("sets #PRGBankMode", function() {
                $subject.PRGBankMode = 0;
                expect(() => $action).to.change($subject, 'PRGBankMode');
                expect($subject.PRGBankMode).to.equal(3);
            });
            it("sets #CHRBankMode", function() {
                expect(() => $action).to.change($subject, 'CHRBankMode');
                expect($subject.CHRBankMode).to.equal(1);
            });
        });
        
        describe("#CHR0=", function() {
            def('action', () =>  { $subject.CHR0 = $value; });
            
            def('value', () => 2);
            
            context("when #CHRBankMode == 0", function() {
                beforeEach(() => { $subject.CHRBankMode = 0; });
                
                it("sets both CHRBanks ([value,value+1])", function() {
                    $action;
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[$value]);
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[$value+1]);
                });
                
                context("and value is odd", function() {
                    def('value', () => 3);
                    
                    it("sets both CHRBanks but ignores bit0", function() {
                        $action;
                        expect($subject.CHRBank[0]).to.equal($subject.CHRROM[$value-1]);
                        expect($subject.CHRBank[1]).to.equal($subject.CHRROM[$value]);
                    });
                });
            });
            
            context("when #CHRBankMode == 1", function() {
                beforeEach(() => { $subject.CHRBankMode = 1; });
                
                it("sets CHRBank[0]", function() {
                    expect(() => $action).to.change($subject.CHRBank, '0');
                    expect($subject.CHRBank[0]).to.equal($subject.CHRROM[$value]);
                });
                it("does not change CHRBank[1]", function() {
                    expect(() => $action).not.to.change($subject.CHRBank, '1');
                });
            });
        });
        
        describe("#CHR1=", function() {
            def('action', () =>  { $subject.CHR1 = $value; });
            
            def('value', () => 2);
            
            context("when #CHRBankMode == 0", function() {
                beforeEach(() => { $subject.CHRBankMode = 0; });
                
                it("does not change CHRBank[0]", function() {
                    expect(() => $action).not.to.change($subject.CHRBank, '0');
                });
                it("does not change CHRBank[1]", function() {
                    expect(() => $action).not.to.change($subject.CHRBank, '1');
                });
            });
            
            context("when #CHRBankMode == 1", function() {
                beforeEach(() => { $subject.CHRBankMode = 1; });
                
                it("does not change CHRBank[0]", function() {
                    expect(() => $action).not.to.change($subject.CHRBank, '0');
                });
                it("sets CHRBank[1]", function() {
                    expect(() => $action).to.change($subject.CHRBank, '1');
                    expect($subject.CHRBank[1]).to.equal($subject.CHRROM[$value]);
                });
            });
        });
        
        describe("#PRG=", function() {
            def('action', () =>  { $subject.PRG = $value; });
            
            def('value', () => 2);
            
            context("when #PRGBankMode == 0", function() {
                beforeEach(() => { $subject.PRGBankMode = 0; });
                
                it("sets both PRGBanks ([value,value+1])", function() {
                    $action;
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[$value]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[$value+1]);
                });
                
                context("and value is odd", function() {
                    def('value', () => 3);
                    
                    it("sets both PRGBanks but ignores bit0", function() {
                        $action;
                        expect($subject.PRGBank[0]).to.equal($subject.PRGROM[$value-1]);
                        expect($subject.PRGBank[1]).to.equal($subject.PRGROM[$value]);
                    });
                });
            });
            
            context("when #PRGBankMode == 1", function() {
                beforeEach(() => { $subject.PRGBankMode = 1; });
                
                it("sets both PRGBanks ([value,value+1])", function() {
                    $action;
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[$value]);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[$value+1]);
                });
                
                context("and value is odd", function() {
                    def('value', () => 3);
                    
                    it("sets both PRGBanks but ignores bit0", function() {
                        $action;
                        expect($subject.PRGBank[0]).to.equal($subject.PRGROM[$value-1]);
                        expect($subject.PRGBank[1]).to.equal($subject.PRGROM[$value]);
                    });
                });
            });
            
            context("when #PRGBankMode == 2", function() {
                beforeEach(() => { $subject.PRGBankMode = 2; });
                
                it("sets both PRGBanks ([first,value])", function() {
                    $action;
                    expect($subject.PRGBank[0]).to.equal($subject.firstPRGBank);
                    expect($subject.PRGBank[1]).to.equal($subject.PRGROM[$value]);
                });
            });
            
            context("when #PRGBankMode == 3", function() {
                beforeEach(() => { $subject.PRGBankMode = 3; });
                
                it("sets both PRGBanks ([value,last])", function() {
                    $action;
                    expect($subject.PRGBank[0]).to.equal($subject.PRGROM[$value]);
                    expect($subject.PRGBank[1]).to.equal($subject.lastPRGBank);
                });
            });
        });
        
        describe(".write(address,data)", function() {
            /*global $address, $data */
            def('action', () => $subject.write($address, $data));
            def('data', () => 0xFF);
            
            context("when address == 0x8000", function() {
                def('address', () => 0x8000);
                
                it("sets #control", function(done) {
                    Object.defineProperty($subject, 'control', {
                        set: (value) => { if (value === $data) done(); }
                    });
                    $action;
                });
            });
            
            context("when address == 0xA000", function() {
                def('address', () => 0xA000);
                
                it("sets #CHR0", function(done) {
                    Object.defineProperty($subject, 'CHR0', {
                        set: (value) => { if (value === $data) done(); }
                    });
                    $action;
                });
            });
            
            context("when address == 0xC000", function() {
                def('address', () => 0xC000);
                
                it("sets #CHR1", function(done) {
                    Object.defineProperty($subject, 'CHR1', {
                        set: (value) => { if (value === $data) done(); }
                    });
                    $action;
                });
            });
            
            context("when address == 0xE000", function() {
                def('address', () => 0xE000);
                
                it("sets #PRG", function(done) {
                    Object.defineProperty($subject, 'PRG', {
                        set: (value) => { if (value === $data) done(); }
                    });
                    $action;
                });
            });
            
            context("when address == 0xFFFF", function() {
                def('address', () => 0xFFFF);
                
                it("sets #PRG", function(done) {
                    Object.defineProperty($subject, 'PRG', {
                        set: (value) => { if (value === $data) done(); }
                    });
                    $action;
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    context("Memory Access", function() {
        /*global $PRGROMData1, $PRGROMData2, $PRGROMData3 */
        def(['PRGROMData1','PRGROMData2','PRGROMData3']);
        beforeEach(() => {
            if ($PRGROMData1) $subject.PRGROM.push(new Uint8Array(0x4000).fill($PRGROMData1));
            if ($PRGROMData2) $subject.PRGROM.push(new Uint8Array(0x4000).fill($PRGROMData2));
            if ($PRGROMData3) $subject.PRGROM.push(new Uint8Array(0x4000).fill($PRGROMData3));
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
            
            context("with more than 2 PRG banks", function() {
                def('PRGROMData1', () => 0x99); // b10011001
                def('PRGROMData2', () => 0xA5); // b10100101
                def('PRGROMData3', () => 0xC3); // b11000011
                
                it("reads from first and last banks (by default)", function() {
                    expect($subject.cpuRead(0x8000)).to.equal($PRGROMData1);
                    expect($subject.cpuRead(0xFFFF)).to.equal($PRGROMData3);
                });
            });
        });
        
        describe(".cpuWrite(address, data)", function() {
            it("pushes bit0 of data into #buffer", function() {
                expect(() => $subject.cpuWrite(0x8000, 0x05)).to.change($subject, 'buffer').by(1);
                expect(() => $subject.cpuWrite(0x8000, 0x0A)).not.to.change($subject, 'buffer');
                expect(() => $subject.cpuWrite(0x8000, 0x05)).to.change($subject, 'buffer').by(4);
                expect(() => $subject.cpuWrite(0x8000, 0x0A)).not.to.change($subject, 'buffer');
            });
            
            context("on the fifth call", function() {
                beforeEach(() => {
                    $subject.cpuWrite(0x8000, 0x00);
                    $subject.cpuWrite(0x8000, 0x01);
                    $subject.cpuWrite(0x8000, 0x00);
                    $subject.cpuWrite(0x8000, 0x01);
                    expect($subject.buffer).to.equal(0x0A);
                });
                
                it("calls .write(address, data) with #buffer as data", function(done) {
                    $subject.write = (address, data) => {
                        expect(address).to.equal(0x8000);
                        expect(data).to.equal(0x0A);
                        done();
                    };
                    $subject.cpuWrite(0x8000, 0x00);
                });
                it("resets #buffer", function() {
                    expect(() => $subject.cpuWrite(0x8000, 0x00)).to.change($subject, 'buffer');
                    expect($subject.buffer).to.equal(0);
                });
            });
            
            context("when data & 0x80", function() {
                def('data', () => 0x88);
                
                it("resets #buffer", function() {
                    $subject.buffer = 0x0F;
                    expect(() => $subject.cpuWrite(0x8000, $data)).to.change($subject, 'buffer');
                    expect($subject.buffer).to.equal(0);
                });
                it("resets #index", function() {
                    $subject.index = 4;
                    expect(() => $subject.cpuWrite(0x8000, $data)).to.change($subject, 'index');
                    expect($subject.index).to.equal(0);
                });
                it("resets #mirroring", function() {
                    $subject.mirroring = 3;
                    expect(() => $subject.cpuWrite(0x8000, $data)).to.change($subject, 'mirroring');
                    expect($subject.mirroring).to.equal(0);
                });
                it("does NOT reset #PRGBankMode", function() {
                    $subject.PRGBankMode = 2;
                    expect(() => $subject.cpuWrite(0x8000, $data)).not.to.change($subject, 'PRGBankMode');
                });
                it("resets #CHRBankMode", function() {
                    $subject.CHRBankMode = 1;
                    expect(() => $subject.cpuWrite(0x8000, $data)).to.change($subject, 'CHRBankMode');
                    expect($subject.CHRBankMode).to.equal(0);
                });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        /*global $CHRROMData1, $CHRROMData2, $CHRROMData3, $CHRROMData4 */
        def(['CHRROMData1','CHRROMData2','CHRROMData3','CHRROMData4']);
        beforeEach(() => {
            if ($CHRROMData1) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData1));
            if ($CHRROMData2) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData2));
            if ($CHRROMData3) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData3));
            if ($CHRROMData4) $subject.CHRROM.push(new Uint8Array(0x1000).fill($CHRROMData4));
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
            
            context("with more than 1 CHR bank", function() {
                def('CHRROMData1', () => 0x81); // b10000001
                def('CHRROMData2', () => 0x99); // b10011001
                def('CHRROMData3', () => 0xA5); // b10100101
                def('CHRROMData4', () => 0xC3); // b11000011
                
                it("reads from the first bank (by default)", function() {
                    expect($subject.ppuRead(0x0000)).to.equal($CHRROMData1);
                    expect($subject.ppuRead(0x1FFF)).to.equal($CHRROMData2);
                });
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".ciramA10(address)", function() {
        context("when #mirroring == 0", function() {
            beforeEach(() => { $subject.mirroring = 0; });
            
            it("is never set", function() {
                expect($subject.ciramA10(0x5555)).to.not.be.ok;
                expect($subject.ciramA10(0xAAAA)).to.not.be.ok;
            });
        });
        context("when #mirroring == 1", function() {
            beforeEach(() => { $subject.mirroring = 1; });
            
            it("is always set", function() {
                expect($subject.ciramA10(0x5555)).to.be.ok;
                expect($subject.ciramA10(0xAAAA)).to.be.ok;
            });
        });
        context("when #mirroring == 2", function() {
            beforeEach(() => { $subject.mirroring = 2; });
            
            it("is set when address & 0x400", function() {
                expect($subject.ciramA10(0x4444)).to.be.ok;
                expect($subject.ciramA10(0xBBBB)).to.not.be.ok;
            });
        });
        context("when #mirroring == 3", function() {
            beforeEach(() => { $subject.mirroring = 3; });
            
            it("is set when address & 0x800", function() {
                expect($subject.ciramA10(0x8888)).to.be.ok;
                expect($subject.ciramA10(0x7777)).to.not.be.ok;
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
