// Cello fingering model. See docs/fingering-model.md for the documented convention
// this implements and why — fingering conventions vary by method/teacher, and this
// is a deliberately simple, internally-consistent model meant to be sanity-checked
// against the user's own teacher/method book, not an authoritative transcription of
// any one method.

import type { Technique } from "../../core/instrument/Technique";
import type { Pitch } from "../../core/music/pitch";
import { spellingsForMidi, toMidi } from "../../core/music/pitch";

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

interface PositionDef {
  name: PositionName;
  /** Semitones the position's reference finger sits above the open string. */
  baseOffset: number;
  /** true if the reference finger is the thumb (finger 0) instead of finger 1. */
  usesThumb: boolean;
}

// Whole-tone spacing per position, except Half -> I which is a half step. Thumb
// positions begin at the octave harmonic (12 semitones above the open string) and
// continue in whole-tone steps up to a two-octave ceiling — see docs/fingering-model.md.
const REGULAR_POSITIONS: PositionDef[] = [
  { name: "Half", baseOffset: 1, usesThumb: false },
  { name: "I", baseOffset: 2, usesThumb: false },
  { name: "II", baseOffset: 4, usesThumb: false },
  { name: "III", baseOffset: 6, usesThumb: false },
  { name: "IV", baseOffset: 8, usesThumb: false },
];

// One step past two octaves — the closed-position pattern (offsets 0,2,3,5 with a
// step of 2 between positions) leaves a one-semitone gap right at whatever position
// happens to be last, so the sequence needs to run one position past the nominal
// "two octaves" ceiling for full chromatic coverage up to the true top note.
const THUMB_POSITION_CEILING_OFFSET = 26;
const THUMB_POSITION_STEP = 2;
const THUMB_POSITION_START = 12;

function buildThumbPositions(): PositionDef[] {
  const positions: PositionDef[] = [];
  let index = 1;
  for (
    let base = THUMB_POSITION_START;
    base <= THUMB_POSITION_CEILING_OFFSET;
    base += THUMB_POSITION_STEP, index++
  ) {
    positions.push({ name: `Thumb ${index}`, baseOffset: base, usesThumb: true });
  }
  return positions;
}

export const POSITIONS: PositionDef[] = [...REGULAR_POSITIONS, ...buildThumbPositions()];

// Finger offsets (semitones above the position's base) for each finger pattern.
// "Low 2nd finger" pattern: whole, whole, half — used in Half and I position.
const LOW_POSITION_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5 };
// Standard closed pattern: whole, half, whole — used from II position up, and by
// fingers 1/2/3 above the thumb in thumb position.
const CLOSED_PATTERN: Record<number, number> = { 1: 0, 2: 2, 3: 3, 4: 5 };
const THUMB_PATTERN: Record<number, number> = { 0: 0, 1: 2, 2: 3, 3: 5 };

function patternFor(position: PositionDef): Record<number, number> {
  if (position.usesThumb) return THUMB_PATTERN;
  if (position.name === "Half" || position.name === "I") return LOW_POSITION_PATTERN;
  return CLOSED_PATTERN;
}

/** The fingers (excluding open string) playable in a given named position — used by the fingerboard diagram. */
export function fingersForPosition(positionName: PositionName): number[] {
  const position = POSITIONS.find((p) => p.name === positionName);
  if (!position) return [];
  return Object.keys(patternFor(position))
    .map(Number)
    .sort((a, b) => a - b);
}

export interface CelloFingering {
  string: CelloString;
  position: PositionName;
  /** 0 = open string or thumb, 1-4 = regular fingers. */
  finger: number;
}

export const FINGERBOARD_CEILING_OFFSET = THUMB_POSITION_CEILING_OFFSET;

function fingeringMidi(fingering: CelloFingering): number {
  const openMidi = toMidi(OPEN_STRINGS[fingering.string]);
  if (fingering.finger === 0 && !fingering.position.startsWith("Thumb")) {
    return openMidi; // open string
  }
  const position = POSITIONS.find((p) => p.name === fingering.position);
  if (!position) throw new Error(`Unknown position: ${fingering.position}`);
  const pattern = patternFor(position);
  const fingerOffset = pattern[fingering.finger];
  if (fingerOffset === undefined) {
    throw new Error(`Finger ${fingering.finger} is not valid in position ${fingering.position}`);
  }
  return openMidi + position.baseOffset + fingerOffset;
}

/** The pitch (in a reasonable single-accidental spelling) produced by a fingering. */
export function pitchForFingering(fingering: CelloFingering): Pitch {
  const midi = fingeringMidi(fingering);
  const spellings = spellingsForMidi(midi);
  // Prefer the natural spelling when one exists, for a stable canonical answer.
  return spellings.find((p) => p.accidental === 0) ?? spellings[0];
}

function allFingeringsUnfiltered(): CelloFingering[] {
  const results: CelloFingering[] = [];
  for (const string of STRINGS) {
    results.push({ string, position: "I", finger: 0 });
    for (const position of POSITIONS) {
      const pattern = patternFor(position);
      for (const fingerKey of Object.keys(pattern)) {
        results.push({ string, position: position.name, finger: Number(fingerKey) });
      }
    }
  }
  return results;
}

/**
 * MIDI range this model guarantees full chromatic coverage over. Computed from the
 * real fingering data (not a hand-derived formula) so it can't silently drift out
 * of sync with the position/pattern tables above.
 *
 * The closed-position pattern's reach (a finger 5 semitones above its position's
 * base) exceeds the whole-tone step between positions, which leaves an isolated
 * one-semitone gap right below the very top note the last position can reach.
 * Rather than exposing a range with a hole in it, the declared max is trimmed back
 * to the last value with unbroken coverage below it — the one or two highest notes
 * in extreme thumb position are simply not used for quiz generation.
 */
export const CELLO_MIDI_RANGE = (() => {
  const midiValues = new Set(allFingeringsUnfiltered().map((f) => toMidi(pitchForFingering(f))));
  const min = Math.min(...midiValues);
  let max = min;
  while (midiValues.has(max + 1)) max++;
  return { min, max };
})();

function inRange(midi: number): boolean {
  return midi >= CELLO_MIDI_RANGE.min && midi <= CELLO_MIDI_RANGE.max;
}

/** Every fingering (across all 4 strings) that produces the given sounding pitch. */
export function fingeringsForPitch(pitch: Pitch): CelloFingering[] {
  const targetMidi = toMidi(pitch);
  if (!inRange(targetMidi)) return [];
  return allFingeringsUnfiltered().filter((f) => fingeringMidi(f) === targetMidi);
}

export function isFingeringInRange(fingering: CelloFingering): boolean {
  return inRange(fingeringMidi(fingering));
}

export function formatFingering(fingering: CelloFingering): string {
  const fingerLabel =
    fingering.finger === 0
      ? fingering.position.startsWith("Thumb")
        ? "thumb"
        : "open"
      : `finger ${fingering.finger}`;
  return `${fingering.string} string, ${fingering.position} position, ${fingerLabel}`;
}

/** All fingerings within the modeled (gap-free) range, used for conformance checks and quiz distractors. */
export function allFingerings(): CelloFingering[] {
  return allFingeringsUnfiltered().filter((f) => inRange(fingeringMidi(f)));
}

export const celloTechnique: Technique<CelloFingering> = {
  actionsForPitch: fingeringsForPitch,
  pitchForAction: pitchForFingering,
  allActions: allFingerings,
  formatAction: formatFingering,
};
