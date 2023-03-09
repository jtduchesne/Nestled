import { expect } from "chai";
import sinon from "sinon";

import Keyboard from "../../../src/Controllers/Devices/Keyboard";

describe("Keyboard", function() {
    subject(() => new Keyboard);
    
    its('type',   () => is.expected.to.equal("Joypad"));
    its('device', () => is.expected.to.equal("Keyboard"));
    
    its('empty',   () => is.expected.to.be.false);
    its('present', () => is.expected.to.be.true);
    
    describe(".assignKey(buttonName, keyName)", function() {
        /*global $buttonName, $keyCode, $keyName */
        def('action', () => $subject.assignKey($buttonName, $keyName));
        def('keyCode', () => 13);
        def('keyName', () => "Enter");
        
        context("if buttonName is valid", function() {
            def('buttonName', () => "start");
            
            it("puts the corresponding handler in #keyHandlers", function() {
                expect($subject.keyHandlers).to.be.empty;
                $action;
                expect($subject.keyHandlers).to.have.property($keyCode);
                expect($subject.keyHandlers[$keyCode]).to.equal($subject.getButtonHandler($buttonName));
            });
            it("replaces existing handler", function() {
                $subject.keyHandlers[$keyCode] = () => null;
                expect(() => $action).to.change($subject.keyHandlers, $keyCode);
                expect($subject.keyHandlers[$keyCode]).to.equal($subject.getButtonHandler($buttonName));
            });
        });
        context("if buttonName is not valid", function() {
            def('buttonName', () => "stop");
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw($buttonName);
            });
        });
    });
    
    describe(".assignKeys(opts)", function() {
        /*global $opts */
        def('action', () => $subject.assignKeys($opts));
        
        context("if all the names are valid", function() {
            def('opts', () => ({start: "1", select: "2"}));
            
            it("adds them to #keyHandlers", function() {
                expect($subject.keyHandlers).to.be.empty;
                $action;
                expect($subject.keyHandlers[0x31]).to.equal($subject.getButtonHandler('start'));
                expect($subject.keyHandlers[0x32]).to.equal($subject.getButtonHandler('select'));
            });
        });
        context("if a button name is not valid", function() {
            def('opts', () => ({start: "1", select: "2", stop: "3"}));
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw("stop");
            });
        });
        context("if a key name is not valid", function() {
            def('opts', () => ({start: "1", select: "2", a: ""}));
            
            it("adds only the valid ones to #keyHandlers", function() {
                expect($subject.keyHandlers).to.be.empty;
                $action;
                expect($subject.keyHandlers[0x31]).to.equal($subject.getButtonHandler('start'));
                expect($subject.keyHandlers[0x32]).to.equal($subject.getButtonHandler('select'));
                expect(Object.values($subject.keyHandlers)).to.have.lengthOf(2);
            });
        });
    });
    
    describe(".pressKey(event, keyDown)", function() {
        /*global $event, $keyDown */
        def('action', () => $subject.pressKey($event, $keyDown));
        beforeEach(function() {
            $subject.buttonHandlers[3] = sinon.stub();
            $subject.assignKey('start', "Enter");
        });
        
        def('event', () => ({keyCode: $keyCode, preventDefault: sinon.stub()}));
        
        context("if event.keyCode is assigned to a button", function() {
            def('keyCode', () => 13);
            
            context("and keyDown=true", function() {
                def('keyDown', () => true);
                
                it("presses that button", function() {
                    $action;
                    expect($subject.buttonHandlers[3]).to.be.calledOnceWith(true);
                });
                it("calls event.preventDefault()", function() {
                    $action;
                    expect($event.preventDefault).to.be.calledOnce;
                });
            });
            context("and keyDown=false", function() {
                def('keyDown', () => false);
                
                it("releases that button", function() {
                    $action;
                    expect($subject.buttonHandlers[3]).to.be.calledOnceWith(false);
                });
                it("calls event.preventDefault()", function() {
                    $action;
                    expect($event.preventDefault).to.be.calledOnce;
                });
            });
        });
        context("if event.keyCode is not assigned to a button", function() {
            def('keyCode', () => 32);
            
            it("does not press any button", function() {
                const stub = sinon.stub();
                $subject.buttonHandlers.fill(stub);
                $action;
                expect(stub).not.to.be.called;
            });
            it("does not call event.preventDefault()", function() {
                $action;
                expect($event.preventDefault).not.to.be.called;
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".getAssignedKey(buttonName)", function() {
        def('action', () => $subject.getAssignedKey($buttonName));
        beforeEach(() => $subject.assignKey("start", "Enter"));
        
        context("if buttonName is assigned to a key", function() {
            def('buttonName', () => "start");
            
            it("returns the name of the key", function() {
                expect($action).to.equal("Enter");
            });
        });
        context("if buttonName is not assigned to any key", function() {
            def('buttonName', () => "select");
            
            it("returns an empty string", function() {
                expect($action).to.equal("");
            });
        });
    });
});
