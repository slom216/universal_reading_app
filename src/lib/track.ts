declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 event. window.gtag only exists after the visitor accepts cookies on read.deulern.com
 * (see public/analytics.js), so this does nothing otherwise.
 * Don't name a param `language`: GA4 reads that as the browser-language field.
 */
export function track(name: string, params: Record<string, string | number> = {}) {
  window.gtag?.('event', name, params);
}

/** Reports installs and launches from the home screen. Call once at startup. */
export function trackInstalls() {
  // Chrome, Edge and Samsung Internet; Safari never fires it.
  window.addEventListener('appinstalled', () => track('app_installed'));
  // Safari sets navigator.standalone, the rest match the display-mode query.
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) track('app_launch_installed');
}
