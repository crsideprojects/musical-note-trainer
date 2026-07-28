# Design

## Architecture: where the instrument seam lives

The repo is named `musical-note-trainer`, not `cello-note-trainer`, because
other instruments may be added later (unspecified which). The only
extensibility investment made for that in v1 is a folder boundary and one
shared TypeScript contract — no plugin registry, dynamic instrument loader, or
generalized "technique dimension" framework. That's deliberate: building more
than this now would be speculative work for instruments that aren't
specified yet.

```
src/
  core/
    music/       Pitch, Clef, enharmonic-equivalence, staff-position math.
                  Pure functions, no React, no cello knowledge.
    quiz/         QuizModeConfig<TPrompt, TAnswer> contract + QuizRunner,
                  shared by every mode regardless of instrument.
    instrument/   Technique<TAction> — the one interface an instrument's
                  technique model must implement, plus a generic conformance
                  test suite any implementation can be run against.
    storage/      localStorage wrapper, namespaced by schema version + instrument.
    ui/           StaffRenderer (VexFlow) — instrument-agnostic.
  instruments/
    cello/
      technique.ts                   Fingering/position model (see fingering-model.md).
      FingerboardDiagram.tsx
      modes/                         fingeringMode.ts, sameNoteMode.ts
      technique.conformance.test.ts  Runs the generic suite against cello.
  app/             Routing, pages, mode-selection menu.
```

Note ID and Enharmonics only touch `core/music` and live entirely in `core` —
confirms the Pitch/Clef model really is instrument-agnostic, not just in
theory. Only Fingering and Same-note-different-strings touch
`instruments/cello`.

## The Technique<TAction> contract

```ts
interface Technique<TAction> {
  actionsForPitch(pitch: Pitch): TAction[];
  pitchForAction(action: TAction): Pitch;
  allActions(): TAction[];
  formatAction(action: TAction): string;
}
```

A future instrument (frets, valves, keys — whatever `TAction` shape fits)
implements this same interface. `describeTechniqueConformance` in
`core/instrument/techniqueConformance.ts` is a generic test suite — round-trip
consistency, in-range coverage, no out-of-range actions — run against cello
from day one via `technique.conformance.test.ts`. This is what actually
justifies the abstraction: it caught a real bug (see "what the conformance
suite caught" below) before any second instrument existed, which is the
whole point of writing the boundary now instead of waiting.

## The QuizModeConfig<TPrompt, TAnswer> contract

```ts
interface QuizModeConfig<TPrompt, TAnswer> {
  id: string;
  instrumentId: string;         // storage namespace: "core" or e.g. "cello"
  generateQuestion(): Question<TPrompt>;
  getValidAnswers(question): TAnswer[];        // array — multiple correct answers is real
  isAnswerCorrect(given: TAnswer[], question): boolean;
  formatAnswer(answer: TAnswer): string;
  PromptDisplay: ComponentType<{ prompt: TPrompt }>;
  AnswerInput: ComponentType<{ question, onSubmit, disabled }>;
}
```

`getValidAnswers` always returns an array because multiple correct answers is
a real case, not an edge case — most directly for Same-note-different-strings
(the whole premise is "more than one place is correct") and for Fingering
(a note is often reachable more than one way). `QuizRunner` is the one
generic component that drives all 4 quiz modes off this config, so adding a
mode doesn't mean writing a fifth near-duplicate quiz screen.

## Pitch model

Pitch is modeled as letter + accidental (flat/natural/sharp only — double
accidentals are out of v1 scope) + octave, resolved to a MIDI-like semitone
number. Enharmonic spellings are *derived* from that number (by checking,
for each of the 7 letters, whether some nearby octave's natural pitch is
within one semitone) rather than hand-listed — this is what makes boundary
cases like B♯3≡C4 and C♭4≡B3 fall out correctly instead of needing to be
special-cased.

One consequence worth documenting explicitly: under a single-accidental
model, natural **D**, **G**, and **A** each have *no* valid enharmonic
spelling — the only alternatives would be C𝄪/E𝄫, F𝄪/A𝄫, and G𝄪/B𝄫, all double
accidentals. The Enharmonics quiz mode excludes these three pitch classes
from question generation for exactly this reason (verified by a unit test).

## Cello fingering model

See [fingering-model.md](fingering-model.md) for the actual convention and
why it needs a sanity check against a real teacher/method book — fingering
conventions genuinely vary between methods, and this is a deliberately
simple, internally-consistent model, not a transcription of any one method.

### What the conformance suite caught

The first version of the position/pattern tables had a one-semitone gap right
below the highest reachable note: the closed-position finger pattern's reach
(5 semitones above a position's base) exceeds the whole-tone step between
positions, so whichever position happened to be last always left one note
unreachable just below its own top note. The generic "every in-range pitch
has at least one action" conformance check failed immediately with the exact
missing MIDI value, before this ever became a runtime bug in quiz generation.
The fix: the model's declared MIDI range is now trimmed to the last value
with provably unbroken coverage below it, computed from the actual fingering
data rather than a hand-derived formula, so it can't silently drift out of
sync with the position tables again.

## Other structural decisions

- **State management**: React Context/local component state only — no
  Redux/Zustand. The only cross-page state is progress, which lives in
  localStorage, not in-memory global state.
- **Routing**: `HashRouter`, not a `/:instrument/` prefix. Hash routing avoids
  needing a GitHub Pages SPA-fallback (`404.html`) trick; no instrument
  prefix because adding one later is a cheap additive change and there's
  only one instrument today.
- **localStorage namespacing**: keys are `mnt.v1.<instrumentId>.progress`
  (schema version + instrument both in the key) so a future instrument, or a
  future data-shape change, can't collide with existing progress data.
- **Hosting**: GitHub Pages. `vite.config.ts` uses `command === "build"` to
  set `base: "/musical-note-trainer/"` only for production builds — the dev
  server serves from `/` so `npm run dev` doesn't need the production path
  prefix.

## Explicitly deferred / not built

- No plugin registry, dynamic instrument loader, or generalized technique
  framework — unjustified until a second instrument is actually specified.
- No E2E test framework — unit tests on the pure logic (highest bug density,
  cheapest to test) plus manual click-through per mode is proportionate for a
  solo personal tool.
- No automated visual-regression testing for the VexFlow/SVG output — a
  one-time manual per-clef reference checklist is enough.
- No full WCAG audit — just keyboard-navigable answers, correct/incorrect not
  conveyed by color alone, and ≥32px touch targets on the fingerboard diagram
  (worth doing now since phone/PWA is a near-term target).
