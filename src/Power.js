export class Powered {
    constructor() {
        this.isPowered = false;
    }
    
    //== Power ==============================================================================//
    powerOn()  { return this.isPowered = true; }
    powerOff() { return this.isPowered = false; }
    
    reset() { return; }
}

export class Power extends Powered {
    constructor() {
        super();
        
        /** The 2 buttons, *Power* and *Reset*, on the front. */
        this.buttons = new Buttons(this);
        
        /** @type {Powered[]?} @private */
        this.subDevices = null;
    }
    
    //== Power ==============================================================================//
    powerOn() {
        this.isPowered = true;
        this.getSubDevices().forEach((device) => {
            if (!device.isPowered) device.powerOn();
        });
        return this.isPowered;
    }
    powerOff() {
        this.isPowered = false;
        this.getSubDevices().forEach((device) => {
            if (device.isPowered) device.powerOff();
        });
        return this.isPowered;
    }
    
    reset() {
        this.getSubDevices().forEach((device) => {
            device.reset();
        });
    }
    
    //=======================================================================================//
    /**
     * @returns {Powered[]}
     * @private
     */
    getSubDevices() {
        if (!this.subDevices) {
            /** @type {(keyof this)[]} */ // @ts-ignore
            const propertyNames = Object.getOwnPropertyNames(this);
            this.subDevices = propertyNames.filter(
                (name) => (
                    name !== 'bus' &&
                    typeof this[name] === 'object' &&
                    this[name] instanceof Powered
                )
            ).map(
                /** @returns {Powered} */ // @ts-ignore
                (name) => this[name]
            );
        }
        return this.subDevices;
    }
}

class Buttons {
    /** @param {Powered} device */
    constructor(device) {
        /** Press the *Power* button, which toggles the device *On* or *Off*. */
        this.pressPower = () => {
            if (!device.isPowered)
                return device.powerOn();
            else
                return device.powerOff();
        };
        /** Press the *Reset* button, which resets the device to its initial state. */
        this.pressReset = () => {
            device.reset();
        };
    }
}

export default Power;
