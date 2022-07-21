export class AudioOutput {
    context: AudioContext;
    gainNode: GainNode;
    get connected(): boolean;
    get disconnected(): boolean;
    connect(element: any): any;
    element: any;
    value: any;
    max: number;
    handleVolumeChange: (e: any) => void;
    disconnect(): any;
    start(): void;
    next: number;
    stop(): void;
    schedule(buffer: any): void;
}
export default AudioOutput;
//# sourceMappingURL=AudioOutput.d.ts.map