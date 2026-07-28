// Generic engine for fretless, fingered string instruments (cello, violin, ...):
// same "string + position + finger -> pitch" math, different constants. Extracted
// from what was originally cello-only logic once violin made it a real second
// instrument, not a hypothetical one — see docs/design.md.

import type { Technique } from "./Technique";
import type { Pitch } from "../music/pitch";
import { spellingsForMidi, toMidi } from "../music/pitch";

export interface PositionDef<TPosition extends string> {
  name: TPosition;
  /** Semitones the position's reference finger sits above the open string. */
  baseOffset: number;
  /** true if the reference finger is the thumb (finger 0) instead of finger 1. */
  usesThumb?: boolean;
  /** Finger -> semitone offset above the position's base. */
  pattern: Record<number, number>;
}

export interface StringFingering<TString extends string, TPosition extends string> {
  string: TString;
  position: TPosition;
  /** 0 = open string or thumb, 1-4 = regular fingers. */
  finger: number;
}

export interface StringInstrumentSpec<TString extends string, TPosition extends string> {
  strings: TString[];
  openStrings: Record<TString, Pitch>;
  positions: PositionDef<TPosition>[];
  /** Position name used as the (otherwise-ignored) position field on open-string fingerings. */
  openStringPositionName: TPosition;
}

export interface StringInstrumentEngine<TString extends string, TPosition extends string> {
  strings: TString[];
  positions: PositionDef<TPosition>[];
  openStrings: Record<TString, Pitch>;
  fingersForPosition(name: TPosition): number[];
  pitchForFingering(fingering: StringFingering<TString, TPosition>): Pitch;
  fingeringsForPitch(pitch: Pitch): StringFingering<TString, TPosition>[];
  allFingerings(): StringFingering<TString, TPosition>[];
  formatFingering(fingering: StringFingering<TString, TPosition>): string;
  isFingeringInRange(fingering: StringFingering<TString, TPosition>): boolean;
  /** true if this fingering is the open string (finger 0, not a thumb position). */
  isOpenFingering(fingering: StringFingering<TString, TPosition>): boolean;
  /**
   * MIDI range this model guarantees full chromatic coverage over. Computed from
   * the real fingering data (not a hand-derived formula) so it can't silently
   * drift out of sync with the position/pattern tables. A closed-position
   * pattern's reach can exceed the step between positions, which leaves an
   * isolated gap right below the very top note the last position can reach —
   * rather than exposing a range with a hole in it, the max is trimmed back to
   * the last value with unbroken coverage below it.
   */
  midiRange: { min: number; max: number };
  technique: Technique<StringFingering<TString, TPosition>>;
}

export function createStringInstrumentEngine<TString extends string, TPosition extends string>(
  spec: StringInstrumentSpec<TString, TPosition>,
): StringInstrumentEngine<TString, TPosition> {
  const { strings, openStrings, positions, openStringPositionName } = spec;

  function findPosition(name: TPosition): PositionDef<TPosition> {
    const position = positions.find((p) => p.name === name);
    if (!position) throw new Error(`Unknown position: ${name}`);
    return position;
  }

  function fingersForPosition(name: TPosition): number[] {
    return Object.keys(findPosition(name).pattern)
      .map(Number)
      .sort((a, b) => a - b);
  }

  function fingeringMidi(fingering: StringFingering<TString, TPosition>): number {
    const openMidi = toMidi(openStrings[fingering.string]);
    const position = findPosition(fingering.position);
    if (fingering.finger === 0 && !position.usesThumb) {
      return openMidi; // open string
    }
    const fingerOffset = position.pattern[fingering.finger];
    if (fingerOffset === undefined) {
      throw new Error(`Finger ${fingering.finger} is not valid in position ${fingering.position}`);
    }
    return openMidi + position.baseOffset + fingerOffset;
  }

  function pitchForFingering(fingering: StringFingering<TString, TPosition>): Pitch {
    const midi = fingeringMidi(fingering);
    const spellings = spellingsForMidi(midi);
    // Prefer the natural spelling when one exists, for a stable canonical answer.
    return spellings.find((p) => p.accidental === 0) ?? spellings[0];
  }

  function allFingeringsUnfiltered(): StringFingering<TString, TPosition>[] {
    const results: StringFingering<TString, TPosition>[] = [];
    for (const string of strings) {
      results.push({ string, position: openStringPositionName, finger: 0 });
      for (const position of positions) {
        for (const fingerKey of Object.keys(position.pattern)) {
          results.push({ string, position: position.name, finger: Number(fingerKey) });
        }
      }
    }
    return results;
  }

  const midiRange = (() => {
    const midiValues = new Set(allFingeringsUnfiltered().map((f) => toMidi(pitchForFingering(f))));
    const min = Math.min(...midiValues);
    let max = min;
    while (midiValues.has(max + 1)) max++;
    return { min, max };
  })();

  function inRange(midi: number): boolean {
    return midi >= midiRange.min && midi <= midiRange.max;
  }

  function fingeringsForPitch(pitch: Pitch): StringFingering<TString, TPosition>[] {
    const targetMidi = toMidi(pitch);
    if (!inRange(targetMidi)) return [];
    return allFingeringsUnfiltered().filter((f) => fingeringMidi(f) === targetMidi);
  }

  function isFingeringInRange(fingering: StringFingering<TString, TPosition>): boolean {
    return inRange(fingeringMidi(fingering));
  }

  function isOpenFingering(fingering: StringFingering<TString, TPosition>): boolean {
    return fingering.finger === 0 && !findPosition(fingering.position).usesThumb;
  }

  function formatFingering(fingering: StringFingering<TString, TPosition>): string {
    const fingerLabel = isOpenFingering(fingering)
      ? "open"
      : fingering.finger === 0
        ? "thumb"
        : `finger ${fingering.finger}`;
    return `${fingering.string} string, ${fingering.position} position, ${fingerLabel}`;
  }

  function allFingerings(): StringFingering<TString, TPosition>[] {
    return allFingeringsUnfiltered().filter((f) => inRange(fingeringMidi(f)));
  }

  return {
    strings,
    positions,
    openStrings,
    fingersForPosition,
    pitchForFingering,
    fingeringsForPitch,
    allFingerings,
    formatFingering,
    isFingeringInRange,
    isOpenFingering,
    midiRange,
    technique: {
      actionsForPitch: fingeringsForPitch,
      pitchForAction: pitchForFingering,
      allActions: allFingerings,
      formatAction: formatFingering,
    },
  };
}
