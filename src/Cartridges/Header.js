export class Header {
    /**
     * @param {ArrayBuffer?} data
     */
    constructor(data = null) {
        this.loaded = false;
        
        this.format = "Unknown";
        this.valid = false;
        
        this.mapperNumber = -1;
        this.mapperName = "";
        this.supported = false;
        
        this.PRGROMByteLength = 0;
        this.CHRROMByteLength = 0;
        
        this.horiMirroring = false;
        this.vertMirroring = false;
        this.battery = false;
        this.trainer = false;
        
        this.consoleType = 0;
        
        this.PRGRAMByteLength = 0;
        this.CHRRAMByteLength = 0;
        this.PRGNVRAMByteLength = 0;
        this.CHRNVRAMByteLength = 0;
        
        if (data) this.parse(data);
    }
    
    /** @readonly */
    get byteLength() {
        return 0x00;
    }
    
    /**
     * @param {ArrayBuffer} data
     */
    parse(data) {
        return this.loaded = !!data.byteLength && (data.byteLength >= this.byteLength);
    }
}

export default Header;
