# Requirements — v1 (Cello)

## Problem

Learning cello after years of reading treble clef (e.g. from another instrument)
means bass clef — and eventually tenor clef, used in higher cello passages —
has to be built up from scratch. On a string instrument, reading a note is
only half the skill: you also need to know where to put your finger, and that
the same pitch is often reachable on more than one string. Flashcard-style
drilling of "notes in isolation" doesn't cover that second half.

## v1 scope

Cello only. See [docs/design.md](design.md) for why the codebase leaves room
for other instruments later without building speculative infrastructure now.

### Feature 1 — Note ID

Show a note on a randomly chosen clef (bass, tenor, or treble); the user picks
its name (letter + accidental + octave) from multiple-choice options.

**Acceptance criteria**
- The correct choice always matches the exact pitch generated (not just an
  enharmonic equivalent) — clef reading is about the notated letter name.
- The staff renders the note on the correct line/space with correct ledger
  lines for the given clef (VexFlow handles this given a correct note key +
  clef; verified by the manual per-clef checklist below).
- A running score (correct / attempted) is shown and persists across
  questions within a session.

### Feature 2 — Enharmonics

Given a note, the user names another valid spelling of the same pitch (e.g.
A♭4 ↔ G♯4).

**Acceptance criteria**
- Only pitches that have at least one valid single-accidental enharmonic
  spelling are used as prompts (natural D, G, and A do not — see
  [design.md](design.md)).
- Double sharps/flats are out of v1 scope — not generated as prompts or
  accepted as answers.
- Boundary cases (E♯/F, B♯/C, C♭/B, F♭/E) are correctly recognized as
  enharmonic pairs.

### Feature 3 — Fingering

Given a note, the user identifies a valid string + position + finger that
plays it.

**Acceptance criteria**
- A note reachable more than one way only needs one valid answer selected
  among the choices to be marked correct.
- Notes outside the modeled fingerboard range are never generated as prompts.

### Feature 4 — Same note, different strings

Given a note, the user selects every place on the fingerboard (across all 4
strings) that plays it.

**Acceptance criteria**
- Prompts are drawn from notes with at least 2 valid fingerings, so the
  exercise is always meaningful.
- Marked correct only when the full set of selections exactly matches the
  full set of valid fingerings (not a subset).

### Feature 5 — Reference (non-quiz)

Pick any note and see it rendered on all three clef staves, plus every place
it's playable on the cello fingerboard.

**Acceptance criteria**
- Works for any letter/accidental/octave combination selectable in the UI.
- Notes outside the fingerboard's modeled range show an explicit "outside
  range" message rather than an empty or broken diagram.

## Test data matrix (must pass before v1 is considered done)

- All 3 clefs × natural/sharp/flat accidentals, including boundary pitches
  (open strings, extreme thumb-position notes, E♯/F, B♯/C, C♭/B).
- Out-of-range notes are excluded from question generation everywhere, never
  cause a crash.
- Automated: the cello technique conformance suite
  (`src/instruments/cello/technique.conformance.test.ts`) is the regression
  guard for the instrument boundary itself.
- Manual: one note per line/space per clef, checked visually against a
  reference, since a VexFlow/clef-mapping bug would be visually obvious but
  needs deliberate checking beyond unit tests.

## Explicitly out of scope for v1

- Microphone/pitch-detection practice (visual/click-based only).
- Instruments other than cello.
- Double sharps/flats.
- Accounts, backend, or cross-device sync (progress is local to the browser).
