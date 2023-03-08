import Keyboard from "../../../src/Controllers/Devices/Keyboard";

describe("Keyboard", function() {
    subject(() => new Keyboard);
    
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
            
            it("adds them to #keyMap", function() {
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
            
            it("adds only the valid ones to #keyMap", function() {
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
            $subject.assignKey('start', "Enter");
        });
        
        context("if event.keyCode is assigned to a button", function() {
            def('event', () => ({keyCode: 13, preventDefault: () => undefined}));
            
            context("and keyDown=true", function() {
                def('keyDown', () => true);
                
                it("presses that button", function() {
                    expect(() => $action).to.change($subject.states, '3');
                    expect($subject.states[3]).to.equal(1);
                });
            });
            context("and keyDown=false", function() {
                def('keyDown', () => false);
                beforeEach(function() { $subject.pressKey($event, true); });
                
                it("releases that button", function() {
                    expect(() => $action).to.change($subject.states, '3');
                    expect($subject.states[3]).to.equal(0);
                });
            });
        });
    });
});
