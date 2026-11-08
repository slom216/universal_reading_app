import { useProgress } from './progress';

test('openedText moves a language to the front of recentLangs', () => {
  const { openedText } = useProgress.getState();
  openedText('fr');
  openedText('ru');
  openedText('fr');
  expect(useProgress.getState().recentLangs).toEqual(['fr', 'ru']);
});

test('reviewed moves a word up a box when right and back to the first when wrong', () => {
  const { reviewed } = useProgress.getState();
  const now = new Date(2026, 10, 8);
  reviewed('es/el piso', true, now);
  reviewed('es/el piso', true, now);
  expect(useProgress.getState().words['es/el piso']).toEqual({
    box: 2,
    due: '2026-11-11',
  });
  reviewed('es/el piso', false, now);
  expect(useProgress.getState().words['es/el piso']).toEqual({
    box: 0,
    due: '2026-11-08',
  });
});
