export class NES {
    constructor() {
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
}
export default NES;
