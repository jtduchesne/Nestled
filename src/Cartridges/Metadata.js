const CONSOLE_TYPE = [
    "NES/Famicom",
    "Nintendo Vs. System",
    "Nintendo Playchoice 10",
    "Extended Console Type",
];
const TV_SYSTEM = {
    NTSC: "NTSC",
    PAL: "PAL",
    SECAM: "SECAM",
};

export class Metadata {
    constructor() {
        this.name = "No Cartridge";
        this.format = "";
        
        this.consoleType = CONSOLE_TYPE[0];
        this.tvSystem = TV_SYSTEM.NTSC;
        
        this.mapper = "";
        this.PRGROM = "";
        this.CHRROM = "";
        this.scrolling = "";
        this.SRAM = "";
        this.PRGRAM = "";
        this.CHRRAM = "";
        this.misc = "";
        
        this.warnings = [];
        this.errors = [];
    }
    
    //=======================================================================================//
    
    get supported() {
        return this.warnings.length === 0;
    }
    get valid() {
        return this.errors.length === 0;
    }
    
    warn(message) {
        this.warnings.push(message);
    }
    error(message) {
        this.errors.push(message);
    }
    
    //=======================================================================================//
    
    parseFilename(filename) {
        const countryCodes = /\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/.exec(filename);
        if (countryCodes) {
            if (countryCodes[0].search(/U[^Kn]|1|4|J|[^U]K|PD|FC|HK/) > 0)
                this.tvSystem = TV_SYSTEM.NTSC;
            else if (countryCodes[0].search(/E|A|B|[^F]C|NL|S|SW|FN|G|UK|GR|I|H/) > 0)
                this.tvSystem = TV_SYSTEM.PAL;
            else if (countryCodes[0].search(/F[^C]/) > 0)
                this.tvSystem = TV_SYSTEM.SECAM; //wtf la France ?
            
            if (this.tvSystem !== TV_SYSTEM.NTSC)
                this.warn(`Unsupported TV system (${this.tvSystem})`);
        }
        
        this.name = filename.replace(
            /\.[A-Za-z0-9_]+$/, ""
        ).replace(
            /\s?\((U|E|Unk|Unl|1|4|A|J|B|K|C|NL|PD|F|S|FC|SW|FN|G|UK|GR|HK|I|H)+\)/g, ""
        ).replace(
            /\s?\[(!|a|p|b|t|f|T[+-]|h|o)+\]/g, ""
        ).replace(
            /_+/g, " "
        ).trim();
        
        if (this.name)
            this.name = this.name[0].toUpperCase() + this.name.slice(1);
    }
    
    load(header) {
        this.format = header.format;
        
        this.mapper = `Mapper #${header.mapperNumber}: ${header.mapperName}`;
        if (!header.supported)
            this.warn(`Unsupported mapper (#${header.mapperNumber}:${header.mapperName})`);
        
        this.PRGROM = `${header.PRGROMByteLength / 1024}kb of PRG-ROM`;
        this.CHRROM = `${header.CHRROMByteLength / 1024}kb of CHR-ROM`;
        
        if (header.horiMirroring && header.vertMirroring) {
            this.scrolling = "Scrolling disabled (or Mapper controlled)";
        } else if (header.vertMirroring) {
            this.scrolling = "Horizontal scrolling";
        } else if (header.horiMirroring) {
            this.scrolling = "Vertical scrolling (or Mapper controlled)";
        } else {
            this.scrolling = "4-screens scrolling";
        }
        
        if (header.battery) this.SRAM = "Battery-backed SRAM";
        if (header.trainer) this.misc = "512b trainer data present";
        
        if (header.PRGRAMByteLength && header.PRGNVRAMByteLength)
            this.PRGRAM = `${(header.PRGRAMByteLength+header.PRGNVRAMByteLength) / 1024}kb of combined PRG-RAM/NVRAM`;
        else if (header.PRGNVRAMByteLength)
            this.PRGRAM = `${header.PRGNVRAMByteLength / 1024}kb of PRG-NVRAM`;
        else if (header.PRGRAMByteLength)
            this.PRGRAM = `${header.PRGRAMByteLength / 1024}kb of PRG-RAM`;
        
        if (header.CHRRAMByteLength && header.CHRNVRAMByteLength)
            this.CHRRAM = `${(header.CHRRAMByteLength+header.CHRNVRAMByteLength) / 1024}kb of combined CHR-RAM/NVRAM`;
        else if (header.CHRNVRAMByteLength)
            this.CHRRAM = `${header.CHRNVRAMByteLength / 1024}kb of CHR-NVRAM`;
        else if (header.CHRRAMByteLength)
            this.CHRRAM = `${header.CHRRAMByteLength / 1024}kb of CHR-RAM`;
        
        this.consoleType = CONSOLE_TYPE[header.consoleType];
        if (header.consoleType > 0)
            this.warn(`Unsupported console type (${this.consoleType})`);
    }
}

export default Metadata;
