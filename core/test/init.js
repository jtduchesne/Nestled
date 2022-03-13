import { expect } from "chai";
global.expect = expect;

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
