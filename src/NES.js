import { Cartridge, NoCartridge } from './Cartridge.js';
import NESFile from './NESFile.js';

export class NES {
    constructor(opts) {
        if (opts) {
            if (opts['oninsertcartridge']) this.oninsertcartridge = opts['oninsertcartridge'];
            if (opts['onremovecartridge']) this.onremovecartridge = opts['onremovecartridge'];
        }
        
        this.cpu = new CPU(this);
        
        if (opts && opts['cartridge'] || opts instanceof Cartridge)
            this.insertCartridge(opts['cartridge'] || opts);
        else if (opts && opts['file'] || opts instanceof NESFile)
            this.insertCartridge(opts['file'] || opts);
        else
            this.removeCartridge();
        
        this.isPowered = false;
    }
     
    powerOn()  { this.isPowered = true; }
    powerOff() { this.isPowered = false; }
     
    //== Buttons =====================================//
    pressPower() {
        if (this.isPowered)
            this.powerOff();
        else
            this.powerOn();
        
        return this.isPowered;
    }
    pressReset()  {
    }
     
    //== Front red LED ===============================//
    // (Yes, it is a fully-fledged part of the NES !)
    get frontLEDState() { return this.isPowered ? "on" : "off"; }
    
    //== Cartridge ==========================================================================//
    insertCartridge(inserted) {
        if (!(this.cartridge instanceof NoCartridge)) this.removeCartridge();
        
        if (inserted instanceof NESFile)
            this.cartridge = new Cartridge({file: inserted});
        else
            this.cartridge = inserted;
        
        if (!(this.cartridge instanceof NoCartridge)) {
            if (this.oninsertcartridge) this.oninsertcartridge({target: this});
        }
        
        return this.cartridge;
    }
    removeCartridge() {
        const removed = this.cartridge;
        if (removed && !(removed instanceof NoCartridge)) {
            if (this.onremovecartridge) this.onremovecartridge({target: this});
        }
        this.cartridge = new NoCartridge;
        
        return removed;
    }
    blowIntoCartridge() { //Indeed
        const cart = this.removeCartridge();
        if (cart && (typeof cart.blowInto === 'function'))
            cart.blowInto(Math.floor(Math.random() * 3) + 1);
        return this.insertCartridge(cart);
    }
}
export default NES;
