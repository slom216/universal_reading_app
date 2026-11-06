import { useProgress } from './progress';

test('openedText moves a language to the front of recentLangs', () => {
  const { openedText } = useProgress.getState();
  openedText('fr');
  openedText('ru');
  openedText('fr');
  expect(useProgress.getState().recentLangs).toEqual(['fr', 'ru']);
});
