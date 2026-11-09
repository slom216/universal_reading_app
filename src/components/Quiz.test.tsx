import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Question } from '../content/schema';
import { Quiz } from './Quiz';

const questions: Question[] = [
  { type: 'mc', prompt: 'Quanti anni?', options: ['1', '2', '3', '4'], answer: 2 },
  { type: 'tf', prompt: 'È vero?', answer: false, explanation: 'No.' },
];

const renderQuiz = (onComplete = vi.fn()) =>
  render(
    <MemoryRouter>
      <Quiz
        questions={questions}
        onComplete={onComplete}
        next={{ to: '/it/text/a1-02', label: 'Next text' }}
        labels={{ trueLabel: 'Vero', falseLabel: 'Falso', perfect: 'Perfetto! 🎉' }}
        code="it"
      />
    </MemoryRouter>,
  );

describe('Quiz', () => {
  it('scores the answers and shows corrections', async () => {
    const onComplete = vi.fn();
    renderQuiz(onComplete);
    const check = screen.getByRole('button', { name: 'Check answers' });
    expect(check).toBeDisabled();

    await userEvent.click(screen.getByLabelText('3'));
    await userEvent.click(screen.getByLabelText('Vero'));
    await userEvent.click(check);

    expect(onComplete).toHaveBeenCalledWith(0.5);
    expect(screen.getByText('1 / 2 correct')).toBeInTheDocument();
    expect(screen.getByText(/Correct answer: Falso\./)).toBeInTheDocument();
    expect(screen.getByText('No.')).toBeInTheDocument();
  });

  it('congratulates and offers the next text on a perfect score', async () => {
    renderQuiz();
    await userEvent.click(screen.getByLabelText('3'));
    await userEvent.click(screen.getByLabelText('Falso'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));

    expect(screen.getByText(/Perfetto/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next text' })).toHaveAttribute(
      'href',
      '/it/text/a1-02',
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('links the share button to the score', async () => {
    render(
      <MemoryRouter>
        <Quiz
          questions={questions}
          onComplete={vi.fn()}
          next={{ to: '/it/text/a1-02', label: 'Next text' }}
          labels={{ trueLabel: 'Vero', falseLabel: 'Falso', perfect: 'Perfetto!' }}
          code="it"
          shareOnX={{ href: (c, t) => `https://x.test/?s=${c}/${t}` }}
        />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByLabelText('3'));
    await userEvent.click(screen.getByLabelText('Falso'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));

    expect(screen.getByRole('link', { name: 'Share on X' })).toHaveAttribute(
      'href',
      'https://x.test/?s=2/2',
    );
  });

  it('opens the result as a popup that closes back to the card', async () => {
    renderQuiz();
    await userEvent.click(screen.getByLabelText('3'));
    await userEvent.click(screen.getByLabelText('Falso'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));

    expect(screen.getByRole('dialog', { name: 'Your result' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Perfetto/)).toBeInTheDocument();
  });
});
