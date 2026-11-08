import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChoiceRound } from '../components/ChoiceRound';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { glossaryNeedle } from '../content/schema';
import { shuffle } from '../lib/distractors';
import { gapOptions, textGaps } from '../lib/gaps';
import { track } from '../lib/track';
import { useLang } from '../lib/useLang';
import { ROUND } from '../lib/words';
import { useProgress } from '../store/progress';

/** `/:lang/gaps`: sentences from finished texts with a glossary word missing. */
export function GapsPage() {
  const { lang, base, texts, key, code, rt } = useLang();
  const practiced = useProgress((s) => s.practiced);
  const pool = useMemo(
    () => texts.flatMap((t) => t.glossary.map((g) => glossaryNeedle(g, lang.articles))),
    [texts, lang.articles],
  );
  // Read once per round, so finishing a text elsewhere does not reshuffle this one.
  const newDraw = (n: number) => {
    const { results } = useProgress.getState();
    // Cutting gaps out of all 300 texts takes ~2 s, so sample the texts first.
    const read = shuffle(texts.filter((t) => results[key(t.id)])).slice(0, ROUND);
    return { n, items: shuffle(read.flatMap((t) => textGaps(lang, t))).slice(0, ROUND) };
  };
  const [draw, setDraw] = useState(() => newDraw(0));

  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={base}>← {lang.name} home</Link>
      </p>
      <h1>{lang.name}: fill the gaps</h1>
      <p className="lead">
        Sentences from the texts you have finished, each with one word missing. Pick the
        word that fits. The hint gives its meaning; the sentence tells you its form.
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
            label="sentence"
            prompt={(g) => (
              <span lang={code}>
                {rt(g.before)}
                <span className="gap">
                  <span className="visually-hidden">(missing word)</span>
                </span>
                {rt(g.after)}
              </span>
            )}
            note={(g) => `Missing word: ${g.meaning}`}
            answer={(g) => g.answer}
            options={(g) => gapOptions(g, pool, lang.code)}
            renderOption={(o) => rt(o)}
            optionLang={code}
            onFinish={(score) => {
              practiced();
              track('gaps_complete', {
                reading_language: lang.id,
                score: Math.round(score * 100),
              });
            }}
            exit={{ to: base, label: `Back to ${lang.name}` }}
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
