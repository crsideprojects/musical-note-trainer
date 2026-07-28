// Pitch is modeled as pitch-class math (MIDI-like), not hardcoded sharp/flat pairs,
// so enharmonic spellings are derived rather than hand-listed.

export type Letter = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type Accidental = -1 | 0 | 1; // flat / natural / sharp — double accidentals are out of v1 scope

export interface Pitch {
  letter: Letter;
  accidental: Accidental;
  octave: number; // scientific pitch notation, C4 = middle C
}

export const ALL_LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const LETTERS = ALL_LETTERS;

// Semitones above C for the natural (unaltered) form of each letter.
const NATURAL_SEMITONE: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const ACCIDENTAL_SYMBOL: Record<Accidental, string> = {
  [-1]: "♭", // ♭
  [0]: "",
  [1]: "♯", // ♯
};

/** MIDI note number, where C4 = 60. */
export function toMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + NATURAL_SEMITONE[pitch.letter] + pitch.accidental;
}

export function pitchClass(pitch: Pitch): number {
  return ((toMidi(pitch) % 12) + 12) % 12;
}

export function formatPitch(pitch: Pitch): string {
  return `${pitch.letter}${ACCIDENTAL_SYMBOL[pitch.accidental]}${pitch.octave}`;
}

/** VexFlow "key" string, e.g. { letter: "B", accidental: 1, octave: 3 } -> "b#/3". */
export function toVexKey(pitch: Pitch): string {
  const symbol = pitch.accidental === -1 ? "b" : pitch.accidental === 1 ? "#" : "";
  return `${pitch.letter.toLowerCase()}${symbol}/${pitch.octave}`;
}

export function pitchesEqual(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave;
}

/** Same sounding pitch, regardless of spelling. */
export function isEnharmonic(a: Pitch, b: Pitch): boolean {
  return toMidi(a) === toMidi(b);
}

/**
 * All single-accidental spellings (natural/sharp/flat only) of a given MIDI note,
 * across all 7 letters. A given MIDI value typically has 1-2 valid spellings under
 * this restriction (see docs/design.md for why some pitch classes — D, G, A — have
 * only one).
 */
export function spellingsForMidi(midi: number): Pitch[] {
  const results: Pitch[] = [];
  const octaveGuess = Math.floor(midi / 12) - 1;

  for (const letter of LETTERS) {
    for (const octave of [octaveGuess - 1, octaveGuess, octaveGuess + 1]) {
      const naturalMidi = (octave + 1) * 12 + NATURAL_SEMITONE[letter];
      const accidental = midi - naturalMidi;
      if (accidental === -1 || accidental === 0 || accidental === 1) {
        results.push({ letter, accidental: accidental as Accidental, octave });
      }
    }
  }

  // De-duplicate (shouldn't happen given the octave window, but be defensive).
  const seen = new Set<string>();
  return results.filter((p) => {
    const key = formatPitch(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Other valid spellings of the same sounding pitch, excluding the given spelling itself. */
export function enharmonicsOf(pitch: Pitch): Pitch[] {
  return spellingsForMidi(toMidi(pitch)).filter((p) => !pitchesEqual(p, pitch));
}

export function randomInt(min: number, maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}
