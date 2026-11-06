import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PickerPage } from './PickerPage';

const renderPicker = () =>
  render(
    <MemoryRouter>
      <PickerPage />
    </MemoryRouter>,
  );

describe('PickerPage language vote', () => {
  afterEach(() => delete window.gtag);

  it('sends one vote and remembers it', async () => {
    window.gtag = vi.fn();
    renderPicker();
    await userEvent.click(screen.getByRole('button', { name: /Polski/ }));
    expect(window.gtag).toHaveBeenCalledWith('event', 'language_vote', {
      voted_language: 'pl',
    });
    expect(screen.getByRole('button', { name: /Polski/ })).toBeDisabled();

    expect(localStorage.getItem('deulern-polyglot-votes')).toBe('["pl"]');
  });
});
