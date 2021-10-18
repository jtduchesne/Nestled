global.expect = require('chai').expect;
global.Nestled = require('../../public/javascripts/nestled.cjs.js');

global.window = undefined;
global.document = {
    createElement: (name) => {
        if (name === 'canvas') return require('canvas').createCanvas();
    }
};

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

global.AudioContext = class {
    createBuffer(channels, bufferLength, sampleRate) {
        return new Float32Array(channels * bufferLength);
    }
};
