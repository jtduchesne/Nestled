import { expect } from "chai";
import sinon from "sinon";

import Controller from "../../src/Controllers/Controller";

describe("Controller", function() {
    subject(() => new Controller);
    
    its('strobing', () => is.expected.to.be.false);
    
    its('type',   () => is.expected.to.be.a('string').and.equal("Empty"));
    its('device', () => is.expected.to.be.a('string').and.equal("None"));
    
    its('empty',   () => is.expected.to.be.true);
    its('present', () => is.expected.to.be.false);
    
    describe(".read()", function() {
        it("keeps reporting -0-", function() {
            expect($subject.read()).to.equal(0);
            expect($subject.read()).to.equal(0);
        });
        
        context("if #strobing is set", function() {
            beforeEach(() => { $subject.strobing = true; });
            
            it("keeps calling .strobe()", function() {
                const stub = sinon.stub($subject, 'strobe');
                $subject.read();
                $subject.read();
                expect(stub).to.be.calledTwice;
            });
        });
    });
    
    describe(".write(data)", function() {
        /*global $data */
        def('action', () => $subject.write($data));
        
        context("if data is 0", function() {
            def('data', () => 0);
            
            it("does not set #strobing", function() {
                expect(() => $action).not.to.change($subject, 'strobing');
                expect($subject.strobing).to.be.false;
            });
            it("does not call .strobe()", function() {
                const stub = sinon.stub($subject, 'strobe');
                $action;
                expect(stub).not.to.be.called;
            });
            
            context("and #strobing is set", function() {
                beforeEach(() => { $subject.strobing = true; });
                
                it("clears #strobing", function() {
                    expect(() => $action).to.change($subject, 'strobing');
                    expect($subject.strobing).to.be.false;
                });
                it("calls .strobe() only once", function() {
                    const stub = sinon.stub($subject, 'strobe');
                    $subject.write($data);
                    $subject.write($data);
                    expect(stub).to.be.calledOnce;
                });
            });
        });
        context("if data is 1", function() {
            def('data', () => 1);
            
            it("sets #strobing", function() {
                expect(() => $action).to.change($subject, 'strobing');
                expect($subject.strobing).to.be.true;
            });
            it("does not call .strobe()", function() {
                const stub = sinon.stub($subject, 'strobe');
                $action;
                expect(stub).not.to.be.called;
            });
            
            context("and #strobing is set", function() {
                beforeEach(() => { $subject.strobing = true; });
                
                it("does not clear #strobing", function() {
                    expect(() => $action).not.to.change($subject, 'strobing');
                    expect($subject.strobing).to.be.true;
                });
                it("keeps calling .strobe()", function() {
                    const stub = sinon.stub($subject, 'strobe');
                    $subject.write($data);
                    $subject.write($data);
                    expect(stub).to.be.calledTwice;
                });
            });
        });
    });
});
