import { LANG_IDS, type LangId } from '../../languages';
import { phraseSlug } from '../../lib/slug';

export type Phrase = {
  id: number;
  rank: number;
  /** English source. */
  phrase: string;
  category: string;
  note?: string;
  /** In the target language. */
  text: string;
  /** `/say/<slug>`: the phrase in every language. */
  slug: string;
};

// Recordings live at src/assets/audio/phrases/<lang>/<phrase id>.mp3; only the URLs are
// bundled. Phrases without a recording get no play button.
const audio = import.meta.glob<string>('../../assets/audio/phrases/*/*.mp3', {
  query: '?url',
  import: 'default',
  eager: true,
});
export const phraseAudio = (lang: LangId, id: number): string | undefined =>
  audio[`../../assets/audio/phrases/${lang}/${id}.mp3`];

// The English list and each language's translations (keyed by phrase id) load lazily, so
// readers who never open the phrasebook do not download them.
const english = () => import('../../../1000_phrases_claude.json').then((m) => m.default);
const files = import.meta.glob<{ default: Record<string, string> }>('./*.json');

/** Languages with a phrasebook; a reading language can ship before its phrases. */
export const PHRASE_LANGS = LANG_IDS.filter((id) => `./${id}.json` in files);

const cache = new Map<LangId, Promise<Phrase[]>>();

/** A language's phrases in rank order, the most useful first. */
export function loadPhrases(lang: LangId): Promise<Phrase[]> {
  let p = cache.get(lang);
  if (!p) {
    p = Promise.all([english(), files[`./${lang}.json`]!()]).then(([en, tr]) =>
      en
        .map((x) => ({ ...x, text: tr.default[x.id] ?? '', slug: phraseSlug(x.phrase) }))
        .sort((a, b) => a.rank - b.rank),
    );
    cache.set(lang, p);
  }
  return p;
}

let all: Promise<Phrase[][]> | undefined;
/** Every phrasebook, in PHRASE_LANGS order (for `/say/:slug`). */
export const loadAllPhrases = () => (all ??= Promise.all(PHRASE_LANGS.map(loadPhrases)));
