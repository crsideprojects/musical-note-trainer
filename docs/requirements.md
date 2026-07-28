# Requirements — v2 (Cello + Violin)

## Problem

Learning cello after years of reading treble clef (e.g. from another instrument)
means bass clef — and eventually tenor clef, used in higher cello passages —
has to be built up from scratch. On a string instrument, reading a note is
only half the skill: you also need to know where to put your finger, and that
the same pitch is often reachable on more than one string. Flashcard-style
drilling of "notes in isolation" doesn't cover that second half.

Violin was added as a second instrument, selectable at the top of the screen.
Same underlying problem, different physical instrument — violin reads treble
clef only, and has its own string/position/finger geography.

## Scope

Cello and violin. See [docs/design.md](design.md) for the shared
string-instrument engine both are built on, and why a third instrument with a
genuinely different technique model (frets, valves, keys) still wouldn't need
a plugin registry to add.

### Instrument selection

A selector at the top of the screen (in the header, visible on every page)
switches between Cello and Violin.

**Acceptance criteria**
- The selection persists across page reloads (localStorage).
- Switching instruments mid-quiz starts a fresh question rather than
  continuing with the previous instrument's in-flight state.
- Progress (score) is tracked separately per instrument for the modes where
  that's meaningful — Note ID, Fingering, Same-note-different-strings.
  Enharmonics progress is shared, since naming an alternate spelling isn't
  instrument-specific.

### Feature 1 — Note ID

Show a note on a randomly chosen clef *relevant to the selected instrument*
(cello: bass, tenor, or treble; violin: treble only); the user picks its name
(letter + accidental + octave) from multiple-choice options.

**Acceptance criteria**
- The correct choice always matches the exact pitch generated (not just an
  enharmonic equivalent) — clef reading is about the notated letter name.
- Violin never generates a bass- or tenor-clef question.
- The staff renders the note on the correct line/space with correct ledger
  lines for the given clef (VexFlow handles this given a correct note key +
  clef; verified by the manual per-clef checklist below).
- A running score (correct / attempted) is shown and persists across
  questions within a session, separately per instrument.

### Feature 2 — Enharmonics

Given a note, the user names another valid spelling of the same pitch (e.g.
A♭4 ↔ G♯4). Instrument-agnostic — identical behavior regardless of the
selected instrument.

**Acceptance criteria**
- Only pitches that have at least one valid single-accidental enharmonic
  spelling are used as prompts (natural D, G, and A do not — see
  [design.md](design.md)).
- Double sharps/flats are out of scope — not generated as prompts or
  accepted as answers.
- Boundary cases (E♯/F, B♯/C, C♭/B, F♭/E) are correctly recognized as
  enharmonic pairs.

### Feature 3 — Fingering

Given a note, the user identifies a valid string + position + finger that
plays it, on the selected instrument.

**Acceptance criteria**
- A note reachable more than one way only needs one valid answer selected
  among the choices to be marked correct.
- Notes outside the selected instrument's modeled fingerboard range are never
  generated as prompts.
- Choices reflect the selected instrument's own strings and positions (cello:
  C/G/D/A, Half-IV plus thumb positions; violin: G/D/A/E, Half-VII).

### Feature 4 — Same note, different strings

Given a note, the user selects every place on the fingerboard (across all 4
strings) that plays it, on the selected instrument.

**Acceptance criteria**
- Prompts are drawn from notes with at least 2 valid fingerings, so the
  exercise is always meaningful.
- Marked correct only when the full set of selections exactly matches the
  full set of valid fingerings (not a subset).

### Feature 5 — Reference (non-quiz)

Pick any note and see it rendered on every clef the selected instrument
reads, plus every place it's playable on that instrument's fingerboard.

**Acceptance criteria**
- Works for any letter/accidental/octave combination selectable in the UI.
- Violin only shows a treble-clef staff; cello shows all three.
- Notes outside the fingerboard's modeled range show an explicit "outside
  range" message rather than an empty or broken diagram.

## Test data matrix (must pass before a release is considered done)

- All clefs relevant to each instrument × natural/sharp/flat accidentals,
  including boundary pitches (open strings, the highest modeled position,
  E♯/F, B♯/C, C♭/B).
- Out-of-range notes are excluded from question generation everywhere, never
  cause a crash.
- Automated: each instrument's technique conformance suite
  (`src/instruments/{cello,violin}/technique.conformance.test.ts`) is the
  regression guard for the instrument boundary itself — run against both
  instruments, not just one.
- Manual: one note per line/space per clef, checked visually against a
  reference, since a VexFlow/clef-mapping bug would be visually obvious but
  needs deliberate checking beyond unit tests.

## Explicitly out of scope

- Microphone/pitch-detection practice (visual/click-based only).
- Instruments beyond cello and violin.
- Double sharps/flats.
- Accounts, backend, or cross-device sync (progress is local to the browser).
