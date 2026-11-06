import { useState } from 'react';
import { dayKey } from '../lib/dates';

// English, like the rest of the chrome: the progress page covers every language.
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Month grid (Monday first) shading each day by how many texts were finished. */
export function MonthCalendar({ activity }: { activity: Record<string, number> }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = dayKey();
  const lead = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const shift = (n: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const label = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => shift(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 aria-live="polite">{label}</h3>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => shift(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="calendar__grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`pad${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const key = dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const count = activity[key] ?? 0;
          return (
            <span
              key={key}
              className={`calendar__day heat-${Math.min(count, 4)}${key === today ? ' is-today' : ''}`}
              title={count ? `${count} text(s) finished` : undefined}
              aria-label={`${i + 1}: ${count} text(s) finished`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
    </div>
  );
}
