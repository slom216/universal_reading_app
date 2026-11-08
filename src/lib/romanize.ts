// Latin pronunciation guides shown above Russian, Greek, Hindi and Arabic words (and,
// lazily loaded, pinyin above Chinese characters). Each romanizer splits a string into
// [text, reading] pairs; reading is '' for punctuation, spaces and digits.

export type Seg = [text: string, reading: string];
export type Romanizer = (s: string) => Seg[];

/** Splits on runs of `word` (a regex with one capture group) and romanizes each run. */
const byWord =
  (word: RegExp, fn: (w: string) => string): Romanizer =>
  (s) =>
    s
      .split(word)
      .map((part, i): Seg => [part, i % 2 ? fn(part) : ''])
      .filter(([part]) => part !== '');

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const capLike = (w: string, out: string) =>
  w[0] !== w[0]!.toLowerCase() ? cap(out) : out;

// --- Russian: BGN-style, е → ye at the start of a word and after a vowel.
const RU: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: 'ʼ',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const ru = byWord(/((?:[а-яё]|\u0301)+)/i, (w) => {
  const l = w.toLowerCase();
  let out = '';
  for (let i = 0; i < l.length; i++) {
    const c = l[i]!;
    out +=
      c === 'е' && (i === 0 || 'аеёиоуыэюяъь'.includes(l[i - 1]!)) ? 'ye' : (RU[c] ?? c);
  }
  return capLike(w, out);
});

// --- Greek: phonetic (αι → e, ει/οι → i, μπ → b/mb …), stress kept as an acute accent.
const EL: Record<string, string> = {
  α: 'a',
  β: 'v',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'i',
  θ: 'th',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'r',
  σ: 's',
  ς: 's',
  τ: 't',
  υ: 'i',
  φ: 'f',
  χ: 'ch',
  ψ: 'ps',
  ω: 'o',
};
const EL_VOWELS: Record<string, string> = {
  αι: 'e',
  ει: 'i',
  οι: 'i',
  υι: 'i',
  ου: 'ou',
};
const stress = (s: string, on: boolean) => (on ? s.replace(/[aeiou]/, '$&́') : s);

export const el = byWord(/([Ͱ-Ͽ]+)/, (w) => {
  // Base letters with their accent / diaeresis (NFD splits ά into α + U+0301).
  const u: { c: string; acc: boolean; dia: boolean }[] = [];
  for (const ch of w.toLowerCase().normalize('NFD')) {
    if (ch === '́') u[u.length - 1]!.acc = true;
    else if (ch === '̈') u[u.length - 1]!.dia = true;
    else u.push({ c: ch, acc: false, dia: false });
  }
  let out = '';
  for (let i = 0; i < u.length;) {
    const a = u[i]!;
    const b = u[i + 1];
    const c = u[i + 2];
    const pair = b && !b.dia ? a.c + b.c : '';
    const acc = a.acc || Boolean(b?.acc);
    if (EL_VOWELS[pair]) {
      out += stress(EL_VOWELS[pair], acc);
      i += 2;
    } else if (/^[αεη]υ$/.test(pair)) {
      const f = !c || 'θκξπσςτφχψ'.includes(c.c);
      out += stress(EL[a.c] + (f ? 'f' : 'v'), acc);
      i += 2;
    } else {
      const two = b ? a.c + b.c : '';
      const cons = (
        {
          μπ: i ? 'mb' : 'b',
          ντ: i ? 'nd' : 'd',
          γκ: i ? 'ng' : 'g',
          γγ: 'ng',
          γχ: 'nch',
          τσ: 'ts',
          τζ: 'tz',
        } as Record<string, string>
      )[two];
      if (cons) {
        out += cons;
        i += 2;
        continue;
      }
      // γ before an e/i sound is a y sound: γεια → yia.
      const front =
        b &&
        ('εηιυ'.includes(b.c) || (c && !c.dia && ['αι', 'ει', 'οι'].includes(b.c + c.c)));
      out += a.c === 'γ' && front ? 'y' : stress(EL[a.c] ?? a.c, a.acc);
      i++;
    }
  }
  return capLike(w, out.normalize('NFC'));
});

// --- Hindi: Devanagari → Latin with the usual schwa-deletion rules (कमरा → kamrā).
// ponytail: heuristic, misses some compounds (e.g. a schwa kept across a word seam);
// store a reading per word if learners report wrong ones.
const HI_C: Record<string, string> = {
  क: 'k',
  ख: 'kh',
  ग: 'g',
  घ: 'gh',
  ङ: 'ṅ',
  च: 'ch',
  छ: 'chh',
  ज: 'j',
  झ: 'jh',
  ञ: 'ñ',
  ट: 'ṭ',
  ठ: 'ṭh',
  ड: 'ḍ',
  ढ: 'ḍh',
  ण: 'ṇ',
  त: 't',
  थ: 'th',
  द: 'd',
  ध: 'dh',
  न: 'n',
  प: 'p',
  फ: 'ph',
  ब: 'b',
  भ: 'bh',
  म: 'm',
  य: 'y',
  र: 'r',
  ल: 'l',
  व: 'v',
  श: 'sh',
  ष: 'sh',
  स: 's',
  ह: 'h',
  ळ: 'ḷ',
};
const HI_NUKTA: Record<string, string> = {
  k: 'q',
  kh: 'kh',
  g: 'g',
  j: 'z',
  ph: 'f',
  ḍ: 'ṛ',
  ḍh: 'ṛh',
};
const HI_V: Record<string, string> = {
  अ: 'a',
  आ: 'ā',
  इ: 'i',
  ई: 'ī',
  उ: 'u',
  ऊ: 'ū',
  ऋ: 'ri',
  ए: 'e',
  ऐ: 'ai',
  ओ: 'o',
  औ: 'au',
  ऑ: 'o',
  ऍ: 'e',
};
const HI_MATRA: Record<string, string> = {
  'ा': 'ā',
  'ि': 'i',
  'ी': 'ī',
  'ु': 'u',
  'ू': 'ū',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ॉ': 'o',
  'ॅ': 'e',
};

export const hi = byWord(/([ऀ-ॣॱ-ॿ‌‍]+)/, (w) => {
  // c: consonant ('' for a vowel letter), v: its vowel, inh: v is the inherent a.
  const t: { c: string; v: string; inh: boolean; nas: string }[] = [];
  for (const ch of w.normalize('NFD')) {
    const last = t[t.length - 1];
    if (HI_C[ch]) t.push({ c: HI_C[ch], v: 'a', inh: true, nas: '' });
    else if (HI_V[ch]) t.push({ c: '', v: HI_V[ch], inh: false, nas: '' });
    else if (!last) continue;
    else if (ch === '़') last.c = HI_NUKTA[last.c] ?? last.c;
    else if (HI_MATRA[ch]) Object.assign(last, { v: HI_MATRA[ch], inh: false });
    else if (ch === '्') Object.assign(last, { v: '', inh: false });
    else if (ch === 'ं' || ch === 'ँ') last.nas = ch;
    else if (ch === 'ः') last.v += 'ḥ';
  }
  // ज्ञ is said "gy" in Hindi: ज्ञान → gyān.
  t.forEach((x, i) => {
    if (x.c === 'j' && !x.v && t[i + 1]?.c === 'ñ') [x.c, t[i + 1]!.c] = ['g', 'y'];
  });
  // Final schwa goes, except after a cluster (मित्र → mitra) or in a one-letter word (न → na).
  const end = t[t.length - 1];
  if (end?.inh && t.length > 1 && t[t.length - 2]!.v && !end.nas) end.v = '';
  // A medial schwa goes between a vowel+consonant and a consonant+vowel, right to left
  // (a nasal mark before the consonant makes a cluster: अंजलि → anjali).
  for (let i = t.length - 2; i > 0; i--) {
    const x = t[i]!;
    const prev = t[i - 1]!;
    if (x.inh && x.c && !x.nas && prev.v && !prev.nas && t[i + 1]!.c && t[i + 1]!.v)
      x.v = '';
  }
  return t
    .map((x, i) => {
      if (!x.nas) return x.c + x.v;
      const next = t[i + 1]?.c ?? '';
      const nasal = !next || x.nas === 'ँ' ? 'ṁ' : /^[pbm]/.test(next) ? 'm' : 'n';
      return x.c + x.v + nasal;
    })
    .join('');
});

// --- Arabic: read from the full vowel marks (the texts are fully vowelled).
const AR: Record<string, string> = {
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'ḥ',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 'ṣ',
  ض: 'ḍ',
  ط: 'ṭ',
  ظ: 'ẓ',
  ع: 'ʻ',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
};
const AR_VOWEL: Record<string, string> = {
  'َ': 'a',
  'ُ': 'u',
  'ِ': 'i',
  'ً': 'an',
  'ٌ': 'un',
  'ٍ': 'in',
};
const SHADDA = 'ّ';
const SUKUN = 'ْ';
const DAGGER = 'ٰ';
const SUN = 'تثدذرزسشصضطظلن';
const HAMZA = 'ءأإؤئ';
const isAlif = (c?: string) => c === 'ا' || c === 'ٱ';

export const ar = byWord(/([ء-ٰٟٱ]+)/, (w) => {
  const u: { c: string; m: string }[] = [];
  for (const ch of w) {
    if (/[ً-ْٰ]/.test(ch)) {
      if (u.length) u[u.length - 1]!.m += ch;
    } else if (ch !== 'ـ') u.push({ c: ch, m: '' });
  }
  const vowelOf = (m: string) => [...m].map((x) => AR_VOWEL[x] ?? '').join('');

  // The article: (و ف ب ك + vowel)? + ال, or لِ + ل (لِلْبَيْتِ = li + al-bayti).
  let out = '';
  let i = 0;
  let lam = -1;
  if (
    'وفبك'.includes(u[0]!.c) &&
    vowelOf(u[0]!.m) &&
    isAlif(u[1]?.c) &&
    u[2]?.c === 'ل' &&
    u[3]
  ) {
    out = AR[u[0]!.c] + vowelOf(u[0]!.m);
    lam = 2;
  } else if (isAlif(u[0]!.c) && !u[0]!.m && u[1]?.c === 'ل' && u[2]) lam = 1;
  else if (u[0]!.c === 'ل' && u[0]!.m === 'ِ' && u[1]?.c === 'ل' && u[2]) {
    out = 'li';
    lam = 1;
  }
  let sunAt = -1;
  if (lam > 0) {
    const next = u[lam + 1]!;
    const sun =
      next.m.includes(SHADDA) && SUN.includes(next.c) && !u[lam]!.m.includes(SUKUN);
    if (sun) sunAt = lam + 1;
    out = (out || 'a') + (sun ? AR[next.c] : 'l') + '-';
    i = lam + 1;
  }
  const start = i;

  const lengthen = (short: string, long: string) => {
    if (out.endsWith(short)) out = out.slice(0, -1) + long;
    else if (!out.endsWith(long)) out += long;
  };
  for (; i < u.length; i++) {
    const { c, m } = u[i]!;
    const v = vowelOf(m);
    const bare = !v && !m.includes(SHADDA) && !m.includes(SUKUN);
    if (isAlif(c)) {
      // Silent after tanwin (كِتَابًا) and after the plural ū (كَتَبُوا).
      if (v) out += v;
      else if (out.endsWith('an') || out.endsWith('ū')) continue;
      // A bare first alif is a hamzat al-wasl: اسْمِي → ismī.
      else if (i === start) out += 'i';
      else lengthen('a', 'ā');
    } else if (c === 'آ') out += (i > start ? 'ʼ' : '') + 'ā';
    else if (HAMZA.includes(c)) out += i > start ? 'ʼ' + v : v || (c === 'إ' ? 'i' : 'a');
    else if (c === 'و' && bare && out.endsWith('u')) lengthen('u', 'ū');
    else if (c === 'ي' && bare && out.endsWith('i')) lengthen('i', 'ī');
    else if (c === 'ى') {
      if (!out.endsWith('an')) lengthen('a', 'ā');
      continue;
    } else if (c === 'ة') out += v ? 't' + v : '';
    else {
      const l = AR[c] ?? '';
      out += l + (m.includes(SHADDA) && i !== sunAt ? l : '') + v;
    }
    if (m.includes(DAGGER)) lengthen('a', 'ā');
  }
  return out;
});

let zhPromise: Promise<Romanizer> | undefined;
/** Pinyin per character, by word context (行 in 银行 is háng). Loads pinyin-pro on first use. */
export const loadZh = () =>
  (zhPromise ??= import('pinyin-pro').then(
    ({ pinyin }): Romanizer =>
      (s) =>
        pinyin(s, { type: 'all' }).map((x) => [x.origin, x.isZh ? x.pinyin : '']),
  ));
