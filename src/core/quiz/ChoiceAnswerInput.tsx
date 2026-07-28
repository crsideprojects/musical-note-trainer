// Shared single-select multiple-choice input, reused by Note ID, Enharmonics, and
// the note-to-fingering direction of the Fingering mode. The "same note, different
// strings" mode uses its own multi-select input instead (see instruments/cello).

interface ChoiceAnswerInputProps<TAnswer> {
  choices: TAnswer[];
  formatChoice: (choice: TAnswer) => string;
  onSubmit: (answer: TAnswer[]) => void;
  disabled: boolean;
}

export function ChoiceAnswerInput<TAnswer>({
  choices,
  formatChoice,
  onSubmit,
  disabled,
}: ChoiceAnswerInputProps<TAnswer>) {
  return (
    <div className="choice-answer-input" role="group" aria-label="Answer choices">
      {choices.map((choice, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onSubmit([choice])}
          className="choice-button"
        >
          {formatChoice(choice)}
        </button>
      ))}
    </div>
  );
}
