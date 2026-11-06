// Standard Interslavic Latin → Cyrillic, one letter (or digraph) to one letter.
const MAP: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', dž: 'џ', đ: 'ђ', e: 'е', ě: 'є',
  f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', lj: 'љ', m: 'м', n: 'н',
  nj: 'њ', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', y: 'ы',
  z: 'з', ž: 'ж',
};

/** Keeps case (Lj, LJ → Љ) and leaves everything that is not a standard letter as is. */
export function toCyrillic(s: string): string {
  return s.replace(/dž|lj|nj|[a-zčćđěšž]/giu, (m) => {
    const c = MAP[m.toLowerCase()];
    if (!c) return m;
    return m[0] === m[0]!.toLowerCase() ? c : c.toUpperCase();
  });
}

/** Letters a standard-orthography Interslavic text may use (content.test.ts checks it). */
export const ISV_LETTERS = /^[a-pr-vyzčćđěšž]$/iu;
