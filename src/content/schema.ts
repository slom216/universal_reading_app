import { z } from 'zod';

export const LEVELS = ['A1', 'A2', 'B1'] as const;
export type Level = (typeof LEVELS)[number];

/** Inclusive word-count range per level. */
export const WORD_RANGE: Record<Level, [number, number]> = {
  A1: [89, 144],
  A2: [144, 233],
  B1: [233, 377],
};

const question = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mc'),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    answer: z.number().int().min(0).max(3),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal('tf'),
    prompt: z.string().min(1),
    answer: z.boolean(),
    explanation: z.string().optional(),
  }),
]);

export const textSchema = z.strictObject({
  id: z.string().regex(/^(a1|a2|b1)-\d{2,3}$/),
  level: z.enum(LEVELS),
  title: z.string().min(1),
  topic: z.string().min(1),
  body: z.string().min(1),
  glossary: z
    .array(
      z.object({
        term: z.string().min(1),
        translation: z.string().min(1),
        /** Exact text to highlight in the body, when it differs from the headword. */
        match: z.string().min(1).optional(),
      }).strict(),
    )
    .min(1),
  questions: z.array(question).min(5).max(8),
});

export type Question = z.infer<typeof question>;
export type ReadingText = z.infer<typeof textSchema>;

const HAN = /\p{Script=Han}/u;
const zhWords = new Intl.Segmenter('zh', { granularity: 'word' });

/** Tokens separated by whitespace that contain a letter or digit. Chinese has no spaces,
 *  so Han text is split into words by the platform's dictionary segmenter instead. */
export function countWords(body: string): number {
  if (HAN.test(body)) return [...zhWords.segment(body)].filter((s) => s.isWordLike).length;
  return body.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Text to find in the body: `match`, else the headword without its leading article. */
export function glossaryNeedle(
  g: { term: string; match?: string | undefined },
  articles: RegExp | null,
): string {
  return g.match ?? (articles ? g.term.replace(articles, '') : g.term);
}

/** First case-insensitive whole-word occurrence of `needle` in `body`. Combining marks
 *  count as part of the word, so a match can't stop before an Arabic vowel. Chinese has no
 *  word boundaries to check, so a Han needle matches anywhere. */
export function findGlossary(body: string, needle: string): number {
  if (HAN.test(needle)) return body.indexOf(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'iu').exec(body);
  return m ? m.index : -1;
}
