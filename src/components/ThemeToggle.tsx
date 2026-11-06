import { useSyncExternalStore } from 'react';
import { useProgress } from '../store/progress';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia?.(DARK_QUERY);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/**
 * Header shortcut for the theme, as on the other DeuLern apps. Settings keeps the full
 * System / Light / Dark control; this flips between the two explicit themes, so a reader
 * on "System" lands on the opposite of what the OS currently shows rather than a no-op.
 */
export function ThemeToggle() {
  const theme = useProgress((s) => s.settings.theme);
  const setSettings = useProgress((s) => s.setSettings);
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(DARK_QUERY).matches ?? false,
    () => false,
  );

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  const next = isDark ? 'light' : 'dark';
  const label = `Switch to the ${next} theme`;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setSettings({ theme: next })}
      aria-label={label}
      title={label}
    >
      {/* One stateless half-disc in both themes, like deulern.com. */}
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
      </svg>
    </button>
  );
}
