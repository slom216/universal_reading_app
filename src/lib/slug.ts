// No imports: scripts/prerender.mjs loads this file directly, so the static pages and the
// app agree on every URL.

/** URL slug of an English phrase: "Where's the bathroom?" → "wheres-the-bathroom". */
export const phraseSlug = (phrase: string) =>
  phrase
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The phrase as it reads inside a sentence: "Thank you." → "Thank you". */
export const phraseQuote = (phrase: string) => phrase.replace(/\.$/, '');
