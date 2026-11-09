import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { countWords } from '../content/schema';
import { GlossaryText } from '../components/GlossaryText';
import { Quiz } from '../components/Quiz';
import { RomanizeToggle, ScriptToggle } from '../components/ScriptToggle';
import { track } from '../lib/track';
import { useLang } from '../lib/useLang';
import { useProgress } from '../store/progress';
import { NotFoundPage } from './NotFoundPage';

// Narration lives at src/assets/audio/<lang>/<id>.mp3. Only the URLs are bundled; the
// browser fetches the mp3 when the reader presses play.
const audio = import.meta.glob<string>('../assets/audio/*/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function ReaderPage() {
  const { id = '' } = useParams();
  const { lang, base, byId, byLevel, key, tr, rt, code } = useLang();
  const text = byId(id);
  const result = useProgress((s) => s.results[key(id)]);
  const complete = useProgress((s) => s.complete);
  const fontSize = useProgress((s) => s.settings.fontSize);
  const openedText = useProgress((s) => s.openedText);
  // Saved data from before this setting lacks it.
  const split = useProgress((s) => s.settings.split ?? false);
  const setSettings = useProgress((s) => s.setSettings);
  const found = Boolean(text);
  useEffect(() => {
    if (found) openedText(lang.id);
  }, [found, lang.id, openedText]);
  const level = text?.level;
  useEffect(() => {
    if (level) track('text_open', { reading_language: lang.id, level, text_id: id });
  }, [lang.id, level, id]);
  if (!text) return <NotFoundPage />;

  const siblings = byLevel(text.level);
  const index = siblings.findIndex((t) => t.id === text.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const levelPath = `${base}/level/${text.level.toLowerCase()}`;
  const audioUrl = audio[`../assets/audio/${key(text.id)}.mp3`];
  const params = { reading_language: lang.id, level: text.level, text_id: text.id };
  const nextClicked = () => track('next_text', params);

  return (
    <article className="reader stack" data-font={fontSize} data-split={split}>
      <p className="text-sm">
        <Link to={levelPath}>
          ← {lang.name} {text.level} texts
        </Link>
      </p>
      <header className="stack stack--tight">
        <div className="row">
          <span className="chip">{text.level}</span>
          <span className="text-sm text-muted">
            {text.topic} · {countWords(text.body)} words
            {result && ` · best score ${Math.round(result.bestScore * 100)}%`}
          </span>
        </div>
        <h1 lang={code}>{rt(text.title)}</h1>
        <ScriptToggle id={lang.id} />
        <RomanizeToggle id={lang.id} />
        <label className="switch reader__split-toggle">
          <input
            type="checkbox"
            role="switch"
            checked={split}
            onChange={(e) => setSettings({ split: e.target.checked })}
          />
          Questions beside the text
        </label>
      </header>

      {audioUrl && (
        <audio
          className="reader__audio"
          controls
          preload="none"
          src={audioUrl}
          aria-label={`Listen to ${tr(text.title)}`}
          // Resuming after a pause fires play again; only count plays from the start.
          onPlay={(e) => e.currentTarget.currentTime < 1 && track('audio_play', params)}
        />
      )}

      <div className="reader__body">
        <div className="stack">
          <GlossaryText
            text={text}
            articles={lang.articles}
            code={code}
            tr={tr}
            rt={rt}
          />

          <section className="stack stack--tight" aria-labelledby="glossary-heading">
            <h2 id="glossary-heading" lang={code}>
              {tr(lang.glossHeading)}
            </h2>
            <p className="text-muted text-sm">Words that might be new at this level.</p>
            <dl className="glossary">
              {text.glossary.map((g) => (
                <div key={g.term} className="glossary__row">
                  <dt lang={code}>{rt(g.term)}</dt>
                  <dd>{g.translation}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section className="stack" aria-labelledby="quiz-heading">
          <h2 id="quiz-heading" lang={code}>
            {tr(lang.quizHeading)}
          </h2>
          {/* key resets the quiz state when moving to another text */}
          <Quiz
            key={text.id}
            questions={text.questions}
            onComplete={(s) => {
              complete(key(text.id), s);
              track('quiz_complete', { ...params, score: Math.round(s * 100) });
            }}
            labels={{
              trueLabel: tr(lang.trueLabel),
              falseLabel: tr(lang.falseLabel),
              perfect: tr(lang.perfect),
            }}
            code={code}
            tr={tr}
            rt={rt}
            next={
              next
                ? {
                    to: `${base}/text/${next.id}`,
                    label: `Next text: ${tr(next.title)} →`,
                    onClick: nextClicked,
                  }
                : { to: levelPath, label: `Back to level ${text.level}` }
            }
          />
        </section>
      </div>

      <nav className="row reader__pager" aria-label="More texts">
        {prev && (
          <Link className="button button--ghost" to={`${base}/text/${prev.id}`}>
            ← <span lang={code}>{tr(prev.title)}</span>
          </Link>
        )}
        <span className="spacer" />
        {next ? (
          <Link
            className="button button--secondary"
            to={`${base}/text/${next.id}`}
            onClick={nextClicked}
          >
            <span lang={code}>{tr(next.title)}</span> →
          </Link>
        ) : (
          <Link className="button button--secondary" to={levelPath}>
            Back to level {text.level}
          </Link>
        )}
      </nav>
    </article>
  );
}
