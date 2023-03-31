import { expect } from "chai";
import sinon from "sinon";

import CartConnector from "../src/CartConnector";

import { Cartridge, Header, Metadata, FileFormats } from "../src/Cartridges";
const { INESHeader, UNIFHeader } = FileFormats;

import inesFileFactory from "./Fixtures/INESFile_factory";
import unifFileFactory from "./Fixtures/UNIFFile_factory";

describe("CartConnector", function() {
    subject(() => new CartConnector);
    
    its('name',      () => is.expected.to.be.a('string'));
    
    its('supported', () => is.expected.to.be.a('boolean'));
    its('valid',     () => is.expected.to.be.a('boolean'));
    
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
        it("returns a Promise that resolves to $subject", function() {
            return $action.then((result) => {
                expect(result).to.equal($subject);
            });
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
        
        context("without a file", function() {
            def('file', () => undefined);
            
            it("does not set its name", function() {
                expect(() => $action).not.to.change($subject, 'name');
            });
            it("sets it as invalid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.false; });
            });
        });
        
        context("with an empty file", function() {
            def('file', () => new File("empty_game.nes"));
            
            it("does set its name", function() {
                expect(() => $action).to.change($subject, 'name');
                expect($subject.name).to.equal("Empty game");
            });
            it("sets it as invalid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.false; });
            });
        });
        
        context("with an invalid file", function() {
            def('file', () => new File("invalid_game.nes", inesFileFactory({ signature: 'BAD!' })));
            
            it("does set its name", function() {
                expect(() => $action).to.change($subject, 'name');
                expect($subject.name).to.equal("Invalid game");
            });
            it("sets it as invalid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.false; });
            });
        });
        
        context("with a valid iNES file", function() {
            def('file', () => new File("valid_game.nes", inesFileFactory()));
            
            it("sets its name", function() {
                expect(() => $action).to.change($subject, 'name');
                expect($subject.name).to.equal("Valid game");
            });
            
            it("sets its #file to an INESHeader", function() {
                return $action.then(() => {
                    expect($subject.file).to.be.an.instanceOf(INESHeader);
                });
            });
            it("calls Metadata.load()", function() {
                const spy = sinon.spy(Metadata.prototype, 'load');
                return $action.then(() => {
                    expect(spy).to.be.calledOnce;
                    spy.restore();
                });
            });
            it("calls Cartridge.load()", function() {
                const spy = sinon.spy(Cartridge.prototype, 'load');
                return $action.then(() => {
                    expect(spy).to.be.calledOnce;
                    spy.restore();
                });
            });
            
            it("keeps it as valid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.true; });
            });
        });
        
        context("with a valid but unsupported iNES file", function() {
            def('file', () => new File("unsupported_game.nes", inesFileFactory({ mapper: 123 })));
            
            it("sets its name", function() {
                expect(() => $action).to.change($subject, 'name');
                expect($subject.name).to.equal("Unsupported game");
            });
            
            it("sets its #file to an INESHeader", function() {
                return $action.then(() => {
                    expect($subject.file).to.be.an.instanceOf(INESHeader);
                });
            });
            it("calls Metadata.load()", function() {
                const spy = sinon.spy(Metadata.prototype, 'load');
                return $action.then(() => {
                    expect(spy).to.be.calledOnce;
                    spy.restore();
                });
            });
            it("calls Cartridge.load()", function() {
                const spy = sinon.spy(Cartridge.prototype, 'load');
                return $action.then(() => {
                    expect(spy).to.be.calledOnce;
                    spy.restore();
                });
            });
            
            it("sets it as unsupported", function() {
                expect($subject.supported).to.be.true;
                return $action.then(() => { expect($subject.supported).to.be.false; });
            });
            it("keeps it as valid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.true; });
            });
        });
        
        context("with a valid UNIF file", function() {
            def('file', () => new File("valid_game.nes", unifFileFactory()));
            
            it("sets its name", function() {
                expect(() => $action).to.change($subject, 'name');
                expect($subject.name).to.equal("Valid game");
            });
            
            it("sets its #file to an UNIFHeader", function() {
                return $action.then(() => {
                    expect($subject.file).to.be.an.instanceOf(UNIFHeader);
                });
            });
            it("does not call Metadata.load()", function() {
                const spy = sinon.spy(Metadata.prototype, 'load');
                return $action.then(() => {
                    expect(spy).not.to.be.called;
                    spy.restore();
                });
            });
            it("does not call Cartridge.load()", function() {
                const spy = sinon.spy(Cartridge.prototype, 'load');
                return $action.then(() => {
                    expect(spy).not.to.be.called;
                    spy.restore();
                });
            });
            
            it("sets it as invalid", function() {
                expect($subject.valid).to.be.true;
                return $action.then(() => { expect($subject.valid).to.be.false; });
            });
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        it("returns a Promise", function() {
            expect($action).to.be.an.instanceOf(Promise);
        });
        it("returns a Promise that resolves to $subject", function() {
            return $action.then((result) => {
                expect(result).to.equal($subject);
            });
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
