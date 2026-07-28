import type { ClefId } from "../music/clef";
import { CLEFS, randomClef, randomPitchInClef } from "../music/clef";
import type { Pitch } from "../music/pitch";
import { ALL_LETTERS, formatPitch, pickRandom, pitchesEqual, toMidi } from "../music/pitch";
import { ChoiceAnswerInput } from "../quiz/ChoiceAnswerInput";
import type { Question, QuizModeConfig } from "../quiz/QuizModeConfig";
import { StaffRenderer } from "../ui/StaffRenderer";

interface NoteIdPrompt {
  clef: ClefId;
  pitch: Pitch;
  choices: Pitch[];
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

function generateChoices(correct: Pitch, clef: ClefId): Pitch[] {
  const { min, max } = CLEFS[clef].range;
  const minMidi = toMidi(min);
  const maxMidi = toMidi(max);
  const distractors: Pitch[] = [];
  let attempts = 0;
  while (distractors.length < 3 && attempts < 100) {
    attempts++;
    const letter = pickRandom(ALL_LETTERS);
    const accidental = pickRandom([-1, 0, 1] as const);
    const octave = pickRandom(
      Array.from({ length: max.octave - min.octave + 1 }, (_, i) => min.octave + i),
    );
    const candidate: Pitch = { letter, accidental, octave };
    const midi = toMidi(candidate);
    if (midi < minMidi || midi > maxMidi) continue;
    if (formatPitch(candidate) === formatPitch(correct)) continue;
    distractors.push(candidate);
  }
  const choices = distinctFormatted([correct, ...distractors]);
  return shuffle(choices);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const noteIdMode: QuizModeConfig<NoteIdPrompt, Pitch> = {
  id: "note-id",
  label: "Note ID",
  description: "Name the note shown on the staff.",
  instrumentId: "core",
  generateQuestion(): Question<NoteIdPrompt> {
    const clef = randomClef();
    const pitch = randomPitchInClef(clef);
    return {
      id: `${clef}-${formatPitch(pitch)}-${Math.random()}`,
      prompt: { clef, pitch, choices: generateChoices(pitch, clef) },
    };
  },
  getValidAnswers(question) {
    return [question.prompt.pitch];
  },
  isAnswerCorrect(given, question) {
    return given.length === 1 && pitchesEqual(given[0], question.prompt.pitch);
  },
  formatAnswer: formatPitch,
  PromptDisplay({ prompt }) {
    return (
      <div>
        <p>{CLEFS[prompt.clef].label} — what note is this?</p>
        <StaffRenderer clef={prompt.clef} pitch={prompt.pitch} />
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
