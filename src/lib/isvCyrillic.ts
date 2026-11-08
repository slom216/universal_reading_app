// Standard Interslavic Latin → Cyrillic, one letter (or digraph) to one letter.
const MAP: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'ц',
  č: 'ч',
  ć: 'ћ',
  d: 'д',
  dž: 'џ',
  đ: 'ђ',
  e: 'е',
  ě: 'є',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'ј',
  k: 'к',
  l: 'л',
  lj: 'љ',
  m: 'м',
  n: 'н',
  nj: 'њ',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  š: 'ш',
  t: 'т',
  u: 'у',
  v: 'в',
  y: 'ы',
  z: 'з',
  ž: 'ж',
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

const LATIN = Object.fromEntries(Object.entries(MAP).map(([l, c]) => [c, l]));

/** Serbian Cyrillic → Latin (gajica): Љ → Lj, or LJ inside an all-caps word. */
export function toLatin(s: string): string {
  return s.replace(/[Ѐ-ӿ]/gu, (c, i: number) => {
    const l = LATIN[c.toLowerCase()];
    if (!l) return c;
    if (c === c.toLowerCase()) return l;
    const next = s[i + 1] ?? '';
    const caps = next !== next.toLowerCase();
    return caps ? l.toUpperCase() : l[0]!.toUpperCase() + l.slice(1);
  });
}

/** The 30 letters of the Serbian Cyrillic alphabet (content tests check sr against it). */
export const SR_LETTERS = /^[абвгдђежзијклљмнњопрстћуфхцчџш]$/iu;

/** Hindi letters and vowel signs: the Devanagari block (content tests check hi against it). */
export const HI_LETTERS = /^[ऀ-ॿ]$/u;
