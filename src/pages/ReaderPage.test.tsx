import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReadingText } from '../content/schema';
import { LANGS } from '../languages';
import { LangCtx } from '../lib/useLang';
import { ReaderPage } from './ReaderPage';

const text = (id: string): ReadingText => ({
  id,
  level: 'A1',
  title: `Testo ${id}`,
  topic: 'Test',
  body: 'Ciao! Mi chiamo Giulia.',
  glossary: [],
  questions: [],
});

const renderReader = (id: string) =>
  render(
    <LangCtx
      value={{ lang: LANGS.it, texts: [text('a1-01'), text('a1-02')], code: 'it', tr: (s) => s }}
    >
      <MemoryRouter initialEntries={[`/it/text/${id}`]}>
        <Routes>
          <Route path="/it/text/:id" element={<ReaderPage />} />
        </Routes>
      </MemoryRouter>
    </LangCtx>,
  );

describe('ReaderPage audio', () => {
  it('shows a player when the text has narration', () => {
    const { container } = renderReader('a1-01');
    const player = container.querySelector('audio');
    expect(player).toHaveAttribute('aria-label', 'Listen to Testo a1-01');
    expect(player?.getAttribute('src')).toMatch(/a1-01.*\.mp3/);
  });

  it('shows nothing when it has none', () => {
    const { container } = renderReader('a1-02');
    expect(screen.getByRole('heading', { name: 'Testo a1-02' })).toBeInTheDocument();
    expect(container.querySelector('audio')).toBeNull();
  });
});
