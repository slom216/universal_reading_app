import type { ReadingText } from '../content/schema';
import { LANGS } from '../languages';
import { inOrder, scramble, textScrambles, tilesOf } from './unscramble';

const text = {
  id: 'a1-01',
  body: 'Ciao! Lavoro in una banca in centro. «Vieni anche tu?» chiede Marco.\n\nOggi la banca è chiusa, quindi resto a casa.',
} as ReadingText;

test('keeps 4–10 word sentences without quotes and moves the end mark off the tiles', () => {
  const s = textScrambles(LANGS.it, text);
  expect(s.map((x) => [x.tiles.join(' '), x.end])).toEqual([
    ['Lavoro in una banca in centro', '.'],
    ['Oggi la banca è chiusa, quindi resto a casa', '.'],
  ]);
});

test('a scramble is never already in order, even with repeated words', () => {
  // Swapping the two "in"s alone would still read right; scramble must not stop there.
  const tiles = ['in', 'una', 'in'];
  for (let n = 0; n < 500; n++) {
    const order = scramble(tiles);
    expect([...order].sort()).toEqual([0, 1, 2]);
    expect(inOrder(tiles, order)).toBe(false);
  }
  expect(() => scramble(['no', 'no'])).toThrow();
});

test('identical words are interchangeable when checking', () => {
  expect(inOrder(['in', 'una', 'in'], [2, 1, 0])).toBe(true);
  expect(inOrder(['in', 'una', 'in'], [0, 1])).toBe(false);
});

test('Chinese splits into words with punctuation on the word before', () => {
  expect(tilesOf('我今天很忙，明天去北京', 'zh-CN').join('')).toBe('我今天很忙，明天去北京');
  expect(tilesOf('我今天很忙，明天去北京', 'zh-CN').some((t) => t.startsWith('，'))).toBe(
    false,
  );
});
