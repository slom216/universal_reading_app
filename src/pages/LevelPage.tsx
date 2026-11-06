import { Link, useParams } from 'react-router-dom';
import { LEVELS, countWords, type Level } from '../content/schema';
import { useLang } from '../lib/useLang';
import { useProgress } from '../store/progress';
import { NotFoundPage } from './NotFoundPage';

export function LevelPage() {
  const level = useParams().level?.toUpperCase() as Level;
  const results = useProgress((s) => s.results);
  const { lang, base, byLevel, key, tr, code } = useLang();
  if (!LEVELS.includes(level)) return <NotFoundPage />;

  return (
    <div className="stack">
      <p className="text-sm">
        <Link to={base}>← All {lang.name} levels</Link>
      </p>
      <h1>
        {lang.name} {level} texts
      </h1>
      <ol className="text-list">
        {byLevel(level).map((t, i) => {
          const r = results[key(t.id)];
          return (
            <li key={t.id}>
              <Link className="card text-card" to={`${base}/text/${t.id}`}>
                <span className="text-card__num">{i + 1}</span>
                <span className="text-card__body">
                  <strong lang={code}>{tr(t.title)}</strong>
                  <span className="text-sm text-muted">
                    {t.topic} · {countWords(t.body)} words · {t.questions.length}{' '}
                    questions
                  </span>
                </span>
                {r ? (
                  <span className="chip">Best {Math.round(r.bestScore * 100)}%</span>
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
