import { Suspense, use, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { PHRASE_LANGS, loadPhrases, type Phrase } from '../content/phrases';
import { LANGS, isLangId, type LangId } from '../languages';
import { nearest, shuffle } from '../lib/distractors';
import { useScript } from '../lib/script';
import { track } from '../lib/track';
import { NotFoundPage } from './NotFoundPage';

export const PRACTICE_SIZES = [20, 50, 100] as const;

/** Links that start a practice round of 20, 50 or 100 phrases drawn at random from all 1000. */
export function PracticeLinks({ id }: { id: LangId }) {
  return (
    <div className="row">
      <span className="text-sm">Practice random phrases:</span>
      {PRACTICE_SIZES.map((n) => (
        <Link
          key={n}
          className="button button--secondary"
          to={`/phrases/${id}/practice?n=${n}`}
        >
          {n}
        </Link>
      ))}
    </div>
  );
}

/** `/phrases/:lang/practice?n=20`: pick the translation of an English phrase out of six. */
export function PhrasePracticePage() {
  const { lang } = useParams();
  const [params] = useSearchParams();
  // English is its own source, so there is nothing to translate.
  if (!isLangId(lang) || lang === 'en' || !PHRASE_LANGS.includes(lang))
    return <NotFoundPage />;
  const n = Number(params.get('n'));
  const size = PRACTICE_SIZES.find((s) => s === n);
  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={`/phrases/${lang}`}>← {LANGS[lang].name} phrases</Link>
      </p>
      <h1>{LANGS[lang].name} phrase practice</h1>
      {size ? (
        <Suspense fallback={<p className="text-muted">Loading phrases…</p>}>
          <Practice key={size} id={lang} size={size} />
        </Suspense>
      ) : (
        <>
          <p className="lead">
            You get a phrase in English; pick its {LANGS[lang].name} translation out of six.
          </p>
          <PracticeLinks id={lang} />
        </>
      )}
    </div>
  );
}

function Practice({ id, size }: { id: LangId; size: number }) {
  const phrases = use(loadPhrases(id));
  const lang = LANGS[id];
  const { code, rt } = useScript(id, lang.code);
  // Bumping the round reshuffles the questions for "Try again".
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => shuffle(phrases).slice(0, size),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- round forces a new shuffle
    [phrases, size, round],
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q: Phrase | undefined = questions[i];
  const pool = useMemo(() => phrases.map((p) => p.text), [phrases]);
  // Five wrong answers that look most like the right one, so the choice takes reading.
  const options = useMemo(
    () => (q ? shuffle([q.text, ...nearest(q.text, pool, 5)]) : []),
    [q, pool],
  );

  const restart = () => {
    setRound((r) => r + 1);
    setI(0);
    setPicked(null);
    setScore(0);
  };

  if (!q) {
    const perfect = score === questions.length;
    return (
      <div className={`card quiz__result${perfect ? ' is-perfect' : ''}`} role="status">
        <div>
          <p className="quiz__score">
            {score} / {questions.length} correct
          </p>
          {perfect && (
            <p className="quiz__praise">Every one right. Try a bigger round next.</p>
          )}
        </div>
        <div className="row">
          <Link className="button button--ghost" to={`/phrases/${id}`}>
            Back to phrases
          </Link>
          <button type="button" className="button button--primary" onClick={restart}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const choose = (text: string) => {
    if (picked !== null) return;
    setPicked(text);
    const right = text === q.text;
    if (right) setScore((s) => s + 1);
    if (i === questions.length - 1)
      track('phrase_practice_complete', {
        reading_language: id,
        size,
        score: Math.round(((score + (right ? 1 : 0)) / questions.length) * 100),
      });
  };
  const answered = picked !== null;
  const right = picked === q.text;

  return (
    <>
      <div className="phrase-tools">
        <ScriptToggle id={id} />
        <RomanizeToggle id={id} />
      </div>
      <p className="text-sm text-muted">
        Question {i + 1} of {questions.length} · {score} correct
      </p>
      <fieldset
        className={`card quiz__q${answered ? (right ? ' is-right' : ' is-wrong') : ''}`}
      >
        <legend>
          <span lang="en">{q.phrase}</span>
        </legend>
        {q.note && <p className="text-sm text-muted practice__note">{q.note}</p>}
        <div className="quiz__choices">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              lang={code}
              className={`quiz__choice practice__choice${
                answered && o === q.text ? ' is-answer' : ''
              }${o === picked && !right ? ' is-picked' : ''}`}
              aria-pressed={o === picked}
              disabled={answered}
              onClick={() => choose(o)}
            >
              {rt(o)}
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
            {i === questions.length - 1 ? 'See score' : 'Next phrase →'}
          </button>
        </div>
      )}
    </>
  );
}
