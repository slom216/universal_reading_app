import { existsSync, readFileSync } from 'node:fs';
import { LANG_IDS } from '../../languages';

// Languages without a phrasebook yet are skipped (see PHRASE_LANGS).
const LANGS_WITH_PHRASES = LANG_IDS.filter((id) =>
  existsSync(`src/content/phrases/${id}.json`),
);
import { HI_LETTERS, ISV_LETTERS, SR_LETTERS, ZH_LETTERS } from '../../lib/isvCyrillic';

const english = (
  JSON.parse(readFileSync('1000_phrases_claude.json', 'utf8')) as {
    id: number;
    rank: number;
    phrase: string;
  }[]
).sort((a, b) => a.rank - b.rank);
const brackets = (s: string) => (s.match(/\[/g) ?? []).length;

describe.each(LANGS_WITH_PHRASES)('%s phrases', (id) => {
  const tr = JSON.parse(readFileSync(`src/content/phrases/${id}.json`, 'utf8')) as Record<
    string,
    string
  >;

  it('translates every phrase, keeping its [placeholders]', () => {
    const missing = english.filter((p) => !tr[p.id]?.trim()).map((p) => p.rank);
    expect(missing).toEqual([]);
    const off = english.filter((p) => brackets(p.phrase) !== brackets(tr[p.id]!));
    expect(off.map((p) => p.rank)).toEqual([]);
    expect(Object.keys(tr)).toHaveLength(english.length);
  });

  it('has a recording for each of the top 10', () => {
    const silent = english
      .slice(0, 10)
      .filter((p) => !existsSync(`src/assets/audio/phrases/${id}/${p.id}.mp3`));
    expect(silent.map((p) => p.rank)).toEqual([]);
  });

  const letters = { isv: ISV_LETTERS, sr: SR_LETTERS, hi: HI_LETTERS, zh: ZH_LETTERS }[id as string];
  if (letters) {
    it('uses only the standard alphabet', () => {
      const all = Object.values(tr).join(' ');
      const bad = [...new Set(all.match(/\p{L}/gu) ?? [])].filter(
        (c) => !letters.test(c),
      );
      expect(bad).toEqual([]);
    });
  }
});
