import type { LangId } from '../../languages';

export type Phrase = {
  id: number;
  rank: number;
  /** English source. */
  phrase: string;
  category: string;
  note?: string;
  /** In the target language. */
  text: string;
};

// The English list and each language's translations (keyed by phrase id) load lazily, so
// readers who never open the phrasebook do not download them.
const english = () => import('../../../1000_phrases_claude.json').then((m) => m.default);
const files = import.meta.glob<{ default: Record<string, string> }>('./*.json');

const cache = new Map<LangId, Promise<Phrase[]>>();

/** A language's phrases in rank order, the most useful first. */
export function loadPhrases(lang: LangId): Promise<Phrase[]> {
  let p = cache.get(lang);
  if (!p) {
    p = Promise.all([english(), files[`./${lang}.json`]!()]).then(([en, tr]) =>
      en
        .map((x) => ({ ...x, text: tr.default[x.id] ?? '' }))
        .sort((a, b) => a.rank - b.rank),
    );
    cache.set(lang, p);
  }
  return p;
}
