import { z } from 'zod';
import type { LangId } from '../languages';
import { LEVELS, textSchema, type ReadingText } from './schema';

// One lazy chunk per language (grouped in vite.config.ts), so a visitor only downloads
// the languages they open.
const files = import.meta.glob<{ default: unknown[] }>('./texts/*/*.json');

const cache = new Map<LangId, Promise<ReadingText[]>>();

export function loadTexts(lang: LangId): Promise<ReadingText[]> {
  let p = cache.get(lang);
  if (!p) {
    p = Promise.all(
      LEVELS.map((l) => files[`./texts/${lang}/${l.toLowerCase()}.json`]!()),
    ).then((mods) => z.array(textSchema).parse(mods.flatMap((m) => m.default)));
    cache.set(lang, p);
  }
  return p;
}
