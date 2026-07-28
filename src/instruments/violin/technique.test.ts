import { describe, expect, it } from "vitest";
import { formatPitch, toMidi } from "../../core/music/pitch";
import { fingeringsForPitch, pitchForFingering } from "./technique";

describe("open strings", () => {
  it("G string open is G3, D string open is D4, A string open is A4, E string open is E5", () => {
    expect(formatPitch(pitchForFingering({ string: "G", position: "I", finger: 0 }))).toBe("G3");
    expect(formatPitch(pitchForFingering({ string: "D", position: "I", finger: 0 }))).toBe("D4");
    expect(formatPitch(pitchForFingering({ string: "A", position: "I", finger: 0 }))).toBe("A4");
    expect(formatPitch(pitchForFingering({ string: "E", position: "I", finger: 0 }))).toBe("E5");
  });
});

describe("1st position on the D string", () => {
  it("finger 1 is E4, a whole step above the open D", () => {
    const pitch = pitchForFingering({ string: "D", position: "I", finger: 1 });
    expect(formatPitch(pitch)).toBe("E4");
  });

  it("finger 4 is A4 (unison with the open A string)", () => {
    const pitch = pitchForFingering({ string: "D", position: "I", finger: 4 });
    expect(toMidi(pitch)).toBe(toMidi({ letter: "A", accidental: 0, octave: 4 }));
  });
});

describe("same note on different strings", () => {
  it("A4 is reachable both as the open A string and as finger 4 in 1st position on the D string", () => {
    const options = fingeringsForPitch({ letter: "A", accidental: 0, octave: 4 });
    expect(options).toContainEqual({ string: "A", position: "I", finger: 0 });
    expect(options).toContainEqual({ string: "D", position: "I", finger: 4 });
    expect(options.length).toBeGreaterThanOrEqual(2);
  });
});
