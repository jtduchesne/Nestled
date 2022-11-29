import CartConnector, { Cartridge, Metadata } from "../../src/Cartridges";
import { Header } from "../../src/Cartridges/FileFormats";

describe("CartConnector", function() {
    subject(() => new CartConnector);
    
    its('file',      () => is.expected.to.be.an.instanceOf(Header));
    its('metadata',  () => is.expected.to.be.an.instanceOf(Metadata));
    its('cartridge', () => is.expected.to.be.an.instanceOf(Cartridge));
    
    describe(".reset()", function() {
        def('action', () => $subject.reset());
        
        it("resets #file", function() {
            expect(() => $action).to.change($subject, 'file');
            expect($subject.file).to.be.an.instanceOf(Header);
        });
        it("resets #metadata", function() {
            expect(() => $action).to.change($subject, 'metadata');
            expect($subject.metadata).to.be.an.instanceOf(Metadata);
        });
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
    });
    
    describe(".load(file)", function() {
        def('action', () => $subject.load($file));
        
        def('file', () => undefined); /*global $file */
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        
        it("resets #file", function() {
            expect(() => $action).to.change($subject, 'file');
            expect($subject.file).to.be.an.instanceOf(Header);
        });
        it("resets #metadata", function() {
            expect(() => $action).to.change($subject, 'metadata');
            expect($subject.metadata).to.be.an.instanceOf(Metadata);
        });
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        
        it("resets #file", function() {
            expect(() => $action).to.change($subject, 'file');
            expect($subject.file).to.be.an.instanceOf(Header);
        });
        it("resets #metadata", function() {
            expect(() => $action).to.change($subject, 'metadata');
            expect($subject.metadata).to.be.an.instanceOf(Metadata);
        });
        it("resets #cartridge", function() {
            expect(() => $action).to.change($subject, 'cartridge');
            expect($subject.cartridge).to.be.an.instanceOf(Cartridge);
        });
    });
});
