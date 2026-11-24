import { Link, useParams } from 'react-router-dom';
import { LEVELS, SAGA_TITLE, countWords, levelSpan, type Level } from '../content/schema';
import { useLang } from '../lib/useLang';
import { useProgress } from '../store/progress';
import { NotFoundPage } from './NotFoundPage';

/** The texts of one level, or with `saga` the chapters of the book saga. */
export function LevelPage({ saga: isSaga = false }: { saga?: boolean }) {
  const level = useParams().level?.toUpperCase() as Level;
  const results = useProgress((s) => s.results);
  const { lang, base, byLevel, saga, textPath, key, tr, code } = useLang();
  if (!isSaga && !LEVELS.includes(level)) return <NotFoundPage />;
  const list = isSaga ? saga : byLevel(level);
  const span = levelSpan(saga.map((t) => t.level));

  return (
    <div className="stack">
      <p className="text-sm">
        <Link to={isSaga ? '/saga' : base}>
          ← {isSaga ? 'All languages' : `All ${lang.name} levels`}
        </Link>
      </p>
      <h1>
        {isSaga
          ? `${SAGA_TITLE} in ${lang.name}, ${span}`
          : `${lang.name} ${level} texts`}
      </h1>
      {isSaga && (
        <p className="lead">
          An orphan boy at a medieval monastery, and the long road ahead of him. One story
          in simple {lang.name} for beginners (level {span}), told chapter by chapter.
          Read them in order: each one continues the last.
        </p>
      )}
      <ol className="text-list">
        {list.map((t, i) => {
          const r = results[key(t.id)];
          return (
            <li key={t.id}>
              <Link className="card text-card" to={textPath(t)}>
                <span className="text-card__num">{i + 1}</span>
                <span className="text-card__body">
                  <strong lang={code}>{tr(t.title)}</strong>
                  <span className="text-sm text-muted">
                    {isSaga
                      ? `${t.level} · ${t.topic} · ${countWords(t.body)} words`
                      : `${t.topic} · ${countWords(t.body)} words · ${t.questions.length} questions`}
                  </span>
                </span>
                {r ? (
                  <span className="chip">
                    {isSaga ? 'Read' : `Best ${Math.round(r.bestScore * 100)}%`}
                  </span>
                ) : (
                  <span className="chip chip--soft">New</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
