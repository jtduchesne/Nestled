export class CPU {
    /**
     * @param {NES} bus
     */
    constructor(bus: NES);
    /** @private */
    private bus;
    cycle: number;
    /** Internal 2kb of RAM, located at `[0x0000-0x07FF]`. */
    ram: Uint8Array;
    /** Predefined memory page used for the Stack, located at `[0x0100-0x01FF]`. */
    stack: Uint8Array;
    /**
     * Optimized accessor for the NMI vector `[0xFFFA]`.
     * @private
     */
    private nmiVector;
    /**
     * Optimized accessor for the RESET vector `[0xFFFC]`.
     * @private
     */
    private resetVector;
    /**
     * Optimized accessor for the IRQ vector `[0xFFFE]`.
     * @private
     */
    private irqVector;
    /**
     * **Accumulator**
     *
     * **A** is byte-wide and along with the *Arithmetic Logic Unit* (**ALU**),
     * supports using the *Status register* for carrying, overflow detection,
     * and so on.
     */
    A: number;
    /**
     * **X index**
     *
     * **X** is byte-wide and used for several addressing modes. It can be used as
     * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
     * the accumulator, it has limited addressing modes when loading and saving.
     */
    X: number;
    /**
     * **Y index**
     *
     * **Y** is byte-wide and used for several addressing modes. It can be used as
     * loop counter easily, using `INC`/`DEC` and *Branch* instructions. Not being
     * the accumulator, it has limited addressing modes when loading and saving.
     */
    Y: number;
    /**
     * **Status Register**
     *
     * `|---7----|---6----|--5--|---4---|---3---|----2----|--1---|---0---|`
     * `|Negative|oVerflow| - - | *BRK* |Decimal|Interrupt| Zero | Carry |`
     *
     * **P** has 6 bits used by the **ALU** but is byte-wide. `PHP`, `PLP`,
     * *Arithmetic*, *Testing*, and *Branch* instructions can access this register.
     */
    P: number;
    /**
     * **Stack Pointer**
     *
     * **S** is byte-wide and can be accessed using *Interrupts*, *Pulls*, *Pushes*,
     * and *Transfers*. It indexes into a 256 bytes stack at `[0x0100-0x01FF]`.
     */
    SP: number;
    /**
     * **Program Counter**
     *
     * **PC** is 2-byte-wide and can be accessed either by CPU's internal fetch logic
     * increment, by an interrupt (*NMI*, *Reset*, *IRQ/BRQ*), or by using the
     * `RTS`/`JMP`/`JSR`/ *Branch* instructions.
     */
    PC: number;
    /**
     * Addressing modes by opcode lookup table.
     * @type {AddressingModeFunc[]}
     * @private
     */
    private addressLookup;
    /**
     * Instructions by opcode lookup table.
     * @type {InstructionFunc[]}
     * @private
     */
    private instructionLookup;
    /** @private */
    private opcode;
    /** @private */
    private operand;
    isPowered: boolean;
    powerOn(): void;
    powerOff(): void;
    reset(): void;
    /**
     * Execute instructions up to a given limit of CPU cycles, the limit being based on
     * the number of cycle since the beginning of the current frame.
     * @param {number} limit
     */
    doInstructions(limit: number): void;
    /**
     * Execute a single instruction.
     */
    doInstruction(): void;
    doNMI(): void;
    doReset(): void;
    doIRQ(): void;
    /**
     * @param {number} address 16-bit address
     * @returns {number} 8-bit data
     */
    read(address: number): number;
    /**
     * @param {number} address 16-bit address
     * @param {number} data 8-bit data
     */
    write(address: number, data: number): void;
    /** @param {number} value 8-bit value @private */
    private pushByte;
    /** @param {number} value 16-bit value @private */
    private pushWord;
    /** @returns {number} 8-bit value @private */
    private pullByte;
    /** @returns {number} 16-bit value @private */
    private pullWord;
    set Carry(arg: boolean);
    get Carry(): boolean;
    set Zero(arg: boolean);
    get Zero(): boolean;
    set Interrupt(arg: boolean);
    get Interrupt(): boolean;
    set Decimal(arg: boolean);
    get Decimal(): boolean;
    set Overflow(arg: boolean);
    get Overflow(): boolean;
    set Negative(arg: boolean);
    get Negative(): boolean;
    /** @private @param {number} value */
    private ALU;
    /** Implied
     * @template {number|boolean} T
     * @param {T} implied
     * @private */
    private imp;
    /** Immediate - `#00`
     * @private */
    private imm;
    /** Relative - `±#00`
     * @private */
    private rel;
    /** Zero Page - `$00`
     * @private */
    private zero;
    /** Zero Page indexed X - `$00+X`
     * @private */
    private zeroX;
    /** Zero Page indexed Y - `$00+Y`
     * @private */
    private zeroY;
    /** @private */
    private readWord;
    /** Absolute - `$0000`
     * @private */
    private abs;
    /** Absolute indexed X - `$0000+X`
     * @private */
    private absX;
    /** Absolute indexed Y - `$0000+Y`
     * @private */
    private absY;
    /** Indirect - `($0000)`
     * @private */
    private ind;
    /** Indirect indexed X - `($00+X)`
     * @private */
    private indX;
    /** Indirect indexed Y - `($00)+Y`
     * @private */
    private indY;
    /** Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BRK;
    /** Return from Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private RTI;
    /** Jump to Subroutine
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private JSR;
    /** Return from Subroutine
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private RTS;
    /** Jump to
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private JMP;
    /** Branch if Positive
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BPL;
    /** Branch if Negative
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BMI;
    /** Branch if oVerflow Clear
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BVC;
    /** Branch if oVerflow Set
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BVS;
    /** Branch if Carry Clear
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BCC;
    /** Branch if Carry Set
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BCS;
    /** Branch if Not Equal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BNE;
    /** Branch if Equal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BEQ;
    /** Push Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private PHA;
    /** Push Processor Status
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private PHP;
    /** Pull Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private PLA;
    /** Pull Processor Status
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private PLP;
    /** Clear Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CLC;
    /** Clear Decimal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CLD;
    /** Clear Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CLI;
    /** Clear Overflow
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CLV;
    /** Set Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private SEC;
    /** Set Decimal
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private SED;
    /** Set Interrupt
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private SEI;
    /** Transfert A to X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TAX;
    /** Transfert X to A
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TXA;
    /** Transfert A to Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TAY;
    /** Transfert Y to A
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TYA;
    /** Transfert SP to X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TSX;
    /** Transfert X to SP
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private TXS;
    /** Load Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private LDA;
    /** Load X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private LDX;
    /** Load Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private LDY;
    /** Store Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private STA;
    /** Store X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private STX;
    /** Store Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private STY;
    /** Add with Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private ADC;
    /** Subtract with Carry
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private SBC;
    /**
     * @param {number} reg
     * @param {number} operand
     * @private
     */
    private add;
    /** Arithmetic Shift Left
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private ASL;
    /** Arithmetic Shift Left (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private AXL;
    /** Logical Shift Right
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private LSR;
    /** Logical Shift Right (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private LXR;
    /** Rotate Left
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private ROL;
    /** Rotate Left (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private RXL;
    /** Rotate Right
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private ROR;
    /** Rotate Right (implied)
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private RXR;
    /** Increment memory
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private INC;
    /** Decrement memory
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private DEC;
    /** Increment X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private INX;
    /** Decrement X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private DEX;
    /** Increment Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private INY;
    /** Decrement Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private DEY;
    /** Bit test
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private BIT;
    /** Compare with Accumulator
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CMP;
    /** Compare with X
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CPX;
    /** Compare with Y
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private CPY;
    /**
     * @param {number} reg
     * @param {number} operand
     * @private */
    private compare;
    /** Logical OR
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private ORA;
    /** Logical AND
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private AND;
    /** Exclusive OR
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private EOR;
    /** No-Op
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private NOP;
    /** Fault
     * @param {FetchOperandFunc} fnFetchOperand
     * @private */
    private KIL;
}
export default CPU;
export type NES = import('./NES.js').NES;
export type FetchOperandFunc = (implied?: any) => any;
export type AddressingModeFunc = FetchOperandFunc;
export type InstructionFunc = (fnFetchOperand: FetchOperandFunc) => void;
//# sourceMappingURL=CPU.d.ts.map