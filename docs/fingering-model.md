# Cello fingering model

**Please sanity-check this against your own teacher or method book.**
Cello fingering conventions genuinely vary — how many whole/half steps apart
positions are, exactly where "2nd position" sits, how thumb position is
introduced — and this is a deliberately simple, internally-consistent model
picked to make the data tractable to build and test, not a transcription of
any specific method. If something here doesn't match what you're being
taught, the fix is almost certainly in
[`src/instruments/cello/technique.ts`](../src/instruments/cello/technique.ts) —
it's a small, self-contained data table, not logic spread across the app.

## Open strings

C2, G2, D3, A3 (low to high), a perfect fifth apart.

## Positions

Each position is defined by how many semitones its reference finger sits
above the open string:

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

## Finger patterns within a position

Two patterns, both relative to the position's base semitone offset:

- **Half and I position** ("low 2nd finger"): finger 1 at the base, finger 2
  a whole step up, finger 3 a whole step above that, finger 4 a half step
  above that. Offsets: `1→0, 2→2, 3→4, 4→5`.
- **II position and up, including thumb position**: finger 1 (or the thumb,
  in thumb position) at the base, then whole/half/whole. Offsets:
  `1→0, 2→2, 3→3, 4→5`. In thumb position the same pattern applies with the
  thumb taking finger 1's role and fingers 1/2/3 taking the upper three
  slots.

## Range

The model's usable range is computed from the actual fingering data, not
hardcoded — see "What the conformance suite caught" in
[design.md](design.md) for why. In short: the closed-position pattern's
reach (5 semitones above a position's base) is wider than the whole-tone step
between positions, so whichever position happens to be last always leaves one
note unreachable just below its own top note. Rather than exposing a range
with a gap in it, the declared maximum is trimmed to the last value with
unbroken coverage below it — the one or two highest notes in extreme thumb
position are simply not used for quiz generation.

## Known simplifications

- Extensions (stretching a finger pattern without shifting the whole hand)
  are not modeled — every position uses one fixed closed-hand pattern.
- Only one canonical spelling is used per fingering's pitch (the natural
  spelling when one exists) — the same physical fingering isn't tagged with
  multiple enharmonic names.
- Thumb position technique above the first few sub-positions gets
  increasingly idealized; real playing introduces alternate fingerings this
  model doesn't cover.
