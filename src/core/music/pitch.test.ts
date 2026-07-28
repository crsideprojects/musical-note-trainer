import { describe, expect, it } from "vitest";
import {
  enharmonicsOf,
  formatPitch,
  isEnharmonic,
  pitchClass,
  spellingsForMidi,
  toMidi,
  toVexKey,
} from "./pitch";

describe("toMidi", () => {
  it("computes middle C (C4) as MIDI 60", () => {
    expect(toMidi({ letter: "C", accidental: 0, octave: 4 })).toBe(60);
  });

  it("computes open cello strings correctly", () => {
    expect(toMidi({ letter: "C", accidental: 0, octave: 2 })).toBe(36);
    expect(toMidi({ letter: "G", accidental: 0, octave: 2 })).toBe(43);
    expect(toMidi({ letter: "D", accidental: 0, octave: 3 })).toBe(50);
    expect(toMidi({ letter: "A", accidental: 0, octave: 3 })).toBe(57);
  });
});

describe("toVexKey", () => {
  it("formats naturals, sharps, and flats", () => {
    expect(toVexKey({ letter: "C", accidental: 0, octave: 4 })).toBe("c/4");
    expect(toVexKey({ letter: "F", accidental: 1, octave: 3 })).toBe("f#/3");
    expect(toVexKey({ letter: "B", accidental: -1, octave: 5 })).toBe("bb/5");
  });
});

describe("enharmonic boundary cases", () => {
  it("treats B#3 as enharmonic to C4", () => {
    const bSharp3 = { letter: "B" as const, accidental: 1 as const, octave: 3 };
    const c4 = { letter: "C" as const, accidental: 0 as const, octave: 4 };
    expect(isEnharmonic(bSharp3, c4)).toBe(true);
    expect(enharmonicsOf(c4)).toContainEqual(bSharp3);
  });

  it("treats Cb4 as enharmonic to B3", () => {
    const cFlat4 = { letter: "C" as const, accidental: -1 as const, octave: 4 };
    const b3 = { letter: "B" as const, accidental: 0 as const, octave: 3 };
    expect(isEnharmonic(cFlat4, b3)).toBe(true);
  });

  it("treats E#4 as enharmonic to F4, and Fb4 as enharmonic to E4", () => {
    expect(
      isEnharmonic(
        { letter: "E", accidental: 1, octave: 4 },
        { letter: "F", accidental: 0, octave: 4 },
      ),
    ).toBe(true);
    expect(
      isEnharmonic(
        { letter: "F", accidental: -1, octave: 4 },
        { letter: "E", accidental: 0, octave: 4 },
      ),
    ).toBe(true);
  });

  it("classic A-flat / G-sharp equivalence", () => {
    expect(
      isEnharmonic(
        { letter: "A", accidental: -1, octave: 4 },
        { letter: "G", accidental: 1, octave: 4 },
      ),
    ).toBe(true);
  });
});

describe("spellingsForMidi", () => {
  it("gives exactly one single-accidental spelling for D, G, and A naturals", () => {
    // D4, G4, A4 have no valid single-sharp/flat enharmonic under this model
    // (the alternatives would require double accidentals, which are out of v1 scope).
    expect(spellingsForMidi(toMidi({ letter: "D", accidental: 0, octave: 4 }))).toHaveLength(1);
    expect(spellingsForMidi(toMidi({ letter: "G", accidental: 0, octave: 4 }))).toHaveLength(1);
    expect(spellingsForMidi(toMidi({ letter: "A", accidental: 0, octave: 4 }))).toHaveLength(1);
  });

  it("gives exactly two spellings for black-key pitch classes", () => {
    expect(spellingsForMidi(toMidi({ letter: "C", accidental: 1, octave: 4 }))).toHaveLength(2);
  });

  it("every returned spelling actually maps back to the same pitch class", () => {
    for (let midi = 36; midi <= 96; midi++) {
      for (const spelling of spellingsForMidi(midi)) {
        expect(toMidi(spelling)).toBe(midi);
      }
    }
  });
});

describe("formatPitch", () => {
  it("renders accidentals with symbols", () => {
    expect(formatPitch({ letter: "F", accidental: 1, octave: 3 })).toBe("F♯3");
    expect(formatPitch({ letter: "B", accidental: -1, octave: 2 })).toBe("B♭2");
    expect(formatPitch({ letter: "C", accidental: 0, octave: 4 })).toBe("C4");
  });
});

describe("pitchClass", () => {
  it("wraps correctly for negative-looking mod cases", () => {
    expect(pitchClass({ letter: "C", accidental: -1, octave: 4 })).toBe(11);
  });
});
