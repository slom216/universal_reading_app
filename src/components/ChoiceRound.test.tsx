import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChoiceRound } from './ChoiceRound';

const items = [
  { q: 'uno', a: 'one' },
  { q: 'dos', a: 'two' },
];

test('a round scores the answers and offers the missed ones again', async () => {
  const user = userEvent.setup();
  const onAnswer = vi.fn();
  const onFinish = vi.fn();
  render(
    <MemoryRouter>
      <ChoiceRound
        items={items}
        label="word"
        prompt={(i) => i.q}
        answer={(i) => i.a}
        options={(i) => ['one', 'two'].filter((o) => o !== i.a)}
        renderOption={(o) => o}
        optionLang="en"
        onAnswer={(i, right) => onAnswer(i.q, right)}
        onFinish={onFinish}
        exit={{ to: '/', label: 'Back' }}
        onRestart={vi.fn()}
      />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('button', { name: 'one' })); // uno: right
  await user.click(screen.getByRole('button', { name: 'Next word →' }));
  await user.click(screen.getByRole('button', { name: 'one' })); // dos: wrong
  expect(onAnswer.mock.calls).toEqual([
    ['uno', true],
    ['dos', false],
  ]);
  expect(onFinish).toHaveBeenCalledWith(0.5);

  await user.click(screen.getByRole('button', { name: 'See score' }));
  expect(screen.getByText('1 / 2 correct')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Retry the 1 you missed' }));
  expect(screen.getByText('dos')).toBeInTheDocument();
  expect(screen.getByText(/Question 1 of 1/)).toBeInTheDocument();
});
