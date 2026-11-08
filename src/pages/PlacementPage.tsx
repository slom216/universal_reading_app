import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChoiceRound } from '../components/ChoiceRound';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { LEVELS, type Level } from '../content/schema';
import { nearest } from '../lib/distractors';
import { PER_LEVEL, placedLevel, placementWords } from '../lib/placement';
import { track } from '../lib/track';
import { useLang } from '../lib/useLang';
import { allWords } from '../lib/words';
import { useProgress } from '../store/progress';

const zero = (): Record<Level, number> => ({ A1: 0, A2: 0, B1: 0 });

/** `/:lang/level-check`: glossary words from all three levels; the score per level picks
 *  where to start reading. */
export function PlacementPage() {
  const { lang, base, texts, byLevel, key, code, tr, rt } = useLang();
  const results = useProgress((s) => s.results);
  const pool = useMemo(
    () => allWords(lang.id, texts).map((w) => w.meaning),
    [lang.id, texts],
  );
  const [draw, setDraw] = useState(() => ({
    n: 0,
    items: placementWords(lang.id, texts),
  }));
  const [right, setRight] = useState(zero);
  const placed = placedLevel(right);
  const next = byLevel(placed).find((t) => !results[key(t.id)]);

  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={base}>← {lang.name} home</Link>
      </p>
      <h1>{lang.name} level check</h1>
      <p className="lead">
        {draw.items.length} words, {PER_LEVEL} from each level, easiest first. Pick each
        meaning. Wrong answers are fine: they only tell the check where you should start.
      </p>
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
        onAnswer={(w, ok) => {
          const r = ok ? { ...right, [w.level]: right[w.level] + 1 } : right;
          setRight(r);
          if (w === draw.items.at(-1))
            track('level_check_complete', {
              reading_language: lang.id,
              level: placedLevel(r),
            });
        }}
        onFinish={() => {}}
        exit={{ to: base, label: `Back to ${lang.name}` }}
        onRestart={() => {}}
        result={
          <div className="card stack stack--tight" role="status">
            <p className="quiz__score">Start at {placed}</p>
            <p>
              {LEVELS.map((l) => `${l}: ${right[l]} / ${PER_LEVEL}`).join(' · ')}.{' '}
              {placed === 'A1'
                ? 'A1 texts are short and in the present tense: a good place to begin.'
                : `You know most ${LEVELS[LEVELS.indexOf(placed) - 1]} words, so ${placed} texts will stretch you without losing you.`}
            </p>
            <div className="row">
              {next && (
                <Link className="button button--primary" to={`${base}/text/${next.id}`}>
                  <span>
                    Read <span lang={code}>{tr(next.title)}</span>
                  </span>
                </Link>
              )}
              <Link
                className="button button--secondary"
                to={`${base}/level/${placed.toLowerCase()}`}
              >
                All {placed} texts
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setRight(zero());
                  setDraw((d) => ({ n: d.n + 1, items: placementWords(lang.id, texts) }));
                }}
              >
                Take it again
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
