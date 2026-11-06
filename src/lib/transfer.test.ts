import { exportProgress, importProgress } from './transfer';
import type { ProgressData } from '../store/progress';

const data: ProgressData = {
  results: {
    'it/a1-01': {
      bestScore: 1,
      lastScore: 0.75,
      attempts: 2,
      completedAt: '2026-09-23T10:00:00.000Z',
    },
  },
  activity: { '2026-09-23': 2 },
  settings: { theme: 'dark', fontSize: 'l', isvScript: 'cyrillic', arHarakat: 'off', lastLang: 'ru' },
  recentLangs: ['ru', 'it'],
};

describe('progress transfer', () => {
  it('round-trips an export', () => {
    expect(importProgress(exportProgress(data))).toEqual(data);
  });

  it('rejects files that are not exports', () => {
    expect(() => importProgress('not json')).toThrow(/valid JSON/);
    expect(() => importProgress('{"results": 5}')).toThrow(/not a DeuLern Polyglot/);
  });
});
