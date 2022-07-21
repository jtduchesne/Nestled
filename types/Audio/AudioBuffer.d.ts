export class AudioBuffer {
    constructor(output: AudioOutput);
    output: AudioOutput;
    context: AudioContext;
    sampleRate: number;
    bufferLength: number;
    createNewBuffer(): void;
    buffer: AudioBuffer;
    data: Float32Array;
    index: number;
    writeSample(value: number): void;
}
export default AudioBuffer;
import AudioOutput from "./AudioOutput.js";
//# sourceMappingURL=AudioBuffer.d.ts.map