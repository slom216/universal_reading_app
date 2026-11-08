import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChoiceRound } from '../components/ChoiceRound';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { dayKey } from '../lib/dates';
import { nearest } from '../lib/distractors';
import { track } from '../lib/track';
import { useLang } from '../lib/useLang';
import { ROUND, allWords, dueWords } from '../lib/words';
import { BOX_DAYS, useProgress } from '../store/progress';

/** `/:lang/words`: glossary words from finished texts, back on a Leitner schedule. */
export function WordsPage() {
  const { lang, base, texts, code, rt } = useLang();
  const reviewed = useProgress((s) => s.reviewed);
  const practiced = useProgress((s) => s.practiced);
  const pool = useMemo(
    () => allWords(lang.id, texts).map((w) => w.meaning),
    [lang.id, texts],
  );
  // Read once per round, so answering does not reshuffle the round under the reader.
  const newDraw = (n: number) => ({
    n,
    items: dueWords(lang.id, texts, useProgress.getState(), dayKey()).slice(0, ROUND),
  });
  const [draw, setDraw] = useState(() => newDraw(0));

  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={base}>← {lang.name} home</Link>
      </p>
      <h1>{lang.name} word review</h1>
      <p className="lead">
        The glossary words of the texts you have finished. Each one you get right comes
        back later: the next day, then after {BOX_DAYS.slice(2).join(', ')} days. Get it
        wrong and it starts over.
      </p>
      {draw.items.length ? (
        <>
          <div className="phrase-tools">
            <ScriptToggle id={lang.id} />
            <RomanizeToggle id={lang.id} />
          </div>
          <ChoiceRound
            key={draw.n}
            items={draw.items}
            label="word"
            prompt={(w) => <span lang={code}>{rt(w.term)}</span>}
            answer={(w) => w.meaning}
            options={(w) => nearest(w.meaning, pool, 5)}
            renderOption={(o) => o}
            optionLang="en"
            onAnswer={(w, right) => reviewed(w.key, right)}
            onFinish={(score) => {
              practiced();
              track('word_review_complete', {
                reading_language: lang.id,
                score: Math.round(score * 100),
              });
            }}
            exit={{ to: base, label: `Back to ${lang.name}` }}
            onRestart={() => setDraw((d) => newDraw(d.n + 1))}
          />
        </>
      ) : (
        <NothingDue />
      )}
    </div>
  );
}

function NothingDue() {
  const { lang, base, key, texts } = useLang();
  const results = useProgress((s) => s.results);
  const started = texts.some((t) => results[key(t.id)]);
  return (
    <div className="card stack stack--tight" role="status">
      <p>
        {started
          ? 'Nothing to review today. Come back tomorrow, or finish another text to add its words.'
          : 'Finish a text’s quiz and its glossary words show up here.'}
      </p>
      <p>
        <Link className="button button--primary" to={base}>
          {lang.name} texts
        </Link>
      </p>
    </div>
  );
}
