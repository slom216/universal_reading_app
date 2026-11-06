import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { LANG_IDS, LANGS } from '../languages';
import { ISV_LETTERS } from '../lib/isvCyrillic';
import {
  LEVELS,
  WORD_RANGE,
  countWords,
  findGlossary,
  glossaryNeedle,
  textSchema,
  type ReadingText,
} from './schema';

const load = (lang: string): ReadingText[] =>
  LEVELS.flatMap((l) =>
    z
      .array(textSchema)
      .parse(
        JSON.parse(
          readFileSync(`src/content/texts/${lang}/${l.toLowerCase()}.json`, 'utf8'),
        ),
      ),
  );

describe.each(LANG_IDS)('%s texts', (id) => {
  const lang = LANGS[id];
  const TEXTS = load(id);

  it.each(LEVELS)('%s has the count in languages.ts', (level) => {
    expect(TEXTS.filter((t) => t.level === level)).toHaveLength(lang.counts[level]);
  });

  it('texts within a level have distinct titles', () => {
    for (const level of LEVELS) {
      const titles = TEXTS.filter((t) => t.level === level).map((t) => t.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it('ids are unique, in order and match their level', () => {
    for (const level of LEVELS) {
      const ids = TEXTS.filter((t) => t.level === level).map((t) => t.id);
      const l = level.toLowerCase();
      expect(ids).toEqual(ids.map((_, i) => `${l}-${String(i + 1).padStart(2, '0')}`));
    }
  });

  it.each(TEXTS.map((t) => [t.id, t] as const))('%s is within its word range', (_, t) => {
    const [min, max] = WORD_RANGE[t.level];
    const n = countWords(t.body);
    expect(n).toBeGreaterThanOrEqual(min);
    expect(n).toBeLessThanOrEqual(max);
  });

  it.each(TEXTS.map((t) => [t.id, t] as const))(
    '%s glossary words appear in the text',
    (_, t) => {
      const missing = t.glossary.filter(
        (g) => findGlossary(t.body, glossaryNeedle(g, lang.articles)) < 0,
      );
      expect(missing.map((g) => g.term)).toEqual([]);
    },
  );

  if (id === 'isv') {
    it.each(TEXTS.map((t) => [t.id, t] as const))(
      '%s uses only the standard Interslavic alphabet',
      (_, t) => {
        const all = [
          t.title,
          t.body,
          ...t.glossary.map((g) => `${g.term} ${g.match ?? ''}`),
          ...t.questions.flatMap((q) => [
            q.prompt,
            q.explanation ?? '',
            ...(q.type === 'mc' ? q.options : []),
          ]),
        ].join(' ');
        const bad = [...new Set(all.match(/\p{L}/gu) ?? [])].filter(
          (c) => !ISV_LETTERS.test(c),
        );
        expect(bad).toEqual([]);
      },
    );
  }
});

describe('glossaryNeedle', () => {
  it('strips articles, including elided ones', () => {
    expect(glossaryNeedle({ term: "l'albergo" }, LANGS.it.articles)).toBe('albergo');
    expect(glossaryNeedle({ term: 'lo zaino' }, LANGS.it.articles)).toBe('zaino');
    expect(glossaryNeedle({ term: 'l’école' }, LANGS.fr.articles)).toBe('école');
    expect(glossaryNeedle({ term: 'las gafas' }, LANGS.es.articles)).toBe('gafas');
    expect(glossaryNeedle({ term: 'лето' }, LANGS.ru.articles)).toBe('лето');
    expect(glossaryNeedle({ term: 'la', match: 'x' }, LANGS.fr.articles)).toBe('x');
  });

  it('finds Cyrillic whole words case-insensitively', () => {
    expect(findGlossary('Летом мы едем', 'летом')).toBe(0);
    expect(findGlossary('Прилетом', 'летом')).toBe(-1);
  });
});
