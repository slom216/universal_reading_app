import type { Level } from './content/schema';

export const LANG_IDS = [
  'en',
  'de',
  'it',
  'es',
  'fr',
  'ru',
  'isv',
  'tr',
  'pt',
  'ar',
  'pl',
  'el',
  'sr',
] as const;
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
  en: {
    id: 'en',
    code: 'en',
    name: 'English',
    native: 'English',
    trueLabel: 'True',
    falseLabel: 'False',
    quizHeading: 'Did you understand everything?',
    glossHeading: 'Words from the text',
    perfect: 'Perfect! 🎉',
    sample: 'This is a sample sentence in the size you chose.',
    // The glossary explains each word in simpler English. Verbs are listed as "to …".
    articles: /^(?:the|a|an|to)\s+/i,
    blurb: {
      A1: 'Short everyday texts from the UK, the US, Ireland, Canada, Australia and New Zealand in the present tense: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the past simple and past continuous.',
      B1: 'Articles and reports on society, work and daily life, with the present perfect, the passive, conditionals and phrasal verbs.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  de: {
    id: 'de',
    code: 'de',
    name: 'German',
    native: 'Deutsch',
    trueLabel: 'Richtig',
    falseLabel: 'Falsch',
    quizHeading: 'Hast du alles verstanden?',
    glossHeading: 'Wörter zum Text',
    perfect: 'Perfekt! 🎉',
    sample: 'Das ist ein Beispielsatz in der gewählten Größe.',
    // Nouns carry their article; inflected and separated forms go in `match`.
    articles: /^(?:der|die|das|ein|eine)\s+/i,
    blurb: {
      A1: 'Short everyday texts from Germany, Austria and Switzerland in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the Perfekt, with dative and weil/dass clauses.',
      B1: 'Articles and reports on society, work and daily life, with the Präteritum, Konjunktiv II, the passive and relative clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
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
  tr: {
    id: 'tr',
    code: 'tr',
    name: 'Turkish',
    native: 'Türkçe',
    trueLabel: 'Doğru',
    falseLabel: 'Yanlış',
    quizHeading: 'Her şeyi anladın mı?',
    glossHeading: 'Metindeki kelimeler',
    perfect: 'Mükemmel! 🎉',
    sample: 'Bu, seçilen boyutta örnek bir cümledir.',
    // Turkish has no articles; inflected forms go in `match`.
    articles: null,
    blurb: {
      A1: 'Short everyday texts in the present tense, with the first case endings: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the past tense with -di and -miş.',
      B1: 'Articles and reports on society, work and daily life, with the conditional, participles and -dik clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  pt: {
    id: 'pt',
    code: 'pt-BR',
    name: 'Portuguese',
    native: 'Português',
    trueLabel: 'Verdadeiro',
    falseLabel: 'Falso',
    quizHeading: 'Você entendeu tudo?',
    glossHeading: 'Palavras do texto',
    perfect: 'Perfeito! 🎉',
    sample: 'Esta é uma frase de exemplo no tamanho escolhido.',
    // Brazilian Portuguese; contractions (do, na, pelo) go in `match`.
    articles: /^(?:o|a|os|as|um|uma|uns|umas)\s+/i,
    blurb: {
      A1: 'Short everyday texts from Brazil in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the pretérito perfeito and imperfeito.',
      B1: 'Articles and reports on Brazilian society, work and daily life, with the future, conditional and subjuntivo.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  ar: {
    id: 'ar',
    code: 'ar',
    name: 'Arabic',
    native: 'العربية',
    trueLabel: 'صَحِيحٌ',
    falseLabel: 'خَطَأٌ',
    quizHeading: 'هَلْ فَهِمْتَ كُلَّ شَيْءٍ؟',
    glossHeading: 'كَلِمَاتٌ مِنَ النَّصِّ',
    perfect: 'مُمْتَازٌ! 🎉',
    sample: 'هٰذِهِ جُمْلَةٌ لِلتَّجْرِبَةِ بِالْحَجْمِ الْمُخْتَارِ.',
    // Modern Standard Arabic, fully vowelled (the reader can hide the vowels). The
    // article and prefixes are attached, so every glossary entry has a `match`.
    articles: null,
    blurb: {
      A1: 'Short everyday texts from across the Arab world, fully vowelled, in the present tense: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the past tense.',
      B1: 'Articles and reports on society, work and daily life, with the future, the subjunctive after أَنْ and relative clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  pl: {
    id: 'pl',
    code: 'pl',
    name: 'Polish',
    native: 'Polski',
    trueLabel: 'Prawda',
    falseLabel: 'Fałsz',
    quizHeading: 'Wszystko jasne?',
    glossHeading: 'Słowa z tekstu',
    perfect: 'Doskonale! 🎉',
    sample: 'To jest przykładowe zdanie w wybranym rozmiarze.',
    // No articles; inflected case forms go in `match`.
    articles: null,
    blurb: {
      A1: 'Short everyday texts from Poland in the present tense, with the first cases: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the past tense, with all seven cases.',
      B1: 'Articles and reports on Polish society, work and daily life, with the conditional, żeby and który clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  el: {
    id: 'el',
    code: 'el',
    name: 'Greek',
    native: 'Ελληνικά',
    trueLabel: 'Σωστό',
    falseLabel: 'Λάθος',
    quizHeading: 'Τα κατάλαβες όλα;',
    glossHeading: 'Λέξεις από το κείμενο',
    perfect: 'Τέλεια! 🎉',
    sample: 'Αυτή είναι μια πρόταση για δοκιμή στο μέγεθος που διάλεξες.',
    // Modern Greek, monotonic; other cases and verb forms go in `match`.
    articles: /^(?:ο|η|το|οι|τα|ένας|μια|μία|ένα)\s+/i,
    blurb: {
      A1: 'Short everyday texts from Greece and Cyprus in the present tense: family, food, home, getting around.',
      A2: 'Longer stories about work, travel and health, told in the aorist and imperfect.',
      B1: 'Articles and reports on Greek society, work and daily life, with the perfect, να-clauses and the conditional.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
  sr: {
    id: 'sr',
    code: 'sr',
    name: 'Serbian',
    native: 'Српски',
    trueLabel: 'Тачно',
    falseLabel: 'Нетачно',
    quizHeading: 'Да ли је све јасно?',
    glossHeading: 'Речи из текста',
    perfect: 'Одлично! 🎉',
    sample: 'Ово је пример реченице у изабраној величини.',
    // Ekavian, stored in Cyrillic (the reader can switch to Latin). No articles;
    // inflected case forms go in `match`.
    articles: null,
    blurb: {
      A1: 'Short everyday texts from Serbia in the present tense, with the first cases: family, food, home.',
      A2: 'Longer stories about work, travel and health, told in the perfect tense, with all seven cases.',
      B1: 'Articles and reports on Serbian society, work and daily life, with aspect, the conditional and који clauses.',
    },
    counts: { A1: 60, A2: 100, B1: 140 },
  },
};

/**
 * Announced on the picker as "coming soon". No routes or texts yet: when one gets texts,
 * move it into LANG_IDS/LANGS. Notes for that move: fa and ku (Sorani) are right-to-left like ar (see :lang(ar) in globals.css).
 */
export const UPCOMING: { code: string; name: string; native: string }[] = [
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'sq', name: 'Albanian', native: 'Shqip' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
  { code: 'bg', name: 'Bulgarian', native: 'Български' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски' },
];

export const isLangId = (s: string | undefined): s is LangId =>
  (LANG_IDS as readonly string[]).includes(s ?? '');

export const totalTexts = (lang: Lang) =>
  Object.values(lang.counts).reduce((a, b) => a + b, 0);
