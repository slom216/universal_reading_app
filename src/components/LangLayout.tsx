import { Suspense, use, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { loadTexts } from '../content';
import { LANGS, isLangId, type LangId } from '../languages';
import { scriptFor } from '../lib/script';
import { LangCtx } from '../lib/useLang';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useProgress } from '../store/progress';

function Loaded({ id }: { id: LangId }) {
  const texts = use(loadTexts(id));
  const settings = useProgress((s) => s.settings);
  const setSettings = useProgress((s) => s.setSettings);
  useEffect(() => setSettings({ lastLang: id }), [id, setSettings]);

  const lang = LANGS[id];
  return (
    <LangCtx value={{ lang, texts, ...scriptFor(id, lang.code, settings) }}>
      <Outlet />
    </LangCtx>
  );
}

/** Route element for `/:lang/*`: loads that language's texts and provides them. */
export function LangLayout() {
  const { lang } = useParams();
  if (!isLangId(lang)) return <NotFoundPage />;
  return (
    <Suspense fallback={<p className="text-muted">Loading texts…</p>}>
      <Loaded id={lang} />
    </Suspense>
  );
}
