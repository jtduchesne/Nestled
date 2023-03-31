export class NES extends Power {
    game: CartConnector;
    controllers: CtrlConnector;
    video: VideoOutput;
    audio: AudioOutput;
    cpu: CPU;
    apu: APU;
    ppu: PPU;
    engine: Engine;
    /**
     * The state of the front red LED.
     * @readonly
     */
    readonly get frontLED(): "paused" | "on" | "off";
}
export default NES;
import Power from "./Power.js";
import CartConnector from "./CartConnector.js";
import CtrlConnector from "./CtrlConnector.js";
import VideoOutput from "./VideoOutput.js";
import AudioOutput from "./AudioOutput.js";
import CPU from "./CPU.js";
import APU from "./APU.js";
import PPU from "./PPU.js";
import Engine from "./Engine.js";
//# sourceMappingURL=NES.d.ts.map