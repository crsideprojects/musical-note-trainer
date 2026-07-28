import { describe, expect, it } from "vitest";
import { formatPitch, toMidi } from "../../core/music/pitch";
import { fingeringsForPitch, pitchForFingering } from "./technique";

describe("open strings", () => {
  it("C string open is C2, G string open is G2, D string open is D3, A string open is A3", () => {
    expect(formatPitch(pitchForFingering({ string: "C", position: "I", finger: 0 }))).toBe("C2");
    expect(formatPitch(pitchForFingering({ string: "G", position: "I", finger: 0 }))).toBe("G2");
    expect(formatPitch(pitchForFingering({ string: "D", position: "I", finger: 0 }))).toBe("D3");
    expect(formatPitch(pitchForFingering({ string: "A", position: "I", finger: 0 }))).toBe("A3");
  });
});

describe("1st position on the D string", () => {
  it("finger 1 is E3, a whole step above the open D", () => {
    const pitch = pitchForFingering({ string: "D", position: "I", finger: 1 });
    expect(formatPitch(pitch)).toBe("E3");
  });

  it("finger 4 is A3 (an octave-adjacent unison with the open A string)", () => {
    const pitch = pitchForFingering({ string: "D", position: "I", finger: 4 });
    expect(toMidi(pitch)).toBe(toMidi({ letter: "A", accidental: 0, octave: 3 }));
  });
});

describe("same note on different strings", () => {
  it("A3 is reachable both as the open A string and as finger 4 in 1st position on the D string", () => {
    const options = fingeringsForPitch({ letter: "A", accidental: 0, octave: 3 });
    expect(options).toContainEqual({ string: "A", position: "I", finger: 0 });
    expect(options).toContainEqual({ string: "D", position: "I", finger: 4 });
    expect(options.length).toBeGreaterThanOrEqual(2);
  });
});

describe("thumb position", () => {
  it("the thumb itself sounds the octave harmonic on each string", () => {
    const pitch = pitchForFingering({ string: "A", position: "Thumb 1", finger: 0 });
    expect(toMidi(pitch)).toBe(toMidi({ letter: "A", accidental: 0, octave: 4 }));
  });
});
