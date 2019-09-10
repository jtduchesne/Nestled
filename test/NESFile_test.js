describe("NESFile", function() {
    subject(() => new Nestled.NESFile);
    
    def('emptyFile', () => new File("emptyfile", []));
    def('validData', () => [0x4E,0x45,0x53,0x1A, 0,1,2,3,4,5,6,7,8,9]);
    def('validFile', () => new File("validfile", $validData));
    
    describe(".load()", function() {
        def('action', () => $subject.load($file));
        
        context("when the file is empty", function() {
            def('file', () => $emptyFile);
            
            it("returns a Promise", function() {
                expect($action).to.be.a('Promise'); });
                
            it("sets #isLoaded to -true-", function() {
                return $action.finally(() => { expect($subject.isLoaded).to.be.true; }); });
            it("sets #isValid to -false-", function() {
                return $action.finally(() => { expect($subject.isValid).to.be.false; }); });
            
            it("sets #name", function() {
                return $action.finally(() => { expect($subject.name).to.equal($file.name); }); });
            it("clears #size", function() {
                return $action.finally(() => { expect($subject.size).to.equal(0); }); });
            it("clears #data", function() {
                return $action.finally(() => { expect($subject.data).to.be.null; }); });
            
            it("updates the status", function() {
                return $action.finally(() => {
                    expect($subject.status).to.include("empty");
                });
            });
        });
        context("when the file is valid", function() {
            def('file', () => $validFile);
            
            it("returns a Promise", function() {
                expect($action).to.be.a('Promise'); });
                
            it("sets #isLoaded to -true-", function() {
                return $action.finally(() => { expect($subject.isLoaded).to.be.true; }); });
            it("sets #isValid to -true-", function() {
                return $action.finally(() => { expect($subject.isValid).to.be.true; }); });
            
            it("sets #name", function() {
                return $action.finally(() => { expect($subject.name).to.equal($file.name); }); });
            it("sets #size", function() {
                return $action.finally(() => { expect($subject.size).to.equal($file.size); }); });
            it("sets #data", function() {
                return $action.finally(() => { expect($subject.data).to.eql($file.arrayBuffer); }); });
            
            it("updates the status", function() {
                return $action.finally(() => {
                    expect($subject.status).to.include($file.name).and.include("loaded");
                });
            });
            
            it("triggers 'onload' event with itself as argument", function() {
                $subject.onload = (e) => {
                    expect(e.target).to.equal($subject);
                };
                return $action;
            });
        });
    });
    
    describe(".unload()", function() {
        def('action', () => $subject.unload());
        
        context("when a file is loaded", function() {
            beforeEach(function() {
                $subject.isLoaded = true;
                $subject.isValid = true;
                $subject.name = "validfile";
                $subject.size = $validData.length;
                $subject.data = $validData;
            });
            
            it("returns a Promise", function() {
                expect($action).to.be.a('Promise'); });
                
            it("sets #isLoaded to -false-", function() {
                return $action.finally(() => { expect($subject.isLoaded).to.be.false; }); });
            it("sets #isValid to -null-", function() {
                return $action.finally(() => { expect($subject.isValid).to.be.null; }); });
            
            it("clears #name", function() {
                return $action.finally(() => { expect($subject.name).to.be.empty; }); });
            it("clears #size", function() {
                return $action.finally(() => { expect($subject.size).to.equal(0); }); });
            it("clears #data", function() {
                return $action.finally(() => { expect($subject.data).to.be.null; }); });
            
            it("updates the status", function() {
                return $action.finally(() => {
                    expect($subject.status).to.include("validfile").and.include("unloaded");
                });
            });
            
            it("triggers 'onunload' event with itself as argument", function() {
                $subject.onunload = (e) => {
                    expect(e.target).to.equal($subject);
                };
                return $action;
            });
        });
        context("when no file is loaded", function() {
            it("does NOT returns Promise", function() {
                expect($action).not.to.be.a('Promise'); });
            
            it("keeps the 'no file' status", function() {
                expect($subject.status.toLowerCase()).to.include("no file");
            });
        });
    });
    
    describe(".updateStatus(text)", function() {
        def('action', () => $subject.updateStatus($text));
        def('text', () => "This is a new status");
        
        it("returns the status", function() {
            expect($action).to.equal($text); });
        it("sets #status", function() {
            expect(() => $action).to.change($subject, 'status');
            expect($subject.status).to.equal($text);
        });
        
        it("triggers 'onstatus' event with itself as argument", function() {
            $subject.onstatus = (e) => {
                expect(e.target).to.equal($subject).and.have.property('status', $text);
            };
            return $action;
        });
    });
});
