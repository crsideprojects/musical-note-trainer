import type { Pitch } from "../music/pitch";
import {
  ALL_LETTERS,
  enharmonicsOf,
  formatPitch,
  pickRandom,
  pitchesEqual,
  randomInt,
  toMidi,
} from "../music/pitch";
import { ChoiceAnswerInput } from "../quiz/ChoiceAnswerInput";
import type { Question, QuizModeConfig } from "../quiz/QuizModeConfig";

interface EnharmonicsPrompt {
  pitch: Pitch;
  choices: Pitch[];
}

function randomPitchWithEnharmonic(): Pitch {
  // Rejection sampling: natural D, G, and A have no single-accidental enharmonic
  // equivalent (see docs/design.md), so keep drawing until we get a pitch that does.
  let pitch: Pitch;
  let attempts = 0;
  do {
    pitch = {
      letter: pickRandom(ALL_LETTERS),
      accidental: pickRandom([-1, 0, 1] as const),
      octave: randomInt(2, 5),
    };
    attempts++;
  } while (enharmonicsOf(pitch).length === 0 && attempts < 100);
  return pitch;
}

function distinctFormatted(pitches: Pitch[]): Pitch[] {
  const seen = new Set<string>();
  return pitches.filter((p) => {
    const key = formatPitch(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateChoices(prompt: Pitch, correct: Pitch): Pitch[] {
  const distractors: Pitch[] = [];
  let attempts = 0;
  while (distractors.length < 3 && attempts < 100) {
    attempts++;
    const candidate: Pitch = {
      letter: pickRandom(ALL_LETTERS),
      accidental: pickRandom([-1, 0, 1] as const),
      octave: randomInt(2, 5),
    };
    if (toMidi(candidate) === toMidi(prompt)) continue; // enharmonic to the prompt itself
    if (formatPitch(candidate) === formatPitch(correct)) continue;
    distractors.push(candidate);
  }
  return shuffle(distinctFormatted([correct, ...distractors]));
}

export const enharmonicsMode: QuizModeConfig<EnharmonicsPrompt, Pitch> = {
  id: "enharmonics",
  label: "Enharmonics",
  description: "Name another spelling for the same pitch.",
  instrumentId: "core",
  generateQuestion(): Question<EnharmonicsPrompt> {
    const pitch = randomPitchWithEnharmonic();
    const correct = pickRandom(enharmonicsOf(pitch));
    return {
      id: `${formatPitch(pitch)}-${Math.random()}`,
      prompt: { pitch, choices: generateChoices(pitch, correct) },
    };
  },
  getValidAnswers(question) {
    return enharmonicsOf(question.prompt.pitch);
  },
  isAnswerCorrect(given, question) {
    if (given.length !== 1) return false;
    return enharmonicsOf(question.prompt.pitch).some((a) => pitchesEqual(a, given[0]));
  },
  formatAnswer: formatPitch,
  PromptDisplay({ prompt }) {
    return (
      <div>
        <p>What is another name for {formatPitch(prompt.pitch)}?</p>
      </div>
    );
  },
  AnswerInput({ question, onSubmit, disabled }) {
    return (
      <ChoiceAnswerInput
        choices={question.prompt.choices}
        formatChoice={formatPitch}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  },
};
