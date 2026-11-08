import type { ReadingText } from '../content/schema';
import type { LangId } from '../languages';
import type { ProgressData } from '../store/progress';

export type Word = { key: string; term: string; meaning: string };

/** Words per review round. */
export const ROUND = 20;

/** The English meaning of a glossary entry. Chinese entries start with pinyin
 *  ("lǎojiā · hometown"), which would give the answer away next to the ruby guide. */
export const meaning = (lang: LangId, translation: string) =>
  lang === 'zh' ? translation.replace(/^[^·]*·\s*/, '') : translation;

/** Every glossary word of a language, once per term, in text order. */
export function allWords(
  lang: LangId,
  texts: ReadingText[],
): (Word & { textId: string })[] {
  const seen = new Set<string>();
  return texts.flatMap((t) =>
    t.glossary
      .filter((g) => !seen.has(g.term) && seen.add(g.term))
      .map((g) => ({
        key: `${lang}/${g.term}`,
        term: g.term,
        meaning: meaning(lang, g.translation),
        textId: t.id,
      })),
  );
}

/** Words from texts whose quiz is done that are due today: words seen before (longest
 *  overdue first), then new ones in text order. */
export function dueWords(
  lang: LangId,
  texts: ReadingText[],
  { results, words }: Pick<ProgressData, 'results' | 'words'>,
  today: string,
): Word[] {
  const read = allWords(lang, texts).filter((w) => results[`${lang}/${w.textId}`]);
  const seen = read
    .filter((w) => words[w.key] && words[w.key]!.due <= today)
    .sort((a, b) => words[a.key]!.due.localeCompare(words[b.key]!.due));
  return [...seen, ...read.filter((w) => !words[w.key])];
}
