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
    constructor(name, content) {
        this.name = name;
        this.size = content.length;
        this.type = "application/octet-stream";
        this.arrayBuffer = Uint8Array.from(content);
    }
};
global.FileReader = class {
    readAsArrayBuffer(file) {
        this.result = file.arrayBuffer;
        this.onload();
    }
};

global.DOMException = class DOMException extends Error {
    get [Symbol.toStringTag]() { return 'DOMException'; }
};
