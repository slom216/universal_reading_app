/** Fisher–Yates; returns a shuffled copy. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Levenshtein edit distance, counted in code points so Devanagari and Han compare per letter. */
export function levenshtein(a: string, b: string): number {
  const s = [...a];
  const t = [...b];
  let prev = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++)
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (s[i - 1] === t[j - 1] ? 0 : 1),
      );
    prev = cur;
  }
  return prev[t.length]!;
}

/** The `n` distinct strings in `pool` closest to `target` by edit distance, never `target`
 *  itself or a blank. Ties are broken at random so repeat sessions vary. */
export function nearest(target: string, pool: readonly string[], n: number): string[] {
  const candidates = shuffle([...new Set(pool)].filter((s) => s && s !== target));
  return candidates
    .map((s) => ({ s, d: levenshtein(target, s) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n)
    .map((x) => x.s);
}
