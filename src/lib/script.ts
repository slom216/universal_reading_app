import { createElement, use, type ReactNode } from 'react';
import type { LangId } from '../languages';
import { useProgress, type Settings } from '../store/progress';
import { toCyrillic, toLatin } from './isvCyrillic';
import { ar, el, hi, loadZh, ru, type Romanizer } from './romanize';

/** Removes Arabic short vowels, tanwin, shadda, sukun and the dagger alif. */
export const stripHarakat = (s: string) => s.replace(/[ً-ْٰ]/g, '');

const same = (s: string) => s;

/** Languages that can show a Latin pronunciation guide above the words. */
export const ROMANIZERS: Partial<Record<LangId, Romanizer | 'zh'>> = {
  ru,
  el,
  hi,
  ar,
  zh: 'zh',
};
/** Guide on by default for scripts most Europeans can't read yet. */
export const ROMANIZE_DEFAULT: LangId[] = ['zh', 'hi', 'ar'];

/** Data saved before the guide existed has no `romanize`. */
export const romanizeOn = (id: LangId, s: Settings) =>
  (s.romanize ?? ROMANIZE_DEFAULT).includes(id);

/** `lang` attribute and display transform for a language under the reader's settings:
 *  Interslavic in Cyrillic, Serbian in Latin, Arabic without vowel marks, or the stored text
 *  unchanged. `rt` is `tr` plus the Latin reading as ruby above each word, when switched on. */
export function scriptFor(id: LangId, code: string, s: Settings, rom?: Romanizer) {
  const base = baseScript(id, code, s);
  const rt = (text: string): ReactNode =>
    rom
      ? rom(text).map(([t, r], i) =>
          r
            ? createElement(
                'ruby',
                { key: i },
                createElement('span', null, base.tr(t)),
                createElement('rt', null, r),
              )
            : base.tr(t),
        )
      : base.tr(text);
  return { ...base, rt };
}

function baseScript(id: LangId, code: string, s: Settings) {
  if (id === 'isv' && s.isvScript === 'cyrillic')
    return { code: 'isv-Cyrl', tr: toCyrillic };
  // Serbian is stored in Cyrillic; data saved before Serbian existed has no srScript.
  if (id === 'sr' && s.srScript === 'latin') return { code: 'sr-Latn', tr: toLatin };
  // Not `!== 'on'`: data saved before Arabic existed has no arHarakat.
  if (id === 'ar' && s.arHarakat === 'off') return { code, tr: stripHarakat };
  return { code, tr: same };
}

/** scriptFor with the current settings; suspends while pinyin-pro loads for Chinese. */
export function useScript(id: LangId, code: string) {
  const settings = useProgress((s) => s.settings);
  const r = romanizeOn(id, settings) ? ROMANIZERS[id] : undefined;
  const rom = r === 'zh' ? use(loadZh()) : r;
  return scriptFor(id, code, settings, rom);
}
