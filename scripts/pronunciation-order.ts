// Orders each language's pronunciation rules by how often they occur in its 300 texts.
// Every rule has a `pattern` (a regex source, matched with flags `gu` against the
// lowercased titles and bodies). Chinese texts are followed by their numbered pinyin
// (`wo3 men0 qu4`, underlying tones, no sandhi) so patterns can match sounds and tones.
//
//   node scripts/pronunciation-order.ts de it   # check, sort and rewrite those files
//   node scripts/pronunciation-order.ts         # all languages
//
// pronunciation.test.ts runs the same counts and fails if a file is out of order.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pinyin } from 'pinyin-pro';

type Rule = { title: string; body: string; pattern: string; examples: unknown[] };

const DIR = 'src/content/pronunciation';
const LOCALE: Record<string, string> = { tr: 'tr', isv: 'hr', sr: 'sr', el: 'el' };

const corpora = new Map<string, string>();

export function corpus(lang: string): string {
  let c = corpora.get(lang);
  if (c == null) {
    const texts = ['a1', 'a2', 'b1'].flatMap(
      (l) =>
        JSON.parse(readFileSync(`src/content/texts/${lang}/${l}.json`, 'utf8')) as {
          title: string;
          body: string;
        }[],
    );
    c = texts
      .map((t) => `${t.title}\n${t.body}`)
      .join('\n\n')
      .normalize('NFC')
      .toLocaleLowerCase(LOCALE[lang] ?? lang);
    if (lang === 'zh') {
      c +=
        '\n\n' +
        pinyin(c, { toneType: 'num', type: 'array', nonZh: 'removed', toneSandhi: false }).join(
          ' ',
        );
    }
    corpora.set(lang, c);
  }
  return c;
}

export function ruleCounts(lang: string, rules: { pattern: string }[]): number[] {
  const c = corpus(lang);
  return rules.map((r) => c.match(new RegExp(r.pattern, 'gu'))?.length ?? 0);
}

function sortFile(lang: string) {
  const file = `${DIR}/${lang}.json`;
  const rules = JSON.parse(readFileSync(file, 'utf8')) as Rule[];
  const problems: string[] = [];
  const titles = new Set<string>();
  for (const r of rules) {
    if (!r.title || !r.body || !r.pattern) problems.push(`missing field: ${JSON.stringify(r)}`);
    if (titles.has(r.title)) problems.push(`duplicate title: ${r.title}`);
    titles.add(r.title);
    if (!Array.isArray(r.examples) || r.examples.length < 2 || r.examples.length > 6)
      problems.push(`2–6 examples needed: ${r.title}`);
    try {
      new RegExp(r.pattern, 'gu');
    } catch (e) {
      problems.push(`bad pattern in “${r.title}”: ${(e as Error).message}`);
    }
  }
  if (rules.length > 100) problems.push(`${rules.length} rules, the cap is 100`);
  if (problems.length) {
    console.log(`${lang}: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
    return false;
  }
  const counts = ruleCounts(lang, rules);
  const zero = rules.filter((_, i) => counts[i] === 0).map((r) => r.title);
  const order = rules.map((r, i) => ({ r, n: counts[i]! })).sort((a, b) => b.n - a.n);
  writeFileSync(file, JSON.stringify(order.map((o) => o.r), null, 2) + '\n');
  console.log(`${lang}: ${rules.length} rules sorted`);
  for (const o of order) console.log(`  ${String(o.n).padStart(8)}  ${o.r.title}`);
  if (zero.length) console.log(`${lang}: patterns that match nothing:\n  ${zero.join('\n  ')}`);
  return zero.length === 0;
}

if (process.argv[1]?.endsWith('pronunciation-order.ts')) {
  const langs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync(DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.slice(0, -5));
  const ok = langs.map((l) => existsSync(`${DIR}/${l}.json`) && sortFile(l)).every(Boolean);
  process.exitCode = ok ? 0 : 1;
}
