import { expect } from "chai";

import Metadata from "../../src/Cartridges/Metadata";

import { Header } from "../../src/Cartridges";

describe("Metadata", function() {
    subject(() => new Metadata);
    
    its('name',        () => is.expected.to.be.a('string').and.equal("No Cartridge"));
    its('format',      () => is.expected.to.be.a('string'));
    its('consoleType', () => is.expected.to.be.a('string').and.equal("NES/Famicom"));
    its('tvSystem',    () => is.expected.to.be.a('string').and.equal("NTSC"));
    
    its('mapper',    () => is.expected.to.be.a('string'));
    its('PRGROM',    () => is.expected.to.be.a('string'));
    its('CHRROM',    () => is.expected.to.be.a('string'));
    its('scrolling', () => is.expected.to.be.a('string'));
    its('SRAM',      () => is.expected.to.be.a('string'));
    its('PRGRAM',    () => is.expected.to.be.a('string'));
    its('CHRRAM',    () => is.expected.to.be.a('string'));
    its('misc',      () => is.expected.to.be.a('string'));
    
    its('warnings', () => is.expected.to.be.an('array').and.be.empty);
    its('errors',   () => is.expected.to.be.an('array').and.be.empty);
    
    its('supported', () => is.expected.to.be.true);
    its('valid',     () => is.expected.to.be.true);
    
    describe(".warn(message)", function() {
        def('action', () => $subject.warn($message));
        
        def('message', () => "Warning"); /*global $message */
        
        it("pushes given message to #warnings array", function() {
            expect(() => $action).to.increase($subject.warnings, 'length').by(1);
            expect($subject.warnings[$subject.warnings.length-1]).to.equal($message);
        });
        it("sets #supported to -false-", function() {
            expect(() => $action).to.change($subject, 'supported');
            expect($subject.supported).to.be.false;
        });
    });
    describe(".error(message)", function() {
        def('action', () => $subject.error($message));
        
        def('message', () => "Error");
        
        it("pushes given message to #errors array", function() {
            expect(() => $action).to.increase($subject.errors, 'length').by(1);
            expect($subject.errors[$subject.errors.length-1]).to.equal($message);
        });
        it("sets #valid to -false-", function() {
            expect(() => $action).to.change($subject, 'valid');
            expect($subject.valid).to.be.false;
        });
    });
    
    describe(".parseFilename(filename)", function() {
        def('action', () => $subject.parseFilename($filename));
        
        def('filename', () => "a_pretty_good_Game (UK)[!b].nes"); /*global $filename */
        
        it("sets #name", function() {
            expect(() => $action).to.change($subject, 'name');
        });
        it("sets #tvSystem", function() {
            expect(() => $action).to.change($subject, 'tvSystem');
        });
        it("removes the file extension", function() {
            $action;
            expect($subject.name).not.to.match(/\.(nes)?$/);
        });
        it("removes the country code", function() {
            $action;
            expect($subject.name).not.to.match(/\([A-Z]*\)/);
        });
        it("removes dump infos", function() {
            $action;
            expect($subject.name).not.to.match(/\[.*?\]/);
        });
        it("properly format the name", function() {
            $action;
            expect($subject.name).to.equal("A pretty good Game");
        });
        
        context("when no country code is in the filename", function() {
            def('filename', () => "Game name.nes");
            
            it("keeps #tvSystem as 'NTSC'(default)", function() {
                expect(() => $action).not.to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("NTSC");
            });
            it("keeps #supported -true-", function() {
                expect(() => $action).not.to.change($subject, 'supported');
                expect($subject.supported).to.be.true;
            });
        });
        context("when a NTSC country code is in the filename", function() {
            def('filename', () => "Game name (U).nes");
            
            it("sets #tvSystem to 'NTSC'", function() {
                $subject.tvSystem = "PAL";
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("NTSC");
            });
            it("keeps #supported -true-", function() {
                expect(() => $action).not.to.change($subject, 'supported');
                expect($subject.supported).to.be.true;
            });
        });
        context("when a PAL country code is in the filename", function() {
            def('filename', () => "Game name (UK).nes");
            
            it("sets #tvSystem to 'PAL'", function() {
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("PAL");
            });
            it("sets #supported to -false-", function() {
                expect(() => $action).to.change($subject, 'supported');
                expect($subject.supported).to.be.false;
            });
        });
        context("when a SECAM country code is in the filename", function() {
            def('filename', () => "Game name (F).nes");
            
            it("sets #tvSystem to 'SECAM'", function() {
                expect(() => $action).to.change($subject, 'tvSystem');
                expect($subject.tvSystem).to.equal("SECAM");
            });
            it("sets #supported to -false-", function() {
                expect(() => $action).to.change($subject, 'supported');
                expect($subject.supported).to.be.false;
            });
        });
    });
    
    describe(".load(header)", function() {
        def('action', () => $subject.load($header));
        
        def('header', () => new Header); /*global $header */
        
        it("sets #format", function() {
            expect(() => $action).to.change($subject, 'format');
        });
        it("sets #mapper", function() {
            expect(() => $action).to.change($subject, 'mapper');
        });
        it("sets #PRGROM", function() {
            expect(() => $action).to.change($subject, 'PRGROM');
        });
        it("sets #CHRROM", function() {
            expect(() => $action).to.change($subject, 'CHRROM');
        });
        it("sets #scrolling", function() {
            expect(() => $action).to.change($subject, 'scrolling');
        });
        
        context("when header is valid and supported", function() {
            beforeEach(() => {
                $header.valid = true;
                $header.supported = true;
            });
            
            it("keeps #supported -true-", function() {
                expect(() => $action).not.to.change($subject, 'supported');
                expect($subject.supported).to.be.true;
            });
        });
        context("when header is valid but unsupported", function() {
            beforeEach(() => {
                $header.valid = true;
                $header.supported = false;
            });
            
            it("sets #supported to -false-", function() {
                expect(() => $action).to.change($subject, 'supported');
                expect($subject.supported).to.be.false;
            });
        });
        
        context("when there is a battery", function() {
            beforeEach(() => { $header.battery = true; });
            
            it("sets #SRAM", function() {
                expect(() => $action).to.change($subject, 'SRAM');
            });
        });
        context("when there is a trainer", function() {
            beforeEach(() => { $header.trainer = true; });
            
            it("sets #misc", function() {
                expect(() => $action).to.change($subject, 'misc');
            });
        });
        
        context("when there is PRG-NVRAM data", function() {
            beforeEach(() => { $header.PRGNVRAMByteLength = 1024; });
            
            it("sets #PRGRAM", function() {
                expect(() => $action).to.change($subject, 'PRGRAM');
            });
        });
        context("when there is PRG-RAM data", function() {
            beforeEach(() => { $header.PRGRAMByteLength = 1024; });
            
            it("sets #PRGRAM", function() {
                expect(() => $action).to.change($subject, 'PRGRAM');
            });
        });
        
        context("when there is CHR-NVRAM data", function() {
            beforeEach(() => { $header.CHRNVRAMByteLength = 1024; });
            
            it("sets #CHRRAM", function() {
                expect(() => $action).to.change($subject, 'CHRRAM');
            });
        });
        context("when there is CHR-RAM data", function() {
            beforeEach(() => { $header.CHRRAMByteLength = 1024; });
            
            it("sets #CHRRAM", function() {
                expect(() => $action).to.change($subject, 'CHRRAM');
            });
        });
        
        context("when console type is not 'NES/Famicom'", function() {
            beforeEach(() => { $header.consoleType = 1; });
            
            it("sets #consoleType", function() {
                expect(() => $action).to.change($subject, 'consoleType');
            });
            it("sets #supported to -false-", function() {
                expect(() => $action).to.change($subject, 'supported');
                expect($subject.supported).to.be.false;
            });
        });
    });
});
