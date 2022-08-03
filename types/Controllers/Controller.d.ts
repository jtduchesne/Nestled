export class Controller {
    constructor(type: string);
    type: string;
    strobing: boolean;
    states: number[];
    get empty(): boolean;
    get present(): boolean;
    strobe(): void;
    data: number[];
    read(): number;
    write(data: number): void;
}
export default Controller;
//# sourceMappingURL=Controller.d.ts.map