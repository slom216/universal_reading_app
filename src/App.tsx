import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AboutPage } from './pages/AboutPage';
import { LangLayout } from './components/LangLayout';
import { HomePage } from './pages/HomePage';
import { HubPage } from './pages/HubPage';
import { PickerPage } from './pages/PickerPage';
import { LevelPage } from './pages/LevelPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { GapsPage } from './pages/GapsPage';
import { PhrasePracticePage } from './pages/PhrasePracticePage';
import { PhrasebookPage, PhrasesPage } from './pages/PhrasesPage';
import { PlacementPage } from './pages/PlacementPage';
import { PronunciationIndexPage, PronunciationPage } from './pages/PronunciationPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReaderPage } from './pages/ReaderPage';
import { SayIndexPage, SayPage } from './pages/SayPage';
import { SettingsPage } from './pages/SettingsPage';
import { UnscramblePage } from './pages/UnscramblePage';
import { WordsPage } from './pages/WordsPage';
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
          <Route path="phrases/:lang/practice" element={<PhrasePracticePage />} />
          <Route path="say" element={<SayIndexPage />} />
          <Route path="say/:slug" element={<SayPage />} />
          <Route path="pronunciation" element={<PronunciationIndexPage />} />
          <Route path="pronunciation/:lang" element={<PronunciationPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path=":lang" element={<LangLayout />}>
            <Route index element={<HomePage />} />
            <Route path="level/:level" element={<LevelPage />} />
            <Route path="text/:id" element={<ReaderPage />} />
            <Route path="words" element={<WordsPage />} />
            <Route path="gaps" element={<GapsPage />} />
            <Route path="unscramble" element={<UnscramblePage />} />
            <Route path="level-check" element={<PlacementPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
