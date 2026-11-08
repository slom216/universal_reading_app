import { readFileSync } from 'node:fs';
import { phraseQuote, phraseSlug } from './slug';

test('slugs are readable and unique across the 1000 phrases', () => {
  expect(phraseSlug("Where's the bathroom?")).toBe('wheres-the-bathroom');
  expect(phraseSlug('Do you speak [language]?')).toBe('do-you-speak-language');
  expect(phraseQuote('Thank you.')).toBe('Thank you');
  const en: { phrase: string }[] = JSON.parse(
    readFileSync('1000_phrases_claude.json', 'utf8'),
  );
  const slugs = en.map((p) => phraseSlug(p.phrase));
  expect(new Set(slugs).size).toBe(en.length);
  expect(slugs.every((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))).toBe(true);
});
