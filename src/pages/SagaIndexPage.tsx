import { Link } from 'react-router-dom';
import { SAGA_LEVEL, SAGA_TITLE, SAGA_WORDS } from '../content/schema';
import { LANG_IDS, LANGS } from '../languages';

/** `/saga`: the book saga's section page. Pick the language to read it in. */
export function SagaIndexPage() {
  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/">← Home</Link>
      </p>
      <p className="eyebrow">Book saga · {SAGA_LEVEL}</p>
      <h1>{SAGA_TITLE}</h1>
      <p className="lead">
        An orphan boy at a medieval monastery, and the long road ahead of him. One story
        in simple language for beginners (level {SAGA_LEVEL}), told chapter by chapter.
        Each chapter has {SAGA_WORDS[0]}–{SAGA_WORDS[1]} words and a glossary, and shows
        its own level. No quiz, just reading. Pick a language and start with chapter 1.
      </p>
      <div className="lang-grid">
        {LANG_IDS.map((id) => (
          <article key={id} className="card level-card">
            <span className="chip">{id.toUpperCase()}</span>
            <h2 lang={LANGS[id].code}>{LANGS[id].native}</h2>
            <div className="level-card__actions">
              <Link className="button button--primary" to={`/saga/${id}`}>
                Read in {LANGS[id].name}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
