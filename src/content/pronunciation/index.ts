import type { LangId } from '../../languages';

export type PronunciationRule = {
  title: string;
  body: string;
  /** Regex source for what the rule describes; orders the rules by frequency. See
   *  scripts/pronunciation-order.ts. Not shown to readers. */
  pattern: string;
  /** `say` is an English-style respelling, capitals mark the stressed syllable. */
  examples: { word: string; say: string; en: string }[];
};

// One lazy chunk per language, most frequent rule first.
const files = import.meta.glob<{ default: PronunciationRule[] }>('./*.json');

const cache = new Map<LangId, Promise<PronunciationRule[]>>();

/** Cached, so React's `use()` sees the same promise on every render. */
export function loadRules(lang: LangId): Promise<PronunciationRule[]> {
  let p = cache.get(lang);
  if (!p) {
    p = files[`./${lang}.json`]!().then((m) => m.default);
    cache.set(lang, p);
  }
  return p;
}
