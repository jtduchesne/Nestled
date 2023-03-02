import Header from '../Header.js';

const LENGTH = 0x20;

export class UNIFHeader extends Header {
    get byteLength() {
        return LENGTH;
    }
    
    parse(data) {
        if (super.parse(data)) {
            const header = new DataView(data, 0, LENGTH);
            if (header.getUint32(0) === 0x554E4946) {
                this.format = "UNIF v" + header.getUint32(4, true);
            }
        }
        return this.loaded;
    }
}

export default UNIFHeader;
