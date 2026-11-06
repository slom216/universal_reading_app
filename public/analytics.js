/* global location, window, document, localStorage */
/* Polyglot's own cookie banner and GA4 loader, separate from the other DeuLern
   apps. Nothing loads from Google until the visitor accepts. The choice lives in
   localStorage on polyglot.deulern.com and can be changed again from the footer "Cookies"
   link or any [data-consent-open] element. src/lib/track.ts sends events through the
   window.gtag this creates. Styles: .consent in src/styles/globals.css. */
(() => {
  // Off on localhost and previews: keeps dev traffic out of GA and the banner out of tests.
  if (location.hostname !== 'polyglot.deulern.com') return;
  const GA_ID = 'G-ZMEZ0NSJT3';
  const KEY = 'deulern-polyglot-consent';

  function loadGA() {
    if (window.gtag) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function save(v) {
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {
      // Storage blocked: the banner just shows again next visit.
    }
  }

  function decide(ok) {
    save(ok ? 'yes' : 'no');
    document.querySelector('.consent')?.remove();
    if (ok) loadGA();
  }

  function banner() {
    if (document.querySelector('.consent')) return;
    const el = document.createElement('div');
    el.className = 'card consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie notice');
    el.innerHTML =
      '<p class="text-sm">We use Google Analytics to see which languages and levels people ' +
      'read. Nothing is loaded from Google unless you accept.</p><div class="row">' +
      '<button type="button" class="button button--ghost" data-consent="no">Decline</button>' +
      '<button type="button" class="button button--primary" data-consent="yes">Accept</button></div>';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-consent]');
      if (b) decide(b.dataset.consent === 'yes');
    });
    document.body.appendChild(el);
  }

  // Delegated, so the footer link React renders works without wiring.
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('[data-consent-open]')) return;
    e.preventDefault();
    save('');
    banner();
  });

  let choice;
  try {
    choice = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: treat as undecided.
  }
  if (choice === 'yes') loadGA();
  else if (choice !== 'no') banner();
})();
