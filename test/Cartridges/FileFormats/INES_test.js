import INES from "../../../src/Cartridges/FileFormats/INES";

import INESFileFactory from "../../Fixtures/INESFile_factory";

describe("INES", function() {
    subject(() => new INES($data));
    
    def('data'); /*global $data */
    
    its('byteLength', () => is.expected.to.equal(0x10));
    
    context("with", function() {
        context("no data", function() {
            def('data', () => new ArrayBuffer(0x00));
            
            its('format', () => is.expected.equal("Unknown"));
            
            its('loaded', () => is.expected.to.be.false);
            its('valid',  () => is.expected.to.be.false);
        });
        context("invalid data", function() {
            def('data', () => INESFileFactory({ signature: "BAD_" }));
            
            its('format', () => is.expected.equal("Unknown"));
            
            its('loaded', () => is.expected.to.be.true);
            its('valid',  () => is.expected.to.be.false);
        });
        context("archaic data", function() {
            def('data', () => INESFileFactory({ archaic: true }));
            
            its('format', () => is.expected.to.equal("Archaic iNES"));
            
            its('loaded', () => is.expected.to.be.true);
            its('valid',  () => is.expected.to.be.true);
        });
        context("valid data", function() {
            def('data', () => INESFileFactory());
            
            its('format', () => is.expected.to.equal("iNES"));
            
            its('loaded', () => is.expected.to.be.true);
            its('valid',  () => is.expected.to.be.true);
        });
    });
    
    context("with", function() {
        def('data', () => INESFileFactory({ mapper: $mapper }));
        def('mapper'); /* global $mapper */
        
        context("a supported Mapper (#1)", function() {
            def('mapper', () => 1);
            
            its('mapperNumber', () => is.expected.to.equal(1));
            its('mapperName',   () => is.expected.to.equal("Nintendo MMC1"));
            its('supported',    () => is.expected.to.be.true);
        });
        context("an unsupported Mapper (#15)", function() {
            def('mapper', () => 15);
            
            its('mapperNumber', () => is.expected.to.equal(15));
            its('mapperName',   () => is.expected.to.equal("100-in-1"));
            its('supported',    () => is.expected.to.be.false);
        });
        context("an extended Mapper number (#16)", function() {
            def('mapper', () => 16);
            
            its('mapperNumber', () => is.expected.to.equal(16));
            its('mapperName',   () => is.expected.to.equal("BANDAI 24C02"));
            its('supported',    () => is.expected.to.be.false);
        });
    });
    
    context("with", function() {
        def('data', () => INESFileFactory({ byte6: $byte6 }));
        def('byte6'); /* global $byte6 */
        
        context("horizontal mirroring", function() {
            def('byte6', () => 0x00);
            
            its('horiMirroring', () => is.expected.to.be.true);
            its('vertMirroring', () => is.expected.to.be.false);
        });
        context("vertical mirroring", function() {
            def('byte6', () => 0x01);
            
            its('horiMirroring', () => is.expected.to.be.false);
            its('vertMirroring', () => is.expected.to.be.true);
        });
        context("4-screens mirroring", function() {
            def('byte6', () => 0x08);
            
            its('horiMirroring', () => is.expected.to.be.false);
            its('vertMirroring', () => is.expected.to.be.false);
        });
        
        context("battery-backed PRG-RAM enabled", function() {
            def('byte6', () => 0x02);
            
            its('battery',          () => is.expected.to.be.true);
            its('PRGRAMByteLength', () => is.expected.to.equal(0x2000));
        });
        
        context("a 512 bytes trainer", function() {
            def('byte6', () => 0x04);
            
            its('trainer',          () => is.expected.to.be.true);
            its('PRGRAMByteLength', () => is.expected.to.be.above(0x200));
        });
    });
    
    context("with", function() {
        def('data', () => INESFileFactory({ numPRG: $numPRG, numCHR: $numCHR }));
        def('numPRG', 'numCHR'); /* global $numPRG, $numCHR */
        
        context("PRG data", function() {
            def('numPRG', () => 1);
            def('numCHR', () => 0);
            
            its('PRGROMByteLength', () => is.expected.to.equal(0x4000));
        });
        context("CHR data", function() {
            def('numPRG', () => 0);
            def('numCHR', () => 1);
            
            its('CHRROMByteLength', () => is.expected.to.equal(0x2000));
        });
    });
});
