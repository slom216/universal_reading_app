import { Suspense, use } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadRules } from '../content/pronunciation';
import { LANG_IDS, LANGS, isLangId, type LangId } from '../languages';
import { NotFoundPage } from './NotFoundPage';

/** `/pronunciation`: pick a language. */
export function PronunciationIndexPage() {
  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/">← Home</Link>
      </p>
      <h1>Pronunciation</h1>
      <p className="lead">
        How each language sounds, rule by rule, with example words and an English-style
        respelling. The rules you will meet most often come first.
      </p>
      <div className="lang-grid">
        {LANG_IDS.map((id) => (
          <article key={id} className="card level-card">
            <span className="chip">{id.toUpperCase()}</span>
            <h2 lang={LANGS[id].code}>{LANGS[id].native}</h2>
            <div className="level-card__actions">
              <Link className="button button--primary" to={`/pronunciation/${id}`}>
                {LANGS[id].name} pronunciation
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** `/pronunciation/:lang`: the rules for one language. */
export function PronunciationPage() {
  const { lang } = useParams();
  if (!isLangId(lang)) return <NotFoundPage />;
  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/pronunciation">← All languages</Link>
      </p>
      <h1>{LANGS[lang].name} pronunciation</h1>
      <Suspense fallback={<p className="text-muted">Loading rules…</p>}>
        <Rules id={lang} />
      </Suspense>
    </div>
  );
}

function Rules({ id }: { id: LangId }) {
  const rules = use(loadRules(id));
  const { name, code } = LANGS[id];
  return (
    <>
      <p className="lead">
        {rules.length > 1
          ? `${rules.length} rules, ordered by how often you will meet them in ${name} texts.`
          : 'A first rule to get you started.'}
      </p>
      <ol className="rule-list">
        {rules.map((rule) => (
          <li key={rule.title} className="card level-card">
            <h2>{rule.title}</h2>
            <p>{rule.body}</p>
            <dl className="say-list">
              {rule.examples.map((ex) => (
                <div key={ex.word}>
                  <dt lang={code}>{ex.word}</dt>
                  <dd>
                    “{ex.say}” · {ex.en}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </>
  );
}
