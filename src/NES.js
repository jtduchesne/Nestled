import Power from './Power.js';

import CartConnector from './CartConnector.js';
import CtrlConnector from './CtrlConnector.js';
import VideoOutput from './VideoOutput.js';
import AudioOutput from './AudioOutput.js';
import CPU from './CPU.js';
import APU from './APU.js';
import PPU from './PPU.js';
import Engine from './Engine.js';

export class NES extends Power {
    constructor() {
        super();
        
        this.game        = new CartConnector;
        this.controllers = new CtrlConnector;
        this.video       = new VideoOutput;
        this.audio       = new AudioOutput;
        
        this.cpu = new CPU(this);
        this.apu = new APU(this);
        this.ppu = new PPU(this);
        this.engine = new Engine(this);
    }
    
    /**
     * The state of the front red LED.
     * @readonly
     */
    get frontLED() {
        return this.isPowered ? this.engine.isPaused ? "paused" : "on" : "off";
    }
}

export default NES;
