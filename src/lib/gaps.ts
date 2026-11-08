import {
  countWords,
  findGlossary,
  glossaryNeedle,
  type ReadingText,
} from '../content/schema';
import type { Lang } from '../languages';
import { nearest } from './distractors';
import { meaning } from './words';

/** One fill-the-gap question: a sentence from a text with a glossary word cut out. */
export type Gap = {
  key: string;
  textId: string;
  before: string;
  answer: string;
  after: string;
  /** English meaning of the missing word, shown as a hint. */
  meaning: string;
};

/** Every glossary word of a text that sits in a sentence with enough context around it
 *  and does not appear again in that sentence (which would give the answer away). */
export function textGaps(lang: Lang, text: ReadingText): Gap[] {
  const sentences = [
    ...new Intl.Segmenter(lang.code, { granularity: 'sentence' }).segment(text.body),
  ];
  return text.glossary.flatMap((g) => {
    const needle = glossaryNeedle(g, lang.articles);
    const start = findGlossary(text.body, needle);
    const s = sentences.find(
      (x) => x.index <= start && start < x.index + x.segment.length,
    );
    if (start < 0 || !s) return [];
    const at = start - s.index;
    const flat = (t: string) => t.replace(/\s+/g, ' ');
    const before = flat(s.segment.slice(0, at)).trimStart();
    const answer = s.segment.slice(at, at + needle.length);
    const after = flat(s.segment.slice(at + needle.length)).trimEnd();
    if (
      countWords(`${before} ${after}`) < 3 ||
      findGlossary(`${before} ${after}`, needle) >= 0
    )
      return [];
    return [
      {
        key: `${text.id}/${g.term}`,
        textId: text.id,
        before,
        answer,
        after,
        meaning: meaning(lang.id, g.translation),
      },
    ];
  });
}

/** Three wrong words for a gap: the glossary words of the language that look most like the
 *  answer. At the start of a sentence they get a capital too, so case gives nothing away. */
export function gapOptions(gap: Gap, pool: readonly string[], locale: string): string[] {
  const capital =
    gap.before === '' && gap.answer !== gap.answer.toLocaleLowerCase(locale);
  const cap = (w: string) =>
    capital ? w.charAt(0).toLocaleUpperCase(locale) + w.slice(1) : w;
  const same = (w: string) =>
    w.toLocaleLowerCase(locale) === gap.answer.toLocaleLowerCase(locale);
  return [...new Set(nearest(gap.answer, pool, 8).map(cap))]
    .filter((w) => !same(w))
    .slice(0, 3);
}
