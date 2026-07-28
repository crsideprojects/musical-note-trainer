import { useState } from "react";
import type { Pitch } from "../../music/pitch";
import { formatPitch, randomInt, spellingsForMidi } from "../../music/pitch";
import type { Question, QuizModeConfig } from "../../quiz/QuizModeConfig";
import { StringFingerboardDiagram } from "../StringFingerboardDiagram";
import type { StringFingering, StringInstrumentEngine } from "../stringInstrumentEngine";

interface SameNotePrompt {
  pitch: Pitch;
}

function fingeringKey<TString extends string, TPosition extends string>(
  f: StringFingering<TString, TPosition>,
): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function sameSet<TString extends string, TPosition extends string>(
  a: StringFingering<TString, TPosition>[],
  b: StringFingering<TString, TPosition>[],
): boolean {
  if (a.length !== b.length) return false;
  const bKeys = new Set(b.map(fingeringKey));
  return a.every((f) => bKeys.has(fingeringKey(f)));
}

export function createSameNoteMode<TString extends string, TPosition extends string>(
  engine: StringInstrumentEngine<TString, TPosition>,
  instrumentId: string,
  instrumentLabel: string,
): QuizModeConfig<SameNotePrompt, StringFingering<TString, TPosition>> {
  function randomPitchWithMultipleFingerings(): Pitch {
    let attempts = 0;
    while (attempts < 200) {
      attempts++;
      const midi = randomInt(engine.midiRange.min, engine.midiRange.max);
      const spellings = spellingsForMidi(midi);
      const pitch = spellings.find((p) => p.accidental === 0) ?? spellings[0];
      if (engine.fingeringsForPitch(pitch).length >= 2) return pitch;
    }
    // Fall back to the lowest modeled note, which is always reachable at least one way
    // (may not have multiple fingerings on every instrument, but generation won't hang).
    const midi = engine.midiRange.min;
    const spellings = spellingsForMidi(midi);
    return spellings.find((p) => p.accidental === 0) ?? spellings[0];
  }

  return {
    id: "same-note",
    label: "Same note, different strings",
    description: "Find every place on the fingerboard that plays a given note.",
    instrumentId,
    generateQuestion(): Question<SameNotePrompt> {
      const pitch = randomPitchWithMultipleFingerings();
      return { id: `${formatPitch(pitch)}-${Math.random()}`, prompt: { pitch } };
    },
    getValidAnswers(question) {
      return engine.fingeringsForPitch(question.prompt.pitch);
    },
    isAnswerCorrect(given, question) {
      return sameSet(given, engine.fingeringsForPitch(question.prompt.pitch));
    },
    formatAnswer: engine.formatFingering,
    PromptDisplay({ prompt }) {
      return (
        <div>
          <p>Select every place on the fingerboard that plays {formatPitch(prompt.pitch)}.</p>
        </div>
      );
    },
    AnswerInput({ onSubmit, disabled }) {
      const [selected, setSelected] = useState<StringFingering<TString, TPosition>[]>([]);

      function toggle(fingering: StringFingering<TString, TPosition>) {
        setSelected((current) =>
          current.some((f) => fingeringKey(f) === fingeringKey(fingering))
            ? current.filter((f) => fingeringKey(f) !== fingeringKey(fingering))
            : [...current, fingering],
        );
      }

      return (
        <div>
          <StringFingerboardDiagram
            engine={engine}
            instrumentLabel={instrumentLabel}
            selectable={!disabled}
            selected={selected}
            onToggle={toggle}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={disabled || selected.length === 0}
            onClick={() => onSubmit(selected)}
          >
            Submit
          </button>
        </div>
      );
    },
  };
}
