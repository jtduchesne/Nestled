import { expect } from "chai";
import Header from "../../../src/Cartridges/FileFormats/Header";

describe("Header", function() {
    subject(() => new Header);
    
    its('loaded',  () => is.expected.to.be.false);
    
    its('format', () => is.expected.to.be.a('string').and.equal("Unknown"));
    its('valid',  () => is.expected.to.be.false);
    
    its('mapperNumber', () => is.expected.to.equal(-1));
    its('mapperName',   () => is.expected.to.be.a('string').and.be.empty);
    its('supported',    () => is.expected.to.be.false);
    
    its('PRGROMByteLength', () => is.expected.to.equal(0));
    its('CHRROMByteLength', () => is.expected.to.equal(0));
    
    its('horiMirroring', () => is.expected.to.be.false);
    its('vertMirroring', () => is.expected.to.be.false);
    its('battery',       () => is.expected.to.be.false);
    its('trainer',       () => is.expected.to.be.false);
    
    its('consoleType', () => is.expected.to.equal(0));
    
    its('PRGRAMByteLength',   () => is.expected.to.equal(0));
    its('CHRRAMByteLength',   () => is.expected.to.equal(0));
    its('PRGNVRAMByteLength', () => is.expected.to.equal(0));
    its('CHRNVRAMByteLength', () => is.expected.to.equal(0));
    
    its('byteLength', () => is.expected.to.equal(0));
    
    describe(".parse(data)", function() {
        def('action', () => $subject.parse($data));
        def('data'); /*global $data */
        
        context("without data", function() {
            def('data', () => new ArrayBuffer(0x00));
            
            it("returns -false-", function() {
                expect($action).to.be.false;
            });
        });
        context("with any data", function() {
            def('data', () => new ArrayBuffer(0x10));
            
            it("returns -true-", function() {
                expect($action).to.be.true;
            });
            it("sets #loaded", function() {
                expect(() => $action).to.change($subject, 'loaded');
                expect($subject.loaded).to.be.true;
            });
        });
    });
});
