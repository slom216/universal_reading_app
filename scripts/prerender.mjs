/* global console */
// Post-build: writes a static HTML page per language, level and text into dist/, plus
// sitemap.xml. Crawlers that do not run JavaScript otherwise see an empty
// <div id="root">. The React app mounts over this markup; Cloudflare serves
// dist/it/text/a1-01.html at /it/text/a1-01. Interslavic is prerendered in Latin.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = 'https://read.deulern.com';
const LEVELS = ['a1', 'a2', 'b1'];
// Mirrors src/languages.ts (name, lang code, True/False label).
const LANGS = {
  it: { name: 'Italian', tf: 'Vero o falso?' },
  es: { name: 'Spanish', tf: '¿Verdadero o falso?' },
  fr: { name: 'French', tf: 'Vrai ou faux ?' },
  ru: { name: 'Russian', tf: 'Верно или неверно?' },
  isv: { name: 'Interslavic', tf: 'Pravda ili nepravda?' },
};
const shell = readFileSync('dist/index.html', 'utf8');

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const paras = (body) =>
  body.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');

function page(path, title, description, main) {
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(description)}" />\n    <link rel="canonical" href="${ORIGIN}${path}" />`,
    )
    .replace('<div id="root"></div>', `<div id="root"><main>\n${main}\n</main></div>`);
}

function write(path, title, description, main) {
  const file = `dist${path}.html`;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, page(path, title, description, main));
}

const urls = ['/'];
const langLinks = Object.entries(LANGS)
  .map(([id, l]) => `<li><a href="/${id}">${l.name} reading texts</a></li>`)
  .join('\n');

for (const [lang, { name, tf }] of Object.entries(LANGS)) {
  const texts = Object.fromEntries(
    LEVELS.map((l) => [l, JSON.parse(readFileSync(`src/content/texts/${lang}/${l}.json`, 'utf8'))]),
  );
  const levelLinks = LEVELS.map(
    (l) => `<li><a href="/${lang}/level/${l}">Level ${l.toUpperCase()} ${name} reading texts</a></li>`,
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
      );
      urls.push(`/${lang}/text/${t.id}`);
    });
  }
}

// The home page doubles as the SPA fallback, so it gets only the language links.
writeFileSync(
  'dist/index.html',
  page(
    '/',
    'DeuLern Polyglot',
    'Free graded reading texts in Italian, Spanish, French, Russian and Interslavic for A1, A2 and B1, with glossary and comprehension questions. No account needed.',
    `<h1>DeuLern Polyglot: graded reading texts in five languages</h1>\n<ul>\n${langLinks}\n</ul>`,
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
