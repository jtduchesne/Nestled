import { expect } from "chai";
import sinon from "sinon";

import NES from "../src/NES";

import CartConnector from "../src/CartConnector";
import CtrlConnector from "../src/CtrlConnector";
import AudioOutput from "../src/AudioOutput";
import VideoOutput from "../src/VideoOutput";
import CPU from "../src/CPU";
import APU from "../src/APU";
import PPU from "../src/PPU";
import Engine from "../src/Engine";

describe("Nes", function() {
    subject(() => new NES);
    
    its('game',        () => is.expected.to.be.an.instanceOf(CartConnector));
    its('controllers', () => is.expected.to.be.an.instanceOf(CtrlConnector));
    its('audio',       () => is.expected.to.be.an.instanceOf(AudioOutput));
    its('video',       () => is.expected.to.be.an.instanceOf(VideoOutput));

    its('cpu',    () => is.expected.to.be.an.instanceOf(CPU));
    its('apu',    () => is.expected.to.be.an.instanceOf(APU));
    its('ppu',    () => is.expected.to.be.an.instanceOf(PPU));
    its('engine', () => is.expected.to.be.an.instanceOf(Engine));
    
    its('buttons', () => is.expected.to.be.an('object'));
    its('buttons', () => is.expected.to.have.keys('pressPower', 'pressReset'));
    
    describe(".powerOn()", function() {
        beforeEach(function() {
            sinon.stub($subject.cpu, 'powerOn');
            sinon.stub($subject.apu, 'powerOn');
            sinon.stub($subject.ppu, 'powerOn');
            sinon.stub($subject.engine, 'powerOn');
        });
        def('action', () => $subject.powerOn());
        
        it("turns on the CPU", function() {
            $subject.cpu.isPowered = false;
            expect(() => $action).to.change($subject.cpu.powerOn, 'callCount');
            expect($subject.cpu.powerOn).to.be.calledOnce;
        });
        it("turns on the APU", function() {
            $subject.apu.isPowered = false;
            expect(() => $action).to.change($subject.apu.powerOn, 'callCount');
            expect($subject.apu.powerOn).to.be.calledOnce;
        });
        it("turns on the PPU", function() {
            $subject.ppu.isPowered = false;
            expect(() => $action).to.change($subject.ppu.powerOn, 'callCount');
            expect($subject.ppu.powerOn).to.be.calledOnce;
        });
        it("turns on the Engine", function() {
            $subject.engine.isPowered = false;
            expect(() => $action).to.change($subject.engine.powerOn, 'callCount');
            expect($subject.engine.powerOn).to.be.calledOnce;
        });
        
        it("sets #isPowered to -true-", function() {
            $subject.isPowered = false;
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.true;
        });
        
        it("returns -true-", function() {
            expect($action).to.be.true;
        });
    });
    describe(".powerOff()", function() {
        beforeEach(function() {
            sinon.stub($subject.cpu, 'powerOff');
            sinon.stub($subject.apu, 'powerOff');
            sinon.stub($subject.ppu, 'powerOff');
            sinon.stub($subject.engine, 'powerOff');
        });
        def('action', () => $subject.powerOff());
        
        it("turns off the CPU", function() {
            $subject.cpu.isPowered = true;
            expect(() => $action).to.change($subject.cpu.powerOff, 'callCount');
            expect($subject.cpu.powerOff).to.be.calledOnce;
        });
        it("turns off the APU", function() {
            $subject.apu.isPowered = true;
            expect(() => $action).to.change($subject.apu.powerOff, 'callCount');
            expect($subject.apu.powerOff).to.be.calledOnce;
        });
        it("turns off the PPU", function() {
            $subject.ppu.isPowered = true;
            expect(() => $action).to.change($subject.ppu.powerOff, 'callCount');
            expect($subject.ppu.powerOff).to.be.calledOnce;
        });
        it("turns off the Engine", function() {
            $subject.engine.isPowered = true;
            expect(() => $action).to.change($subject.engine.powerOff, 'callCount');
            expect($subject.engine.powerOff).to.be.calledOnce;
        });
        
        it("sets #isPowered to -false-", function() {
            $subject.isPowered = true;
            expect(() => $action).to.change($subject, 'isPowered');
            expect($subject.isPowered).to.be.false;
        });
        
        it("returns -false-", function() {
            expect($action).to.be.false;
        });
    });
    
    describe(".reset()", function() {
        beforeEach(function() {
            sinon.stub($subject.cpu, 'reset');
            sinon.stub($subject.apu, 'reset');
            sinon.stub($subject.ppu, 'reset');
        });
        def('action', () => $subject.reset());
        
        it("resets the CPU", function() {
            expect(() => $action).to.change($subject.cpu.reset, 'callCount');
            expect($subject.cpu.reset).to.be.calledOnce;
        });
        it("resets the APU", function() {
            expect(() => $action).to.change($subject.apu.reset, 'callCount');
            expect($subject.apu.reset).to.be.calledOnce;
        });
        it("resets the PPU", function() {
            expect(() => $action).to.change($subject.ppu.reset, 'callCount');
            expect($subject.ppu.reset).to.be.calledOnce;
        });
        
        it("does not change #isPowered", function() {
            expect(() => $action).not.to.change($subject, 'isPowered');
        });
    });
});
