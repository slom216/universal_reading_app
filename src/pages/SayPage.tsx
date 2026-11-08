import { Suspense, use, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PHRASE_LANGS,
  loadAllPhrases,
  loadPhrases,
  phraseAudio,
  type Phrase,
} from '../content/phrases';
import { LANGS, type LangId } from '../languages';
import { useScript } from '../lib/script';
import { phraseQuote } from '../lib/slug';
import { track } from '../lib/track';
import { NotFoundPage } from './NotFoundPage';

/** Languages shown on a comparison page: English is the source, so it is the heading. */
const OTHERS = PHRASE_LANGS.filter((id) => id !== 'en');

/** `/say`: every phrase, each linking to its comparison page. */
export function SayIndexPage() {
  return (
    <div className="stack">
      <p className="text-sm">
        <Link to="/phrases">← Phrasebooks</Link>
      </p>
      <h1>One phrase, {OTHERS.length} languages</h1>
      <p className="lead">
        Pick a phrase to see it in every language side by side, with a pronunciation guide
        for the scripts that need one.
      </p>
      <Suspense fallback={<p className="text-muted">Loading phrases…</p>}>
        <SayIndex />
      </Suspense>
    </div>
  );
}

function SayIndex() {
  const phrases = use(loadPhrases('en'));
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? phrases.filter((p) => p.phrase.toLowerCase().includes(needle))
    : phrases;
  return (
    <>
      <div className="phrase-tools">
        <label>
          Search{' '}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. thank you"
          />
        </label>
        <span className="text-sm text-muted">{shown.length} phrases</span>
      </div>
      <ol className="say-index">
        {shown.map((p) => (
          <li key={p.id} value={p.rank}>
            <Link to={`/say/${p.slug}`}>{p.phrase}</Link>
          </li>
        ))}
      </ol>
    </>
  );
}

/** `/say/:slug`: one phrase in every language. */
export function SayPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading phrases…</p>}>
      <Say />
    </Suspense>
  );
}

function Say() {
  const { slug = '' } = useParams();
  const books = use(loadAllPhrases());
  const en = books[PHRASE_LANGS.indexOf('en')]!;
  const i = en.findIndex((p) => p.slug === slug);
  const phrase = en[i];
  if (!phrase) return <NotFoundPage />;
  const prev = en[i - 1];
  const next = en[i + 1];

  return (
    <div className="stack reader">
      <p className="text-sm">
        <Link to="/say">← All phrases</Link>
      </p>
      <h1>
        How to say “{phraseQuote(phrase.phrase)}” in {OTHERS.length} languages
      </h1>
      {phrase.note && <p className="lead">{phrase.note}</p>}
      <p className="text-sm text-muted">
        Phrase {phrase.rank} of {en.length} by usefulness · topic: {phrase.category}.
        Words in [brackets] are placeholders.
      </p>
      <ul className="text-list">
        {OTHERS.map((id) => (
          <SayRow
            key={id}
            id={id}
            phrase={books[PHRASE_LANGS.indexOf(id)]!.find((p) => p.id === phrase.id)!}
          />
        ))}
      </ul>
      <nav className="row reader__pager" aria-label="More phrases">
        {prev && (
          <Link className="button button--ghost" to={`/say/${prev.slug}`}>
            ← {prev.phrase}
          </Link>
        )}
        <span className="spacer" />
        {next && (
          <Link className="button button--secondary" to={`/say/${next.slug}`}>
            {next.phrase} →
          </Link>
        )}
      </nav>
    </div>
  );
}

function SayRow({ id, phrase }: { id: LangId; phrase: Phrase }) {
  const lang = LANGS[id];
  const { code, rt } = useScript(id, lang.code);
  const url = phraseAudio(id, phrase.id);
  return (
    <li className="card text-card">
      <span className="text-card__body">
        <span className="text-sm text-muted">
          <Link to={`/phrases/${id}`}>{lang.name}</Link>
        </span>
        <strong lang={code} className="phrase__text">
          {rt(phrase.text)}
        </strong>
      </span>
      {url && (
        <button
          type="button"
          className="button button--secondary phrase__play"
          aria-label={`Play in ${lang.name}`}
          onClick={() => {
            void new Audio(url).play();
            track('phrase_audio_play', { reading_language: id, phrase_id: phrase.id });
          }}
        >
          ▶
        </button>
      )}
    </li>
  );
}
