import { readFileSync } from 'node:fs';
import { ar, el, hi, loadZh, ru, type Romanizer } from './romanize';

const read = (rom: Romanizer, s: string) =>
  rom(s)
    .map(([t, r]) => r || t)
    .join('');

it('romanizes Russian', () => {
  expect(read(ru, 'Её семья живёт в Казани.')).toBe('Yeyo semʼya zhivyot v Kazani.');
});

it('romanizes Greek phonetically with stress', () => {
  expect(read(el, 'Γεια σας! Είμαι από τη Θεσσαλονίκη, αυτό το μπαρ.')).toBe(
    'Yia sas! Íme apó ti Thessaloníki, aftó to bar.',
  );
});

it('romanizes Hindi with schwa deletion', () => {
  expect(read(hi, 'कमरा समझना बहन मित्र अंजलि हिंदी में ज्ञान लड़का।')).toBe(
    'kamrā samajhnā bahan mitra anjali hindī meṁ gyān laṛkā।',
  );
});

it('romanizes vowelled Arabic', () => {
  expect(
    read(
      ar,
      'اسْمِي فِي الْجَامِعَةِ وَالشَّمْسُ لِلْبَيْتِ كِتَابًا كَتَبُوا عَلَى الْآنَ',
    ),
  ).toBe('ismī fī al-jāmiʻati wash-shamsu lil-bayti kitāban katabū ʻalā al-āna');
});

it('gives pinyin by word context', async () => {
  const zh = await loadZh();
  expect(zh('去银行，行吗？')).toEqual([
    ['去', 'qù'],
    ['银', 'yín'],
    ['行', 'háng'],
    ['，', ''],
    ['行', 'xíng'],
    ['吗', 'ma'],
    ['？', ''],
  ]);
});

// Every word of every text gets a reading made only of Latin letters: catches an unmapped
// letter or mark slipping through.
it.each([
  ['ru', ru],
  ['el', el],
  ['hi', hi],
  ['ar', ar],
] as const)('%s texts romanize to Latin only', (id, rom) => {
  const bad = new Set<string>();
  for (const level of ['a1', 'a2', 'b1'])
    for (const t of JSON.parse(
      readFileSync(`src/content/texts/${id}/${level}.json`, 'utf8'),
    ))
      for (const [w, r] of rom([t.title, t.body].join('\n')))
        if (r && !/^[\p{Script=Latin}̀-ͯʼʻ-]+$/u.test(r.normalize('NFD')))
          bad.add(`${w} → ${r}`);
  expect([...bad].slice(0, 10)).toEqual([]);
});
