export class NES {
    cpu: CPU;
    apu: APU;
    ppu: PPU;
    engine: Engine;
    cartConnector: CartConnector;
    ctrlConnector: CtrlConnector;
    videoOutput: VideoOutput;
    audioOutput: AudioOutput;
    isPowered: boolean;
    pressPower(): boolean;
    pressReset(): void;
    pause(): boolean;
    get frontLEDState(): "paused" | "on" | "off";
    insertCartridge(file: any): Promise<CartConnector>;
    removeCartridge(): Promise<CartConnector>;
    insertController(controller: any): any;
    removeController(controller: any): any;
    connectVideo(output: any): any;
    disconnectVideo(): any;
    connectAudio(output: any): any;
    disconnectAudio(): any;
}
export default NES;
import CPU from "./CPU.js";
import APU from "./APU.js";
import PPU from "./PPU.js";
import Engine from "./Engine.js";
import CartConnector from "./Cartridges.js";
import CtrlConnector from "./Controllers.js";
import VideoOutput from "./Video.js";
import AudioOutput from "./Audio.js";
//# sourceMappingURL=NES.d.ts.map