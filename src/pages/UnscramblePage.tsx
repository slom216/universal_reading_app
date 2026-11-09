import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { shuffle } from '../lib/distractors';
import { track } from '../lib/track';
import { inOrder, scramble, textScrambles, type Scramble } from '../lib/unscramble';
import { useLang } from '../lib/useLang';
import { useProgress } from '../store/progress';

/** Building a sentence takes longer than picking an answer, so rounds are shorter. */
export const UNSCRAMBLE_ROUND = 10;

/** `/:lang/unscramble`: sentences from finished texts with their words shuffled. */
export function UnscramblePage() {
  const { lang, base, texts, key } = useLang();
  const practiced = useProgress((s) => s.practiced);
  // Read once per round, so finishing a text elsewhere does not reshuffle this one.
  const newDraw = (n: number) => {
    const { results } = useProgress.getState();
    const read = shuffle(texts.filter((t) => results[key(t.id)])).slice(0, 20);
    return {
      n,
      items: shuffle(read.flatMap((t) => textScrambles(lang, t))).slice(
        0,
        UNSCRAMBLE_ROUND,
      ),
    };
  };
  const [draw, setDraw] = useState(() => newDraw(0));

  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={base}>← {lang.name} home</Link>
      </p>
      <h1>{lang.name}: unscramble</h1>
      <p className="lead">
        Sentences from the texts you have finished, with the words mixed up. Tap them in the
        right order.
      </p>
      {draw.items.length ? (
        <>
          <div className="phrase-tools">
            <ScriptToggle id={lang.id} />
            <RomanizeToggle id={lang.id} />
          </div>
          <Round
            key={draw.n}
            items={draw.items}
            onFinish={(score) => {
              practiced();
              track('unscramble_complete', {
                reading_language: lang.id,
                score: Math.round(score * 100),
              });
            }}
            onRestart={() => setDraw((d) => newDraw(d.n + 1))}
          />
        </>
      ) : (
        <div className="card stack stack--tight" role="status">
          <p>Finish a text’s quiz and its sentences show up here.</p>
          <p>
            <Link className="button button--primary" to={base}>
              {lang.name} texts
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function Round({
  items,
  onFinish,
  onRestart,
}: {
  items: Scramble[];
  onFinish: (score: number) => void;
  onRestart: () => void;
}) {
  const { lang, base } = useLang();
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const q = items[i];

  if (!q)
    return (
      <div
        className={`card quiz__result${right === items.length ? ' is-perfect' : ''}`}
        role="status"
      >
        <p className="quiz__score">
          {right} / {items.length} correct
        </p>
        <div className="row">
          <Link className="button button--ghost" to={base}>
            Back to {lang.name}
          </Link>
          <button type="button" className="button button--primary" onClick={onRestart}>
            New round
          </button>
        </div>
      </div>
    );

  return (
    <>
      <p className="text-sm text-muted">
        Sentence {i + 1} of {items.length} · {right} correct
      </p>
      <Question
        key={q.key}
        q={q}
        last={i === items.length - 1}
        onChecked={(ok) => {
          const total = right + (ok ? 1 : 0);
          setRight(total);
          if (i === items.length - 1) onFinish(total / items.length);
        }}
        onNext={() => setI(i + 1)}
      />
    </>
  );
}

function Question({
  q,
  last,
  onChecked,
  onNext,
}: {
  q: Scramble;
  last: boolean;
  onChecked: (ok: boolean) => void;
  onNext: () => void;
}) {
  const { code, rt } = useLang();
  const [bank] = useState(() => scramble(q.tiles));
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const ok = inOrder(q.tiles, placed);
  const tile = (k: number, onClick: () => void) => (
    <button
      key={k}
      type="button"
      lang={code}
      className="quiz__choice practice__choice tile"
      disabled={checked}
      onClick={onClick}
    >
      {rt(q.tiles[k]!)}
    </button>
  );

  return (
    <>
      <fieldset className={`card quiz__q${checked ? (ok ? ' is-right' : ' is-wrong') : ''}`}>
        <legend>Put the words in order</legend>
        <div className="tiles tiles--answer" dir="auto" aria-label="Your sentence">
          {placed.map((k) => tile(k, () => setPlaced(placed.filter((p) => p !== k))))}
          {q.end && <span lang={code}>{q.end}</span>}
        </div>
        <div className="tiles" dir="auto" aria-label="Words to place">
          {bank
            .filter((k) => !placed.includes(k))
            .map((k) => tile(k, () => setPlaced([...placed, k])))}
        </div>
        {checked && (
          <p className="quiz__feedback" role="status">
            {ok ? '✓ Correct.' : '✗ Not quite. The sentence was: '}
            {!ok && <span lang={code}>{rt(q.tiles.join(q.joiner) + q.end)}</span>}
          </p>
        )}
      </fieldset>
      <div className="row">
        {checked ? (
          <button
            type="button"
            className="button button--primary"
            autoFocus
            onClick={onNext}
          >
            {last ? 'See score' : 'Next sentence →'}
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            disabled={placed.length < q.tiles.length}
            onClick={() => {
              setChecked(true);
              onChecked(ok);
            }}
          >
            Check
          </button>
        )}
      </div>
    </>
  );
}
