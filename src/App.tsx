import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LangLayout } from './components/LangLayout';
import { HomePage } from './pages/HomePage';
import { HubPage } from './pages/HubPage';
import { PickerPage } from './pages/PickerPage';
import { LevelPage } from './pages/LevelPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PhrasebookPage, PhrasesPage } from './pages/PhrasesPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { useProgress } from './store/progress';

export function App() {
  const theme = useProgress((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HubPage />} />
          <Route path="reading" element={<PickerPage />} />
          <Route path="phrases" element={<PhrasebookPage />} />
          <Route path="phrases/:lang" element={<PhrasesPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path=":lang" element={<LangLayout />}>
            <Route index element={<HomePage />} />
            <Route path="level/:level" element={<LevelPage />} />
            <Route path="text/:id" element={<ReaderPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
