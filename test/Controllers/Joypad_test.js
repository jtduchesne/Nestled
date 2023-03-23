import { expect } from "chai";

import Joypad from "../../src/Controllers/Joypad";

describe("Joypad", function() {
    subject(() => new Joypad);
    
    its('states',   () => is.expected.to.be.an('array').with.lengthOf(8).and.be.sealed);
    its('data',     () => is.expected.to.be.an('array').and.be.empty);
    its('strobing', () => is.expected.to.be.false);
    
    its('type',   () => is.expected.to.equal("Joypad"));
    its('device', () => is.expected.to.equal("None"));
    
    its('empty',   () => is.expected.to.be.false);
    its('present', () => is.expected.to.be.true);
    
    describe(".read()", function() {
        beforeEach(function() {
            $subject.states[0] = 0;
            $subject.states[1] = 1;
            $subject.states[2] = 0;
        });
        
        context("without a strobe", function() {
            it("keeps reporting -1-", function() {
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
            });
        });
        context("with a strobe", function() {
            beforeEach(() => { $subject.strobe(); });
            
            it("reports one bit at a time from #states", function() {
                expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(0);
            });
            it("keeps reporting -1- after 8 reads", function() {
                for (let i = 1; i <= 8; i++)
                    $subject.read();
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
                expect($subject.read()).to.equal(1);
            });
        });
        
        context("if #strobing is kept set", function() {
            beforeEach(() => { $subject.strobing = true; });
            
            it("keeps reporting the first bit of #states", function() {
                expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(0);
                expect($subject.read()).to.equal(0);
            });
        });
    });
    
    describe(".strobe()", function() {
        def('action', () => $subject.strobe());
        
        beforeEach(function() {
            $subject.states[0] =
            $subject.states[2] =
            $subject.states[4] =
            $subject.states[6] = 1;
        });
        
        it("copies button states into #data", function() {
            expect(() => $action).to.change($subject, 'data');
            expect($subject.data).to.deep.equal([1,0,1,0,1,0,1,0]);
            expect($subject.data).not.to.equal($subject.states);
        });
    });
    
    //-------------------------------------------------------------------------------//
    /*global $name */
    
    describe(".getButtonHandler(name)", function() {
        def('action', () => $subject.getButtonHandler($name));
        
        context("if a name is valid", function() {
            def('name', () => 'a');
            
            it("returns the corresponding handler", function() {
                expect($action).to.equal($subject.buttonHandlers[0]);
            });
        });
        context("if a name is not valid", function() {
            def('name', () => 'unknown_button');
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw($name);
            });
        });
    });
    
    describe(".pressButton(name, pressDown)", function() {
        /*global $pressDown*/
        def('action', () => $subject.pressButton($name, $pressDown));
        
        context("if the name is valid", function() {
            def('name', () => 'a');
            
            context("and pressDown is -true-", function() {
                beforeEach(() => { $subject.states[0] = 0; });
                def('pressDown', () => true);
                
                it("sets its state to -1-", function() {
                    expect(() => $action).to.change($subject.states, '0');
                    expect($subject.states[0]).to.equal(1);
                });
            });
            context("and pressDown is -false-", function() {
                beforeEach(() => { $subject.states[0] = 1; });
                def('pressDown', () => false);
                
                it("sets its state to -0-", function() {
                    expect(() => $action).to.change($subject.states, '0');
                    expect($subject.states[0]).to.equal(0);
                });
            });
        });
        context("if the name is not valid", function() {
            def('name', () => 'unknown_button');
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw($name);
            });
        });
    });
});
