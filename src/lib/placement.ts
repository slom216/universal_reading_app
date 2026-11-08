import { LEVELS, type Level, type ReadingText } from '../content/schema';
import type { LangId } from '../languages';
import { shuffle } from './distractors';
import { allWords, type Word } from './words';

/** Words asked per level. */
export const PER_LEVEL = 8;
/** Share of a level's words to get right to pass it. */
export const PASS = 0.75;

export type PlacementWord = Word & { level: Level };

/** PER_LEVEL random glossary words from each level, easiest level first. A word belongs to
 *  the level of the first text it appears in. */
export function placementWords(lang: LangId, texts: ReadingText[]): PlacementWord[] {
  const words = allWords(lang, texts).map((w) => ({
    ...w,
    level: w.textId.slice(0, 2).toUpperCase() as Level,
  }));
  return LEVELS.flatMap((l) =>
    shuffle(words.filter((w) => w.level === l)).slice(0, PER_LEVEL),
  );
}

/** The level to start at: the first one not passed, or the top one if all are. */
export function placedLevel(right: Record<Level, number>): Level {
  return LEVELS.find((l) => right[l] < PASS * PER_LEVEL) ?? LEVELS[LEVELS.length - 1]!;
}
