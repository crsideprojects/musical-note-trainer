// Violin fingering data. See docs/fingering-model.md for the documented convention
// this implements and why — as with cello, this is a deliberately simple,
// internally-consistent model meant to be sanity-checked against a real teacher or
// method book, not an authoritative transcription of any one method. The actual
// position/pattern math lives in core/instrument/stringInstrumentEngine.ts, shared
// with cello.

import type { PositionDef, StringFingering } from "../../core/instrument/stringInstrumentEngine";
import { createStringInstrumentEngine } from "../../core/instrument/stringInstrumentEngine";
import type { Pitch } from "../../core/music/pitch";

export type ViolinString = "G" | "D" | "A" | "E";

export const STRINGS: ViolinString[] = ["G", "D", "A", "E"];

/** Open-string pitches, low to high. */
export const OPEN_STRINGS: Record<ViolinString, Pitch> = {
  G: { letter: "G", accidental: 0, octave: 3 },
  D: { letter: "D", accidental: 0, octave: 4 },
  A: { letter: "A", accidental: 0, octave: 4 },
  E: { letter: "E", accidental: 0, octave: 5 },
};

// Violin doesn't lean on "Half position" as heavily as cello pedagogy does, but it
// still shows up (some methods use it for specific pieces or younger players), and
// — same as on cello — leaving it out creates an unreachable gap immediately above
// each open string, since the whole-tone-spaced I-VII positions alone can't cover
// it. See "What the conformance suite caught" in docs/design.md.
export type PositionName = "Half" | "I" | "II" | "III" | "IV" | "V" | "VI" | "VII";

export type ViolinFingering = StringFingering<ViolinString, PositionName>;

// Same two finger patterns as cello: "low 2nd finger" (whole, whole, half) in Half
// and 1st position, and the closed pattern (whole, half, whole) from 2nd position up.
const LOW_POSITION_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5 };
const CLOSED_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 3, 4: 5 };

// Whole-tone spacing between every position, except Half -> I which is a half step.
export const POSITIONS: PositionDef<PositionName>[] = [
  { name: "Half", baseOffset: 1, pattern: LOW_POSITION_PATTERN },
  { name: "I", baseOffset: 2, pattern: LOW_POSITION_PATTERN },
  { name: "II", baseOffset: 4, pattern: CLOSED_PATTERN },
  { name: "III", baseOffset: 6, pattern: CLOSED_PATTERN },
  { name: "IV", baseOffset: 8, pattern: CLOSED_PATTERN },
  { name: "V", baseOffset: 10, pattern: CLOSED_PATTERN },
  { name: "VI", baseOffset: 12, pattern: CLOSED_PATTERN },
  { name: "VII", baseOffset: 14, pattern: CLOSED_PATTERN },
];

const engine = createStringInstrumentEngine<ViolinString, PositionName>({
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

export const VIOLIN_MIDI_RANGE = engine.midiRange;
export const violinTechnique = engine.technique;
export const violinEngine = engine;
