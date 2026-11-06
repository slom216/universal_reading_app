import { Suspense, use, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ScriptToggle } from '../components/ScriptToggle';
import { loadPhrases } from '../content/phrases';
import { LANG_IDS, LANGS, isLangId, type LangId } from '../languages';
import { toCyrillic } from '../lib/isvCyrillic';
import { track } from '../lib/track';
import { useProgress } from '../store/progress';
import { NotFoundPage } from './NotFoundPage';

// Recordings live at src/assets/audio/phrases/<lang>/<phrase id>.mp3; only the URLs are
// bundled. Phrases without a recording get no play button.
const audio = import.meta.glob<string>('../assets/audio/phrases/*/*.mp3', {
  query: '?url',
  import: 'default',
  eager: true,
});

/** `/phrases`: pick a language. */
export function PhrasebookPage() {
  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/">← Home</Link>
      </p>
      <h1>Everyday phrases</h1>
      <p className="lead">
        1000 phrases per language, ordered by how useful they are. Start at the top: the
        first hundred get you through a first day abroad.
      </p>
      <div className="lang-grid">
        {LANG_IDS.map((id) => (
          <article key={id} className="card level-card">
            <span className="chip">{id.toUpperCase()}</span>
            <h2 lang={LANGS[id].code}>{LANGS[id].native}</h2>
            <p className="level-card__meta">{LANGS[id].name} · 1000 phrases</p>
            <div className="level-card__actions">
              <Link className="button button--primary" to={`/phrases/${id}`}>
                {LANGS[id].name} phrases
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** `/phrases/:lang`: the phrase list. */
export function PhrasesPage() {
  const { lang } = useParams();
  if (!isLangId(lang)) return <NotFoundPage />;
  return (
    <Suspense fallback={<p className="text-muted">Loading phrases…</p>}>
      <PhraseList id={lang} />
    </Suspense>
  );
}

function PhraseList({ id }: { id: LangId }) {
  const phrases = use(loadPhrases(id));
  const [category, setCategory] = useState('');
  const cyrillic = useProgress((s) => id === 'isv' && s.settings.isvScript === 'cyrillic');
  const lang = LANGS[id];
  const code = cyrillic ? 'isv-Cyrl' : lang.code;
  const tr = cyrillic ? toCyrillic : (s: string) => s;
  const categories = [...new Set(phrases.map((p) => p.category))].sort();
  const shown = category ? phrases.filter((p) => p.category === category) : phrases;

  const play = (phraseId: number, url: string) => {
    void new Audio(url).play();
    track('phrase_audio_play', { reading_language: id, phrase_id: phraseId });
  };

  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/phrases">← All languages</Link>
      </p>
      <h1>{lang.name} phrases</h1>
      <p className="lead">
        Ordered by how useful they are. Phrases you say to strangers use the polite form;
        phrases for friends use the informal one. Words in [brackets] are placeholders.
      </p>
      <div className="phrase-tools">
        <label>
          Topic{' '}
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All topics ({phrases.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {id === 'isv' && <ScriptToggle />}
      </div>
      <ol className="text-list">
        {shown.map((p) => {
          const url = audio[`../assets/audio/phrases/${id}/${p.id}.mp3`];
          return (
            <li key={p.id} className="card text-card">
              <span className="text-card__num">{p.rank}</span>
              <span className="text-card__body">
                <strong lang={code} className="phrase__text">
                  {tr(p.text)}
                </strong>
                <span className="text-sm text-muted">
                  {p.phrase}
                  {p.note && <> · {p.note}</>}
                </span>
              </span>
              {url && (
                <button
                  type="button"
                  className="button button--secondary phrase__play"
                  aria-label={`Play “${p.phrase}”`}
                  onClick={() => play(p.id, url)}
                >
                  ▶
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
