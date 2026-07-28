# Musical Note Trainer

A personal practice app for reading music notation and mapping notes to an
instrument. The v1 target is cello: recognizing notes across bass, tenor, and
treble clef; naming enharmonic equivalents; and finding where a note is played
on the fingerboard (including that the same pitch is often playable on more
than one string). The repo is named instrument-agnostically because other
instruments may be added later — see [docs/design.md](docs/design.md) for how
the codebase is structured to make that additive rather than a rewrite.

This project also doubles as a hands-on exercise in a lightweight AI-Driven
Development Life Cycle (AIDLC) workflow: [docs/requirements.md](docs/requirements.md)
and [docs/design.md](docs/design.md) were written before implementation, and
work is tracked via GitHub Issues / a Project board rather than a separate
planning document.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. Run the test suite with:

```bash
npm test
```

## Docs

- [docs/requirements.md](docs/requirements.md) — problem statement, v1 feature list, acceptance criteria
- [docs/design.md](docs/design.md) — architecture: the core/instrument boundary, data model
- [docs/fingering-model.md](docs/fingering-model.md) — the cello fingering convention used, and why it needs a sanity check against a real teacher/method book
