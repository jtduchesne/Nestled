const chai = require('chai');
const sinon = require('sinon');
global.expect = chai.expect;
global.sinon = sinon;

const sinonChai = require("sinon-chai");
chai.use(sinonChai);

exports.mochaHooks = {
    afterEach() {
        sinon.restore();
    }
};

global.isSet = (v) => (typeof v !== 'undefined');

global.File = class {
    constructor(name, content = []) {
        this.name = name;
        this.size = content.length || content.byteLength;
        this.type = "application/octet-stream";
        this.arrayBuffer = (content instanceof ArrayBuffer) ? content : Uint8Array.from(content).buffer;
    }
};
global.FileReader = class {
    readAsArrayBuffer(file) {
        this.result = file.arrayBuffer;
        this.error  = null;
        if (typeof this.onload === 'function')
            this.onload();
    }
};

global.DOMException = class DOMException extends Error {
    get [Symbol.toStringTag]() { return 'DOMException'; }
};

global.AudioBuffer = class {
    constructor(options = {}) {
        const { length = 0, sampleRate = 44100 } = options;
        this.buffer = new Float32Array(length);
        this.duration = length / sampleRate;
    }
    getChannelData(channel) {
        expect(channel).to.equal(0, "AudioBuffer.getChannelData() stub only handles channel 0.");
        return this.buffer;
    }
};

global.ImageData = class {
    constructor(width, height) {
        this.data = {
            buffer: new ArrayBuffer(width * height)
        };
    }
};

global.requestAnimationFrame = (callback) => setTimeout(callback);
global.cancelAnimationFrame  = (handle) => clearTimeout(handle);
