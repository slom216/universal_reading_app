import { track } from '../lib/track';
import { useProgress, type Settings } from '../store/progress';

const SCRIPTS: { value: Settings['isvScript']; label: string; lang: string }[] = [
  { value: 'latin', label: 'Latinica', lang: 'isv' },
  { value: 'cyrillic', label: 'Кирилица', lang: 'isv-Cyrl' },
];

/** Interslavic script switch, shown in the reader and on the settings page. */
export function ScriptToggle() {
  const script = useProgress((s) => s.settings.isvScript);
  const setSettings = useProgress((s) => s.setSettings);
  return (
    <div className="segmented" role="radiogroup" aria-label="Interslavic script">
      {SCRIPTS.map((s) => (
        <label key={s.value} lang={s.lang}>
          <input
            type="radio"
            name="isv-script"
            checked={script === s.value}
            onChange={() => {
              setSettings({ isvScript: s.value });
              track('script_change', { script: s.value });
            }}
          />
          {s.label}
        </label>
      ))}
    </div>
  );
}
