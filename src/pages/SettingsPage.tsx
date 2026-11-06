import { useState } from 'react';
import { ScriptToggle } from '../components/ScriptToggle';
import { LANGS } from '../languages';
import { toCyrillic } from '../lib/isvCyrillic';
import { exportProgress, importProgress } from '../lib/transfer';
import { dayKey } from '../lib/dates';
import { useProgress, type Settings } from '../store/progress';

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const SIZES: { value: Settings['fontSize']; label: string }[] = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
];

export function SettingsPage() {
  const state = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const { lastLang, isvScript } = state.settings;
  const sampleLang = LANGS[lastLang ?? 'it'];
  const cyrillic = sampleLang.id === 'isv' && isvScript === 'cyrillic';

  const download = () => {
    const blob = new Blob([exportProgress(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deulern-polyglot-progress-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = importProgress(await file.text());
      if (!confirm('Replace your current progress with this file?')) return;
      state.replaceAll(data);
      setMessage('Progress imported.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <div className="stack">
      <h1>Settings</h1>

      <section className="card stack stack--tight">
        <h2>Theme</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <label key={t.value}>
              <input
                type="radio"
                name="theme"
                checked={state.settings.theme === t.value}
                onChange={() => state.setSettings({ theme: t.value })}
              />
              {t.label}
            </label>
          ))}
        </div>
      </section>

      <section className="card stack stack--tight">
        <h2>Reading text size</h2>
        <div className="segmented" role="radiogroup" aria-label="Reading text size">
          {SIZES.map((s) => (
            <label key={s.value}>
              <input
                type="radio"
                name="font"
                checked={state.settings.fontSize === s.value}
                onChange={() => state.setSettings({ fontSize: s.value })}
              />
              {s.label}
            </label>
          ))}
        </div>
        <p
          className="reading"
          data-font={state.settings.fontSize}
          lang={cyrillic ? 'isv-Cyrl' : sampleLang.code}
        >
          {cyrillic ? toCyrillic(sampleLang.sample) : sampleLang.sample}
        </p>
      </section>

      <section className="card stack stack--tight">
        <h2>Interslavic script</h2>
        <p className="text-muted">
          Interslavic texts are written in Latin letters. Pick Cyrillic to read them in
          the standard Cyrillic alphabet instead.
        </p>
        <ScriptToggle />
      </section>

      <section className="card stack stack--tight">
        <h2>Your data</h2>
        <p className="text-muted">
          Progress is stored only in this browser. Download a backup to move it to another
          device.
        </p>
        <div className="row">
          <button type="button" className="button button--secondary" onClick={download}>
            Download progress
          </button>
          <label className="button button--secondary">
            Import progress
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            className="button button--danger"
            onClick={() => {
              if (confirm('Delete all reading progress? This cannot be undone.')) {
                state.reset();
                setMessage('Progress reset.');
              }
            }}
          >
            Reset progress
          </button>
        </div>
        {message && <p role="status">{message}</p>}
      </section>
    </div>
  );
}
