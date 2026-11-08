import { Suspense, use, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { loadTexts } from '../content';
import { LANGS, isLangId, type LangId } from '../languages';
import { useScript } from '../lib/script';
import { LangCtx } from '../lib/useLang';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useProgress } from '../store/progress';

function Loaded({ id }: { id: LangId }) {
  const texts = use(loadTexts(id));
  const setSettings = useProgress((s) => s.setSettings);
  useEffect(() => setSettings({ lastLang: id }), [id, setSettings]);

  const lang = LANGS[id];
  const script = useScript(id, lang.code);
  return (
    <LangCtx value={{ lang, texts, ...script }}>
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
