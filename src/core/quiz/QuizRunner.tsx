import { useState } from "react";
import { getStats, recordAttempt, resetStats } from "../storage/progress";
import type { QuizModeConfig, Question } from "./QuizModeConfig";

interface QuizRunnerProps<TPrompt, TAnswer> {
  config: QuizModeConfig<TPrompt, TAnswer>;
}

export function QuizRunner<TPrompt, TAnswer>({ config }: QuizRunnerProps<TPrompt, TAnswer>) {
  const [question, setQuestion] = useState<Question<TPrompt>>(() => config.generateQuestion());
  const [given, setGiven] = useState<TAnswer[] | null>(null);
  const [stats, setStats] = useState(() => getStats(config.instrumentId, config.id));

  const { PromptDisplay, AnswerInput } = config;
  const answered = given !== null;
  const correct = answered && config.isAnswerCorrect(given, question);
  const pct = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : null;

  function handleSubmit(answer: TAnswer[]) {
    const isCorrect = config.isAnswerCorrect(answer, question);
    setGiven(answer);
    setStats(recordAttempt(config.instrumentId, config.id, isCorrect));
  }

  function nextQuestion() {
    setQuestion(config.generateQuestion());
    setGiven(null);
  }

  function handleReset() {
    setStats(resetStats(config.instrumentId, config.id));
  }

  const validAnswers = config.getValidAnswers(question);

  return (
    <div className="quiz-runner">
      <div className="quiz-runner__score-bar" aria-live="polite">
        <span className="quiz-runner__score-label">{config.scopeLabel}</span>
        <span className="quiz-runner__score-value">
          {stats.correct} / {stats.attempted} correct{pct !== null ? ` (${pct}%)` : ""}
        </span>
        {stats.attempted > 0 && (
          <button type="button" className="quiz-runner__reset" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <PromptDisplay prompt={question.prompt} />

      <AnswerInput question={question} onSubmit={handleSubmit} disabled={answered} />

      {answered && (
        <div
          className={`quiz-feedback ${correct ? "quiz-feedback--correct" : "quiz-feedback--incorrect"}`}
          role="status"
        >
          <p>{correct ? "Correct!" : "Not quite."}</p>
          <p>
            Valid answer{validAnswers.length > 1 ? "s" : ""}:{" "}
            {validAnswers.map((a) => config.formatAnswer(a)).join(", ")}
          </p>
          <button type="button" className="btn-primary" onClick={nextQuestion}>
            Next question
          </button>
        </div>
      )}
    </div>
  );
}
