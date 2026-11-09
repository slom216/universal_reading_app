import { Suspense, use, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChoiceRound } from '../components/ChoiceRound';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { PHRASE_LANGS, loadPhrases, type Phrase } from '../content/phrases';
import { LANGS, isLangId, type LangId } from '../languages';
import { nearest, shuffle } from '../lib/distractors';
import { useScript } from '../lib/script';
import { track } from '../lib/track';
import { useProgress } from '../store/progress';
import { NotFoundPage } from './NotFoundPage';

export const PRACTICE_SIZES = [20, 50, 100] as const;
const ROUND_NAMES = { 20: 'Quick round', 50: 'Longer round', 100: 'Big round' };

/** Links that start a practice round of 20, 50 or 100 phrases drawn at random from all
 *  1000, in either direction. `?to=en` asks for the English. */
export function PracticeLinks({ id }: { id: LangId }) {
  const name = LANGS[id].name;
  return (
    <div className="stack stack--tight">
      {[
        { to: '', label: `Translate into ${name}` },
        { to: '&to=en', label: `Translate into English` },
      ].map((d) => (
        <div key={d.to} className="row">
          <span className="text-sm">{d.label}</span>
          {PRACTICE_SIZES.map((n) => (
            <Link
              key={n}
              className="button button--secondary"
              to={`/phrases/${id}/practice?n=${n}${d.to}`}
            >
              {ROUND_NAMES[n]} · {n} phrases
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

/** `/phrases/:lang/practice?n=20[&to=en]`: pick a phrase's translation out of six. */
export function PhrasePracticePage() {
  const { lang } = useParams();
  const [params] = useSearchParams();
  // English is its own source, so there is nothing to translate.
  if (!isLangId(lang) || lang === 'en' || !PHRASE_LANGS.includes(lang))
    return <NotFoundPage />;
  const n = Number(params.get('n'));
  const size = PRACTICE_SIZES.find((s) => s === n);
  const toEnglish = params.get('to') === 'en';
  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to={`/phrases/${lang}`}>← {LANGS[lang].name} phrases</Link>
      </p>
      <h1>{LANGS[lang].name} phrase practice</h1>
      {size ? (
        <Suspense fallback={<p className="text-muted">Loading phrases…</p>}>
          <Practice
            key={`${size}${toEnglish}`}
            id={lang}
            size={size}
            toEnglish={toEnglish}
          />
        </Suspense>
      ) : (
        <>
          <p className="lead">
            Pick the right translation out of six, from English into {LANGS[lang].name} or
            the other way round.
          </p>
          <PracticeLinks id={lang} />
        </>
      )}
    </div>
  );
}

function Practice({
  id,
  size,
  toEnglish,
}: {
  id: LangId;
  size: number;
  toEnglish: boolean;
}) {
  const phrases = use(loadPhrases(id));
  const lang = LANGS[id];
  const { code, rt } = useScript(id, lang.code);
  const practiced = useProgress((s) => s.practiced);
  // A new draw (with a new key) remounts ChoiceRound for "New round".
  const newDraw = (n: number) => ({ n, items: shuffle(phrases).slice(0, size) });
  const [draw, setDraw] = useState(() => newDraw(0));
  const answer = (p: Phrase) => (toEnglish ? p.phrase : p.text);

  return (
    <>
      <div className="phrase-tools">
        <ScriptToggle id={id} />
        <RomanizeToggle id={id} />
      </div>
      <ChoiceRound
        key={draw.n}
        items={draw.items}
        label="phrase"
        prompt={(p) =>
          toEnglish ? (
            <span lang={code}>{rt(p.text)}</span>
          ) : (
            <span lang="en">{p.phrase}</span>
          )
        }
        note={(p) => p.note}
        answer={answer}
        // Five wrong answers that look most like the right one, so the choice takes
        // reading. Phrases sharing this one's translation would be right too: left out.
        options={(q) =>
          nearest(
            answer(q),
            phrases.filter((p) => p.text !== q.text && p.phrase !== q.phrase).map(answer),
            5,
          )
        }
        renderOption={(o) => (toEnglish ? o : rt(o))}
        optionLang={toEnglish ? 'en' : code}
        onFinish={(score) => {
          practiced();
          track('phrase_practice_complete', {
            reading_language: id,
            size,
            direction: toEnglish ? 'to_en' : 'from_en',
            score: Math.round(score * 100),
          });
        }}
        exit={{ to: `/phrases/${id}`, label: 'Back to phrases' }}
        onRestart={() => setDraw((d) => newDraw(d.n + 1))}
      />
    </>
  );
}
