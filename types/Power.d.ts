export class Powered {
    isPowered: boolean;
    powerOn(): boolean;
    powerOff(): boolean;
    reset(): void;
}
export class Power extends Powered {
    /** The 2 buttons, *Power* and *Reset*, on the front. */
    buttons: Buttons;
    /** @type {Powered[]?} @private */
    private subDevices;
    /**
     * @returns {Powered[]}
     * @private
     */
    private getSubDevices;
}
export default Power;
declare class Buttons {
    /** @param {Powered} device */
    constructor(device: Powered);
    /** Press the *Power* button, which toggles the device *On* or *Off*. */
    pressPower: () => boolean;
    /** Press the *Reset* button, which resets the device to its initial state. */
    pressReset: () => void;
}
//# sourceMappingURL=Power.d.ts.map