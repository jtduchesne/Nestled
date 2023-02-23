/**
 * With the least significant bit set, the remaining bits select a linear length
 * (with the exception of the 0 entry).
 * Otherwise, we get note lengths based on a base length of 12 (MSB set) or 10 (MSB clear).
 */
const lengths = [
    10, 254, 20,  2, 40,  4, 80,  6, 160,  8, 60, 10, 14, 12, 26, 14,
    12,  16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30,
];

/**
 * The length counter provides automatic duration control for the waveform channels.
 * 
 * Once loaded with a value, it can optionally count down (when the halt flag is clear)
 * and once it reaches zero, the corresponding channel is silenced.
 */
export class LengthCounter {
    constructor() {
        /** @private */
        this.disabled = true;
        /** @private */
        this.lengthCounter = 0;
        /** @protected */
        this.lengthCounterHalt = false;
    }
    
    reset() {
        this.enabled = false;
        this.length = 0;
    }
    
    //===================================================================================//
    /** @type {boolean} */
    get enabled() {
        return this.lengthCounter > 0;
    }
    set enabled(value) {
        if ((this.disabled = !value))
            this.lengthCounter = 0;
    }
    
    //== Registers ======================================================================//
    /** @type {number} */
    get length() {
        return this.lengthCounter;
    }
    set length(value) {
        if (!this.disabled)
            this.lengthCounter = lengths[(value & 0xF8) >>> 3];
    }
    
    //== Execution ======================================================================//
    doHalf() {
        if (this.lengthCounter > 0 && !this.lengthCounterHalt)
            this.lengthCounter--;
    }
}

export default LengthCounter;

/*
Linear length values:
1 1111 (1F) => 30
1 1101 (1D) => 28
1 1011 (1B) => 26
1 1001 (19) => 24
1 0111 (17) => 22
1 0101 (15) => 20
1 0011 (13) => 18
1 0001 (11) => 16
0 1111 (0F) => 14
0 1101 (0D) => 12
0 1011 (0B) => 10
0 1001 (09) => 8
0 0111 (07) => 6
0 0101 (05) => 4
0 0011 (03) => 2
0 0001 (01) => 254

Notes with base length 12 (4/4 at 75 bpm):
1 1110 (1E) => 32  (96 times 1/3, quarter note triplet)
1 1100 (1C) => 16  (48 times 1/3, eighth note triplet)
1 1010 (1A) => 72  (48 times 1 1/2, dotted quarter)
1 1000 (18) => 192 (Whole note)
1 0110 (16) => 96  (Half note)
1 0100 (14) => 48  (Quarter note)
1 0010 (12) => 24  (Eighth note)
1 0000 (10) => 12  (Sixteenth)

Notes with base length 10 (4/4 at 90 bpm, with relative durations being the same as above):
0 1110 (0E) => 26  (Approx. 80 times 1/3, quarter note triplet)
0 1100 (0C) => 14  (Approx. 40 times 1/3, eighth note triplet)
0 1010 (0A) => 60  (40 times 1 1/2, dotted quarter)
0 1000 (08) => 160 (Whole note)
0 0110 (06) => 80  (Half note)
0 0100 (04) => 40  (Quarter note)
0 0010 (02) => 20  (Eighth note)
0 0000 (00) => 10  (Sixteenth)
*/
