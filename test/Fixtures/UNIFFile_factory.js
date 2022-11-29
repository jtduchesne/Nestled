export default (attrs = {}) => {
    let signature = attrs['signature'];
    if (typeof signature === 'undefined')
        signature = [0x55,0x4E,0x49,0x46]; // UNIF
    else if (typeof signature === 'string')
        signature = signature.split("", 4).map(v => v.charCodeAt(0));
    else if (Array.isArray(signature))
        signature = signature.slice(0, 4);
    else
        throw new Error("Invalid 'signature' attribute");
    
    const version = attrs['version'] || 1;
    
    const header = new Uint8Array(0x20);
    header.set(signature);
    (new DataView(header.buffer)).setUint32(4, version, true);
    
    return header.buffer;
};
