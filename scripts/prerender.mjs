/* global console */
// Post-build: writes a static HTML page per language, level and text into dist/, plus
// sitemap.xml. Crawlers that do not run JavaScript otherwise see an empty
// <div id="root">. The React app mounts over this markup; Cloudflare serves
// dist/it/text/a1-01.html at /it/text/a1-01. Interslavic is prerendered in Latin.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pinyin } from 'pinyin-pro';

// Shared with the app (Node strips the types), so URLs and readings match it exactly.
const { phraseQuote, phraseSlug } = await import('../src/lib/slug.ts');
const romanizers = await import('../src/lib/romanize.ts');
const { toLatin } = await import('../src/lib/isvCyrillic.ts');

const ORIGIN = 'https://polyglot.icu';
const LEVELS = ['a1', 'a2', 'b1'];
// Mirrors src/languages.ts (name, lang code, True/False label).
const LANGS = {
  en: { name: 'English', tf: 'True or false?' },
  de: { name: 'German', tf: 'Richtig oder falsch?' },
  it: { name: 'Italian', tf: 'Vero o falso?' },
  es: { name: 'Spanish', tf: '¿Verdadero o falso?' },
  fr: { name: 'French', tf: 'Vrai ou faux ?' },
  ru: { name: 'Russian', tf: 'Верно или неверно?' },
  isv: { name: 'Interslavic', tf: 'Pravda ili nepravda?' },
  tr: { name: 'Turkish', tf: 'Doğru mu, yanlış mı?' },
  pt: { name: 'Portuguese', tf: 'Verdadeiro ou falso?' },
  ar: { name: 'Arabic', tf: 'صَحِيحٌ أَمْ خَطَأٌ؟' },
  pl: { name: 'Polish', tf: 'Prawda czy fałsz?' },
  el: { name: 'Greek', tf: 'Σωστό ή λάθος;' },
  sr: { name: 'Serbian', tf: 'Тачно или нетачно?' },
  hi: { name: 'Hindi', tf: 'सही या ग़लत?' },
  zh: { name: 'Chinese', tf: '对还是错？' },
};
const shell = readFileSync('dist/index.html', 'utf8');

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const paras = (body) =>
  body
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

// Link previews (WhatsApp, Telegram, Facebook, X…). The square app icon suits the small
// "summary" card. ponytail: one image for every page; per-language 1200×630 art would
// give the large card if shares become a real channel.
const social = (path, title, description) =>
  [
    ['og:type', 'website'],
    ['og:site_name', 'DeuLern Polyglot'],
    ['og:title', title],
    ['og:description', description],
    ['og:url', `${ORIGIN}${path}`],
    ['og:image', `${ORIGIN}/pwa-512x512.png`],
    ['og:image:alt', 'DeuLern Polyglot'],
  ]
    .map(([p, c]) => `<meta property="${p}" content="${esc(c)}" />`)
    .concat('<meta name="twitter:card" content="summary" />')
    .join('\n    ');

/** Structured data for search engines, as a <script> in the head. */
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`;

function page(path, title, description, main, ld) {
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(description)}" />\n    <link rel="canonical" href="${ORIGIN}${path}" />\n    ${social(path, title, description)}`,
    )
    .replace('</head>', ld ? `  ${jsonLd(ld)}\n  </head>` : '</head>')
    .replace('<div id="root"></div>', `<div id="root"><main>\n${main}\n</main></div>`);
}

function write(path, title, description, main, ld) {
  const file = `dist${path}.html`;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, page(path, title, description, main, ld));
}

const urls = ['/'];
const langLinks = Object.entries(LANGS)
  .map(([id, l]) => `<li><a href="/${id}">${l.name} reading texts</a></li>`)
  .join('\n');

for (const [lang, { name, tf }] of Object.entries(LANGS)) {
  const texts = Object.fromEntries(
    LEVELS.map((l) => [
      l,
      JSON.parse(readFileSync(`src/content/texts/${lang}/${l}.json`, 'utf8')),
    ]),
  );
  const levelLinks = LEVELS.map(
    (l) =>
      `<li><a href="/${lang}/level/${l}">Level ${l.toUpperCase()} ${name} reading texts</a></li>`,
  ).join('\n');

  write(
    `/${lang}`,
    `${name} reading texts, A1 to B1 · DeuLern Polyglot`,
    `Free graded ${name} reading texts for A1, A2 and B1 with a glossary and comprehension questions. No account needed.`,
    `<h1>Graded ${name} reading texts</h1>\n<ul>\n${levelLinks}\n</ul>\n<h2>Other languages</h2>\n<ul>\n${langLinks}\n</ul>`,
  );
  urls.push(`/${lang}`);

  for (const level of LEVELS) {
    const list = texts[level];
    const L = level.toUpperCase();
    write(
      `/${lang}/level/${level}`,
      `Level ${L} ${name} reading texts · DeuLern Polyglot`,
      `${list.length} free ${L} ${name} reading texts with a glossary and comprehension questions. No account needed.`,
      `<h1>Level ${L} ${name} reading texts</h1>
<p>${list.length} short texts at CEFR level ${L}. Each has a glossary of difficult words and comprehension questions you can answer in the browser.</p>
<ul lang="${lang}">
${list.map((t) => `<li><a href="/${lang}/text/${t.id}">${esc(t.title)}</a> (<span lang="en">${esc(t.topic)}</span>)</li>`).join('\n')}
</ul>
<h2>Other levels</h2>
<ul>
${levelLinks}
</ul>`,
    );
    urls.push(`/${lang}/level/${level}`);

    list.forEach((t, i) => {
      const related = [list[i - 1], list[i + 1], list[i + 2]].filter(Boolean);
      write(
        `/${lang}/text/${t.id}`,
        `${t.title} · ${t.level} ${name} reading text · DeuLern Polyglot`,
        `Read "${t.title}", ${t.level === 'B1' ? 'a' : 'an'} ${t.level} ${name} text about ${t.topic.toLowerCase()}, with a glossary and ${t.questions.length} comprehension questions.`,
        `<p><a href="/${lang}/level/${level}">Level ${t.level} ${name} texts</a></p>
<h1 lang="${lang}">${esc(t.title)}</h1>
<p>CEFR level ${t.level} · Topic: ${esc(t.topic)}</p>
<article lang="${lang}">
${paras(t.body)}
</article>
<h2>Glossary</h2>
<dl>
${t.glossary.map((g) => `<dt lang="${lang}">${esc(g.term)}</dt><dd>${esc(g.translation)}</dd>`).join('\n')}
</dl>
<h2>Comprehension questions</h2>
<p>Open this page in a browser with JavaScript to answer the questions and check your answers.</p>
<ol lang="${lang}">
${t.questions
  .map((q) =>
    q.type === 'mc'
      ? `<li>${esc(q.prompt)}<ul>${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></li>`
      : `<li>${tf} ${esc(q.prompt)}</li>`,
  )
  .join('\n')}
</ol>
<h2>More ${t.level} ${name} texts</h2>
<ul lang="${lang}">
${related.map((r) => `<li><a href="/${lang}/text/${r.id}">${esc(r.title)}</a></li>`).join('\n')}
</ul>`,
        {
          '@type': 'LearningResource',
          name: t.title,
          url: `${ORIGIN}/${lang}/text/${t.id}`,
          inLanguage: lang,
          about: t.topic,
          educationalLevel: `CEFR ${t.level}`,
          learningResourceType: 'Reading passage with comprehension questions',
          teaches: `${name} reading comprehension`,
          isAccessibleForFree: true,
          publisher: {
            '@type': 'Organization',
            name: 'DeuLern',
            url: 'https://deulern.com',
          },
        },
      );
      urls.push(`/${lang}/text/${t.id}`);
    });
  }
}

// Phrasebook: one page per language listing every phrase in rank order.
const english = JSON.parse(readFileSync('1000_phrases_claude.json', 'utf8')).sort(
  (a, b) => a.rank - b.rank,
);
// Languages whose phrasebook is still to come are left out.
const PHRASE_LANGS = Object.entries(LANGS).filter(([id]) =>
  existsSync(`src/content/phrases/${id}.json`),
);
const phraseLinks = PHRASE_LANGS.map(
  ([id, l]) => `<li><a href="/phrases/${id}">${l.name} phrases</a></li>`,
).join('\n');
write(
  '/reading',
  'Graded reading texts in fifteen languages · DeuLern Polyglot',
  'Free graded reading texts in English, German, Italian, Spanish, French, Russian, Interslavic, Turkish, Portuguese, Arabic, Polish, Greek, Serbian, Hindi and Chinese for A1, A2 and B1, with glossary and comprehension questions.',
  `<h1>Graded reading texts in fifteen languages</h1>\n<ul>\n${langLinks}\n</ul>`,
);
write(
  '/phrases',
  'Everyday phrases in fifteen languages · DeuLern Polyglot',
  'The 1000 most useful everyday phrases in English, German, Italian, Spanish, French, Russian, Interslavic, Turkish, Portuguese, Arabic, Polish, Greek, Serbian, Hindi and Chinese, ordered by how useful they are.',
  `<h1>Everyday phrases in fifteen languages</h1>\n<ul>\n${phraseLinks}\n</ul>\n<p><a href="/say">Compare a phrase across every language</a></p>`,
);
urls.push('/reading', '/phrases');
for (const [lang, { name }] of PHRASE_LANGS) {
  const tr = JSON.parse(readFileSync(`src/content/phrases/${lang}.json`, 'utf8'));
  write(
    `/phrases/${lang}`,
    `1000 everyday ${name} phrases · DeuLern Polyglot`,
    `The 1000 most useful ${name} phrases${lang === 'en' ? '' : ' with English translations'}, from greetings to emergencies, ordered by how useful they are.`,
    `<h1>1000 everyday ${name} phrases</h1>
<ol>
${english
  .map((p) =>
    lang === 'en'
      ? `<li><a href="/say/${phraseSlug(p.phrase)}">${esc(p.phrase)}</a></li>`
      : `<li><span lang="${lang}">${esc(tr[p.id])}</span> · <a href="/say/${phraseSlug(p.phrase)}">${esc(p.phrase)}</a></li>`,
  )
  .join('\n')}
</ol>
<h2>Other languages</h2>
<ul>
${phraseLinks}
</ul>`,
  );
  urls.push(`/phrases/${lang}`);
}

// "How to say X": one page per phrase with every language's version, plus an index.
const books = Object.fromEntries(
  PHRASE_LANGS.map(([id]) => [
    id,
    JSON.parse(readFileSync(`src/content/phrases/${id}.json`, 'utf8')),
  ]),
);
const OTHERS = PHRASE_LANGS.filter(([id]) => id !== 'en');
/** Latin reading for scripts most readers can't sound out, as the app's guide shows it
 *  (Serbian: its Latin spelling). Final punctuation is dropped: it goes in brackets. */
const reading = (lang, text) => {
  const out =
    lang === 'zh'
      ? pinyin(text, { type: 'all' })
          .map((x, i, all) =>
            x.isZh ? (all[i - 1]?.isZh ? ' ' : '') + x.pinyin : x.origin,
          )
          .join('')
      : lang === 'sr'
        ? toLatin(text)
        : romanizers[lang]
          ? romanizers[lang](text)
              .map(([t, r]) => r || t)
              .join('')
          : '';
  return out.replace(/।/g, '.').replace(/[\s.!?;؟。？！]+$/u, '');
};
write(
  '/say',
  `How to say 1000 everyday phrases in ${OTHERS.length} languages · DeuLern Polyglot`,
  `The 1000 most useful everyday phrases, each side by side in ${OTHERS.map(([, l]) => l.name).join(', ')}, with a pronunciation guide.`,
  `<h1>One phrase, ${OTHERS.length} languages</h1>
<ol>
${english.map((p) => `<li><a href="/say/${phraseSlug(p.phrase)}">${esc(p.phrase)}</a></li>`).join('\n')}
</ol>`,
);
urls.push('/say');
english.forEach((p, i) => {
  const quote = phraseQuote(p.phrase);
  const rows = OTHERS.map(([id, l]) => ({ id, name: l.name, text: books[id][p.id] }));
  // As many "Italian: Grazie" pairs as fit a search snippet.
  let description = `How to say “${quote}” in ${OTHERS.length} languages:`;
  for (const r of rows) {
    const more = ` ${r.name}: ${r.text}`;
    if (description.length + more.length > 150) break;
    description += more;
  }
  const near = [english[i - 1], english[i + 1]].filter(Boolean);
  write(
    `/say/${phraseSlug(p.phrase)}`,
    `How to say “${quote}” in ${OTHERS.length} languages · DeuLern Polyglot`,
    description,
    `<p><a href="/say">All phrases</a></p>
<h1>How to say “${esc(quote)}” in ${OTHERS.length} languages</h1>
${p.note ? `<p>${esc(p.note)}</p>\n` : ''}<p>Phrase ${p.rank} of ${english.length} by usefulness · topic: ${esc(p.category)}</p>
<dl>
${rows
  .map((r) => {
    const say = reading(r.id, r.text);
    return `<dt><a href="/phrases/${r.id}">${r.name}</a></dt><dd><span lang="${r.id}">${esc(r.text)}</span>${say ? ` (${esc(say)})` : ''}</dd>`;
  })
  .join('\n')}
</dl>
<h2>More phrases</h2>
<ul>
${near.map((n) => `<li><a href="/say/${phraseSlug(n.phrase)}">${esc(n.phrase)}</a></li>`).join('\n')}
</ul>`,
  );
  urls.push(`/say/${phraseSlug(p.phrase)}`);
});

// Pronunciation: an index plus one page of rules per language.
const sayLinks = Object.entries(LANGS)
  .map(([id, l]) => `<li><a href="/pronunciation/${id}">${l.name} pronunciation</a></li>`)
  .join('\n');
write(
  '/pronunciation',
  'Pronunciation rules for fifteen languages · DeuLern Polyglot',
  'How English, German, Italian, Spanish, French, Russian, Interslavic, Turkish, Portuguese, Arabic, Polish, Greek, Serbian, Hindi and Chinese sound, rule by rule, with example words.',
  `<h1>Pronunciation rules for fifteen languages</h1>\n<ul>\n${sayLinks}\n</ul>`,
);
urls.push('/pronunciation');
for (const [lang, { name }] of Object.entries(LANGS)) {
  const rules = JSON.parse(
    readFileSync(`src/content/pronunciation/${lang}.json`, 'utf8'),
  );
  write(
    `/pronunciation/${lang}`,
    `${name} pronunciation · DeuLern Polyglot`,
    `How ${name} sounds: ${rules.length} pronunciation rule${rules.length > 1 ? 's' : ''}, most frequent first, with example words and an English-style respelling.`,
    `<h1>${name} pronunciation</h1>
<ol>
${rules
  .map(
    (r) => `<li><h2>${esc(r.title)}</h2>
<p>${esc(r.body)}</p>
<ul>
${r.examples.map((e) => `<li><span lang="${lang}">${esc(e.word)}</span> “${esc(e.say)}” · ${esc(e.en)}</li>`).join('\n')}
</ul></li>`,
  )
  .join('\n')}
</ol>
<h2>Other languages</h2>
<ul>
${sayLinks}
</ul>`,
  );
  urls.push(`/pronunciation/${lang}`);
}

// The home page doubles as the SPA fallback, so it gets only the section links.
writeFileSync(
  'dist/index.html',
  page(
    '/',
    'DeuLern Polyglot',
    'Free graded reading texts and the 1000 most useful everyday phrases in English, German, Italian, Spanish, French, Russian, Interslavic, Turkish, Portuguese, Arabic, Polish, Greek, Serbian, Hindi and Chinese. No account needed.',
    `<h1>DeuLern Polyglot: reading texts and everyday phrases in fifteen languages</h1>\n<ul>\n<li><a href="/reading">Graded reading texts</a></li>\n<li><a href="/phrases">Everyday phrases</a></li>\n<li><a href="/pronunciation">Pronunciation</a></li>\n</ul>\n<ul>\n${langLinks}\n</ul>`,
  ).replace(/\n\s*<link rel="canonical"[^>]*>/, ''),
);

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}
</urlset>
`,
);
console.log(`prerender: ${urls.length - 1} pages + sitemap.xml`);
