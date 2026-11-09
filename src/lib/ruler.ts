export type Line = { top: number; bottom: number };

/** Groups text fragment boxes into lines: boxes that overlap vertically share a line. */
export function groupLines(boxes: Line[]): Line[] {
  const lines: Line[] = [];
  for (const b of boxes) {
    const same = lines.find((l) => b.top < l.bottom && b.bottom > l.top);
    if (same) {
      same.top = Math.min(same.top, b.top);
      same.bottom = Math.max(same.bottom, b.bottom);
    } else {
      lines.push({ ...b });
    }
  }
  return lines.sort((a, b) => a.top - b.top);
}

/** Index of the line whose middle is closest to y. */
export function nearestLine(lines: Line[], y: number): number {
  const dist = (l: Line) => Math.abs((l.top + l.bottom) / 2 - y);
  let best = 0;
  lines.forEach((l, i) => {
    if (dist(l) < dist(lines[best]!)) best = i;
  });
  return best;
}
