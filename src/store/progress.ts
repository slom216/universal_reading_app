import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, dayKey } from '../lib/dates';
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

const day = z.string().regex(/^\d{4}-\d\d-\d\d$/);

/** Word review (Leitner boxes): days until a word comes back, by box. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;

export const progressDataSchema = z.object({
  results: z.record(z.string(), resultSchema),
  activity: z.record(day, z.number().int().min(0)),
  /** Glossary words under review, keyed `${lang}/${term}`. Missing before word review. */
  words: z
    .record(
      z.string(),
      z.object({
        box: z
          .number()
          .int()
          .min(0)
          .max(BOX_DAYS.length - 1),
        due: day,
      }),
    )
    .default({}),
  settings: z.object({
    theme: z.enum(['system', 'light', 'dark']),
    fontSize: z.enum(['s', 'm', 'l', 'xl']),
    isvScript: z.enum(['latin', 'cyrillic']),
    /** Arabic vowel marks (harakat). Missing in data saved before Arabic existed. */
    arHarakat: z.enum(['on', 'off']).default('on'),
    /** Serbian script; texts are stored in Cyrillic. Missing in data saved before Serbian. */
    srScript: z.enum(['cyrillic', 'latin']).default('cyrillic'),
    /** Languages showing the Latin pronunciation guide. Missing in data saved before it. */
    romanize: z.array(z.enum(LANG_IDS)).default(['zh', 'hi', 'ar']),
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
  words: {},
  settings: {
    theme: 'system',
    fontSize: 'm',
    isvScript: 'latin',
    arHarakat: 'on',
    srScript: 'cyrillic',
    romanize: ['zh', 'hi', 'ar'],
    lastLang: null,
  },
  recentLangs: [],
};

type Actions = {
  /** Records a finished quiz; score is the fraction correct (0–1). */
  complete: (key: string, score: number, now?: Date) => void;
  /** Counts a finished practice round (phrases, words) toward the day's activity. */
  practiced: (now?: Date) => void;
  /** Moves a word up a box when answered right, back to the first box when wrong. */
  reviewed: (key: string, right: boolean, now?: Date) => void;
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
      practiced: (now = new Date()) =>
        set((s) => {
          const d = dayKey(now);
          return { activity: { ...s.activity, [d]: (s.activity[d] ?? 0) + 1 } };
        }),
      reviewed: (key, right, now = new Date()) =>
        set((s) => {
          const box = right
            ? Math.min((s.words[key]?.box ?? 0) + 1, BOX_DAYS.length - 1)
            : 0;
          return {
            words: {
              ...s.words,
              [key]: { box, due: addDays(dayKey(now), BOX_DAYS[box]!) },
            },
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
      reset: () => set({ results: {}, activity: {}, words: {}, recentLangs: [] }),
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
);
