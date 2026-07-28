import type { Pitch } from "./pitch";
import { pickRandom, randomInt, toMidi } from "./pitch";

export type ClefId = "bass" | "tenor" | "treble";

export interface ClefInfo {
  id: ClefId;
  label: string;
  vexflowClef: "bass" | "tenor" | "treble";
  /** Practical practice range for question generation — staff plus a few ledger lines. */
  range: { min: Pitch; max: Pitch };
}

export const CLEFS: Record<ClefId, ClefInfo> = {
  bass: {
    id: "bass",
    label: "Bass clef",
    vexflowClef: "bass",
    range: {
      min: { letter: "E", accidental: 0, octave: 2 },
      max: { letter: "E", accidental: 0, octave: 4 },
    },
  },
  tenor: {
    id: "tenor",
    label: "Tenor clef",
    vexflowClef: "tenor",
    range: {
      min: { letter: "A", accidental: 0, octave: 2 },
      max: { letter: "C", accidental: 0, octave: 5 },
    },
  },
  treble: {
    id: "treble",
    label: "Treble clef",
    vexflowClef: "treble",
    range: {
      min: { letter: "C", accidental: 0, octave: 4 },
      max: { letter: "C", accidental: 0, octave: 6 },
    },
  },
};

export const ALL_CLEFS: ClefId[] = ["bass", "tenor", "treble"];

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** A random pitch within the given clef's practice range, with an accidental some of the time. */
export function randomPitchInClef(clefId: ClefId, accidentalChance = 0.35): Pitch {
  const { min, max } = CLEFS[clefId].range;
  const minMidi = toMidi(min);
  const maxMidi = toMidi(max);

  // Sample by letter/octave (not raw MIDI) so natural note names stay evenly likely
  // rather than skewed toward whichever letters happen to have sharps/flats nearby.
  const candidates: Pitch[] = [];
  for (let octave = min.octave; octave <= max.octave; octave++) {
    for (const letter of LETTERS) {
      const natural: Pitch = { letter, accidental: 0, octave };
      const midi = toMidi(natural);
      if (midi >= minMidi && midi <= maxMidi) candidates.push(natural);
    }
  }

  const base = pickRandom(candidates);
  if (Math.random() < accidentalChance) {
    const accidental = pickRandom([-1, 1] as const);
    const altered: Pitch = { ...base, accidental };
    const midi = toMidi(altered);
    if (midi >= minMidi && midi <= maxMidi) return altered;
  }
  return base;
}

export function randomClef(clefs: ClefId[] = ALL_CLEFS): ClefId {
  return clefs[randomInt(0, clefs.length - 1)];
}
