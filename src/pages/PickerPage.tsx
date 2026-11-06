import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LANG_IDS, LANGS, UPCOMING, totalTexts } from '../languages';
import { track } from '../lib/track';
import { useProgress } from '../store/progress';
import heroArt from '../assets/art/hero-reading.webp';

// Kept out of the progress store so an import or reset does not bring back the vote buttons.
const VOTES_KEY = 'deulern-polyglot-votes';

function readVotes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function PickerPage() {
  const [votes, setVotes] = useState(readVotes);
  // ponytail: one vote per language per browser, counted in GA only after cookie consent.
  const vote = (code: string) => {
    const next = [...votes, code];
    setVotes(next);
    localStorage.setItem(VOTES_KEY, JSON.stringify(next));
    track('language_vote', { voted_language: code });
  };
  const results = useProgress((s) => s.results);
  const keys = Object.keys(results);
  const recent = useProgress((s) => s.recentLangs);
  // Most recently read languages first, the rest in their default order.
  const order = [...recent, ...LANG_IDS.filter((id) => !recent.includes(id))];

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">A1–B1 reading in seven languages</p>
          <h1>
            Read your way <span className="hero__accent">into a new language.</span>
          </h1>
          <p className="lead">
            Graded texts in Italian, Spanish, French, Russian, Interslavic, Turkish and
            Portuguese,
            each set in the places where the language is spoken. Tap an underlined word to
            see its meaning, then answer a few questions to check what you understood.
          </p>
        </div>
        <img className="hero__art" src={heroArt} alt="" width={743} height={371} />
      </section>

      <div className="lang-grid">
        {order.map((id) => {
          const lang = LANGS[id];
          const total = totalTexts(lang);
          const done = keys.filter((k) => k.startsWith(`${id}/`)).length;
          return (
            <article key={id} className="card level-card">
              <span className="chip">{id.toUpperCase()}</span>
              <h2 lang={lang.code}>{lang.native}</h2>
              <p className="level-card__meta">
                {lang.name} · {total} texts, A1 to B1
              </p>
              <div className="progress-bar" aria-label={`${done} of ${total} read`}>
                <span style={{ width: `${(100 * done) / (total || 1)}%` }} />
              </div>
              <p>
                {done} / {total} read
              </p>
              <div className="level-card__actions">
                <Link className="button button--primary" to={`/${id}`}>
                  Read in {lang.name}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <section className="stack" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Coming soon</h2>
        <p className="text-muted">
          Which language should come next? Tap the ones you want.
        </p>
        <ul className="upcoming-list">
          {UPCOMING.map((l) => {
            const voted = votes.includes(l.code);
            return (
              <li key={l.code}>
                <button
                  type="button"
                  className="chip chip--soft upcoming-list__vote"
                  disabled={voted}
                  onClick={() => vote(l.code)}
                >
                  {voted && '✓ '}
                  <span lang={l.code} dir="auto">
                    {l.native}
                  </span>
                  <span className="upcoming-list__en"> · {l.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
