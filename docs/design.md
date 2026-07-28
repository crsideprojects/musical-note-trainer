# Design

## Architecture: where the instrument seam lives

The repo is named `musical-note-trainer`, not `cello-note-trainer`, because
other instruments were always meant to be added later. Violin is the second
one — the first real test of the `Technique<TAction>` boundary described
below, rather than a hypothetical justification for it. Cello and violin are
both fretless, fingered string instruments (same "string + position + finger
→ pitch" structure, different constants), so adding violin meant extracting
the position/pattern math that used to live directly in
`instruments/cello/technique.ts` into a shared, parameterized engine — a
data/config extraction, not a rewrite. There's still no plugin registry or
dynamic instrument loader: a third instrument with a genuinely different
technique model (frets, valves, keys) would only need to implement
`Technique<TAction>` on its own terms, not fit into the string-instrument
engine.

```
src/
  core/
    music/       Pitch, Clef, enharmonic-equivalence, staff-position math.
                  Pure functions, no React, no instrument knowledge.
    quiz/         QuizModeConfig<TPrompt, TAnswer> contract + QuizRunner,
                  shared by every mode regardless of instrument.
    instrument/   Technique<TAction> — the one interface an instrument's
                  technique model must implement, plus a generic conformance
                  test suite any implementation can be run against.
                  stringInstrumentEngine.ts — the shared position/pattern math
                  for fretless string instruments (cello, violin); factory,
                  not a base class, parameterized by open strings + position/
                  pattern tables.
                  StringFingerboardDiagram.tsx — generic string×position grid,
                  used directly by both instruments.
                  modes/createFingeringMode.tsx, createSameNoteMode.tsx —
                  generic quiz mode factories over any StringInstrumentEngine.
    storage/      localStorage wrapper, namespaced by schema version + instrument.
    ui/           StaffRenderer (VexFlow) — instrument-agnostic.
  instruments/
    cello/
      technique.ts   Cello's open strings + position/pattern data (see
                      fingering-model.md), calling createStringInstrumentEngine.
      technique.conformance.test.ts  Runs the generic suite against cello.
    violin/
      technique.ts   Violin's open strings + position/pattern data, same shape.
      technique.conformance.test.ts  Same generic suite, against violin.
  instruments/registry.ts   The list of InstrumentDef — id, label, which
                             clefs it reads, its four QuizModeConfig instances,
                             its engine. This is the only place that knows both
                             instruments exist at once.
  app/
    InstrumentContext.tsx   Selected-instrument state (localStorage-persisted)
                             + the header selector.
    Routing, pages, mode-selection menu.
```

Note ID and Enharmonics only touch `core/music` and live entirely in `core` —
confirms the Pitch/Clef model really is instrument-agnostic, not just in
theory. Note ID is a factory (`createNoteIdMode(instrumentId, clefs)`) rather
than a static export, because *which clefs get quizzed* is instrument-specific
(violin never reads bass or tenor clef) even though the underlying logic
isn't. Enharmonics stays a single shared instance — naming a pitch's
alternate spelling has nothing to do with which instrument is selected, so
there's no reason to fork its logic or its progress tracking. Fingering and
Same-note-different-strings are generic factories
(`core/instrument/modes/`) over any `StringInstrumentEngine`, instantiated
once per instrument in the registry.

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

## String instrument fingering models

See [fingering-model.md](fingering-model.md) for cello's and violin's actual
conventions and why they need a sanity check against a real teacher/method
book — fingering conventions genuinely vary between methods, and these are
deliberately simple, internally-consistent models, not transcriptions of any
one method.

### What the conformance suite caught

**Cello** (v1): the first version of the position/pattern tables had a
one-semitone gap right below the highest reachable note — the closed-position
finger pattern's reach (5 semitones above a position's base) exceeds the
whole-tone step between positions, so whichever position happened to be last
always left one note unreachable just below its own top note. The generic
"every in-range pitch has at least one action" conformance check failed
immediately with the exact missing MIDI value, before this ever became a
runtime bug in quiz generation. The fix, now baked into the shared engine:
the declared MIDI range is trimmed to the last value with provably unbroken
coverage below it, computed from the actual fingering data rather than a
hand-derived formula.

**Violin** (adding the second instrument): an *un*-trimmed version of the same
gap showed up immediately at the *bottom* of the range instead of the top —
violin positions I-VII (whole-tone spaced, starting a whole step above the
open string) leave the note directly above each open string unreachable,
the same way cello's would without its "Half position." The fix was the same
fix, not a new one: add a "Half position" to violin's table too (positions I
and Half both use the "low 2nd finger" pattern, exactly mirroring cello).
This is the generalization paying for itself twice over — the second
instrument's bug was caught by a test suite that already existed, and the fix
was already understood from the first time.

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
  future data-shape change, can't collide with existing progress data. The
  selected instrument itself is also persisted, at `mnt.v1.selectedInstrument`.
- **Instrument selection**: a small React context (`InstrumentContext`) holds
  the currently selected `InstrumentDef` from the registry; a `<select>` in
  the header (top of the page, above every route) changes it. Each quiz route
  is keyed by `` `${instrument.id}-${modeId}` `` so switching instruments
  mid-quiz remounts with a fresh question instead of carrying over stale
  state from the other instrument.
- **Hosting**: GitHub Pages. `vite.config.ts` uses `command === "build"` to
  set `base: "/musical-note-trainer/"` only for production builds — the dev
  server serves from `/` so `npm run dev` doesn't need the production path
  prefix.

## Visual theme

Colors were chosen and verified against the WCAG 2.1 contrast formula, not
eyeballed. Spartan Green `#18453B` on white is 10.76:1 (light mode accent,
text, and filled-button backgrounds paired with white text). Dark mode uses a
lighter `#6FCF97` against the existing `#16171d` background (9.4:1) — a dark
background needs a *light* accent, so the two modes intentionally use
different accent colors, not just an opacity tweak of the same one. Filled
buttons use a dedicated `--accent-contrast` variable (white in light mode,
near-black `#0a1f19` in dark mode) rather than assuming white text always
works, since it doesn't against the light-mode-inverted dark-mode accent.

## Explicitly deferred / not built

- No plugin registry or dynamic instrument loader — with two real instruments
  in hand, both fit `Technique<TAction>` and the shared string-instrument
  engine without one. That would only become worth reconsidering for an
  instrument whose technique model doesn't fit "string + position + finger"
  at all (winds, brass, keys).
- No E2E test framework — unit tests on the pure logic (highest bug density,
  cheapest to test) plus manual click-through per mode is proportionate for a
  solo personal tool.
- No automated visual-regression testing for the VexFlow/SVG output — a
  one-time manual per-clef reference checklist is enough.
- No full WCAG audit — just keyboard-navigable answers, correct/incorrect not
  conveyed by color alone, and ≥32px touch targets on the fingerboard diagram
  (worth doing now since phone/PWA is a near-term target).
