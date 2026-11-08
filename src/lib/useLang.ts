import { createContext, useContext, type ReactNode } from 'react';
import type { Level, ReadingText } from '../content/schema';
import type { Lang } from '../languages';

export type LangContext = {
  lang: Lang;
  texts: ReadingText[];
  /** `lang` attribute for target-language content (isv-Cyrl when shown in Cyrillic). */
  code: string;
  /** Shows target-language text in the chosen script (isv Cyrillic, Arabic without vowels). */
  tr: (s: string) => string;
  /** `tr` with the Latin pronunciation guide as ruby, when it is switched on. */
  rt: (s: string) => ReactNode;
};

export const LangCtx = createContext<LangContext | null>(null);

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang outside a /:lang route');
  const { lang, texts } = ctx;
  return {
    ...ctx,
    base: `/${lang.id}`,
    byLevel: (level: Level) => texts.filter((t) => t.level === level),
    byId: (id: string) => texts.find((t) => t.id === id),
    /** Progress-store key of a text. */
    key: (id: string) => `${lang.id}/${id}`,
  };
}
