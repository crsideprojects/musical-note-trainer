import type { Pitch } from "../../../core/music/pitch";
import { formatPitch, pickRandom, randomInt, spellingsForMidi } from "../../../core/music/pitch";
import { ChoiceAnswerInput } from "../../../core/quiz/ChoiceAnswerInput";
import type { Question, QuizModeConfig } from "../../../core/quiz/QuizModeConfig";
import type { CelloFingering } from "../technique";
import { allFingerings, CELLO_MIDI_RANGE, fingeringsForPitch, formatFingering } from "../technique";

interface FingeringPrompt {
  pitch: Pitch;
  choices: CelloFingering[];
}

function fingeringKey(f: CelloFingering): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function randomPlayablePitch(): Pitch {
  const midi = randomInt(CELLO_MIDI_RANGE.min, CELLO_MIDI_RANGE.max);
  const spellings = spellingsForMidi(midi);
  return spellings.find((p) => p.accidental === 0) ?? spellings[0];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateChoices(pitch: Pitch, correct: CelloFingering): CelloFingering[] {
  const all = allFingerings();
  const validKeys = new Set(fingeringsForPitch(pitch).map(fingeringKey));
  const distractors: CelloFingering[] = [];
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

export const fingeringMode: QuizModeConfig<FingeringPrompt, CelloFingering> = {
  id: "fingering",
  label: "Fingering",
  description: "Find the string, position, and finger for a note.",
  instrumentId: "cello",
  generateQuestion(): Question<FingeringPrompt> {
    const pitch = randomPlayablePitch();
    const valid = fingeringsForPitch(pitch);
    const correct = pickRandom(valid);
    return {
      id: `${formatPitch(pitch)}-${Math.random()}`,
      prompt: { pitch, choices: generateChoices(pitch, correct) },
    };
  },
  getValidAnswers(question) {
    return fingeringsForPitch(question.prompt.pitch);
  },
  isAnswerCorrect(given, question) {
    if (given.length !== 1) return false;
    return fingeringsForPitch(question.prompt.pitch).some(
      (a) => fingeringKey(a) === fingeringKey(given[0]),
    );
  },
  formatAnswer: formatFingering,
  PromptDisplay({ prompt }) {
    return (
      <div>
        <p>Where do you play {formatPitch(prompt.pitch)} on the cello?</p>
      </div>
    );
  },
  AnswerInput({ question, onSubmit, disabled }) {
    return (
      <ChoiceAnswerInput
        choices={question.prompt.choices}
        formatChoice={formatFingering}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  },
};
