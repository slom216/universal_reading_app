import { readFileSync } from 'node:fs';
import { ruleCounts } from '../../../scripts/pronunciation-order';
import { LANG_IDS } from '../../languages';
import type { PronunciationRule } from '.';

describe.each(LANG_IDS)('pronunciation rules: %s', (lang) => {
  const rules = JSON.parse(
    readFileSync(`src/content/pronunciation/${lang}.json`, 'utf8'),
  ) as PronunciationRule[];

  it('are complete and at most 100', () => {
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.length).toBeLessThanOrEqual(100);
    expect(new Set(rules.map((r) => r.title)).size).toBe(rules.length);
    for (const r of rules) {
      expect(r.title && r.body && r.pattern, r.title).toBeTruthy();
      expect(r.examples.length, r.title).toBeGreaterThanOrEqual(2);
      for (const e of r.examples) expect(e.word && e.say && e.en, r.title).toBeTruthy();
    }
  });

  it('occur in the texts, most frequent first', () => {
    const counts = ruleCounts(lang, rules);
    rules.forEach((r, i) => expect(counts[i], r.title).toBeGreaterThan(0));
    // Run `node scripts/pronunciation-order.ts <lang>` to re-sort.
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
});
