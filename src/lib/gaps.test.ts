import type { ReadingText } from '../content/schema';
import { LANGS } from '../languages';
import { gapOptions, textGaps } from './gaps';

const text = {
  id: 'a1-01',
  body: 'Ciao! Lavoro in una banca in centro.\n\nLa casa è grande e la casa è bella.',
  glossary: [
    { term: 'lavorare', translation: 'to work', match: 'Lavoro' },
    { term: 'la banca', translation: 'bank' },
    { term: 'ciao', translation: 'hi' },
    { term: 'la casa', translation: 'house' },
  ],
} as ReadingText;

test('cuts each glossary word out of its sentence, skipping thin or repeated context', () => {
  const gaps = textGaps(LANGS.it, text);
  // "Ciao!" has no context left and "casa" repeats in its sentence: both are skipped.
  expect(gaps.map((g) => [g.before, g.answer, g.after])).toEqual([
    ['', 'Lavoro', ' in una banca in centro.'],
    ['Lavoro in una ', 'banca', ' in centro.'],
  ]);
  expect(gaps[0]!.meaning).toBe('to work');
});

test('options at a sentence start are capitalised and never repeat the answer', () => {
  const [gap] = textGaps(LANGS.it, text);
  const options = gapOptions(gap!, ['lavoro', 'lavora', 'lavori', 'lavare'], 'it');
  expect(options).toHaveLength(3);
  expect(options.every((o) => /^[A-Z]/.test(o) && o !== 'Lavoro')).toBe(true);
});
