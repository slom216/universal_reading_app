import type { LangId } from '../languages';
import type { Settings } from '../store/progress';
import { toCyrillic, toLatin } from './isvCyrillic';

/** Removes Arabic short vowels, tanwin, shadda, sukun and the dagger alif. */
export const stripHarakat = (s: string) => s.replace(/[ً-ْٰ]/g, '');

const same = (s: string) => s;

/** `lang` attribute and display transform for a language under the reader's settings:
 *  Interslavic in Cyrillic, Serbian in Latin, Arabic without vowel marks, or the stored text unchanged. */
export function scriptFor(id: LangId, code: string, s: Settings) {
  if (id === 'isv' && s.isvScript === 'cyrillic')
    return { code: 'isv-Cyrl', tr: toCyrillic };
  // Serbian is stored in Cyrillic; data saved before Serbian existed has no srScript.
  if (id === 'sr' && s.srScript === 'latin') return { code: 'sr-Latn', tr: toLatin };
  // Not `!== 'on'`: data saved before Arabic existed has no arHarakat.
  if (id === 'ar' && s.arHarakat === 'off') return { code, tr: stripHarakat };
  return { code, tr: same };
}
