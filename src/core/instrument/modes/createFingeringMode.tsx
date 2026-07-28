import type { Pitch } from "../../music/pitch";
import { formatPitch, pickRandom, randomInt, spellingsForMidi } from "../../music/pitch";
import { ChoiceAnswerInput } from "../../quiz/ChoiceAnswerInput";
import type { Question, QuizModeConfig } from "../../quiz/QuizModeConfig";
import type { StringFingering, StringInstrumentEngine } from "../stringInstrumentEngine";

interface FingeringPrompt<TString extends string, TPosition extends string> {
  pitch: Pitch;
  choices: StringFingering<TString, TPosition>[];
}

function fingeringKey<TString extends string, TPosition extends string>(
  f: StringFingering<TString, TPosition>,
): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createFingeringMode<TString extends string, TPosition extends string>(
  engine: StringInstrumentEngine<TString, TPosition>,
  instrumentId: string,
  instrumentLabel: string,
): QuizModeConfig<FingeringPrompt<TString, TPosition>, StringFingering<TString, TPosition>> {
  function randomPlayablePitch(): Pitch {
    const midi = randomInt(engine.midiRange.min, engine.midiRange.max);
    const spellings = spellingsForMidi(midi);
    return spellings.find((p) => p.accidental === 0) ?? spellings[0];
  }

  function generateChoices(
    pitch: Pitch,
    correct: StringFingering<TString, TPosition>,
  ): StringFingering<TString, TPosition>[] {
    const all = engine.allFingerings();
    const validKeys = new Set(engine.fingeringsForPitch(pitch).map(fingeringKey));
    const distractors: StringFingering<TString, TPosition>[] = [];
    let attempts = 0;
    while (distractors.length < 3 && attempts < 200) {
      attempts++;
      const candidate = pickRandom(all);
      if (validKeys.has(fingeringKey(candidate))) continue;
      if (distractors.some((d) => fingeringKey(d) === fingeringKey(candidate))) continue;
      distractors.push(candidate);
    }
    return shuffle([correct, ...distractors]);
  }

  return {
    id: "fingering",
    label: "Fingering",
    description: "Find the string, position, and finger for a note.",
    instrumentId,
    scopeLabel: `${instrumentLabel[0].toUpperCase()}${instrumentLabel.slice(1)} · Fingering`,
    generateQuestion(): Question<FingeringPrompt<TString, TPosition>> {
      const pitch = randomPlayablePitch();
      const valid = engine.fingeringsForPitch(pitch);
      const correct = pickRandom(valid);
      return {
        id: `${formatPitch(pitch)}-${Math.random()}`,
        prompt: { pitch, choices: generateChoices(pitch, correct) },
      };
    },
    getValidAnswers(question) {
      return engine.fingeringsForPitch(question.prompt.pitch);
    },
    isAnswerCorrect(given, question) {
      if (given.length !== 1) return false;
      return engine.fingeringsForPitch(question.prompt.pitch).some(
        (a) => fingeringKey(a) === fingeringKey(given[0]),
      );
    },
    formatAnswer: engine.formatFingering,
    PromptDisplay({ prompt }) {
      return (
        <div>
          <p>
            Where do you play {formatPitch(prompt.pitch)} on the {instrumentLabel}?
          </p>
        </div>
      );
    },
    AnswerInput({ question, onSubmit, disabled }) {
      return (
        <ChoiceAnswerInput
          choices={question.prompt.choices}
          formatChoice={engine.formatFingering}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    },
  };
}
