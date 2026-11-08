import { levenshtein, nearest, shuffle } from './distractors';

describe('levenshtein', () => {
  it('counts insertions, deletions and substitutions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('Ciao.', 'Ciao.')).toBe(0);
  });

  it('compares code points, not UTF-16 halves', () => {
    expect(levenshtein('𠀀a', '𠀁a')).toBe(1);
  });
});

describe('nearest', () => {
  const pool = ['Mi scusi.', 'Scusa.', 'Scusi.', 'Grazie.', 'Buonanotte.', '', 'Scusa.', 'Scusi.'];

  it('returns the closest distinct strings, never the target or a blank', () => {
    const got = nearest('Scusa.', pool, 2);
    expect(got).toHaveLength(2);
    expect(got[0]).toBe('Scusi.');
    expect(got).not.toContain('Scusa.');
    expect(got).toContain('Mi scusi.');
  });

  it('returns fewer when the pool runs out', () => {
    expect(nearest('a', ['a', 'b'], 5)).toEqual(['b']);
  });
});

describe('shuffle', () => {
  it('keeps every item and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5];
    expect([...shuffle(input)].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
