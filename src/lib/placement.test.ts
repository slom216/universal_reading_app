import { placedLevel } from './placement';

test('starts at the first level not passed (6 of 8), else the top', () => {
  expect(placedLevel({ A1: 5, A2: 8, B1: 8 })).toBe('A1');
  expect(placedLevel({ A1: 6, A2: 3, B1: 0 })).toBe('A2');
  expect(placedLevel({ A1: 8, A2: 7, B1: 2 })).toBe('B1');
  expect(placedLevel({ A1: 8, A2: 8, B1: 8 })).toBe('B1');
});
