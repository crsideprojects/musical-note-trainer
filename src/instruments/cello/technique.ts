// Cello fingering data. See docs/fingering-model.md for the documented convention
// this implements and why — fingering conventions vary by method/teacher, and this
// is a deliberately simple, internally-consistent model meant to be sanity-checked
// against the user's own teacher/method book, not an authoritative transcription of
// any one method. The actual position/pattern math lives in
// core/instrument/stringInstrumentEngine.ts, shared with every string instrument.

import type { PositionDef, StringFingering } from "../../core/instrument/stringInstrumentEngine";
import { createStringInstrumentEngine } from "../../core/instrument/stringInstrumentEngine";
import type { Pitch } from "../../core/music/pitch";

export type CelloString = "C" | "G" | "D" | "A";

export const STRINGS: CelloString[] = ["C", "G", "D", "A"];

/** Open-string pitches, low to high. */
export const OPEN_STRINGS: Record<CelloString, Pitch> = {
  C: { letter: "C", accidental: 0, octave: 2 },
  G: { letter: "G", accidental: 0, octave: 2 },
  D: { letter: "D", accidental: 0, octave: 3 },
  A: { letter: "A", accidental: 0, octave: 3 },
};

export type PositionName = "Half" | "I" | "II" | "III" | "IV" | `Thumb ${number}`;

export type CelloFingering = StringFingering<CelloString, PositionName>;

// Finger offsets (semitones above the position's base) for each finger pattern.
// "Low 2nd finger" pattern: whole, whole, half — used in Half and I position.
const LOW_POSITION_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5 };
// Standard closed pattern: whole, half, whole — used from II position up, and by
// fingers 1/2/3 above the thumb in thumb position.
const CLOSED_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 3, 4: 5 };
const THUMB_PATTERN: Record<number, number> = { 0: 0, 1: 2, 2: 3, 3: 5 };

// Whole-tone spacing per position, except Half -> I which is a half step. Thumb
// positions begin at the octave harmonic (12 semitones above the open string) and
// continue in whole-tone steps up to a two-octave-plus ceiling — see
// docs/fingering-model.md for why the ceiling runs one step past two octaves.
const REGULAR_POSITIONS: PositionDef<PositionName>[] = [
  { name: "Half", baseOffset: 1, pattern: LOW_POSITION_PATTERN },
  { name: "I", baseOffset: 2, pattern: LOW_POSITION_PATTERN },
  { name: "II", baseOffset: 4, pattern: CLOSED_PATTERN },
  { name: "III", baseOffset: 6, pattern: CLOSED_PATTERN },
  { name: "IV", baseOffset: 8, pattern: CLOSED_PATTERN },
];

const THUMB_POSITION_CEILING_OFFSET = 26;
const THUMB_POSITION_STEP = 2;
const THUMB_POSITION_START = 12;

function buildThumbPositions(): PositionDef<PositionName>[] {
  const positions: PositionDef<PositionName>[] = [];
  let index = 1;
  for (
    let base = THUMB_POSITION_START;
    base <= THUMB_POSITION_CEILING_OFFSET;
    base += THUMB_POSITION_STEP, index++
  ) {
    positions.push({
      name: `Thumb ${index}`,
      baseOffset: base,
      usesThumb: true,
      pattern: THUMB_PATTERN,
    });
  }
  return positions;
}

export const POSITIONS: PositionDef<PositionName>[] = [...REGULAR_POSITIONS, ...buildThumbPositions()];

const engine = createStringInstrumentEngine<CelloString, PositionName>({
  strings: STRINGS,
  openStrings: OPEN_STRINGS,
  positions: POSITIONS,
  openStringPositionName: "I",
});

export const {
  fingersForPosition,
  pitchForFingering,
  fingeringsForPitch,
  allFingerings,
  formatFingering,
  isFingeringInRange,
} = engine;

export const CELLO_MIDI_RANGE = engine.midiRange;
export const celloTechnique = engine.technique;
export const celloEngine = engine;
