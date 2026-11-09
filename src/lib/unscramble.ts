import type { ReadingText } from '../content/schema';
import type { Lang } from '../languages';
import { shuffle } from './distractors';

/** One unscramble question: a sentence from a text cut into word tiles. */
export type Scramble = {
  key: string;
  textId: string;
  /** The words in their right order. */
  tiles: string[];
  /** Final punctuation, shown after the built sentence rather than on a tile. */
  end: string;
  /** What goes between tiles: a space, or nothing for Chinese. */
  joiner: string;
};

const HAN = /\p{Script=Han}/u;
/** Dialogue and asides cut into odd tiles («Ciao, — and a quote split mid-sentence). */
const MESSY = /[«»“”„"—–()\n]/u;
const END = /[.!?;。！？؟।…]+$/u;
const MIN = 4;
const MAX = 10;

/** Words of a sentence; Chinese is split by the platform's word segmenter, with
 *  punctuation kept on the word before it. */
export function tilesOf(sentence: string, locale: string): string[] {
  if (!HAN.test(sentence)) return sentence.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const s of new Intl.Segmenter(locale, { granularity: 'word' }).segment(sentence)) {
    if (s.isWordLike || !out.length) out.push(s.segment);
    else out[out.length - 1] += s.segment;
  }
  return out.map((t) => t.trim()).filter(Boolean);
}

/** Sentences of a text with 4–10 words, at least two of them different (else no shuffle
 *  could put them out of order), and no quotes or dashes. */
export function textScrambles(lang: Lang, text: ReadingText): Scramble[] {
  const sentences = new Intl.Segmenter(lang.code, { granularity: 'sentence' }).segment(
    text.body,
  );
  return [...sentences].flatMap(({ segment }, i) => {
    const s = segment.trim();
    if (MESSY.test(s)) return [];
    const end = END.exec(s)?.[0] ?? '';
    const tiles = tilesOf(s.slice(0, s.length - end.length), lang.code);
    if (tiles.length < MIN || tiles.length > MAX || new Set(tiles).size < 2) return [];
    return [
      {
        key: `${text.id}/${i}`,
        textId: text.id,
        tiles,
        end,
        joiner: HAN.test(s) ? '' : ' ',
      },
    ];
  });
}

/** True when tiles taken in `order` spell the sentence. Compares words, not positions,
 *  so two copies of the same word count as interchangeable. */
export function inOrder(tiles: readonly string[], order: readonly number[]): boolean {
  return order.length === tiles.length && order.every((k, i) => tiles[k] === tiles[i]);
}

/** Tile positions in a shuffled order that never reads as the sentence itself; shuffles
 *  again until it doesn't. Needs at least two different words, which textScrambles ensures. */
export function scramble(tiles: readonly string[]): number[] {
  if (new Set(tiles).size < 2) throw new Error('nothing to scramble');
  const indices = tiles.map((_, i) => i);
  let order: number[];
  do order = shuffle(indices);
  while (inOrder(tiles, order));
  return order;
}
