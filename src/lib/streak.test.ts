import { streaks } from './streak';

describe('streaks', () => {
  it('is zero with no activity', () => {
    expect(streaks([], '2026-09-23')).toEqual({ current: 0, best: 0 });
  });

  it('counts back from today', () => {
    expect(
      streaks(['2026-09-21', '2026-09-22', '2026-09-23'], '2026-09-23').current,
    ).toBe(3);
  });

  it('keeps yesterday’s streak alive until today is over', () => {
    expect(streaks(['2026-09-21', '2026-09-22'], '2026-09-23').current).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(streaks(['2026-09-20', '2026-09-23'], '2026-09-23').current).toBe(1);
  });

  it('finds the best run across month ends', () => {
    const days = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-10'];
    expect(streaks(days, '2026-09-23')).toEqual({ current: 0, best: 4 });
  });
});
