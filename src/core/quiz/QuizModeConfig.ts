import type { ComponentType } from "react";

export interface Question<TPrompt> {
  id: string;
  prompt: TPrompt;
}

/**
 * The one shared contract between the generic QuizRunner and every quiz mode,
 * instrument-agnostic or instrument-specific. getValidAnswers/isAnswerCorrect work
 * on arrays uniformly so single-answer and multi-select modes (e.g. "same note,
 * different strings") share the same shape rather than needing special-casing.
 */
export interface QuizModeConfig<TPrompt, TAnswer> {
  id: string;
  label: string;
  description: string;
  /** Namespaces progress storage — "core" for instrument-agnostic modes, else e.g. "cello". */
  instrumentId: string;
  generateQuestion(): Question<TPrompt>;
  getValidAnswers(question: Question<TPrompt>): TAnswer[];
  isAnswerCorrect(given: TAnswer[], question: Question<TPrompt>): boolean;
  formatAnswer(answer: TAnswer): string;
  PromptDisplay: ComponentType<{ prompt: TPrompt }>;
  AnswerInput: ComponentType<{
    question: Question<TPrompt>;
    onSubmit: (answer: TAnswer[]) => void;
    disabled: boolean;
  }>;
}
