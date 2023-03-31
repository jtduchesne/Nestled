import { expect } from "chai";
import sinon from "sinon";

import CtrlConnector from "../src/CtrlConnector";

import { Controller } from "../src/Controllers";

describe("CtrlConnector", function() {
    subject(() => new CtrlConnector);
    
    its('1', () => is.expected.to.be.an.instanceOf(Controller).and.have.property('empty', true));
    its('2', () => is.expected.to.be.an.instanceOf(Controller).and.have.property('empty', true));
    
    its('controllers', () => is.expected.to.be.an('object').that.has.keys(1, 2));
    its('1', () => is.expected.to.equal($subject.controllers[1]));
    its('2', () => is.expected.to.equal($subject.controllers[2]));
    
    //-------------------------------------------------------------------------------//
    
    describe(".insert(controller, port)", function() {
        def('action', () => $subject.insert($controller, $port));
        
        /*global $controller, $port*/
        def('controller', () => new Controller);
        
        context("when port = 1", function() {
            def('port', () => 1);
            
            it("sets given controller into port 1", function() {
                expect(() => $action).to.change($subject, '1');
                expect($subject[1]).to.equal($controller);
            });
            it("does not change controller into port 2", function() {
                expect(() => $action).not.to.change($subject, '2');
                expect($subject[2]).not.to.equal($controller);
            });
        });
        context("when port = 2", function() {
            def('port', () => 2);
            
            it("does not change controller into port 1", function() {
                expect(() => $action).not.to.change($subject, '1');
                expect($subject[1]).not.to.equal($controller);
            });
            it("sets given controller into port 2", function() {
                expect(() => $action).to.change($subject, '2');
                expect($subject[2]).to.equal($controller);
            });
        });
        context("when port = 3", function() {
            def('port', () => 3);
            
            it("throws an error", function() {
                expect(() => $action).to.throw(TypeError);
            });
        });
    });
    
    describe(".remove(port)", function() {
        def('action', () => $subject.remove($port));
        
        context("when port = 1", function() {
            def('port', () => 1);
            
            it("sets an empty controller into port 1", function() {
                expect(() => $action).to.change($subject, '1');
                expect($subject[1]).to.still.be.an.instanceOf(Controller).and
                                            .have.property('empty', true);
            });
            it("does not change controller into port 2", function() {
                expect(() => $action).not.to.change($subject, '2');
            });
        });
        context("when port = 2", function() {
            def('port', () => 2);
            
            it("does not change controller into port 1", function() {
                expect(() => $action).not.to.change($subject, '1');
            });
            it("sets given controller into port 2", function() {
                expect(() => $action).to.change($subject, '2');
                expect($subject[2]).to.still.be.an.instanceOf(Controller).and
                                            .have.property('empty', true);
            });
        });
        context("when port = 3", function() {
            def('port', () => 3);
            
            it("throws an error", function() {
                expect(() => $action).to.throw(TypeError);
            });
        });
    });
    
    //-------------------------------------------------------------------------------//
    
    describe(".read(address)", function() {
        def('action', () => $subject.read($address)); /*global $address*/
        
        context("when address is [0x4016]", function() {
            def('address', () => 0x4016);
            
            beforeEach(() => sinon.stub($subject.controllers[1], 'read').returns(0x1F));
            
            it("reads from controller 1", function() {
                $action;
                expect($subject.controllers[1].read).to.be.calledOnce;
            });
            it("adds the higher 3-bits of address bus (0x40) to the returned value", function() {
                expect($action).to.equal(0x5F);
            });
        });
        context("when address is [0x4017]", function() {
            def('address', () => 0x4017);
            
            beforeEach(() => sinon.stub($subject.controllers[2], 'read').returns(0x1F));
            
            it("reads from controller 1", function() {
                $action;
                expect($subject.controllers[2].read).to.be.calledOnce;
            });
            it("adds the higher 3-bits of address bus (0x40) to the returned value", function() {
                expect($action).to.equal(0x5F);
            });
        });
    });
    
    describe(".write(0x4016, data)", function() {
        def('action', () => $subject.write(0x4016, $data)); /*global $data*/
        
        beforeEach(() => {
            sinon.stub($subject.controllers[1], 'write');
            sinon.stub($subject.controllers[2], 'write');
        });
        
        context("when data is [0x00]", function() {
            def('data', () => 0x00);
            
            it("writes to both controllers", function() {
                $action;
                expect($subject.controllers[1].write).to.be.calledOnceWith(0);
                expect($subject.controllers[2].write).to.be.calledOnceWith(0);
            });
        });
        context("when data is [0x01]", function() {
            def('data', () => 0x01);
            
            it("writes to both controllers", function() {
                $action;
                expect($subject.controllers[1].write).to.be.calledOnceWith(1);
                expect($subject.controllers[2].write).to.be.calledOnceWith(1);
            });
        });
        context("when data is [0xFF]", function() {
            def('data', () => 0xFF);
            
            it("writes only the first bit to both controllers", function() {
                $action;
                expect($subject.controllers[1].write).to.be.calledOnceWith(1);
                expect($subject.controllers[2].write).to.be.calledOnceWith(1);
            });
        });
    });
});
