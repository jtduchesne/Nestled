export class AudioOutput {
    context: AudioContext;
    gainNode: GainNode;
    get connected(): boolean;
    get disconnected(): boolean;
    connect(element: HTMLInputElement): HTMLInputElement | null;
    element: HTMLInputElement | null;
    value: number;
    max: number;
    handleVolumeChange: (e: InputEvent) => void;
    disconnect(): null;
    start(): void;
    next: number;
    stop(): void;
    schedule(buffer: AudioBuffer): void;
}
export default AudioOutput;
//# sourceMappingURL=AudioOutput.d.ts.map