# DeuLern Polyglot: design

Date: 2026-11-05. Status: approved. The user said to go ahead without more questions; the calls made after that are marked *(my call)*.

## Intent

A multi-language version of DeuLern's Lese Reise (`../lese_reise`). It has the same kind
of graded reading texts with tappable glossary words and a comprehension quiz, in five
languages on one site: **Italian, Spanish, French, Russian and Interslavic**. It is part
of the DeuLern family and looks exactly like Lese Reise.

`INSTRUCTIONS_FOR_NEW_LANUGAGES.md` (in this repo) is the reference for behaviour,
content rules, visual style and the topic plan. This document only records where the
new app differs from it, and the decisions taken for it.

## Decided by the user

| Topic           | Decision                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| Shape           | **One site with a language picker.** One codebase, one Cloudflare Worker, one domain.        |
| Brand           | **DeuLern family.** Tokens, CSS and art are copied unchanged from Lese Reise.                |
| Name / domain   | **DeuLern Polyglot**, `https://read.deulern.com`                                              |
| Content volume  | **The full plan: 270 texts per language** (60 A1, 90 A2, 120 B1), about 1,350 in total.      |
| Writing method  | **Sequential, written by the main agent itself**, batch by batch. No fan-out to subagents.   |
| Writing order   | Italian → Spanish → French → Russian → Interslavic                                           |
| Gloss / chrome  | **English** for every language                                                               |
| Hero art        | **Generated** with the image tool from the prompt in section 4 of the instructions, then shown to the user before it is used |
| Vocab tooling   | **Dropped.** No `audit:vocab`, no `link:glossary`, no CEFR word lists, no vocab-app links    |
| Interslavic script | **Stored in standard Latin.** A reader setting shows it in Cyrillic through the standard 1:1 transliteration |
| Interslavic setting | **Rotate through Slavic countries.** Each text is set in a real Slavic country (Poland, Czechia, Slovakia, Slovenia, Croatia, Serbia, Bosnia, Montenegro, North Macedonia, Bulgaria, Ukraine, Belarus, Russia), with local names, food and places |

## Where it lives

A new Vite + React app in this folder (`universal_reading_app`). Build it by copying
Lese Reise's source and config (without `node_modules`, `dist`, `.git`, `data/`,
`scripts/auditVocab.ts`, `scripts/linkGlossary.ts`, `design.md`) and adapting it. Keep
the same stack (section 1 "Stack" of the instructions) and the same CSS files.

## Languages

All per-language values sit in one module, `src/languages.ts`, as one record per
language. Nothing else in the code names a language.

| Field        | it                          | es                            | fr                               | ru                         | isv                                   |
| ------------ | --------------------------- | ----------------------------- | -------------------------------- | -------------------------- | ------------------------------------- |
| URL slug     | `it`                        | `es`                          | `fr`                             | `ru`                       | `isv`                                 |
| `lang` attr  | `it`                        | `es`                          | `fr`                             | `ru`                       | `isv` (Latin) / `isv-Cyrl` (Cyrillic) |
| English name | Italian                     | Spanish                       | French                           | Russian                    | Interslavic                           |
| Native name  | Italiano                    | Español                       | Français                         | Русский                    | Medžuslovjansky                       |
| True/False   | Vero / Falso                | Verdadero / Falso             | Vrai / Faux                      | Верно / Неверно            | Pravda / Nepravda                     |
| Quiz heading | Hai capito tutto?           | ¿Lo has entendido todo?       | Tu as tout compris ?             | Ты всё понял?              | Li jesi vse razuměl?                  |
| Gloss heading| Parole dal testo            | Palabras del texto            | Mots du texte                    | Слова из текста            | Slova iz teksta                       |
| Perfect      | Perfetto! 🎉                | ¡Perfecto! 🎉                 | Parfait ! 🎉                     | Отлично! 🎉                | Odlično! 🎉                           |
| Articles stripped from headwords | `il lo la i gli le l' un uno una un'` | `el la los las un una` | `le la les l' un une` | none | none |
| Setting      | Italy                       | Spain                         | France                           | Russia                     | Rotating Slavic countries             |

The builder writes the font-size sample sentence for each language. The native strings
above are the builder's first draft, so correct them while writing if a more natural
form fits better. The Russian quiz heading uses the informal masculine form, like the
German "Hast du"; the builder may pick a gender-neutral one (for example "Всё понятно?").
French spacing before `?` and `!` uses a no-break space.

**Calendar labels** are English *(my call)*: the progress page covers every language, so
it has no single target language. The week starts on Monday. The **settings sample
sentence** is shown in the last language opened (Italian before any), in Cyrillic when
that is Interslavic with the Cyrillic setting.

**Progress page** *(my call)*: stats and calendar for all languages, then one table per
language with a row per level (read / total, average best, average last, tries). It does
not list every text, so it never loads all languages; each level list already shows the
best score per text.

**Article stripping** (`glossaryNeedle`): handle the elided `l'` / `un'` with no space
after the apostrophe, accepting both `'` and `’`. With no articles (ru, isv) the function
is a no-op.

## Routes

| Route                    | Page                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `/`                      | **Language picker** (new). The hero ("Read your way into a new language.") with the new art, then five cards, one per language: native name, English name, "x / 270 read", a progress bar and a button to that language. |
| `/:lang`                 | The Lese Reise home for that language: eyebrow "A1–B1 Italian reading", headline "Read your way *into Italian.*", how-to paragraph, three level cards with blurbs written for that language's grammar. |
| `/:lang/level/:lvl`      | The level list, as in Lese Reise                                                              |
| `/:lang/text/:id`        | The reader, as in Lese Reise, without the vocab-app sentence and links                        |
| `/progress`              | One page for all languages. Streaks and the calendar count activity in every language. The table has one row per language and level. |
| `/settings`              | Global: theme, text size, Interslavic script (Latin/Cyrillic), export, import, reset         |
| `*`                      | Not found. An unknown `:lang`, level or text id also lands here.                              |

Header nav: **Languages** (`/`), **Texts** (the last language opened, or `/` if none),
**Progress**, **Settings**. The brand reads "DeuLern | Reading". The footer note says:
"Reading is part of DeuLern. All texts are written for this app. Your progress is stored
only in this browser." with the Cookies link, and no sibling-app links. `document.title`
is `<h1> · DeuLern Polyglot`.

## Content

- Files: `src/content/texts/{lang}/{a1,a2,b1}.json`, in the format from section 2 of the
  instructions, with the glossary fields renamed to **`term` / `translation`** and no
  `wortschatzId`.
- Text ids stay `a1-01` and so on inside a language. Progress keys are `${lang}/${id}`.
- **Each language loads on its own**: one lazily imported chunk per language
  (`texts-<lang>-<hash>.js`), so a visitor does not download every language. *(my call)*
  The PWA precaches the app shell only; a language chunk is cached (CacheFirst) the first
  time it is opened. Offline therefore works for every language the visitor has opened.
- Content tests run for each language: `EXPECTED[lang][level]` counts, unique ids and
  titles, the id/level match, word ranges, and that every glossary needle is found. For
  Interslavic they also check that only letters of the standard alphabet are used (no
  etymological letters such as å, ę, ų, ȯ, ŕ).
- The writing rules in section 2 of the instructions apply to every language. The topic
  plan in section 6 is used for every language, with the *localise* rows adapted to
  the country.

### Grammar progression (also the source for the level blurbs)

| Lang | A1                                                     | A2                                                                   | B1                                                                                   |
| ---- | ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| it   | presente, essere/avere, articles, c'è/ci sono          | passato prossimo + imperfetto, reflexives, direct and indirect pronouns | futuro, condizionale, congiuntivo presente, relative clauses, trapassato            |
| es   | presente, ser/estar, gustar, hay                       | pretérito indefinido + imperfecto, pretérito perfecto, pronouns      | futuro, condicional, presente de subjuntivo, relative clauses                         |
| fr   | présent, articles, aller + infinitive                  | passé composé + imparfait, futur proche, pronouns                    | futur simple, conditionnel, subjonctif présent, qui/que/dont/où                       |
| ru   | present tense, nominative/accusative/prepositional, short clauses | past tense, basic aspect pairs, genitive/dative/instrumental, basic verbs of motion | all six cases, aspect in narration, который/чтобы clauses, opinions             |
| isv  | present tense, nominative/accusative, short clauses    | past tense (l-form), more cases, simple subordinate clauses          | conditional, all cases, ktory clauses, opinions                                       |

Russian is written with ё, without stress marks.

## Interslavic Cyrillic toggle

- Setting `isvScript: 'latin' | 'cyrillic'`, global and default `'latin'`, stored in the
  progress store and included in export/import.
- `src/lib/isvCyrillic.ts` maps standard Latin to standard Cyrillic: the digraphs
  `lj→љ`, `nj→њ`, `dž→џ` first, then `a б c→ц č→ч ć→ћ d đ→ђ e ě→є f g h→х i j→ј k l m n o p r
  s š→ш t u v y→ы z ž→ж`. It keeps case and leaves non-letters as they are. One
  `assert` or unit test pins the mapping.
- It applies to everything in the target language: the body, title, glossary terms,
  questions, options, explanations and the lesson strings (headings, True/False,
  perfect). Glossary matching runs on the Latin source. The body is split into segments
  first and each segment is transliterated afterwards, so digraph length changes never
  move a highlight.
- It is shown in the Interslavic reader as a small Latin/Cyrillic segmented control, and
  also in Settings.

## Fonts

- Outfit is Latin-only, and the copied file is the `latin` subset, which has no č š ž ě ć
  đ. Add Outfit's **latin-ext** subset (with a matching `unicode-range`) so Interslavic
  headlines don't fall back letter by letter.
- Outfit has no Cyrillic. Cyrillic headlines fall back to **Manrope 800** through the font
  stack. Manrope's variable package already ships the Cyrillic subsets, so no new font is
  needed. Builder's check: the fallback should look acceptable in Russian h1 and hero
  text at both themes.

## Storage, export, hosting

- Storage key and export id `deulern-polyglot`. Export shape
  `{ app: 'deulern-polyglot', version: 1, results, activity, settings }`. The theme
  script in `index.html` reads the same key.
- Prerender (`scripts/prerender.mjs`): `/`, `/:lang`, `/:lang/level/:lvl`,
  `/:lang/text/:id` for every language, with `<article lang>` / `<dt lang>` / `<ol lang>`
  set to the language, the True/False label in the language, and a canonical link and
  sitemap entry for each. Interslavic prerenders in Latin.
- `wrangler.jsonc`: worker `deulern-polyglot`, static assets from `dist/` with the SPA
  fallback, and a custom domain `read.deulern.com`. `public/robots.txt` points at
  `https://read.deulern.com/sitemap.xml`.
- The analytics script stays (`https://deulern.com/analytics.js`).

## Art

Copy `logo-mark.png`, the three level images and `footer-staircase.webp` from Lese Reise.
Generate one country-neutral hero (743×351, transparent WebP) with the section 4 prompt
and show it to the user before using it. The new hero is used on `/` and on every `/:lang`
home.

## Build order

1. The app and every non-content change, with **3 sample texts per level per language**
   (45 in total). Tests, lint, typecheck and build pass, and every page has been clicked
   through in both themes and at phone width. The hero is generated here.
2. Then the content, written by the main agent in batches of about 10, in the order
   Italian → Spanish → French → Russian → Interslavic, A1 → A2 → B1 inside each
   language. Raise `EXPECTED` after each batch and keep the tests green. This takes
   many sessions. The app can be deployed at any point with partial counts.
3. Deploy: `npx wrangler deploy`, run by the user or with their explicit go-ahead.

## Non-goals

- No accounts, backend or sync. Progress stays in `localStorage`.
- No vocab app, CEFR audit or glossary linking.
- No UI translation: the chrome is English only.
- No Russian stress marks, no audio, no install manifest (same as Lese Reise).
- No Latin American Spanish or non-France French settings (Spain and France only).

## Anti-goals

- The texts must not be translations of the German texts, or of each other across
  languages. Each language gets its own stories set in its own country.
- It must not drift from the DeuLern look. If a component looks different from Lese
  Reise, that is a bug.
- Visitors to one language must not download the others.

## Publishing *(my call)*

No hidden/published flag per language. Every language is public once deployed; deploying
stays the user's decision.

## Risks the user should know

- **Interslavic and Russian quality**: these are the languages where my writing is
  least reliable (Interslavic most of all, since it is a constructed language with
  little training text). A fluent reviewer should read a sample before launch.
- **Volume**: about 1,350 texts written one after another is many sessions of work.
  Partial deploys are expected.

## Left to the builder

The exact component split for the picker page, how the lazy language load shows its
loading state (a plain "Loading…" line is enough), the sample sentences, the exact
Interslavic month names, and the order of cards on `/` (the writing order is fine).
