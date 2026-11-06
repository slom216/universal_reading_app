import { addDays, dayKey } from './dates';

/**
 * Current streak counts back from today, or from yesterday if nothing is read
 * yet today (the streak is not lost until the day is over).
 */
export function streaks(days: string[], today: string = dayKey()) {
  const set = new Set(days);
  let current = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev = '';
  for (const day of [...set].sort()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best };
}
