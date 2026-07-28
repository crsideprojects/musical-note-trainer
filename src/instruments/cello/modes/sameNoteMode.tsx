import { useState } from "react";
import type { Pitch } from "../../../core/music/pitch";
import { formatPitch, randomInt, spellingsForMidi } from "../../../core/music/pitch";
import type { Question, QuizModeConfig } from "../../../core/quiz/QuizModeConfig";
import { FingerboardDiagram } from "../FingerboardDiagram";
import type { CelloFingering } from "../technique";
import { CELLO_MIDI_RANGE, fingeringsForPitch, formatFingering } from "../technique";

interface SameNotePrompt {
  pitch: Pitch;
}

function fingeringKey(f: CelloFingering): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function sameSet(a: CelloFingering[], b: CelloFingering[]): boolean {
  if (a.length !== b.length) return false;
  const bKeys = new Set(b.map(fingeringKey));
  return a.every((f) => bKeys.has(fingeringKey(f)));
}

function randomPitchWithMultipleFingerings(): Pitch {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const midi = randomInt(CELLO_MIDI_RANGE.min, CELLO_MIDI_RANGE.max);
    const spellings = spellingsForMidi(midi);
    const pitch = spellings.find((p) => p.accidental === 0) ?? spellings[0];
    if (fingeringsForPitch(pitch).length >= 2) return pitch;
  }
  // Fall back to the open A string, which is always reachable at least two ways.
  const midi = CELLO_MIDI_RANGE.min;
  const spellings = spellingsForMidi(midi);
  return spellings.find((p) => p.accidental === 0) ?? spellings[0];
}

export const sameNoteMode: QuizModeConfig<SameNotePrompt, CelloFingering> = {
  id: "same-note",
  label: "Same note, different strings",
  description: "Find every place on the fingerboard that plays a given note.",
  instrumentId: "cello",
  generateQuestion(): Question<SameNotePrompt> {
    const pitch = randomPitchWithMultipleFingerings();
    return { id: `${formatPitch(pitch)}-${Math.random()}`, prompt: { pitch } };
  },
  getValidAnswers(question) {
    return fingeringsForPitch(question.prompt.pitch);
  },
  isAnswerCorrect(given, question) {
    return sameSet(given, fingeringsForPitch(question.prompt.pitch));
  },
  formatAnswer: formatFingering,
  PromptDisplay({ prompt }) {
    return (
      <div>
        <p>Select every place on the fingerboard that plays {formatPitch(prompt.pitch)}.</p>
      </div>
    );
  },
  AnswerInput({ onSubmit, disabled }) {
    const [selected, setSelected] = useState<CelloFingering[]>([]);

    function toggle(fingering: CelloFingering) {
      setSelected((current) =>
        current.some((f) => fingeringKey(f) === fingeringKey(fingering))
          ? current.filter((f) => fingeringKey(f) !== fingeringKey(fingering))
          : [...current, fingering],
      );
    }

    return (
      <div>
        <FingerboardDiagram selectable={!disabled} selected={selected} onToggle={toggle} />
        <button type="button" disabled={disabled || selected.length === 0} onClick={() => onSubmit(selected)}>
          Submit
        </button>
      </div>
    );
  },
};
