describe("Buffer", function() {
    def('width',  () => 256);
    def('height', () => 240);
    subject(() => new Nestled.Buffer($width, $height));
    
    def('data', () => Uint32Array.from([0x11111,0x22222,0x33333,0x44444,
                                        0x55555,0x66666,0x77777,0x88888]));
    
    its('dirty', () => is.expected.to.be.false);
    
    describe(".getPixels(x,y)", function() {
        def('action', () => $subject.getPixels(1, 1));
        
        it("returns a Uint32Array", function() {
            expect($action).to.have.property('BYTES_PER_ELEMENT', 4);
        });
        it("has a length of 8", function() {
            expect($action).to.have.lengthOf(8);
        });
        
        it("does not set #dirty", function() {
            expect(() => $action).not.to.change($subject, 'dirty');
            expect($subject.dirty).to.be.false;
        });
        
        it("returns the values located at X,Y", function() {
            let buffer = new Uint32Array($subject.imageData.data.buffer);
            buffer.set($data, $width + 1);
            
            expect($action).to.eql($data);
        });
    });
    
    describe(".setPixels(x,y,values)", function() {
        def('action', () => $subject.setPixels(1, 1, $data));
        
        it("sets #dirty", function() {
            expect(() => $action).to.change($subject, 'dirty');
            expect($subject.dirty).to.be.true;
        });
        
        it("sets the values at X,Y", function() {
            let buffer = new Uint32Array($subject.imageData.data.buffer);
            let values = buffer.subarray($width + 1, $width + 9);
            
            expect(() => $action).to.change(values, '0');
            expect(values).to.eql($data);
        });
        
        it("returns the given values", function() {
            expect($action).to.equal($data);
        });
    });
    
    describe("#frame", function() {
        def('action', () => $subject.frame);
        
        context("when dirty", function() {
            beforeEach(function() { $subject.dirty = true; });
            
            it("calls context.putImageData()", function(done) {
                $subject.context.putImageData = () => done();
                $action;
            });
            it("resets #dirty", function() {
                expect(() => $action).to.change($subject, 'dirty');
                expect($subject.dirty).to.be.false;
            });
            
            it("returns #canvas", function() {
                expect($action).to.equal($subject.canvas);
            });
        });
        context("when not dirty", function() {
            beforeEach(function() { $subject.dirty = false; });
            
            it("does not change #dirty", function() {
                expect(() => $action).not.to.change($subject, 'dirty');
                expect($subject.dirty).to.be.false;
            });
            
            it("returns #canvas", function() {
                expect($action).to.equal($subject.canvas);
            });
        });
    });
});
