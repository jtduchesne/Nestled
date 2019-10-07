describe("Keyboard", function() {
    subject(() => new Nestled.Keyboard);
    
    describe(".assignKey(buttonName, keyCode)", function() {
        def('action', () => $subject.assignKey($buttonName, $keyCode));
        def('keyCode', () => 13);
        
        context("if buttonName is valid", function() {
            def('buttonName', () => "start");
            
            it("puts the corresponding handler in #keyMap", function() {
                expect($subject.keyMap).to.be.empty;
                $action;
                expect($subject.keyMap).to.have.property($keyCode);
                expect($subject.keyMap[$keyCode]).to.equal($subject.getButtonHandler($buttonName));
            });
            it("replaces existing handler", function() {
                $subject.keyMap[$keyCode] = () => null;
                expect(() => $action).to.change($subject.keyMap, $keyCode);
                expect($subject.keyMap[$keyCode]).to.equal($subject.getButtonHandler($buttonName));
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
        def('action', () => $subject.assignKeys($opts));
        
        context("if all the names are valid", function() {
            def('opts', () => ({start: 1, select: 2}));
            
            it("adds them to #keyMap", function() {
                expect($subject.keyMap).to.be.empty;
                $action;
                expect($subject.keyMap[1]).to.equal($subject.getButtonHandler('start'));
                expect($subject.keyMap[2]).to.equal($subject.getButtonHandler('select'));
            });
        });
        context("if a name is not valid", function() {
            def('opts', () => ({start: 1, select: 2, stop: 3}));
            
            it("throws an error containing the invalid name", function() {
                expect(() => $action).to.throw("stop");
            });
        });
    });
    
    describe(".pressKey(event, keyDown)", function() {
        def('action', () => $subject.pressKey($event, $keyDown));
        beforeEach(function() {
            $subject.assignKey('start', 13);
        });
        
        context("if event.keyCode is assigned to a button", function() {
            def('event', () => ({keyCode: 13, preventDefault: () => undefined}));
            
            context("and keyDown=true", function() {
                def('keyDown', () => true);
                
                it("press that button", function() {
                    expect(() => $action).to.change($subject, 'start');
                    expect($subject.start).to.equal(true);
                });
            });
            context("and keyDown=false", function() {
                def('keyDown', () => false);
                beforeEach(function() { $subject.start = 1; });
                
                it("releases that button", function() {
                    expect(() => $action).to.change($subject, 'start');
                    expect($subject.start).to.equal(false);
                });
            });
        });
    });
});
