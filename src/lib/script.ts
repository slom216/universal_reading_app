import type { LangId } from '../languages';
import type { Settings } from '../store/progress';
import { toCyrillic } from './isvCyrillic';

/** Removes Arabic short vowels, tanwin, shadda, sukun and the dagger alif. */
export const stripHarakat = (s: string) => s.replace(/[ً-ْٰ]/g, '');

const same = (s: string) => s;

/** `lang` attribute and display transform for a language under the reader's settings:
 *  Interslavic in Cyrillic, Arabic without vowel marks, or the stored text unchanged. */
export function scriptFor(id: LangId, code: string, s: Settings) {
  if (id === 'isv' && s.isvScript === 'cyrillic') return { code: 'isv-Cyrl', tr: toCyrillic };
  // Not `!== 'on'`: data saved before Arabic existed has no arHarakat.
  if (id === 'ar' && s.arHarakat === 'off') return { code, tr: stripHarakat };
  return { code, tr: same };
}
