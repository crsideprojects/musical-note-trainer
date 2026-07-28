// Generic conformance checks any Technique implementation must pass. Written once
// here and exercised against cello from day one, so architecture drift on the
// instrument boundary is caught immediately — not only once a second instrument
// is added.

import { describe, expect, it } from "vitest";
import type { Pitch } from "../music/pitch";
import { toMidi } from "../music/pitch";
import type { Technique } from "./Technique";

export function describeTechniqueConformance<TAction>(
  label: string,
  technique: Technique<TAction>,
  midiRange: { min: number; max: number },
) {
  describe(`${label} technique conformance`, () => {
    it("every action's pitch round-trips through actionsForPitch", () => {
      for (const action of technique.allActions()) {
        const pitch = technique.pitchForAction(action);
        const matches = technique.actionsForPitch(pitch);
        expect(matches.length).toBeGreaterThan(0);
      }
    });

    it("actionsForPitch never returns an action whose own pitch disagrees", () => {
      for (const action of technique.allActions()) {
        const pitch = technique.pitchForAction(action);
        for (const candidate of technique.actionsForPitch(pitch)) {
          expect(toMidi(technique.pitchForAction(candidate))).toBe(toMidi(pitch));
        }
      }
    });

    it("every in-range pitch has at least one action", () => {
      const seenClasses = new Set<number>();
      for (const action of technique.allActions()) {
        seenClasses.add(toMidi(technique.pitchForAction(action)));
      }
      for (let midi = midiRange.min; midi <= midiRange.max; midi++) {
        expect(seenClasses.has(midi)).toBe(true);
      }
    });

    it("formatAction never throws for any in-range action", () => {
      for (const action of technique.allActions()) {
        expect(() => technique.formatAction(action)).not.toThrow();
      }
    });

    it("no action produces a pitch outside the modeled range", () => {
      for (const action of technique.allActions()) {
        const midi = toMidi(technique.pitchForAction(action));
        expect(midi).toBeGreaterThanOrEqual(midiRange.min);
        expect(midi).toBeLessThanOrEqual(midiRange.max);
      }
    });
  });
}

export function pitchInMidiRange(pitch: Pitch, range: { min: number; max: number }): boolean {
  const midi = toMidi(pitch);
  return midi >= range.min && midi <= range.max;
}
