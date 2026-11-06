import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKey } from '../lib/dates';
import { LANG_IDS, type LangId } from '../languages';

/** Must match the key read by the inline theme script in index.html. */
export const STORAGE_KEY = 'deulern-polyglot';

/** Results are keyed `${lang}/${textId}`, e.g. `it/a1-01`. */
const resultSchema = z.object({
  bestScore: z.number().min(0).max(1),
  lastScore: z.number().min(0).max(1),
  attempts: z.number().int().min(1),
  completedAt: z.string(),
});

export const progressDataSchema = z.object({
  results: z.record(z.string(), resultSchema),
  activity: z.record(z.string().regex(/^\d{4}-\d\d-\d\d$/), z.number().int().min(0)),
  settings: z.object({
    theme: z.enum(['system', 'light', 'dark']),
    fontSize: z.enum(['s', 'm', 'l', 'xl']),
    isvScript: z.enum(['latin', 'cyrillic']),
    /** Arabic vowel marks (harakat). Missing in data saved before Arabic existed. */
    arHarakat: z.enum(['on', 'off']).default('on'),
    /** The language the "Texts" nav link and the settings sample use. */
    lastLang: z.enum(LANG_IDS).nullable(),
  }),
  /** Languages in the order a text was last opened in them, most recent first. */
  recentLangs: z.array(z.enum(LANG_IDS)).default([]),
});

export type ProgressData = z.infer<typeof progressDataSchema>;
export type Settings = ProgressData['settings'];

const initial: ProgressData = {
  results: {},
  activity: {},
  settings: { theme: 'system', fontSize: 'm', isvScript: 'latin', arHarakat: 'on', lastLang: null },
  recentLangs: [],
};

type Actions = {
  /** Records a finished quiz; score is the fraction correct (0–1). */
  complete: (key: string, score: number, now?: Date) => void;
  /** Moves a language to the front of recentLangs; called when one of its texts opens. */
  openedText: (lang: LangId) => void;
  setSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: ProgressData) => void;
  reset: () => void;
};

export const useProgress = create<ProgressData & Actions>()(
  persist(
    (set) => ({
      ...initial,
      complete: (key, score, now = new Date()) =>
        set((s) => {
          const prev = s.results[key];
          const day = dayKey(now);
          return {
            results: {
              ...s.results,
              [key]: {
                bestScore: Math.max(prev?.bestScore ?? 0, score),
                lastScore: score,
                attempts: (prev?.attempts ?? 0) + 1,
                completedAt: now.toISOString(),
              },
            },
            activity: { ...s.activity, [day]: (s.activity[day] ?? 0) + 1 },
          };
        }),
      openedText: (lang) =>
        set((s) =>
          s.recentLangs[0] === lang
            ? s
            : { recentLangs: [lang, ...s.recentLangs.filter((l) => l !== lang)] },
        ),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      replaceAll: (data) => set(data),
      reset: () => set({ results: {}, activity: {}, recentLangs: [] }),
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
);
