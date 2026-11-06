import type { Level } from './content/schema';

export const LANG_IDS = ['it', 'es', 'fr', 'ru', 'isv'] as const;
export type LangId = (typeof LANG_IDS)[number];

export type Lang = {
  id: LangId;
  /** BCP 47 code for `lang` attributes. */
  code: string;
  name: string;
  native: string;
  trueLabel: string;
  falseLabel: string;
  quizHeading: string;
  glossHeading: string;
  perfect: string;
  /** Font-size preview on the settings page. */
  sample: string;
  /** Leading article stripped from a glossary headword to find it in the body. */
  articles: RegExp | null;
  blurb: Record<Level, string>;
  /** Texts shipped per level. content.test.ts checks the files match. */
  counts: Record<Level, number>;
};

export const LANGS: Record<LangId, Lang> = {
  it: {
    id: 'it',
    code: 'it',
    name: 'Italian',
    native: 'Italiano',
    trueLabel: 'Vero',
    falseLabel: 'Falso',
    quizHeading: 'Hai capito tutto?',
    glossHeading: 'Parole dal testo',
    perfect: 'Perfetto! 🎉',
    sample: 'Questa è una frase di esempio nella dimensione scelta.',
    articles: /^(?:(?:il|lo|la|i|gli|le|un|uno|una)\s+|(?:l|un)['’])/i,
    blurb: {
      A1: 'Short everyday texts in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the passato prossimo and imperfetto.',
      B1: 'Articles and reports on society, work and daily life, with the future, conditional and congiuntivo.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  es: {
    id: 'es',
    code: 'es',
    name: 'Spanish',
    native: 'Español',
    trueLabel: 'Verdadero',
    falseLabel: 'Falso',
    quizHeading: '¿Lo has entendido todo?',
    glossHeading: 'Palabras del texto',
    perfect: '¡Perfecto! 🎉',
    sample: 'Esta es una frase de ejemplo en el tamaño elegido.',
    articles: /^(?:el|la|los|las|un|una)\s+/i,
    blurb: {
      A1: 'Short everyday texts in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the indefinido and imperfecto.',
      B1: 'Articles and reports on society, work and daily life, with the future, conditional and subjuntivo.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  fr: {
    id: 'fr',
    code: 'fr',
    name: 'French',
    native: 'Français',
    trueLabel: 'Vrai',
    falseLabel: 'Faux',
    quizHeading: 'Tu as tout compris ?',
    glossHeading: 'Mots du texte',
    perfect: 'Parfait ! 🎉',
    sample: 'Voici une phrase d’exemple dans la taille choisie.',
    articles: /^(?:(?:le|la|les|un|une)\s+|l['’])/i,
    blurb: {
      A1: 'Short everyday texts in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the passé composé and imparfait.',
      B1: 'Articles and reports on society, work and daily life, with the future, conditional and subjonctif.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  ru: {
    id: 'ru',
    code: 'ru',
    name: 'Russian',
    native: 'Русский',
    trueLabel: 'Верно',
    falseLabel: 'Неверно',
    quizHeading: 'Всё понятно?',
    glossHeading: 'Слова из текста',
    perfect: 'Отлично! 🎉',
    sample: 'Это пример предложения в выбранном размере шрифта.',
    articles: null,
    blurb: {
      A1: 'Short everyday texts in the present tense, with the first cases: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the past tense, with all the basic cases.',
      B1: 'Articles and reports on society, work and daily life, with aspect, который and чтобы clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  isv: {
    id: 'isv',
    code: 'isv',
    name: 'Interslavic',
    native: 'Medžuslovjansky',
    trueLabel: 'Pravda',
    falseLabel: 'Nepravda',
    quizHeading: 'Vse li jest jasno?',
    glossHeading: 'Slova iz teksta',
    perfect: 'Odlično! 🎉',
    sample: 'To jest priklad teksta v izbranoj veličině.',
    articles: null,
    blurb: {
      A1: 'Short everyday texts in the present tense, set across the Slavic countries.',
      A2: 'Longer stories about work, travel and health, told in the past tense.',
      B1: 'Articles and reports on society, work and daily life, with the conditional and ktory clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
};

/**
 * Announced on the picker as "coming soon". No routes or texts yet: when one gets texts,
 * move it into LANG_IDS/LANGS. Notes for that move: sr needs a Latin/Cyrillic switch
 * like isv; ar, fa and ku (Sorani) are right-to-left.
 */
export const UPCOMING: { code: string; name: string; native: string }[] = [
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'sq', name: 'Albanian', native: 'Shqip' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'sr', name: 'Serbian', native: 'Srpski / Српски' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
  { code: 'bg', name: 'Bulgarian', native: 'Български' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
];

export const isLangId = (s: string | undefined): s is LangId =>
  (LANG_IDS as readonly string[]).includes(s ?? '');

export const totalTexts = (lang: Lang) =>
  Object.values(lang.counts).reduce((a, b) => a + b, 0);
