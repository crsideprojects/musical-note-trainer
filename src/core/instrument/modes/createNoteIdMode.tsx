import { useState } from "react";
import type { ClefId } from "../../music/clef";
import { CLEFS, randomClef, randomPitchInClef } from "../../music/clef";
import type { Pitch } from "../../music/pitch";
import {
  ALL_LETTERS,
  enharmonicsOf,
  formatPitch,
  pickRandom,
  pitchesEqual,
  randomInt,
  toMidi,
} from "../../music/pitch";
import { ChoiceAnswerInput } from "../../quiz/ChoiceAnswerInput";
import type { Question, QuizModeConfig } from "../../quiz/QuizModeConfig";
import { StaffRenderer } from "../../ui/StaffRenderer";
import { FingeringExplorer } from "../FingeringExplorer";
import type { StringInstrumentEngine } from "../stringInstrumentEngine";

type NoteQuestionPrompt =
  | { kind: "identify"; clef: ClefId; pitch: Pitch; choices: Pitch[] }
  | { kind: "enharmonic"; pitch: Pitch; choices: Pitch[] };

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

function generateIdentifyChoices(correct: Pitch, clef: ClefId): Pitch[] {
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
  return shuffle(distinctFormatted([correct, ...distractors]));
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

function generateEnharmonicChoices(prompt: Pitch, correct: Pitch): Pitch[] {
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

function FingeringReveal<TString extends string, TPosition extends string>({
  engine,
  instrumentLabel,
  pitch,
}: {
  engine: StringInstrumentEngine<TString, TPosition>;
  instrumentLabel: string;
  pitch: Pitch;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="note-id__reveal">
      <button type="button" className="toggle-button" onClick={() => setShow((s) => !s)}>
        {show ? "Hide" : "How do I play this?"}
      </button>
      {show && <FingeringExplorer engine={engine} instrumentLabel={instrumentLabel} pitch={pitch} />}
    </div>
  );
}

/**
 * Combines note-reading (staff -> name) and enharmonic-spelling questions into
 * one activity, since they're two facets of the same "know your notes" skill
 * rather than separate practice areas. Instrument-aware (not just clef-aware)
 * because it also offers an on-demand "how do I play this?" fingering reveal.
 */
export function createNoteIdMode<TString extends string, TPosition extends string>(
  engine: StringInstrumentEngine<TString, TPosition>,
  instrumentId: string,
  instrumentLabel: string,
  clefs: ClefId[],
): QuizModeConfig<NoteQuestionPrompt, Pitch> {
  return {
    id: "note-id",
    label: "Note ID",
    description: "Name the note shown on the staff, or its enharmonic spelling.",
    instrumentId,
    scopeLabel: `${instrumentLabel} · Note ID`,
    generateQuestion(): Question<NoteQuestionPrompt> {
      if (Math.random() < 0.5) {
        const clef = randomClef(clefs);
        const pitch = randomPitchInClef(clef);
        return {
          id: `identify-${clef}-${formatPitch(pitch)}-${Math.random()}`,
          prompt: { kind: "identify", clef, pitch, choices: generateIdentifyChoices(pitch, clef) },
        };
      }
      const pitch = randomPitchWithEnharmonic();
      const correct = pickRandom(enharmonicsOf(pitch));
      return {
        id: `enharmonic-${formatPitch(pitch)}-${Math.random()}`,
        prompt: { kind: "enharmonic", pitch, choices: generateEnharmonicChoices(pitch, correct) },
      };
    },
    getValidAnswers(question) {
      return question.prompt.kind === "identify"
        ? [question.prompt.pitch]
        : enharmonicsOf(question.prompt.pitch);
    },
    isAnswerCorrect(given, question) {
      if (given.length !== 1) return false;
      return question.prompt.kind === "identify"
        ? pitchesEqual(given[0], question.prompt.pitch)
        : enharmonicsOf(question.prompt.pitch).some((a) => pitchesEqual(a, given[0]));
    },
    formatAnswer: formatPitch,
    PromptDisplay({ prompt }) {
      return (
        <div className="note-id-prompt">
          {prompt.kind === "identify" ? (
            <IdentifyPrompt prompt={prompt} />
          ) : (
            <p>What is another name for {formatPitch(prompt.pitch)}?</p>
          )}
          <FingeringReveal engine={engine} instrumentLabel={instrumentLabel} pitch={prompt.pitch} />
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
}

function IdentifyPrompt({
  prompt,
}: {
  prompt: Extract<NoteQuestionPrompt, { kind: "identify" }>;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <>
      <p>{CLEFS[prompt.clef].label} — what note is this?</p>
      <StaffRenderer clef={prompt.clef} pitch={prompt.pitch} showHint={showHint} />
      <button type="button" className="toggle-button" onClick={() => setShowHint((s) => !s)}>
        {showHint ? "Hide" : "Show"} line/space hint
      </button>
    </>
  );
}
