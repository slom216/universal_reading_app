/* global Buffer, console */
// Post-build: writes a static HTML page per language, level and text into dist/, plus
// sitemap.xml. Crawlers that do not run JavaScript otherwise see an empty
// <div id="root">. The React app mounts over this markup; Cloudflare serves
// dist/it/text/a1-01.html at /it/text/a1-01. Interslavic is prerendered in Latin.
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { pinyin } from 'pinyin-pro';
import sharp from 'sharp';

// Shared with the app (Node strips the types), so URLs and readings match it exactly.
const { phraseQuote, phraseSlug } = await import('../src/lib/slug.ts');
const romanizers = await import('../src/lib/romanize.ts');
const { toLatin } = await import('../src/lib/isvCyrillic.ts');

const ORIGIN = 'https://polyglot.icu';
const LEVELS = ['a1', 'a2', 'b1'];
// Mirrors src/languages.ts (name, BCP 47 code where it differs from the id, True/False label).
const LANGS = {
  en: { name: 'English', tf: 'True or false?' },
  de: { name: 'German', tf: 'Richtig oder falsch?' },
  it: { name: 'Italian', tf: 'Vero o falso?' },
  es: { name: 'Spanish', tf: '¿Verdadero o falso?' },
  fr: { name: 'French', tf: 'Vrai ou faux ?' },
  ru: { name: 'Russian', tf: 'Верно или неверно?' },
  isv: { name: 'Interslavic', tf: 'Pravda ili nepravda?' },
  tr: { name: 'Turkish', tf: 'Doğru mu, yanlış mı?' },
  pt: { name: 'Portuguese', code: 'pt-BR', tf: 'Verdadeiro ou falso?' },
  ar: { name: 'Arabic', tf: 'صَحِيحٌ أَمْ خَطَأٌ؟' },
  pl: { name: 'Polish', tf: 'Prawda czy fałsz?' },
  el: { name: 'Greek', tf: 'Σωστό ή λάθος;' },
  sr: { name: 'Serbian', tf: 'Тачно или нетачно?' },
  hi: { name: 'Hindi', tf: 'सही या ग़लत?' },
  zh: { name: 'Chinese', code: 'zh-CN', tf: '对还是错？' },
};
const code = (id) => LANGS[id].code ?? id;
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

// Link previews (WhatsApp, Telegram, Facebook, X…). Text pages get their own 1200×630
// card (drawCard below) and the large preview; every other page shows the square app
// icon in the small "summary" card.
const social = (path, title, description, image) =>
  [
    ['og:type', 'website'],
    ['og:site_name', 'DeuLern Polyglot'],
    ['og:title', title],
    ['og:description', description],
    ['og:url', `${ORIGIN}${path}`],
    ['og:image', `${ORIGIN}${image ?? '/pwa-512x512.png'}`],
    ...(image
      ? [
          ['og:image:width', '1200'],
          ['og:image:height', '630'],
        ]
      : []),
    ['og:image:alt', image ? title : 'DeuLern Polyglot'],
  ]
    .map(([p, c]) => `<meta property="${p}" content="${esc(c)}" />`)
    .concat(
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    )
    .join('\n    ');

// Share cards: the text's title in its own script on the app's paper, drawn by sharp
// (librsvg + Pango, so Arabic, Devanagari and Han shape and wrap correctly; resvg mangles
// Devanagari). Fonts come from the system: needs Noto Sans, Noto Sans Arabic, Noto Sans
// Devanagari and Noto Sans CJK installed, or Pango falls back to whatever covers the script.
// Cards are cached by content in node_modules/.cache, so a build only draws new or changed
// titles. Bump CARD after changing the design to redraw them all.
const CARD = 'v1';
const CARD_CACHE = 'node_modules/.cache/og-cards';
const CARD_FONT = {
  ar: 'Noto Sans Arabic',
  hi: 'Noto Sans Devanagari',
  zh: 'Noto Sans CJK SC',
};
const cards = [];

async function drawCard({ lang, name, t }, file) {
  const ink = (s) =>
    `<span foreground="#141414">${s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
  let title;
  for (const size of [76, 60, 48]) {
    title = await sharp({
      text: {
        text: ink(t.title),
        font: `${CARD_FONT[lang] ?? 'Noto Sans'} Bold ${size}`,
        width: 1040,
        dpi: 72,
        rgba: true,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (title.info.height <= 320) break;
  }
  const { width, height } = title.info;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="Noto Sans" font-weight="700">
<rect width="1200" height="630" fill="#e6ddcc"/>
<rect x="80" y="64" width="64" height="64" rx="12" fill="#c63f1e"/>
<text x="112" y="113" text-anchor="middle" font-size="42" font-weight="800" fill="#fbf5ea">P</text>
<text x="164" y="107" font-size="30" fill="#141414">DeuLern Polyglot</text>
<rect x="1016" y="68" width="104" height="56" rx="28" fill="#5aa3e8"/>
<text x="1068" y="106" text-anchor="middle" font-size="30" fill="#141414">${t.level}</text>
<text x="80" y="526" font-size="30" font-weight="400" fill="#3f3a33">${esc(name)} · ${esc(t.id.startsWith('saga-') ? `${SAGA}, ${t.topic.toLowerCase()}` : t.topic)}</text>
<rect y="566" width="1200" height="64" fill="#c63f1e"/>
<text x="80" y="608" font-size="28" fill="#fbf5ea">Free graded reading with a glossary and quiz · polyglot.icu</text>
</svg>`;
  await sharp(Buffer.from(bg))
    .composite([
      {
        input: title.data,
        left: lang === 'ar' ? 1120 - width : 80,
        top: Math.round(160 + (320 - height) / 2),
      },
    ])
    .png({ palette: true })
    .toFile(file);
}

/** Copies every queued card into dist/og, drawing the ones not in the cache yet. */
async function writeCards() {
  mkdirSync(CARD_CACHE, { recursive: true });
  const queue = [...cards];
  let drawn = 0;
  await Promise.all(
    Array.from({ length: availableParallelism() }, async () => {
      for (let c; (c = queue.shift());) {
        const key = createHash('sha1')
          .update(JSON.stringify([CARD, c.lang, c.name, c.t.title, c.t.level, c.t.topic]))
          .digest('hex');
        const cached = `${CARD_CACHE}/${key}.png`;
        if (!existsSync(cached)) {
          await drawCard(c, cached);
          drawn++;
        }
        mkdirSync(`dist/og/${c.lang}`, { recursive: true });
        copyFileSync(cached, `dist/og/${c.lang}/${c.t.id}.png`);
      }
    }),
  );
  console.log(`prerender: ${cards.length} share cards (${drawn} drawn, rest cached)`);
}

/** Structured data for search engines, as a <script> in the head. */
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`;

function page(path, title, description, main, ld, image) {
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(description)}" />\n    <link rel="canonical" href="${ORIGIN}${path}" />\n    ${social(path, title, description, image)}`,
    )
    .replace('</head>', ld ? `  ${jsonLd(ld)}\n  </head>` : '</head>')
    .replace('<div id="root"></div>', `<div id="root"><main>\n${main}\n</main></div>`);
}

function write(path, title, description, main, ld, image) {
  const file = `dist${path}.html`;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, page(path, title, description, main, ld, image));
}

const urls = ['/'];
const langLinks = Object.entries(LANGS)
  .map(([id, l]) => `<li><a href="/${id}">${l.name} reading texts</a></li>`)
  .join('\n');

// Mirrors SAGA_TITLE and SAGA_LEVEL in src/content/schema.ts.
const SAGA = 'The Great Saga';
const SAGA_LEVEL = 'A1';

for (const [lang, { name, tf }] of Object.entries(LANGS)) {
  const read = (f) =>
    JSON.parse(readFileSync(`src/content/texts/${lang}/${f}.json`, 'utf8'));
  const saga = read('saga');
  // Each list of texts: the three levels, then the book saga's chapters.
  const shelves = [
    ...LEVELS.map((level) => {
      const L = level.toUpperCase();
      const list = read(level);
      return {
        path: `/${lang}/level/${level}`,
        list,
        link: `Level ${L} ${name} reading texts`,
        back: `Level ${L} ${name} texts`,
        title: `${name} ${L} reading: ${list.length} texts with quizzes`,
        description: `${list.length} free ${L} ${name} reading texts with a glossary and comprehension questions. No account needed.`,
        intro: `${list.length} short texts at CEFR level ${L}. Each has a glossary of difficult words and comprehension questions you can answer in the browser.`,
        more: `More ${L} ${name} texts`,
      };
    }),
    {
      path: `/${lang}/saga`,
      list: saga,
      saga: true,
      link: `${SAGA}, an ${SAGA_LEVEL} ${name} story in chapters`,
      back: `${SAGA} in ${name}, ${SAGA_LEVEL}`,
      title: `${SAGA}: an ${SAGA_LEVEL} ${name} story for beginners in ${saga.length} chapters`,
      description: `${SAGA} is a serial story in simple ${name} for beginners, CEFR level ${SAGA_LEVEL}: an orphan boy at a medieval monastery, told chapter by chapter with a glossary and comprehension questions.`,
      intro: `An orphan boy at a medieval monastery, and the long road ahead of him. One story in simple ${name} for beginners (CEFR level ${SAGA_LEVEL}), told in chapters, each with a glossary and comprehension questions. Read them in order.`,
      more: `More chapters of ${SAGA}`,
    },
  ];
  const shelfLinks = shelves
    .map((s) => `<li><a href="${s.path}">${s.link}</a></li>`)
    .join('\n');

  write(
    `/${lang}`,
    `Free ${name} reading practice, A1 to B1 · DeuLern Polyglot`,
    `Free graded ${name} reading texts for A1, A2 and B1 with a glossary and comprehension questions. No account needed.`,
    `<h1>Graded ${name} reading texts</h1>\n<ul>\n${shelfLinks}\n</ul>\n<h2>Other languages</h2>\n<ul>\n${langLinks}\n</ul>`,
  );
  urls.push(`/${lang}`);

  for (const shelf of shelves) {
    const { list } = shelf;
    write(
      shelf.path,
      `${shelf.title} · DeuLern Polyglot`,
      shelf.description,
      `<h1>${shelf.saga ? shelf.back : shelf.link}</h1>
<p>${shelf.intro}</p>
<${shelf.saga ? 'ol' : 'ul'} lang="${code(lang)}">
${list.map((t) => `<li><a href="/${lang}/text/${t.id}">${esc(t.title)}</a> (<span lang="en">${esc(t.topic)}</span>)</li>`).join('\n')}
</${shelf.saga ? 'ol' : 'ul'}>
<h2>More ${name} reading</h2>
<ul>
${shelfLinks}
</ul>`,
    );
    urls.push(shelf.path);

    list.forEach((t, i) => {
      const related = [list[i - 1], list[i + 1], list[i + 2]].filter(Boolean);
      write(
        `/${lang}/text/${t.id}`,
        shelf.saga
          ? `${t.title} · ${SAGA} in ${name}, ${SAGA_LEVEL} · DeuLern Polyglot`
          : `${t.title} · ${name} ${t.level} reading text · DeuLern Polyglot`,
        shelf.saga
          ? `Read "${t.title}", ${t.topic.toLowerCase()} of ${SAGA}, an ${SAGA_LEVEL} ${name} story for beginners, with a glossary and ${t.questions.length} comprehension questions.`
          : `Read "${t.title}", ${t.level === 'B1' ? 'a' : 'an'} ${t.level} ${name} text about ${t.topic.toLowerCase()}, with a glossary and ${t.questions.length} comprehension questions.`,
        `<p><a href="${shelf.path}">${shelf.back}</a></p>
<h1 lang="${code(lang)}">${esc(t.title)}</h1>
<p>CEFR level ${t.level} · ${shelf.saga ? `${SAGA}, ${esc(t.topic.toLowerCase())}` : `Topic: ${esc(t.topic)}`}</p>
<article lang="${code(lang)}">
${paras(t.body)}
</article>
<h2>Glossary</h2>
<dl>
${t.glossary.map((g) => `<dt lang="${code(lang)}">${esc(g.term)}</dt><dd>${esc(g.translation)}</dd>`).join('\n')}
</dl>
<h2>Comprehension questions</h2>
<p>Open this page in a browser with JavaScript to answer the questions and check your answers.</p>
<ol lang="${code(lang)}">
${t.questions
  .map((q) =>
    q.type === 'mc'
      ? `<li>${esc(q.prompt)}<ul>${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></li>`
      : `<li>${tf} ${esc(q.prompt)}</li>`,
  )
  .join('\n')}
</ol>
<h2>${shelf.more}</h2>
<ul lang="${code(lang)}">
${related.map((r) => `<li><a href="/${lang}/text/${r.id}">${esc(r.title)}</a></li>`).join('\n')}
</ul>`,
        {
          '@type': 'LearningResource',
          name: t.title,
          url: `${ORIGIN}/${lang}/text/${t.id}`,
          inLanguage: code(lang),
          about: shelf.saga ? `${SAGA}, ${t.topic.toLowerCase()}` : t.topic,
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
        `/og/${lang}/${t.id}.png`,
      );
      cards.push({ lang, name, t });
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
    `1000 useful ${name} phrases${lang === 'en' ? '' : ' with English translations'} · DeuLern Polyglot`,
    `The 1000 most useful ${name} phrases${lang === 'en' ? '' : ' with English translations'}, from greetings to emergencies, ordered by how useful they are.`,
    `<h1>1000 everyday ${name} phrases</h1>
<ol>
${english
  .map((p) =>
    lang === 'en'
      ? `<li><a href="/say/${phraseSlug(p.phrase)}">${esc(p.phrase)}</a></li>`
      : `<li><span lang="${code(lang)}">${esc(tr[p.id])}</span> · <a href="/say/${phraseSlug(p.phrase)}">${esc(p.phrase)}</a></li>`,
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
    return `<dt><a href="/phrases/${r.id}">${r.name}</a></dt><dd><span lang="${code(r.id)}">${esc(r.text)}</span>${say ? ` (${esc(say)})` : ''}</dd>`;
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
${r.examples.map((e) => `<li><span lang="${code(lang)}">${esc(e.word)}</span> “${esc(e.say)}” · ${esc(e.en)}</li>`).join('\n')}
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

write(
  '/about',
  'About Polyglot · DeuLern Polyglot',
  'Who makes DeuLern Polyglot, how its texts and phrases are written with the help of AI, and how they are checked.',
  `<h1>About Polyglot</h1>
<p>Polyglot is made by Slobodan Markovic as part of <a href="https://deulern.com">DeuLern</a>. Its texts, phrases and pronunciation rules were written with the help of AI and pass automated checks; they have not been reviewed by native speakers. There are almost certainly mistakes, and we are working on finding and fixing them.</p>`,
);
urls.push('/about');

// The service worker still serves the home page for every navigation; the app replaces it.
writeFileSync(
  'dist/index.html',
  page(
    '/',
    'DeuLern Polyglot: free reading practice and phrases in 15 languages',
    'Free graded reading texts and the 1000 most useful everyday phrases in English, German, Italian, Spanish, French, Russian, Interslavic, Turkish, Portuguese, Arabic, Polish, Greek, Serbian, Hindi and Chinese. No account needed.',
    `<h1>DeuLern Polyglot: reading texts and everyday phrases in fifteen languages</h1>\n<ul>\n<li><a href="/reading">Graded reading texts</a></li>\n<li><a href="/phrases">Everyday phrases</a></li>\n<li><a href="/pronunciation">Pronunciation</a></li>\n</ul>\n<ul>\n${langLinks}\n</ul>`,
    {
      '@type': 'WebSite',
      name: 'DeuLern Polyglot',
      alternateName: 'Polyglot',
      url: `${ORIGIN}/`,
      publisher: { '@type': 'Organization', name: 'DeuLern', url: 'https://deulern.com' },
    },
  ),
);

// Pages that only make sense with the visitor's saved progress get the bare app shell,
// kept out of search. Any other path is a real 404 (wrangler.jsonc serves 404.html).
const shellPage = (file, title) => {
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(
    file,
    shell.replace(
      /<title>[^<]*<\/title>/,
      `<title>${esc(title)}</title>\n    <meta name="robots" content="noindex" />`,
    ),
  );
};
shellPage('dist/progress.html', 'Progress · DeuLern Polyglot');
shellPage('dist/settings.html', 'Settings · DeuLern Polyglot');
for (const [lang, { name }] of Object.entries(LANGS)) {
  for (const route of ['words', 'gaps', 'unscramble', 'level-check'])
    shellPage(`dist/${lang}/${route}.html`, `${name} practice · DeuLern Polyglot`);
}
for (const [lang, { name }] of PHRASE_LANGS)
  shellPage(
    `dist/phrases/${lang}/practice.html`,
    `${name} phrase practice · DeuLern Polyglot`,
  );
shellPage('dist/404.html', 'Page not found · DeuLern Polyglot');

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}
</urlset>
`,
);
console.log(`prerender: ${urls.length - 1} pages + sitemap.xml`);
await writeCards();
