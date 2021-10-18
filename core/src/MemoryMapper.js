import NROM from './Mappers/NROM.js';
import MMC1 from './Mappers/MMC1.js';

const supportedNumbers = [0,1];

export class MemoryMapper {
    constructor(number, cartridge) {
        switch (number) {
        case 0:  return new NROM(number, cartridge);
        case 1:  return new MMC1(number, cartridge);
        default: return new NROM(number, cartridge);
        }
    }
    
    static isSupported(number) {
        return supportedNumbers.includes(number);
    }
    static getName(number) {
        return names[number] || "Unknown";
    }
}
export default MemoryMapper;

const names = [
    //0x00
    "NROM","Nintendo MMC1","UNROM","CNROM","Nintendo MMC3","Nintendo MMC5","FFE Rev. A","ANROM",
    "","Nintendo MMC2","Nintendo MMC4","Color Dreams","REX DBZ 5","CPROM","REX SL-1632","100-in-1",
    //0x10
    "BANDAI 24C02","FFE Rev. B","JALECO SS880006","Namcot 163","","Konami VRC4a/VRC4c","Konami VRC2a","Konami VRC2b/VRC4e",
    "Konami VRC6a","Konami VRC4b/VRC4d","Konami VRC6b","CC-21 MI HUN CHE","","","","",
    //0x20
    "IREM G-101","TC0190FMC/TC0350FMR","IREM I-IM/BNROM","Wario Land 2","TXC Policeman","PAL-ZZ SMB/TETRIS/NWC","Bit Corp.","",
    "SMB2j FDS","CALTRON 6-in-1","BIO MIRACLE FDS","FDS SMB2j LF36","MMC3 BMC PIRATE A","MMC3 BMC PIRATE B","RUMBLESTATION 15-in-1","NES-QJ SSVB/NWC",
    //0x30
    "TAITO TCxxx","MMC3 BMC PIRATE C","SMB2j FDS Rev. A","11-in-1 BALL SERIES","MMC3 BMC PIRATE D","SUPERVISION 16-in-1","","",
    "","SIMBPLE BMC PIRATE A","SIMBPLE BMC PIRATE B","","SIMBPLE BMC PIRATE C","20-in-1 KAISER Rev. A","700-in-1","",
    //0x40
    "TENGEN RAMBO1","IREM-H3001","MHROM","SUNSOFT-FZII","Sunsoft Mapper #4","SUNSOFT-5/FME-7","BA KAMEN DISCRETE","CAMERICA BF9093",
    "JALECO JF-17","KONAMI VRC3","TW MMC3+VRAM Rev. A","KONAMI VRC1","NAMCOT 108 Rev. A","IREM LROG017","Irem 74HC161/32","AVE/C&E/TXC BOARD",
    //0x50
    "TAITO X1-005 Rev. A","","TAITO X1-017","YOKO VRC Rev. B","","KONAMI VRC7","JALECO JF-13","74*139/74 DISCRETE",
    "NAMCO 3433","SUNSOFT-3","HUMMER/JY BOARD","EARLY HUMMER/JY BOARD","JALECO JF-19","SUNSOFT-3R","HVC-UN1ROM","NAMCOT 108 Rev. B",
    //0x60
    "BANDAI OEKAKIDS","IREM TAM-S1","","VS Uni/Dual- system","","","","FDS DOKIDOKI FULL",
    "","NES-EVENT NWC1990","SMB3 PIRATE A","MAGIC CORP A","FDS UNROM BOARD","","","",
    //0x70
    "ASDER/NTDEC BOARD","HACKER/SACHEN BOARD","MMC3 SG PROT. A","MMC3 PIRATE A","MMC1/MMC3/VRC PIRATE","FUTURE MEDIA BOARD","TSKROM","NES-TQROM",
    "FDS TOBIDASE","MMC3 PIRATE PROT. A","","MMC3 PIRATE H2288","","FDS LH32","","",
    //0x80
    "","","","","TXC/MGENIUS 22111","SA72008","MMC3 BMC PIRATE","",
    "TCU02","S8259D","S8259B","S8259C","JALECO JF-11/14","S8259A","UNLKS7032","TCA01",
    //0x90
    "AGCI 50282","SA72007","SA0161M","TCU01","SA0037","SA0036","S74LS374N","",
    "","BANDAI SRAM","","","","BANDAI BARCODE","","BANDAI 24C01",
    //0xA0
    "SA009","","","","","","SUBOR Rev. A","SUBOR Rev. B","","","","","","","","",
    //0xB0
    "BMCFK23C","","","","","","","","","","","","","","","",
    //0xC0
    "TW MMC3+VRAM Rev. B","NTDEC TC-112","TW MMC3+VRAM Rev. C","TW MMC3+VRAM Rev. D","","","TW MMC3+VRAM Rev. E","",
    "","","","","","","NAMCOT 108 Rev. C","TAITO X1-005 Rev. B",
    //0xD0
    "","","","","","","","","","","","UNLA9746","Debug Mapper","UNLN625092","","",
    //0xE0
    "","","BMC 22+20-in-1","","","","BMC Contra+22-in-1","",
    "BMC QUATTRO","BMC 22+20-in-1 RST","BMC MAXI","","","","UNL6035052","",
    //0xF0
    "","","","S74LS374NA","DECATHLON","","FONG SHEN BANG","","","","","","SAN GUO ZHI PIRATE","DRAGON BALL PIRATE","","",
];
