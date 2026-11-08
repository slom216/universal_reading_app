import { Link } from 'react-router-dom';
import { LEVELS } from '../content/schema';
import { MonthCalendar } from '../components/MonthCalendar';
import { LANG_IDS, LANGS } from '../languages';
import { streaks } from '../lib/streak';
import { useProgress } from '../store/progress';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function ProgressPage() {
  const results = useProgress((s) => s.results);
  const activity = useProgress((s) => s.activity);
  const recentLangs = useProgress((s) => s.recentLangs);
  // Only languages the reader has opened a text in or finished a quiz in.
  const langs = LANG_IDS.filter(
    (id) =>
      recentLangs.includes(id) ||
      Object.keys(results).some((k) => k.startsWith(`${id}/`)),
  );
  const { current, best } = streaks(
    Object.keys(activity).filter((d) => (activity[d] ?? 0) > 0),
  );
  const total = Object.values(activity).reduce((a, b) => a + b, 0);

  return (
    <div className="stack">
      <h1>Your progress</h1>

      <div className="stats">
        <div className="card stat">
          <span className="stat__value">{current}</span>
          <span className="stat__label">Day streak</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{best}</span>
          <span className="stat__label">Best streak</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{Object.keys(results).length}</span>
          <span className="stat__label">Texts read</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{total}</span>
          <span className="stat__label">Exercises finished</span>
        </div>
      </div>

      <section className="card stack">
        <h2>Practice calendar</h2>
        <MonthCalendar activity={activity} />
      </section>

      {langs.length === 0 && (
        <p className="card">
          Nothing here yet. <Link to="/reading">Pick a language</Link> and read your first
          text; its scores show up here.
        </p>
      )}
      {langs.map((id) => {
        const lang = LANGS[id];
        return (
          <section key={id} className="stack stack--tight">
            <h2>
              <Link to={`/${id}`}>{lang.name}</Link>
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Read</th>
                  <th scope="col">Best</th>
                  <th scope="col">Last</th>
                  <th scope="col">Tries</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((level) => {
                  const prefix = `${id}/${level.toLowerCase()}-`;
                  const rs = Object.entries(results)
                    .filter(([k]) => k.startsWith(prefix))
                    .map(([, r]) => r);
                  const avg = (f: (r: (typeof rs)[number]) => number) =>
                    rs.length ? pct(rs.reduce((a, r) => a + f(r), 0) / rs.length) : '—';
                  return (
                    <tr key={level}>
                      <td>
                        <Link to={`/${id}/level/${level.toLowerCase()}`}>{level}</Link>
                      </td>
                      <td>
                        {rs.length} / {lang.counts[level]}
                      </td>
                      <td>{avg((r) => r.bestScore)}</td>
                      <td>{avg((r) => r.lastScore)}</td>
                      <td>{rs.reduce((a, r) => a + r.attempts, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
      <p className="text-muted text-sm">
        Best and Last are averages over the texts you have read. Each level list shows
        your best score per text.
      </p>
    </div>
  );
}
