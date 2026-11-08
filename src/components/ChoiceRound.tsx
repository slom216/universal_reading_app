import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { shuffle } from '../lib/distractors';

/** One round of pick-the-right-answer questions, shared by phrase practice and word review.
 *  At the end it offers the questions answered wrong as a new round. */
export function ChoiceRound<T>({
  items,
  prompt,
  note,
  answer,
  options,
  renderOption,
  optionLang,
  label,
  onAnswer,
  onFinish,
  exit,
  onRestart,
}: {
  items: T[];
  /** The question, shown as the legend. */
  prompt: (item: T) => ReactNode;
  note?: (item: T) => string | undefined;
  answer: (item: T) => string;
  /** Wrong answers for an item; the right one is added and the lot shuffled. */
  options: (item: T) => string[];
  renderOption: (option: string) => ReactNode;
  /** `lang` of the options. */
  optionLang: string;
  /** Noun for the progress line and buttons, e.g. "phrase". */
  label: string;
  onAnswer?: (item: T, right: boolean) => void;
  /** Called when a round ends, with the fraction correct. */
  onFinish: (score: number) => void;
  exit: { to: string; label: string };
  /** "Try again": the parent starts a fresh round. */
  onRestart: () => void;
}) {
  const [round, setRound] = useState(items);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<T[]>([]);
  const q: T | undefined = round[i];
  const choices = useMemo(
    () => (q === undefined ? [] : shuffle([answer(q), ...options(q)])),
    // Only a new question needs new choices; the callbacks are recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );

  if (q === undefined) {
    const score = round.length - missed.length;
    const perfect = missed.length === 0;
    return (
      <div className={`card quiz__result${perfect ? ' is-perfect' : ''}`} role="status">
        <div>
          <p className="quiz__score">
            {score} / {round.length} correct
          </p>
          {perfect && <p className="quiz__praise">Every one right.</p>}
        </div>
        <div className="row">
          <Link className="button button--ghost" to={exit.to}>
            {exit.label}
          </Link>
          {!perfect && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setRound(shuffle(missed));
                setI(0);
                setMissed([]);
              }}
            >
              Retry the {missed.length} you missed
            </button>
          )}
          <button type="button" className="button button--primary" onClick={onRestart}>
            New round
          </button>
        </div>
      </div>
    );
  }

  const right = picked === answer(q);
  const answered = picked !== null;
  const choose = (option: string) => {
    if (answered) return;
    setPicked(option);
    const ok = option === answer(q);
    const nowMissed = ok ? missed : [...missed, q];
    if (!ok) setMissed(nowMissed);
    onAnswer?.(q, ok);
    if (i === round.length - 1)
      onFinish((round.length - nowMissed.length) / round.length);
  };
  const qNote = note?.(q);

  return (
    <>
      <p className="text-sm text-muted">
        Question {i + 1} of {round.length} · {i + (answered ? 1 : 0) - missed.length}{' '}
        correct
      </p>
      <fieldset
        className={`card quiz__q${answered ? (right ? ' is-right' : ' is-wrong') : ''}`}
      >
        <legend>{prompt(q)}</legend>
        {qNote && <p className="text-sm text-muted practice__note">{qNote}</p>}
        <div className="quiz__choices">
          {choices.map((o) => (
            <button
              key={o}
              type="button"
              lang={optionLang}
              className={`quiz__choice practice__choice${
                answered && o === answer(q) ? ' is-answer' : ''
              }${o === picked && !right ? ' is-picked' : ''}`}
              aria-pressed={o === picked}
              disabled={answered}
              onClick={() => choose(o)}
            >
              {renderOption(o)}
            </button>
          ))}
        </div>
        {answered && (
          <p className="quiz__feedback" role="status">
            {right ? '✓ Correct.' : '✗ Not quite: the right answer is marked.'}
          </p>
        )}
      </fieldset>
      {answered && (
        <div className="row">
          <button
            type="button"
            className="button button--primary"
            // Keyboard flow: pick an answer, Enter for the next one.
            autoFocus
            onClick={() => {
              setI(i + 1);
              setPicked(null);
            }}
          >
            {i === round.length - 1 ? 'See score' : `Next ${label} →`}
          </button>
        </div>
      )}
    </>
  );
}
