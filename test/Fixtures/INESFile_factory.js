function str2array(str, limit) {
    return str.split("", limit).map(v => v.charCodeAt(0));
}

function setDataOrIndex(banksCount, bankSize, data) {
    return (new Array(banksCount)).fill(0).map((_, i) => (
        (new Array(bankSize)).fill(typeof data === 'number' ? data : i+1)
    )).flat();
}

export default (attrs = {}) => {
    let signature = attrs['signature'];
    if (typeof signature === 'undefined')
        signature = [0x4E,0x45,0x53,0x1A]; // NES[EOF]
    else if (typeof signature === 'string')
        signature = str2array(signature, 4);
    else if (Array.isArray(signature))
        signature = signature.slice(0, 4);
    else
        throw new Error("Invalid 'signature' attribute");
    
    const numPRG = attrs['numPRG'] || 0;
    const numCHR = attrs['numCHR'] || 0;
    
    const mapper = attrs['mapper'] || 0;
    const byte6 = attrs['byte6'] || (mapper & 0x0F) << 4;
    
    let header;
    if (attrs['archaic']) {
        header = signature.concat([numPRG,numCHR,byte6])
                          .concat(str2array("Diskdude!"));
    } else {
        const byte7 = attrs['byte7'] || (mapper & 0xF0);
        
        header = signature.concat([numPRG,numCHR,byte6,byte7])
                          .concat([0,0,0,0,0,0,0,0]);
    }
    
    const trainerSize = (attrs['trainer'] || byte6&0x4) ? 0x200 : 0;
    const trainerData = (attrs['data'] && attrs['data']['trainer']) || 0;
    const PRGROMData = (attrs['data'] && attrs['data']['PRGROM']);
    const CHRROMData = (attrs['data'] && attrs['data']['CHRROM']);
    
    const name = attrs['name'] ? str2array(attrs['name']) : [];
    
    return new Uint8Array(header
        .concat(new Array(trainerSize).fill(trainerData))
        .concat(setDataOrIndex(numPRG, 0x4000, PRGROMData))
        .concat(setDataOrIndex(numCHR*2, 0x1000, CHRROMData))
        .concat(name)).buffer;
};
