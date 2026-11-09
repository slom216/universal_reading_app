import { describe, expect, it } from 'vitest';
import { groupLines, nearestLine } from './ruler';

describe('reading ruler', () => {
  it('merges fragments on one line and keeps lines apart', () => {
    const lines = groupLines([
      { top: 40, bottom: 60 }, // second line, first word
      { top: 0, bottom: 20 },
      { top: 2, bottom: 22 }, // glossary word on the first line, slightly lower
      { top: 41, bottom: 59 },
    ]);
    expect(lines).toEqual([
      { top: 0, bottom: 22 },
      { top: 40, bottom: 60 },
    ]);
  });

  it('picks the closest line', () => {
    const lines = [
      { top: 0, bottom: 20 },
      { top: 40, bottom: 60 },
    ];
    expect(nearestLine(lines, 5)).toBe(0);
    expect(nearestLine(lines, 35)).toBe(1);
  });
});
