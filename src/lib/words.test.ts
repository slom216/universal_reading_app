import type { ReadingText } from '../content/schema';
import { dueWords, meaning } from './words';

const text = (id: string, terms: string[]) =>
  ({
    id,
    glossary: terms.map((term) => ({ term, translation: `${term} (en)` })),
  }) as ReadingText;
const texts = [
  text('a1-01', ['uno', 'dos']),
  text('a1-02', ['dos', 'tres']),
  text('a1-03', ['cuatro']),
];
const done = { bestScore: 1, lastScore: 1, attempts: 1, completedAt: '' };

test('due words: overdue first, then new ones from finished texts only', () => {
  const due = dueWords(
    'es',
    texts,
    {
      results: { 'es/a1-01': done, 'es/a1-02': done },
      words: {
        'es/dos': { box: 1, due: '2026-11-07' },
        'es/uno': { box: 2, due: '2026-11-05' },
        'es/tres': { box: 1, due: '2026-11-09' },
      },
    },
    '2026-11-08',
  );
  expect(due.map((w) => w.term)).toEqual(['uno', 'dos']);
});

test('new words come once per term, in text order', () => {
  const due = dueWords(
    'es',
    texts,
    { results: { 'es/a1-01': done, 'es/a1-02': done }, words: {} },
    '2026-11-08',
  );
  expect(due.map((w) => w.term)).toEqual(['uno', 'dos', 'tres']);
});

test('Chinese meanings drop the pinyin', () => {
  expect(meaning('zh', 'lǎojiā · hometown')).toBe('hometown');
  expect(meaning('es', 'flat · apartment')).toBe('flat · apartment');
});
