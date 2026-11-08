import { Link } from 'react-router-dom';
import { LEVELS, WORD_RANGE } from '../content/schema';
import { dayKey } from '../lib/dates';
import { useLang } from '../lib/useLang';
import { ROUND, dueWords } from '../lib/words';
import { useProgress } from '../store/progress';
import heroArt from '../assets/art/hero-reading.webp';
import artA1 from '../assets/art/level-a1-family.webp';
import artA2 from '../assets/art/level-a2-travel.webp';
import artB1 from '../assets/art/level-b1-city.webp';

/** Cut-paper art per level, drawn at native size (or smaller on narrow cards). */
const ART = {
  A1: { src: artA1, width: 410, height: 167 },
  A2: { src: artA2, width: 404, height: 167 },
  B1: { src: artB1, width: 410, height: 161 },
};

export function HomePage() {
  const results = useProgress((s) => s.results);
  const words = useProgress((s) => s.words);
  const { lang, base, byLevel, key, tr, code, texts } = useLang();
  const due = dueWords(lang.id, texts, { results, words }, dayKey()).length;

  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/reading">← All languages</Link>
      </p>
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">A1–B1 {lang.name} reading</p>
          <h1>
            Read your way <span className="hero__accent">into {lang.name}.</span>
          </h1>
          <p className="lead">
            Pick a text at your level and read it. Tap an underlined word to see its
            meaning, then answer a few questions to check what you understood. You can
            read the texts in any order.
          </p>
        </div>
        <img className="hero__art" src={heroArt} alt="" width={743} height={371} />
      </section>

      <div className="level-grid">
        {LEVELS.map((level) => {
          const texts = byLevel(level);
          const done = texts.filter((t) => results[key(t.id)]).length;
          const next = texts.find((t) => !results[key(t.id)]);
          const [min, max] = WORD_RANGE[level];
          return (
            <article key={level} className="card level-card">
              <div className="level-card__frame">
                <img
                  className="level-card__art"
                  src={ART[level].src}
                  alt=""
                  width={ART[level].width}
                  height={ART[level].height}
                />
              </div>
              <span className="chip">{level}</span>
              <h2>Level {level}</h2>
              <p className="level-card__blurb">{lang.blurb[level]}</p>
              <p className="level-card__meta">
                {texts.length} texts · {min}–{max} words each
              </p>
              <div
                className="progress-bar"
                aria-label={`${done} of ${texts.length} read`}
              >
                <span style={{ width: `${(100 * done) / (texts.length || 1)}%` }} />
              </div>
              <p>
                {done} / {texts.length} read
              </p>
              <div className="level-card__actions">
                <Link
                  className="button button--primary"
                  to={`${base}/level/${level.toLowerCase()}`}
                >
                  All {level} texts
                </Link>
                {next && (
                  <Link className="level-card__next" to={`${base}/text/${next.id}`}>
                    <b>Next:</b> <span lang={code}>{tr(next.title)}</span>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="card stack stack--tight" aria-labelledby="words-heading">
        <h2 id="words-heading">Word review</h2>
        <p>
          The glossary words of every text you finish come back here, spaced out so they
          stick.{' '}
          {due
            ? `${due} ${due === 1 ? 'word is' : 'words are'} due today.`
            : 'Nothing is due right now.'}
        </p>
        {due > 0 && (
          <p>
            <Link className="button button--primary" to={`${base}/words`}>
              Review {Math.min(due, ROUND)} {due === 1 ? 'word' : 'words'}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
