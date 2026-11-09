import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '../content/schema';

type Answer = number | boolean | undefined;

/** Lesson strings in the target language, already in the reader's script. */
export type QuizLabels = { trueLabel: string; falseLabel: string; perfect: string };

const same = (s: string) => s;

const openModal = (d: HTMLDialogElement | null) => {
  if (!d || d.open) return;
  // jsdom has no showModal; the attribute is enough there.
  if (typeof d.showModal === 'function') d.showModal();
  else d.setAttribute('open', '');
};

const CONFETTI_COLORS = ['--color-red', '--color-mustard', '--color-sky', '--color-on-red'];

/** Paper pieces that fall once over the popup. CSS hides them for reduced motion. */
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      '--x': `${Math.random() * 100}%`,
      '--drift': `${Math.round((Math.random() - 0.5) * 200)}px`,
      '--spin': `${Math.round(360 + Math.random() * 720)}deg`,
      '--delay': `${(Math.random() * 0.5).toFixed(2)}s`,
      '--dur': `${(2.4 + Math.random() * 1.6).toFixed(2)}s`,
      '--c': `var(${CONFETTI_COLORS[i % CONFETTI_COLORS.length]})`,
    })),
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((style, i) => (
        <span key={i} style={style as CSSProperties} />
      ))}
    </div>
  );
}

export function Quiz({
  questions,
  onComplete,
  next,
  labels,
  code,
  tr = same,
  rt = tr,
  shareOnX,
}: {
  questions: Question[];
  onComplete: (score: number) => void;
  /** Where to go after the quiz: the next text, or back to the level list. */
  next: { to: string; label: string; onClick?: () => void };
  labels: QuizLabels;
  /** `lang` of the questions and options. */
  code: string;
  /** Script conversion for question text (Interslavic Cyrillic). */
  tr?: (s: string) => string;
  /** `tr` with the pronunciation guide as ruby. */
  rt?: (s: string) => ReactNode;
  /** X (Twitter) post link for the result, given the score. */
  shareOnX?: {
    href: (correct: number, total: number) => string;
    onClick?: () => void;
  };
}) {
  const tfOptions: { label: ReactNode; value: boolean }[] = [
    { label: labels.trueLabel, value: true },
    { label: labels.falseLabel, value: false },
  ];
  const correctLabel = (q: Question) =>
    q.type === 'mc'
      ? tr(q.options[q.answer] ?? '')
      : q.answer
        ? labels.trueLabel
        : labels.falseLabel;

  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);
  // The result opens as a popup; closing it leaves the same card under the questions.
  const [popup, setPopup] = useState(false);

  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const unanswered = answers.filter((a) => a === undefined).length;
  const perfect = correct === questions.length;

  const submit = () => {
    setSubmitted(true);
    setPopup(true);
    onComplete(correct / questions.length);
  };
  const retry = () => {
    setAnswers(questions.map(() => undefined));
    setSubmitted(false);
    setPopup(false);
  };

  const shareLink = shareOnX && (
    <a
      className="button button--x"
      href={shareOnX.href(correct, questions.length)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={shareOnX.onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
  const nextLink = (primary: boolean) => (
    <Link
      className={`button button--arrow ${primary ? 'button--primary' : 'button--ghost'}`}
      to={next.to}
      onClick={next.onClick}
    >
      {next.label}
    </Link>
  );
  const result = (
    <div
      className={`card quiz__result${perfect ? ' is-perfect' : ''}`}
      role="status"
    >
      {perfect ? (
        <div>
          <p className="quiz__score" lang={code}>
            {labels.perfect}
          </p>
          <p className="quiz__praise">
            All {questions.length} answers are right. Well done — you understood the whole
            text.
          </p>
        </div>
      ) : (
        <p className="quiz__score">
          {correct} / {questions.length} correct
        </p>
      )}
      <div className="row quiz__actions">
        {shareLink}
        {nextLink(perfect)}
        {!perfect && (
          <button type="button" className="button button--primary" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );

  return (
    <form
      className="quiz stack"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {questions.map((q, i) => {
        const choices =
          q.type === 'mc'
            ? q.options.map((label, value) => ({ label: rt(label), value }))
            : tfOptions;
        const isRight = answers[i] === q.answer;
        return (
          <fieldset
            key={i}
            className={`card quiz__q${submitted ? (isRight ? ' is-right' : ' is-wrong') : ''}`}
          >
            <legend>
              <span className="quiz__num">{i + 1}.</span>{' '}
              <span lang={code}>{rt(q.prompt)}</span>
              {q.type === 'tf' && (
                <span className="chip chip--soft" lang={code}>
                  {labels.trueLabel} / {labels.falseLabel}
                </span>
              )}
            </legend>
            <div
              className={
                q.type === 'tf' ? 'quiz__choices quiz__choices--row' : 'quiz__choices'
              }
            >
              {choices.map((c) => (
                <label key={String(c.value)} className="quiz__choice" lang={code}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === c.value}
                    disabled={submitted}
                    onChange={() =>
                      setAnswers((a) => a.map((v, j) => (j === i ? c.value : v)))
                    }
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {submitted && (
              <p className="quiz__feedback" role="status">
                {isRight
                  ? '✓ Correct.'
                  : `✗ Correct answer: ${correctLabel(q).replace(/[.!?]$/, '')}.`}
                {q.explanation && <span lang={code}> {tr(q.explanation)}</span>}
              </p>
            )}
          </fieldset>
        );
      })}

      {submitted && popup && (
        <dialog
          ref={openModal}
          className="result-dialog"
          aria-label="Your result"
          onClose={() => setPopup(false)}
          // A click on the dimmed area around the card lands on the dialog itself.
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        >
          {correct * 2 >= questions.length && <Confetti />}
          <div className="result-dialog__card">
            {result}
            <button
              type="button"
              className="result-dialog__close"
              aria-label="Close"
              onClick={() => setPopup(false)}
            >
              ×
            </button>
          </div>
        </dialog>
      )}
      {submitted ? (
        !popup && result
      ) : (
        <div className="row">
          <button
            type="submit"
            className="button button--primary"
            disabled={unanswered > 0}
          >
            Check answers
          </button>
          {unanswered > 0 && (
            <span className="text-muted text-sm">
              {unanswered} question(s) left to answer
            </span>
          )}
        </div>
      )}
    </form>
  );
}
