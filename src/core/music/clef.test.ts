import { describe, expect, it } from "vitest";
import { ALL_CLEFS, CLEFS, randomPitchInClef } from "./clef";
import { toMidi } from "./pitch";

describe("randomPitchInClef", () => {
  it("always generates a pitch within the clef's declared range", () => {
    for (const clefId of ALL_CLEFS) {
      const { min, max } = CLEFS[clefId].range;
      for (let i = 0; i < 200; i++) {
        const pitch = randomPitchInClef(clefId);
        const midi = toMidi(pitch);
        expect(midi).toBeGreaterThanOrEqual(toMidi(min));
        expect(midi).toBeLessThanOrEqual(toMidi(max));
      }
    }
  });

  it("can generate accidentals when accidentalChance is 1", () => {
    const pitches = Array.from({ length: 50 }, () => randomPitchInClef("treble", 1));
    expect(pitches.some((p) => p.accidental !== 0)).toBe(true);
  });

  it("never generates accidentals when accidentalChance is 0", () => {
    const pitches = Array.from({ length: 50 }, () => randomPitchInClef("treble", 0));
    expect(pitches.every((p) => p.accidental === 0)).toBe(true);
  });
});
