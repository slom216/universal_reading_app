import type { LangId } from '../languages';
import { track } from '../lib/track';
import { useProgress, type Settings } from '../store/progress';

const TOGGLES = {
  isv: {
    setting: 'isvScript',
    label: 'Interslavic script',
    options: [
      { value: 'latin', label: 'Latinica', lang: 'isv' },
      { value: 'cyrillic', label: 'Кирилица', lang: 'isv-Cyrl' },
    ],
  },
  ar: {
    setting: 'arHarakat',
    label: 'Arabic vowel marks',
    options: [
      { value: 'on', label: 'With vowels', lang: 'en' },
      { value: 'off', label: 'Without vowels', lang: 'en' },
    ],
  },
} as const;

const hasScriptToggle = (id: LangId): id is keyof typeof TOGGLES => id in TOGGLES;

/** Interslavic script or Arabic vowel switch, shown in the reader and on the settings
 *  page. Renders nothing for other languages. */
export function ScriptToggle({ id }: { id: LangId }) {
  const settings = useProgress((s) => s.settings);
  const setSettings = useProgress((s) => s.setSettings);
  if (!hasScriptToggle(id)) return null;
  const t = TOGGLES[id];
  // Saved data from before Arabic existed has no arHarakat; the default is on.
  const current = settings[t.setting] ?? t.options[0].value;
  return (
    <div className="segmented" role="radiogroup" aria-label={t.label}>
      {t.options.map((o) => (
        <label key={o.value} lang={o.lang}>
          <input
            type="radio"
            name={t.setting}
            checked={current === o.value}
            onChange={() => {
              setSettings({ [t.setting]: o.value } as Partial<Settings>);
              track('script_change', { script: o.value });
            }}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
