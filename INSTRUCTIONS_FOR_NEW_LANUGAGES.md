# Recreating Lese Reise for another language

This file explains how to build a copy of Lese Reise for a language other than German.
You can follow it yourself or give it to a coding agent. It records what the app does,
which parts depend on German, and how to write the texts again.

The quickest way is to **copy this repo and change it**, not rebuild it. The code is
small and does not depend on the language. Most of the work, around 90%, is writing
the 300 texts.

---

## 0. Fill these in first

| Variable          | Meaning                                          | German original                         |
| ----------------- | ------------------------------------------------ | --------------------------------------- |
| `{LANG}`          | Language name in English                         | German                                  |
| `{LANG_NATIVE}`   | Language name in the language itself             | Deutsch                                 |
| `{LANG_CODE}`     | BCP 47 code for `lang` attributes and dates      | `de` / `de-DE`                          |
| `{APP_NAME}`      | App name, ideally in the target language         | Lese Reise ("reading journey")          |
| `{APP_SLUG}`      | Package, storage key, export id                  | `lese-reise`                            |
| `{ORIGIN}`        | Production URL                                   | `https://lese.deulern.com`              |
| `{GLOSS_LANG}`    | Language of glossary translations and UI chrome  | English                                 |
| `{TRUE}/{FALSE}`  | "True"/"False" in the target language            | Richtig / Falsch                        |
| `{QUIZ_HEADING}`  | "Did you understand everything?"                 | Hast du alles verstanden?               |
| `{GLOSS_HEADING}` | "Words from the text"                            | Wörter zum Text                         |
| `{PERFECT}`       | Praise for a perfect score                       | Perfekt! 🎉                             |
| `{SAMPLE}`        | One sentence for the font-size preview           | Das ist ein Beispielsatz in der …       |
| `{ARTICLES}`      | Articles to strip from glossary headwords        | `der\|die\|das`                         |
| `{VOCAB_APP}`     | Sibling vocabulary app to link to (optional)     | `https://wortschatz.deulern.com`        |

**Language rule used across the app:** the app chrome (nav, buttons, settings, progress
tables) is in `{GLOSS_LANG}`. Anything that belongs to the lesson is in the target
language: the quiz heading, the glossary heading, the true/false labels, the praise
line, the calendar weekdays and month name, and the font-size sample sentence. Keep that
split.

---

## 1. What the app is

A static, offline-capable website of graded reading texts. You don't need an account
and there is no backend. Progress lives in `localStorage`.

### Pages (`src/App.tsx`, React Router)

| Route          | File                      | What it does                                                                                                                                                                                     |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`            | `pages/HomePage.tsx`      | Hero (eyebrow, poster headline, how-to paragraph, art). One card per level: art, chip, blurb, "N texts · min–max words each", progress bar, "x / N read", button to the level, "Next: <first unread title>" link. |
| `/level/:lvl`  | `pages/LevelPage.tsx`     | Numbered list of the level's texts: title, topic, word count, question count, and a chip that shows either "Best NN%" or "New".                                                                  |
| `/text/:id`    | `pages/ReaderPage.tsx`    | Back link, level chip, topic, word count, best score, title. The text with tappable glossary words. A glossary list that links to the vocab app. The quiz. A prev/next pager inside the level. |
| `/progress`    | `pages/ProgressPage.tsx`  | Stats: current streak, best streak, texts read, quizzes finished. A month calendar heatmap. A per-level table of best, last and tries.                                                           |
| `/settings`    | `pages/SettingsPage.tsx`  | Theme (System/Light/Dark), reading text size (S/M/L/XL with a live sample), download/import progress as JSON, reset progress.                                                                    |
| `*`            | `pages/NotFoundPage.tsx`  | "Page not found". Bad level and bad text ids also land here.                                                                                                                                     |

### Shell (`components/AppShell.tsx`)

Skip link, sticky header (logo mark, "DeuLern", divider, app name, nav, theme toggle,
"deulern.com" button), and footer (brand, links to the sibling apps, "All texts are
written for this app. Your progress is stored only in this browser.", Cookies link with
`data-consent-open`, decorative corner art). When the route changes it focuses `<main>`
and scrolls to the top. `document.title` is set to `<h1> · DeuLern {APP_NAME}`.

### Behaviour that must survive the port

- **Glossary in the text** (`components/GlossaryText.tsx`): the body is split into
  paragraphs on blank lines. Only the *first* occurrence of each glossary entry in the
  whole text is underlined (dotted, accent colour). A hit that overlaps an earlier one
  is dropped. The underlined word is a `<button aria-expanded>`. Clicking it opens a
  tooltip with **headword — translation**, and only one tooltip is open at a time. Esc
  closes it.
- **Match rule** (`content/schema.ts`): the needle is `match` if set, otherwise the
  headword without a leading article. It is found case-insensitively as a whole word,
  using Unicode letter lookarounds `(?<!\p{L})…(?!\p{L})`.
- **Quiz** (`components/Quiz.tsx`): multiple choice has 4 options; true/false shows
  `{TRUE}` / `{FALSE}` side by side. "Check answers" stays disabled until every
  question is answered, and the count of open questions is shown. After submitting:
  every question is marked right or wrong, wrong ones show "Correct answer: X." plus an
  optional `explanation`, and the score is `correct / total` (0–1). On a perfect score
  it shows `{PERFECT}`, praise text and a primary "Next text" button, with no retry.
  Otherwise it shows "n / N correct", a ghost "Next text" and a primary "Try again".
  The quiz is keyed by text id, so it resets when you move to another text.
- **Progress store** (`store/progress.ts`, zustand `persist`, key `{APP_SLUG}`): stores
  `results[textId] = { bestScore, lastScore, attempts, completedAt }`,
  `activity["YYYY-MM-DD"] = quizzes finished that day` (the *local* date, not UTC), and
  `settings { theme, fontSize }`. Every submit counts, including retries.
- **Streaks** (`lib/streak.ts`): the current streak counts back from today. If nothing
  has been read today, it counts back from yesterday, so the streak is not lost until
  the day is over. The best streak is the longest run of consecutive days. The tests in
  `streak.test.ts` pin this down.
- **Calendar** (`components/MonthCalendar.tsx`): starts on Monday, with prev/next month
  buttons and heat levels 0–4 (capped at 4 quizzes). Today is outlined. The weekday
  labels and month label are in the target language.
- **Theme**: an inline script in `index.html` reads the stored theme *before first
  paint*, so there is no flash. The key there must match `STORAGE_KEY`. "System" means
  no `data-theme` attribute. The header toggle flips to the opposite of what is
  currently shown. All colours are `light-dark()` pairs in `styles/tokens.css`.
- **Export/import** (`lib/transfer.ts`): JSON
  `{ app: "{APP_SLUG}", version: 1, results, activity, settings }`, validated with zod.
  Readable errors: "not valid JSON" and "not a {APP_NAME} progress export". The app
  asks for confirmation before it replaces your data.
- **Offline**: `vite-plugin-pwa` precaches the whole bundle, which includes every text.
  There is no install manifest yet.
- **SEO prerender** (`scripts/prerender.mjs`, runs after `vite build`): writes static
  HTML for every level and text page (text, glossary, questions without answers,
  related links), a canonical link, and `sitemap.xml`. The React app mounts over it.
- **Hosting**: Cloudflare Workers static assets (`wrangler.jsonc`) with an SPA fallback.

### Stack

Vite 7, React 19, TypeScript (strict, `noUncheckedIndexedAccess`), react-router-dom 7,
zustand, zod, vitest + Testing Library + jsdom, eslint, prettier (single quotes, width
90), Manrope variable font plus local Outfit 800 and Oswald 600 woff2 files.

Scripts: `dev`, `build` (tsc, then vite build, then prerender), `test`, `lint`,
`typecheck`, `format`, `audit:vocab`, `link:glossary`.

---

## 2. Content format: the part you rewrite

`src/content/texts/{a1,a2,b1}.json`, each an array of:

```json
{
  "id": "a1-01",
  "level": "A1",
  "title": "Hallo, ich bin Lena",
  "topic": "Personal information",
  "body": "Paragraph one.\n\nParagraph two.",
  "glossary": [
    { "german": "das Zentrum", "english": "centre, city centre", "wortschatzId": "a2-das-zentrum" },
    { "german": "freischalten", "english": "to release", "match": "freigeschaltet" }
  ],
  "questions": [
    { "type": "mc", "prompt": "Wie alt ist Lena?", "options": ["21 Jahre", "24 Jahre", "34 Jahre", "42 Jahre"], "answer": 1 },
    { "type": "tf", "prompt": "Anna trinkt Kaffee.", "answer": false, "explanation": "Sie trinkt Orangensaft." }
  ]
}
```

**Rename the fields.** `german`/`english` should become neutral names such as
`term`/`translation`. Update `schema.ts`, `GlossaryText.tsx`, `ReaderPage.tsx`,
`prerender.mjs` and the scripts together.

### Numbers the current app uses

| Level | Texts | Words (inclusive) | Questions | Glossary entries | Grammar focus in the German version                    |
| ----- | ----- | ----------------- | --------- | ---------------- | ------------------------------------------------------- |
| A1    | 60    | 89–144            | 6 (5–8)   | ~10 (9–12)       | Present tense, short main clauses, everyday topics      |
| A2    | 100   | 144–233           | 7 (6–8)   | ~14 (11–14)      | Past tense narration (Perfekt), simple subordinate clauses |
| B1    | 140   | 233–377           | 8 (7–8)   | ~15–16           | Articles and reports, varied tenses, subordinate and relative clauses, opinions |

The word ranges are consecutive Fibonacci numbers. Keep them, or change `WORD_RANGE`
in `schema.ts`. The counts in `content.test.ts` (`EXPECTED`) must match whatever you
ship. You can start smaller (for example 10/10/10) and raise the counts as you write.

About one third of the questions are true/false. Explanations are used mainly on false
statements, to give the correct fact.

### Topics

Section 6 lists all 300 topics (the German app's 270 plus A2 91–100 and B1 121–140), rewritten so they work in any
language. Everyday CEFR themes come back at each level and get harder: A1 covers
"at the doctor's", A2 an emergency at the dentist, B1 getting over a fear of the
dentist. Set every text in a country where the target language is spoken, with its
cities, names, institutions, food and customs.

### Writing rules for each text

1. **Original writing.** Every text is written for this app (the footer says so). Do
   not translate the German texts one-to-one. Write new stories set in the target
   culture. Reusing the *topic plan* is fine.
2. **Level-appropriate grammar.** Map A1/A2/B1 to the target language's own grammar
   progression: which tenses, moods, cases and clause types learners usually meet at
   each level. Write the three home-page blurbs (`BLURB` in `HomePage.tsx`) to match.
3. **Word count** within the level range, counted as whitespace-separated tokens that
   contain a letter or digit.
4. **Paragraphs** separated by a blank line (`\n\n`). A single `\n` stays as a line
   break, which is useful for dialogues, lists and messages.
5. **Titles unique within a level.** Ids are `{level}-{NN}`, unique, in reading order.
6. **Glossary.** List the words that are probably new at this level. Every entry must
   occur in the body as a whole word. The headword is the dictionary form (with the
   article for nouns, if the language has articles). If the body uses an inflected
   form, put the exact text in `match` (case-insensitive). Translations go into
   `{GLOSS_LANG}`, short, with a few senses at most. For a conjugated verb you can
   write the form and its infinitive ("(I) sell — verkaufen").
7. **Questions** are in the target language and can be answered from the text alone.
   Multiple choice has exactly 4 plausible options and one right answer. Spread
   `answer` across indexes 0–3; don't always put it at 1. True/false prompts are
   statements, not questions. Add an `explanation` to most false statements. Questions
   follow the order of the text.
8. **No real people's private data.** Phone numbers and emails in texts should be
   obviously fictional.

### Suggested authoring loop

1. Take the topic plan from section 6. Give each text a title in the target language
   and a setting (city, character names), and replace every topic marked *localise*.
   Check the plan for repeats before writing any body.
2. Write texts in batches of about 10 per level, appending to the JSON file.
3. After each batch run `npm test`. The content tests check the counts, unique titles
   and ids, the id/level match, word ranges, and that every glossary word is found.
   Fix and repeat.
4. If you have CEFR word lists, run `npm run audit:vocab -- <id>` to see the coverage
   percentage and unmatched words, then simplify words that are too hard for the level.
5. Read a few texts per batch in the browser (`npm run dev`) and do every quiz.

---

## 3. Every place that depends on German

Change all of these. Search for `de-DE`, `German`, `Deutsch`, `Richtig`, `lese`,
`wortschatz`, `der|die|das` to catch anything missed.

| File                                   | What to change                                                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                         | `name`, `description`                                                                                                                                                  |
| `index.html`                           | `<title>`, meta description, `localStorage` key in the theme script (`'lese-reise'`). Keep `lang="en"` if the chrome stays English. The analytics script URL is DeuLern's own; keep it or swap it. |
| `src/store/progress.ts`                | `STORAGE_KEY`                                                                                                                                                          |
| `src/lib/transfer.ts` (+ test)         | `app: 'lese-reise'`, the "not a Lese Reise progress export" message                                                                                                    |
| `src/content/schema.ts`                | `glossaryNeedle`: the article regex `^(der\|die\|das)\s+` becomes `{ARTICLES}`. Watch for elided articles (French/Italian `l'`) and languages with no articles (make it a no-op). Rename the glossary fields. |
| `src/components/GlossaryText.tsx`      | Field names. Add `lang="{LANG_CODE}"` on the `.reading` div (the German app does not set it on the body; do it properly here, since it helps screen readers and hyphenation). |
| `src/components/Quiz.tsx` (+ test)     | `Richtig`/`Falsch`, `Perfekt! 🎉`                                                                                                                                      |
| `src/components/MonthCalendar.tsx`     | `WEEKDAYS` (`Mo Di Mi Do Fr Sa So`), `'de-DE'` locale for the month label. If the culture starts its week on Sunday, also change `lead = (getDay() + 6) % 7`.          |
| `src/pages/ReaderPage.tsx`             | `Wörter zum Text`, `Hast du alles verstanden?`, the Wortschatz sentence and links, `lang="de"` on `<dt>`                                                               |
| `src/pages/HomePage.tsx`               | Eyebrow "A1–B1 German reading", headline "Read your way into German.", the how-to paragraph, `BLURB` per level, art imports                                            |
| `src/pages/SettingsPage.tsx`           | Sample sentence `{SAMPLE}`, download filename prefix `lese-reise-progress-`                                                                                            |
| `src/components/AppShell.tsx`          | App name in the brand and `document.title`. Footer: the sibling-app links (vocabulary/verbs/grammar) only where they exist for this language.                          |
| `src/content/content.test.ts`          | `EXPECTED` counts. Drop the Wortschatz link test if you have no vocab app.                                                                                             |
| `scripts/prerender.mjs`                | `ORIGIN`, every "German reading texts" string, `Richtig oder falsch?`, `<article lang="de">`/`<dt lang="de">`/`<ol lang="de">`, the "a/an {level}" grammar line, `DeuLern Lese Reise` in titles |
| `scripts/auditVocab.ts`                | `FUNCTION_WORDS` (German inflected function words) and `SUFFIXES` (German endings), and the article and `etw/jdn/jdm` filters in `formsOf`. Rewrite them for the language or delete the script. |
| `scripts/linkGlossary.ts`              | The `die ${plural}` key (German plural article), the vocab app URL scheme. Delete if there is no vocab app.                                                            |
| `data/{a1,a2,b1}.json`                 | CEFR word lists for the new language, in the same shape (`id, level, german, english, plural?, thirdPersonPresent?, simplePast?, pastParticiple?, comparative?, superlative?`), or delete them with the two scripts. |
| `public/robots.txt`                    | Sitemap URL                                                                                                                                                            |
| `wrangler.jsonc`                       | Worker `name`                                                                                                                                                          |
| `vite.config.ts`                       | Only the comment mentioning grammatik.deulern.com and the text count                                                                                                   |
| `src/assets/art/*`                     | `hero-reading.webp` has the German slogan "Lesen öffnet Welten" and Berlin landmarks (Brandenburg Gate, TV tower) in it, so replace it once with a country-neutral hero (see section 4) and share that one across all languages. The level art (family/travel/city) has no landmarks and can stay. Keep the same pixel sizes, or update the `width`/`height` in `HomePage.tsx`. |

`design.md` describes a different brand and is not what the app uses. The real look is
in `src/styles/tokens.css` and `globals.css`, described in section 4. Copy both CSS
files unchanged.

### Writing-system checks

- **Non-Latin scripts** (Cyrillic, Greek, and others): `outfit-800-latin.woff2` and
  `oswald-600-latin.woff2` are Latin-only subsets, so headlines would fall back to a
  system font. Add the matching subsets, or pick display fonts that cover the script.
  Check that Manrope covers it as well.
- **Right-to-left** (Arabic, Hebrew, Persian): set `dir="rtl"` on the reading text and
  quiz, or on `<html>` if the chrome is also RTL. Test the glossary tooltip position
  (`left: 0` becomes `inset-inline-start: 0`), the pager arrows, and the `‹ ›` calendar
  buttons.
- **Languages without spaces** (Chinese, Japanese, Thai): `countWords` and the
  whole-word glossary match both assume spaces. Count characters instead (and rescale
  `WORD_RANGE`), and replace the `\p{L}` lookarounds with a plain substring match or
  `Intl.Segmenter`.
- **Case-insensitive matching** uses the `iu` regex flags, which work for most
  alphabets. Check one text with capitalised glossary words (sentence starts, German-
  style nouns).

---

## 4. Visual style

**Main idea: a printed poster on cream paper.** The page should look like one sheet
of paper lying on a table: black ink, a faint paper grain, big heavy headlines, and
cut-paper art made of flat geometric shapes, in the style of Bauhaus and Swiss
modernist posters. Nothing looks like glass or plastic. There are no shadows, no
gradients and no rounded "app" pills. Depth comes from paper overlapping paper.

If the new app belongs to the DeuLern family, keep the tokens and CSS exactly as they
are, so every language looks like the same product. The art is shared as well (see
below).
If it is a separate brand, keep the system and change the brand colours (red, blue,
mustard) as a set, then check the contrast again.

### Colour

Every colour is a CSS variable in `tokens.css`, written as a `light-dark()` pair.
Components never use raw hex values.

| Role                    | Light (paper)  | Dark (night paper) | Used for                                                     |
| ----------------------- | -------------- | ------------------ | ------------------------------------------------------------ |
| Table                   | `#cfc4ae`      | `#100f0d`          | Around the sheet on screens wider than 1440px                |
| Paper (`bg`)            | `#e6ddcc`      | `#1c1a17`          | Page background, with the grain                              |
| Lifted paper (`surface`)| `#efe8db`      | `#25221e`          | Cards, fields, secondary buttons                             |
| Muted paper             | `#ddd3c0`      | `#2e2a25`          | Soft chips, the quiz result card                             |
| Track                   | `#d3c9b6`      | `#3a352e`          | Empty progress bars, empty calendar days                     |
| Ink (`text`)            | `#141414`      | `#efe6d6`          | Text, outlines of secondary buttons                          |
| Muted ink               | `#3f3a33`      | `#b8ad9a`          | Secondary text, inactive nav links                           |
| Hairline                | ink at 15%     | cream at 15%       | Dividers between rows                                        |
| Strong hairline         | ink at 50%     | cream at 50%       | Card borders, header and footer rules                        |
| **Signal red**          | `#c63f1e`      | same               | **The only action colour**: primary buttons, the active-nav underline, today's outline in the calendar |
| Headline red            | `#c63f1e`      | `#e8603f`          | The second phrase of the hero headline, link hover in the footer |
| **Blue** (`accent`)     | `#2f5f8f`      | `#8fb3dc`          | Links, eyebrows, numbers, selected options, progress, "correct" |
| Sky                     | `#5aa3e8`      | same               | Level chips (always with black text)                         |
| Mustard                 | `#f2a82c`      | same               | Celebration only: the perfect-score card. Also in the art     |
| Danger                  | `#b0381a`      | `#f08a6e`          | Wrong answers, the outlined "Reset progress" button          |

Rules that hold the look together:

- **Red means "act", blue means "you got here".** One kind of thing is red: whatever
  you can press next. Correct answers, finished progress and selected options are blue.
  The palette has no green.
- Mustard is too light for text on paper. Use it as a fill or border, never as text.
- Text on red is cream (`#fbf5ea`, contrast 4.7:1).
- The calendar heat ramp mixes blue into the track colour at 0/30/55/78/100%.
- **Paper grain**: an inline SVG `feTurbulence` noise tile (220px, about 8% opacity)
  painted on `body` and the sticky header. Dark mode uses a lighter, cream-fibre version.

### Type

| Use                                | Font                   | Setting                                                    |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------- |
| Headlines h1–h4                    | **Outfit 800**         | Line height 1.05, letter spacing −0.015em (h1 −0.03em)     |
| Hero line                          | Outfit 800             | `clamp(3rem, 6.4vw, 5.75rem)`, line height 0.9, −0.035em   |
| Big numbers (stats, list numbers, quiz score) | Outfit 800  | Stats in ink; list and quiz numbers in blue                |
| Body and UI                        | **Manrope** (variable) | 15px, weight 500, line height 1.53                         |
| Reading text                       | Manrope                | 19px, line height 1.75, column 43rem; S/M/L/XL = 16/19/22/26px |
| Eyebrow                            | Manrope 800            | 14px, capitals, letter spacing 0.14em, blue                |
| Buttons                            | Manrope 700            | 16px                                                       |

Oswald 600 is loaded in `tokens.css` as `--font-cond`, but nothing uses it. Drop it
unless a design needs condensed titles.

### Shape, lines, depth

- Corners are **trimmed paper**: 2px on cards, 3px on buttons and chips. Only the
  progress bar and the round theme-toggle hit area are fully rounded.
- Borders are 1px hairlines. Buttons use a 2px border. The active nav item has a 3px
  red bar sitting on the header rule.
- No shadows, except on things that float: the glossary tooltip gets
  `0 10px 30px` at 18% (55% in dark mode).
- Motion is limited to 160ms colour and border transitions. There are no animations.

### Layout

- **The sheet**: `body` is at most 1440px wide and centred, so wider screens show the
  darker table colour on both sides. The page gutter is `clamp(16px, 4vw, 44px)`.
- **Header** (sticky, same paper): the logo mark, then "DeuLern", a vertical hairline
  and the app name, then the nav centred, then the theme toggle and an outlined
  "deulern.com" button with an arrow. A strong hairline sits under it. Below 48rem the
  nav wraps onto its own row.
- **Home**: a two-column hero, with the copy on the left (blue eyebrow, the poster line
  with its second phrase in red, a muted lead paragraph) and the art on the right,
  bleeding towards the sheet edge. Below that, three level cards side by side, which
  stack into one column (max 30rem) below 62rem. Each card shows its art on the bottom
  edge of a fixed-ratio frame, so the chips and titles line up across the row.
- **Level list**: one column (max 48rem) of cards: a big blue number, the title, a
  muted meta line, and a chip on the right.
- **Reader**: one 43rem column. Meta row, title, text, glossary, quiz, then a pager
  separated by a hairline.
- **Footer**: a hairline, the brand lockup with a vertical divider, and a small muted
  note with bold ink links. The staircase art rises from the sheet's bottom-right
  corner behind it and is hidden below 62rem.
- Spacing scale: 6 / 10 / 14 / 20 / 28 / 40 / 56 / 72 / 88px. Sections are 28px apart,
  tight groups 10px.

### Components

- **Primary button**: red fill with cream text. When it is a link, it gets an arrow
  drawn with an SVG mask, because the → glyph sits too low in Manrope. Hover darkens it
  20% toward ink.
- **Secondary button**: lifted paper with a 2px ink outline. On hover it inverts to ink
  fill and paper text.
- **Ghost button**: text only, 13px, 44px tall, turns blue on hover.
- **Danger button**: outlined in danger red, with a soft red fill on hover.
- **Chip**: a square-cut tab, sky blue with black 800-weight text. The soft version uses
  muted paper and muted ink (for example "New").
- **Card**: lifted paper, strong hairline, 2px corners, 16px padding.
- **Glossary word**: a 2px dotted blue underline. When open it gets a blue-soft
  background. The tooltip is a black slip with cream text, max 18rem.
- **Glossary list**: two equal columns, the term in bold and the translation in muted ink,
  with hairlines between rows.
- **Quiz**: each question is a card with a blue number. Options are bordered 44px rows;
  the selected one gets a blue border and a blue-soft fill. True/false options sit side
  by side. After checking, the card border turns blue or danger red and the feedback
  line is coloured to match. The result card is muted paper, or mustard-tinted with a
  mustard border on a perfect score.
- **Segmented control** (settings): bordered 44px labels. The selected one is filled blue
  with paper text.
- **Calendar**: a 7-column grid of square days with 2px corners, filled with the heat
  ramp. Today has a 2px red outline.
- **Table**: hairline rows, numbers right-aligned in narrow fixed columns.

### Accessibility, built into the style

Every control is at least 44px tall. Focus shows a 3px blue outline with a 3px gap.
The skip link appears on focus. After each navigation, focus moves to `<main>` without
a visible ring. Decorative art has `alt=""`.

### Art direction

The art has to work for **every** language, so it shows no particular country. Make it
once and use the same images in every language's app: one hero image, three level
images, and the footer staircase. The current level images and staircase already fit
these rules. Only the German hero has to be redrawn.

- **Cut-paper geometric collage**: flat, hard-edged shapes (circles, half-circles,
  triangles, rectangles, stepped blocks) with no outlines, gradients, texture or
  shading. Shapes overlap like pasted paper.
- **Palette**: ink black, signal red, mustard yellow, sky blue, a deep green, and cream
  for pages and paper. Keep to these so the art matches the UI.
- **People** are flat silhouettes: a profile with a single eye line and a red circle
  for the cheek, or a family drawn as stacked circles and rounded shapes. They have no
  detailed faces.
- **An open book** appears in every image: the hero and all three level images.
- **No landmarks and no national symbols.** That means no TV towers, gates,
  cathedrals, famous skylines, flags or flag-colour stripes, and nothing a viewer could
  name as a real place. Buildings are generic: a house with a pitched roof, a village
  of simple blocks, a city of plain rectangles and towers. A big sun disc is fine.
- **No lettering in the art.** The German hero has a printed slogan, which ties it to
  one language. Leave text out, or put the slogan in the HTML, where it can be
  translated.
- **Level themes**: A1 = home and family (a house, a tree, a family, a book). A2 =
  travel (a train on a bridge, mountains, a village, the sun). B1 = city and society
  (generic city blocks and towers, an open newspaper).
- **Hero**: a reader in profile, chin on hand, over a large open book, with a blank
  card or sign and generic shapes around them. No city, no landmark.
- **Files**: transparent WebP at native size: hero 743×351, levels 410×167 (or close,
  since the frame keeps the row aligned), footer 206×201. Logo mark 38×41 PNG: a 2×2
  grid of squares in red, mustard, blue and black.

A prompt you can give an image model:

> Flat cut-paper geometric collage illustration, Bauhaus / Swiss modernist poster
> style, hard-edged flat shapes with no outlines, gradients or texture, transparent
> background. Palette only: ink black #141414, signal red #c63f1e, mustard #f2a82c, sky
> blue #5aa3e8, deep green, cream #efe8db. Subject: {scene}, with an open book in the
> foreground. Generic, unrecognisable buildings only: no landmarks, no flags, no
> national symbols, nothing that identifies a real country or city. Simple figures with
> one eye line and a red circle for the cheek. No text or letters. Wide banner, {W}×{H}.

---

## 5. Step-by-step plan

1. Copy the repo to a new folder (without `node_modules`, `dist`, `.git`) and run
   `npm install`.
2. Fill in section 0. Make every change in section 3 except the content. Use the
   shared, country-neutral art from section 4. The hero is made once for all languages.
3. Replace the three text files with 2–3 sample texts per level. Set `EXPECTED` to
   those counts. Get `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`
   passing, then click through every page in `npm run dev`, in both themes and at
   phone width.
4. Write the topic plans, then the texts in batches (section 2), raising `EXPECTED`
   as you go.
5. Final check: tests, lint and build pass; `dist/sitemap.xml` lists every text;
   `dist/text/<id>.html` shows the text without JavaScript; every quiz in a sample of
   texts was taken by hand; the app works offline after one visit.
6. Deploy with `npx wrangler deploy` (the worker serves `dist/`) and point the domain
   at it.

### Tests to keep

`streak.test.ts`, `transfer.test.ts`, `Quiz.test.tsx` (update the labels) and
`content.test.ts`. They cover the logic that breaks without anyone noticing: the
streak edge cases, import validation, scoring, and content integrity.

---

## 6. Topic plan: 300 texts

These are the topics of the German texts, in the same order, rewritten so they don't
depend on Germany. Most work in any country as they are. Topics marked *localise*
depend on German institutions, places or customs. Keep the situation and replace the
German detail with the local equivalent. If the country has nothing similar, write a
different text with the same theme and level.

The theme column is the `topic` field. The scenario is what the text is about, not its
title.

### A1: 60 texts, 89–144 words, present tense

| #  | Theme                   | Scenario                                                                                      |
| -- | ----------------------- | --------------------------------------------------------------------------------------------- |
| 01 | Personal information    | Introducing yourself: name, age, origin, studies, weekend job, languages, hobbies             |
| 02 | Family                  | A child describes their family and house                                                      |
| 03 | Food and drink          | A slow family breakfast on Sunday                                                             |
| 04 | Shopping                | Buying food at the supermarket for dinner guests                                              |
| 05 | Home                    | My new flat: rooms, floor, what is still missing                                              |
| 06 | Daily routine           | A bus driver's day, starting very early                                                       |
| 07 | Directions              | A tourist asks the way to a famous museum                                                     |
| 08 | Free time               | Two friends talk about their weekend plans                                                    |
| 09 | Health                  | At the doctor's with a headache, fever and sore throat                                        |
| 10 | Travel                  | Taking the train to visit a friend in another city                                            |
| 11 | Food and drink          | A brother and sister order at a café in the old town                                          |
| 12 | Animals                 | My dog: looks, habits, walks                                                                  |
| 13 | Weather and seasons     | The four seasons *(localise: describe the country's real climate)*                            |
| 14 | Shopping and clothes    | Buying new shoes after work                                                                   |
| 15 | Family and celebrations | Grandma's 80th birthday with the whole family                                                 |
| 16 | School and education    | A learner from abroad describes their language course                                         |
| 17 | Work                    | My job: hairdresser in a small salon                                                          |
| 18 | Communication           | An email to a friend about a new flat in a new city                                           |
| 19 | Travel                  | A couple checks in at a hotel on holiday                                                      |
| 20 | Shopping                | Saturday morning at the weekly market                                                         |
| 21 | Home                    | A teenager describes his room                                                                 |
| 22 | Sport                   | A children's football match on Saturday                                                       |
| 23 | Free time               | A family day at the zoo                                                                       |
| 24 | Neighbours              | New neighbours ring the bell and introduce themselves                                         |
| 25 | Food and drink          | A birthday dinner at a restaurant                                                             |
| 26 | Services                | A first visit to the public library                                                           |
| 27 | Services                | Sending a birthday parcel abroad at the post office                                           |
| 28 | Banking and money       | A newcomer opens a bank account for her new job                                               |
| 29 | Services                | Booking a hairdresser appointment by phone before a wedding                                   |
| 30 | Transport               | My bike has a flat tyre on the way to work                                                    |
| 31 | Cooking                 | A father makes pancakes with his daughter                                                     |
| 32 | Holidays                | A foreign friend is invited to celebrate the country's biggest holiday *(localise)*           |
| 33 | Leisure                 | At the swimming pool on a hot July day                                                        |
| 34 | School                  | A pupil's school timetable                                                                    |
| 35 | Food and drink          | My favourite food: someone from abroad cooks at home                                          |
| 36 | Travel                  | A day trip to the mountains *(localise: mountains, coast or countryside nearby)*              |
| 37 | Travel                  | At the airport: check-in, security, gate                                                      |
| 38 | Shopping                | Two children choose a present for Dad's 50th birthday                                         |
| 39 | Daily routine           | Late! Everything goes wrong before an important meeting                                       |
| 40 | Free time               | Getting tickets for a favourite band's concert                                                |
| 41 | Relationships           | My best friend                                                                                |
| 42 | Home                    | A family shares the housework                                                                 |
| 43 | Transport               | Taking a taxi in the rain to catch a train                                                    |
| 44 | Bureaucracy             | A newcomer fills in a registration form at the town hall *(localise)*                         |
| 45 | Health                  | Morning yoga against back pain from office work                                               |
| 46 | School and education    | A child's first day at school *(localise the customs)*                                        |
| 47 | Housing                 | A couple expecting a baby look for a bigger flat                                              |
| 48 | Home                    | Working in the garden on a warm April day                                                     |
| 49 | School and education    | Learning the language with a phone app                                                        |
| 50 | Travel                  | A holiday postcard to a friend                                                                |
| 51 | Free time               | Three friends have a picnic in the park                                                       |
| 52 | Places in town          | My small town: what is there and what is not                                                  |
| 53 | Daily routine           | What time is it? A day told through clock times                                               |
| 54 | Communication           | A text message inviting a friend to the cinema                                                |
| 55 | Health                  | I am ill: staying in bed, calling work                                                        |
| 56 | Weather and clothes     | What should I wear today? Choosing clothes for the weather                                    |
| 57 | Holidays                | A family day at the lake in summer                                                            |
| 58 | Family                  | An old family photo, twenty years ago                                                         |
| 59 | Daily routine           | My weekly schedule as a hotel receptionist                                                    |
| 60 | Celebrations            | An email invitation to a 30th birthday party                                                  |

### A2: 100 texts, 144–233 words, past tense narration

| #  | Theme                  | Scenario                                                                                        |
| -- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| 01 | Housing                | Moving to a new city for a new job                                                              |
| 02 | Work                   | The first day of a vocational apprenticeship *(localise the training system)*                  |
| 03 | Celebrations           | A 30th birthday as a picnic in the park instead of a bar                                        |
| 04 | Clothing               | Buying a warm jacket when winter arrives                                                        |
| 05 | Sport                  | Joining a sports club because of back pain                                                      |
| 06 | Health                 | Catching a cold in winter and staying home                                                      |
| 07 | Travel and weather     | A family seaside holiday and its changing weather *(localise the coast)*                        |
| 08 | Technology             | A dropped phone with a broken screen and the repair                                             |
| 09 | Food and cooking       | An evening cooking course at an adult education centre                                          |
| 10 | Communication          | A thank-you letter to Grandma for a parcel                                                      |
| 11 | Shopping and cars      | Buying a used car at a dealer for a job in the countryside                                      |
| 12 | Services               | Finally getting a new haircut                                                                   |
| 13 | Culture                | A wedding-anniversary evening at the theatre                                                    |
| 14 | Free time              | An email telling a friend about a great concert                                                 |
| 15 | Bureaucracy            | Renewing an expired passport just before a trip abroad                                          |
| 16 | Friends                | Running into an old school friend in town                                                       |
| 17 | Directions             | A tourist asks several people the way to a museum                                               |
| 18 | Shopping               | Returning broken headphones to an electronics shop                                              |
| 19 | Shopping and food      | An older woman's weekly market routine after thirty years                                       |
| 20 | Health                 | At the pharmacy with a sore throat and a runny nose                                             |
| 21 | Health                 | A sudden toothache and an emergency dentist visit                                               |
| 22 | Services               | Sending a birthday parcel to a sister in another country                                        |
| 23 | Banking and money      | A lost bank card: blocking it and getting a new one                                             |
| 24 | Services               | Getting a lost bag back at the lost-property office                                             |
| 25 | Bureaucracy            | Reporting a stolen bike to the police                                                           |
| 26 | Cars and services      | Squeaking brakes and a visit to the garage                                                      |
| 27 | Travel                 | Renting a car at the airport on holiday                                                         |
| 28 | Travel                 | A business traveller complains about his hotel room                                             |
| 29 | Eating out             | The wrong order at a busy restaurant                                                            |
| 30 | Transport              | The train is cancelled: a message from the station                                              |
| 31 | Travel                 | Lost luggage after a flight                                                                     |
| 32 | Shopping and furniture | A couple buys a new sofa at a furniture store                                                   |
| 33 | Health                 | Headaches while reading lead to the optician and new glasses                                    |
| 34 | Free time              | Two friends choose a film at the cinema                                                         |
| 35 | Culture                | An email about a school trip to a big museum                                                    |
| 36 | Animals                | The family dog is ill: at the vet                                                               |
| 37 | Services               | Getting a library card to practise the language                                                 |
| 38 | Sport                  | Starting at the gym on the doctor's advice                                                      |
| 39 | Work                   | A job interview for a hotel receptionist                                                        |
| 40 | Bureaucracy            | Extending a residence permit at the immigration office *(localise)*                             |
| 41 | Bureaucracy            | Registering a used car and getting number plates *(localise)*                                   |
| 42 | Technology             | A student compares offers for a cheaper phone contract                                          |
| 43 | Shopping               | Clearing out the cellar and selling things at a flea market                                     |
| 44 | Shopping               | Buying flowers for a new girlfriend's birthday                                                  |
| 45 | Everyday conversation  | Small talk with a neighbour at the bus stop                                                     |
| 46 | Food and drink         | Ordering a special dinosaur cake for a child's birthday                                         |
| 47 | Home                   | Buying paint at a DIY store to redo a child's room                                              |
| 48 | Travel                 | A retired couple plans a trip at a travel agency                                                |
| 49 | Bureaucracy            | A letter about getting married at the registry office                                           |
| 50 | Transport              | Buying a new bike in a city where everyone cycles                                               |
| 51 | Travel                 | Two friends' first weekend in the capital *(localise the city)*                                 |
| 52 | Work                   | A new colleague from abroad joins the team                                                      |
| 53 | Communication          | My language tandem partner                                                                      |
| 54 | Animals                | A city child's first holiday on a farm                                                          |
| 55 | Home                   | A power cut on a dark winter evening                                                            |
| 56 | Celebrations           | A small, simple wedding in the garden                                                           |
| 57 | Health                 | A bus driver changes to a healthier lifestyle                                                   |
| 58 | Free time              | Going camping at a lake for the first time                                                      |
| 59 | Living together        | A new flatmate moves into the shared flat                                                       |
| 60 | Home                   | The washing machine leaks while nobody is home                                                  |
| 61 | Work                   | A school work-experience fortnight at a bakery                                                  |
| 62 | Media                  | My favourite TV series and how it helps my language                                             |
| 63 | Shopping               | Buying running shoes online, and the return                                                     |
| 64 | Housing                | A letter from the landlord about building work                                                  |
| 65 | Sport                  | A three-day cycling tour along a river                                                          |
| 66 | Friends                | Planning a surprise goodbye party for a friend moving abroad                                    |
| 67 | Everyday life          | Locked out on Sunday morning: the lost key                                                      |
| 68 | Culture                | A visitor from abroad at a traditional seasonal market *(localise the festival)*                |
| 69 | Family                 | Grandpa tells stories from his youth for a school project                                       |
| 70 | Sport                  | A girl's first visit to a professional football match                                           |
| 71 | Family                 | A student's first evening babysitting                                                           |
| 72 | School and education   | Taking and passing the A2 language exam                                                         |
| 73 | Health                 | Visiting a friend in hospital after a knee operation                                            |
| 74 | Transport              | Taking a night train to another country instead of flying                                       |
| 75 | Culture                | A foreign worker's first big local festival with colleagues *(localise: carnival or similar)*   |
| 76 | Neighbours             | A nurse who starts work early has a noisy neighbour                                             |
| 77 | Home                   | Garden work in spring after a long winter                                                       |
| 78 | Free time              | Three friends spend a day at a theme park                                                       |
| 79 | Environment            | A newcomer learns how rubbish is sorted and recycled *(localise the rules)*                     |
| 80 | Food and drink         | Baking a cake for the primary-school summer fair                                                |
| 81 | Housing                | A flat viewing in a city with high rents                                                        |
| 82 | Banking and money      | My first salary: planning a budget                                                              |
| 83 | School                 | A class trip to an old castle                                                                   |
| 84 | Holidays               | A first ski holiday with an experienced friend *(localise: a typical winter or seasonal trip)*  |
| 85 | Family                 | The monthly family Sunday lunch at Grandma's                                                    |
| 86 | Health                 | A small child's emergency in the middle of the night                                            |
| 87 | Society                | A teenager volunteers every Saturday at a care home                                             |
| 88 | Communication          | A letter from a study stay in another country                                                   |
| 89 | Weather                | A week of crazy weather                                                                         |
| 90 | Sport                  | Colleagues train together for a charity run                                                     |
| 91 | Shopping               | Returning a broken kettle and getting a refund                                                  |
| 92 | Free time              | A first pottery class with a friend                                                             |
| 93 | Transport              | Missing the last bus home after a party                                                         |
| 94 | Animals                | Adopting a cat from the animal shelter                                                          |
| 95 | Work                   | A summer job at an ice-cream stand                                                              |
| 96 | Technology             | Teaching Grandpa to use his first smartphone                                                    |
| 97 | Food and drink         | A dinner where every guest brings a dish from home                                              |
| 98 | City                   | Lost in a big city with a dead phone battery                                                    |
| 99 | Celebrations           | A surprise party that almost went wrong                                                         |
| 100 | Holidays              | A week on a farm with the children                                                              |

### B1: 140 texts, 233–377 words, varied tenses and complex sentences

| #   | Theme                     | Scenario                                                                                    |
| --- | ------------------------- | ------------------------------------------------------------------------------------------- |
| 01  | Environment and transport | A family sells its car and looks back on a year without one                                 |
| 02  | Work                      | A designer from abroad goes to a job interview in the new country                           |
| 03  | Society                   | Volunteering every Saturday at an animal shelter                                            |
| 04  | Media                     | How a family's news habits moved from newspaper and TV to the internet                      |
| 05  | Living together           | An argument about cleaning in a student shared flat                                         |
| 06  | Public services           | Booking an appointment and registering an address at the town hall *(localise)*             |
| 07  | Health and nutrition      | Changing your diet after a worrying blood test                                              |
| 08  | Culture and history       | How a dying village came back to life                                                       |
| 09  | Banking and money         | A retired woman nearly falls for an online-banking scam                                     |
| 10  | Education                 | A shop assistant retrains at 45                                                             |
| 11  | Shopping                  | A laptop breaks after three months: claiming the warranty                                   |
| 12  | Transport                 | Buying my first car after passing the driving test                                          |
| 13  | Travel                    | A long dialogue asking an older local the way to a museum                                   |
| 14  | Culture                   | A diary entry about a night at the theatre                                                  |
| 15  | Leisure                   | An email about a rainy but wonderful open-air concert                                       |
| 16  | Everyday life             | A haircut that ends up shorter than wanted                                                  |
| 17  | Public services           | A forum post with tips for the immigration office *(localise)*                              |
| 18  | Money                     | A worker's first tax return                                                                 |
| 19  | Health                    | A cold and a painful knee: a visit to the family doctor                                     |
| 20  | Health                    | A morning in a pharmacy, told by the pharmacist                                             |
| 21  | Housing                   | Thirty people at one flat viewing in a tight housing market                                 |
| 22  | Housing                   | A formal email to the landlord about cold radiators and the service-charge bill             |
| 23  | Shopping                  | An old camera bought at a flea market                                                       |
| 24  | Services                  | A diary about an expensive noise from the car                                               |
| 25  | Food and drink            | A polite complaint at a restaurant, as a dialogue                                           |
| 26  | Services                  | A parcel goes missing and the claim with the post office                                    |
| 27  | Services                  | Opening my first bank account in the new country                                            |
| 28  | Services                  | Cancelling a phone contract by phone, with a pushy agent                                    |
| 29  | Leisure                   | Someone who works from home tries a sports trial session, with consequences                 |
| 30  | Family and school         | Parents argue at a meeting about the cost of a class trip                                   |
| 31  | Public services           | A bag left on the train and the lost-property office                                        |
| 32  | Public services           | Reporting a bike theft to the police                                                        |
| 33  | Travel                    | A long-distance train ends early and passengers have to change plans                        |
| 34  | Travel                    | A letter from a holiday without a suitcase                                                  |
| 35  | Travel                    | The hotel room with a view that wasn't                                                      |
| 36  | Health                    | A diary about overcoming fear of the dentist                                                |
| 37  | Health                    | In the vet's waiting room with a sick cat                                                   |
| 38  | Culture                   | A language learner's guided museum tour with her class                                      |
| 39  | Shopping                  | A three-star online review: the sofa that didn't fit                                        |
| 40  | Shopping                  | A newcomer chats with stallholders at the Saturday market                                   |
| 41  | Health                    | Seeing clearly again: an eye test and first glasses                                         |
| 42  | Public services           | A letter about the registry-office wedding appointment                                      |
| 43  | Work                      | A new start at fifty after the printing company closes                                      |
| 44  | Living together           | Trouble with things left in the stairwell                                                   |
| 45  | Shopping                  | Choosing flowers for a wedding anniversary                                                  |
| 46  | Public services           | A diary about registering my first car *(localise)*                                         |
| 47  | Transport                 | A nervous driving lesson and a tricky right-of-way rule *(localise the rule)*               |
| 48  | Travel                    | A family at a travel agency: package holiday or independent travel?                         |
| 49  | Shopping                  | Returning a jacket without the receipt                                                      |
| 50  | Society                   | A local debate: a cycle lane instead of parking spaces?                                     |
| 51  | Work                      | Two colleagues on working from home: blessing or curse?                                     |
| 52  | Living together           | A neighbourhood app brings a big rented building together                                   |
| 53  | Housing                   | A couple swaps a city flat for a tiny house                                                 |
| 54  | Environment               | Trying to shop without plastic                                                              |
| 55  | Society                   | Growing up between two languages as a child of immigrants                                   |
| 56  | Education                 | A school-leaver looks for an apprenticeship                                                 |
| 57  | Housing                   | Mould in the bathroom: whose fault is it?                                                   |
| 58  | Leisure                   | A family that can't travel takes a holiday at home                                          |
| 59  | Family                    | A son takes on care for his elderly mother                                                  |
| 60  | Travel                    | Crossing Europe by train after graduating *(localise the region)*                           |
| 61  | Transport                 | A public transport strike shuts the city down                                               |
| 62  | Society                   | A club elects a new chair after 25 years                                                    |
| 63  | Environment               | Saving unsold food from a bakery                                                            |
| 64  | Travel                    | A year abroad as an au pair                                                                 |
| 65  | Family                    | A family argues about children and screen time                                              |
| 66  | Environment               | The monthly repair café in a community hall                                                 |
| 67  | Society                   | A crowded, heated public meeting about a local plan                                         |
| 68  | Public services           | A refugee's road to citizenship *(localise the process)*                                    |
| 69  | Health                    | A compulsory first-aid course *(localise why it is required)*                               |
| 70  | Living together           | The neighbour's dog barks all day                                                           |
| 71  | Work                      | A start-up in a garage begins with an everyday problem                                      |
| 72  | Environment               | A community garden where cars used to park                                                  |
| 73  | Media                     | Scammed by a fake online shop                                                               |
| 74  | Leisure                   | A weekend in a mountain hut with no electricity                                             |
| 75  | Family                    | Three generations under one roof                                                            |
| 76  | Transport                 | A student learns to cycle again in a cycling city                                           |
| 77  | Family                    | A father takes ten months of parental leave                                                 |
| 78  | Work                      | An intensive-care nurse weighs part-time against full-time                                  |
| 79  | Society                   | Volunteering at a food bank                                                                 |
| 80  | Banking and money         | A tenant checks the yearly service-charge bill                                              |
| 81  | Food and drink            | A company canteen tries vegan days                                                          |
| 82  | Culture                   | The weekly language café at the library                                                     |
| 83  | Everyday life             | A missing letter and a reminder from the tax office                                         |
| 84  | Environment               | The night the river flooded the village                                                     |
| 85  | Housing                   | A family moves from the city to the countryside                                             |
| 86  | Work                      | A day as a paramedic                                                                        |
| 87  | Culture and history       | A class trip to a historic town *(localise: a town important to the country's culture)*     |
| 88  | Health                    | Finally sleeping again after insomnia                                                       |
| 89  | Media                     | A fifteen-year-old wants to become an influencer                                            |
| 90  | Housing                   | Signing the first rental contract                                                           |
| 91  | Transport                 | An accident on the way to work by bike                                                      |
| 92  | Services                  | The insurance refuses to pay for a flooded basement                                         |
| 93  | Society                   | Litter in the park after summer weekends                                                    |
| 94  | Travel                    | A multi-day hike on a long-distance trail *(localise the trail)*                            |
| 95  | Education                 | A semester abroad in a far northern country                                                 |
| 96  | Leisure                   | A shy accountant joins a choir                                                              |
| 97  | Health                    | A video consultation with the doctor                                                        |
| 98  | Work                      | New city, new job: the first months                                                         |
| 99  | Relationships             | A small lie to a friend with big consequences                                               |
| 100 | Shopping                  | Switching to second-hand fashion after a documentary                                        |
| 101 | Society                   | City people move to a village and join the regulars' table at the pub *(localise)*          |
| 102 | Personal                  | A letter to my younger self on my 40th birthday                                             |
| 103 | Health and nutrition      | Trying intermittent fasting after the holidays                                              |
| 104 | Family                    | Parents can't find a nursery place                                                          |
| 105 | Culture                   | A musician plays a house concert in a living room                                           |
| 106 | Transport                 | Commuting by regional train every day                                                       |
| 107 | Living together           | The house rules and the bikes in the hallway                                                |
| 108 | Relationships             | Finding love through a dating app                                                           |
| 109 | Society                   | A school class visits the national parliament *(localise)*                                  |
| 110 | Health                    | Living with hay fever every spring                                                          |
| 111 | Society                   | The corner bakery closes after forty years                                                  |
| 112 | Leisure                   | Five years of a monthly board-game night                                                    |
| 113 | Travel                    | The first holiday with two small children                                                   |
| 114 | Education                 | A university student tutors a pupil in maths                                                |
| 115 | Food and drink            | Learning to bake bread the old way from Grandma                                             |
| 116 | Work                      | Trouble in the marketing team                                                               |
| 117 | Banking and money         | Budgeting for the first own flat after finishing training                                   |
| 118 | Health                    | A teacher learns to live with diabetes                                                      |
| 119 | Technology                | A hacked messaging account and staying safe online                                          |
| 120 | Culture                   | Organising the yearly town festival                                                         |
| 121 | Environment               | A family tries a zero-waste month                                                           |
| 122 | Work                      | The first year as a self-employed translator                                                |
| 123 | Society                   | The street outside a school is closed to cars                                               |
| 124 | Culture                   | An amateur theatre group puts on its first play                                             |
| 125 | Technology                | An AI assistant arrives at the office: help or threat?                                      |
| 126 | Family                    | Adult siblings clear out their parents' house                                               |
| 127 | Housing                   | A student lives with an elderly woman in exchange for help                                  |
| 128 | Banking and money         | A couple uses the envelope method to get out of debt                                        |
| 129 | Sport                     | An amateur runner finishes her first marathon                                               |
| 130 | Food and drink            | The first year of a food-truck owner                                                        |
| 131 | Media                     | A local newspaper fights to survive                                                         |
| 132 | Relationships             | A long-distance relationship between two countries                                          |
| 133 | Education                 | A father joins the school's parents' council                                                |
| 134 | Health                    | Quitting smoking after twenty years                                                         |
| 135 | Leisure                   | Restoring an old motorbike with Dad                                                         |
| 136 | Work                      | A small company tries the four-day week                                                     |
| 137 | Environment               | Volunteers count birds for a national survey                                                |
| 138 | Travel                    | A house-swap holiday with a family from another country                                     |
| 139 | Society                   | A neighbour sets up a book-sharing box in the street                                        |
| 140 | Personal                  | A grandmother learns to swim at seventy                                                     |
