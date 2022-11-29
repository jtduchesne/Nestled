import UNIF from "../../../src/Cartridges/FileFormats/UNIF";

import UNIFFileFactory from "../../Fixtures/UNIFFile_factory";

describe("UNIF", function() {
    subject(() => new UNIF($data));
    
    def('data'); /*global $data */
    
    its('byteLength', () => is.expected.to.equal(0x20));
    
    context("without data", function() {
        def('data', () => new ArrayBuffer(0x00));
        
        its('format', () => is.expected.equal("Unknown"));
        
        its('loaded',    () => is.expected.to.be.false);
        its('valid',     () => is.expected.to.be.false);
        its('supported', () => is.expected.to.be.false);
    });
    
    context("with invalid data", function() {
        def('data', () => UNIFFileFactory({signature: "BAD_"}));
        
        its('format', () => is.expected.equal("Unknown"));
        
        its('loaded',    () => is.expected.to.be.true);
        its('valid',     () => is.expected.to.be.false);
        its('supported', () => is.expected.to.be.false);
    });
    
    context("with valid data", function() {
        def('data', () => UNIFFileFactory({version: 12345}));
        
        its('format', () => is.expected.to.equal("UNIF v12345"));
        
        its('loaded',    () => is.expected.to.be.true);
        its('valid',     () => is.expected.to.be.false);
        its('supported', () => is.expected.to.be.false);
    });
});
