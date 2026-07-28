# String instrument fingering models

**Please sanity-check these against your own teacher or method book.**
Fingering conventions genuinely vary — how many whole/half steps apart
positions are, exactly where "2nd position" sits, how thumb position is
introduced — and these are deliberately simple, internally-consistent models
picked to make the data tractable to build and test, not transcriptions of
any specific method. If something here doesn't match what you're being
taught, the fix is almost certainly in the relevant instrument's small,
self-contained `technique.ts` data file, not logic spread across the app.

Both models share the same underlying math
([`src/core/instrument/stringInstrumentEngine.ts`](../src/core/instrument/stringInstrumentEngine.ts)):
a position is a semitone offset from the open string, and a finger pattern is
a set of semitone offsets from that position's base. Each instrument's
`technique.ts` only supplies its own open strings and position/pattern table.

## Cello

### Open strings

C2, G2, D3, A3 (low to high), a perfect fifth apart.

### Positions

| Position | Semitones above open string |
|---|---|
| Half | 1 |
| I | 2 |
| II | 4 |
| III | 6 |
| IV | 8 |
| Thumb 1, 2, 3, ... | 12, 14, 16, 18, ... (whole-tone steps, starting at the octave harmonic) |

Half → I is a half step; every other step (including through thumb position)
is a whole step. Thumb position begins at the octave harmonic (12 semitones
above the open string) — the point where the thumb typically anchors on a
natural harmonic — and continues upward in whole-tone steps.

### Finger patterns within a position

- **Half and I position** ("low 2nd finger"): finger 1 at the base, finger 2
  a whole step up, finger 3 a whole step above that, finger 4 a half step
  above that. Offsets: `1→0, 2→2, 3→4, 4→5`.
- **II position and up, including thumb position**: finger 1 (or the thumb,
  in thumb position) at the base, then whole/half/whole. Offsets:
  `1→0, 2→2, 3→3, 4→5`. In thumb position the same pattern applies with the
  thumb taking finger 1's role and fingers 1/2/3 taking the upper three
  slots.

## Violin

### Open strings

G3, D4, A4, E5 (low to high) — also a perfect fifth apart, a fifth above
cello's open strings.

### Positions

| Position | Semitones above open string |
|---|---|
| Half | 1 |
| I | 2 |
| II | 4 |
| III | 6 |
| IV | 8 |
| V | 10 |
| VI | 12 |
| VII | 14 |

Violin pedagogy doesn't lean on "Half position" nearly as often as cello
does, and doesn't use "thumb position" at all — but Half position still
appears in some methods, and it's included here because omitting it (as the
first draft of this model did) leaves the note directly above every open
string unreachable: the whole-tone-spaced I-VII positions alone can't cover
it, the same gap cello would have without Half position. See "What the
conformance suite caught" in [design.md](design.md).

Positions VIII and higher exist in real violin playing (especially on the E
string) but aren't modeled here — v1 stops at VII.

### Finger patterns within a position

Identical shape to cello's: **Half and I** use the "low 2nd finger" pattern
(`1→0, 2→2, 3→4, 4→5`); **II through VII** use the closed pattern
(`1→0, 2→2, 3→3, 4→5`). No thumb-position pattern, since violin has none.

## Range

Each instrument's usable range is computed from its actual fingering data,
not hardcoded — see "What the conformance suite caught" in
[design.md](design.md). In short: a closed-position pattern's reach (5
semitones above a position's base) is wider than the whole-tone step between
positions, so whichever position happens to be last always leaves one note
unreachable just below its own top note. Rather than exposing a range with a
gap in it, each instrument's declared maximum is trimmed to the last value
with unbroken coverage below it — the one or two highest notes in the
uppermost modeled position are simply not used for quiz generation.

## Known simplifications

- Extensions (stretching a finger pattern without shifting the whole hand)
  are not modeled — every position uses one fixed closed-hand pattern.
- Only one canonical spelling is used per fingering's pitch (the natural
  spelling when one exists) — the same physical fingering isn't tagged with
  multiple enharmonic names.
- Cello's thumb position technique above the first few sub-positions gets
  increasingly idealized; real playing introduces alternate fingerings this
  model doesn't cover. Violin positions above VII aren't modeled at all.
