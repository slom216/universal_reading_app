import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { groupLines, nearestLine, type Line } from '../lib/ruler';

/** Line boxes of the text in `box`, relative to its top; pronunciation guides and open
 *  glossary tips are not lines of the text. */
function measure(box: HTMLElement): Line[] {
  const top = box.getBoundingClientRect().top;
  const range = document.createRange();
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const boxes: Line[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement?.closest('rt, .gloss__tip')) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width) boxes.push({ top: r.top - top, bottom: r.bottom - top });
    }
  }
  return groupLines(boxes);
}

/** Controls that use the arrow keys themselves (quiz radios, text, audio seek). Switches
 *  don't, and focus sits on the ruler's switch right after turning it on. */
const typing = (t: EventTarget | null) =>
  t instanceof Element &&
  Boolean(t.closest('input:not([type=checkbox]), select, textarea, audio, [contenteditable]'));

/**
 * A band over one line of the text, starting on the first. ↓/↑ move it a line at a time
 * and keep it in view; clicking or tapping a line moves it there. Render inside .reading.
 */
export function ReadingRuler() {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [index, setIndex] = useState(0);
  const stepped = useRef(false);

  useLayoutEffect(() => {
    const box = ref.current!.parentElement!;
    const update = () => setLines(measure(box));
    update();
    // Font size, script, web fonts and window width all rewrap the text.
    const resized = new ResizeObserver(update);
    resized.observe(box);
    const changed = new MutationObserver(update);
    changed.observe(box, { childList: true, characterData: true, subtree: true });
    return () => {
      resized.disconnect();
      changed.disconnect();
    };
  }, []);

  useEffect(() => {
    const box = ref.current!.parentElement!;
    const onClick = (e: MouseEvent) =>
      setIndex(nearestLine(lines, e.clientY - box.getBoundingClientRect().top));
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || typing(e.target)) return;
      const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      stepped.current = true;
      setIndex((i) => Math.min(Math.max(i + step, 0), lines.length - 1));
    };
    box.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      box.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [lines]);

  // Scroll only after a key press, so the page doesn't jump when the ruler appears.
  useEffect(() => {
    if (!stepped.current || !ref.current) return;
    stepped.current = false;
    const r = ref.current.getBoundingClientRect();
    if (r.top > innerHeight * 0.15 && r.bottom < innerHeight * 0.7) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Absolute target: Chrome stacks relative smooth scrolls from quick key presses.
    scrollTo({ top: scrollY + r.top - innerHeight * 0.4, behavior: reduce ? 'auto' : 'smooth' });
  }, [index]);

  const line = lines[Math.min(index, lines.length - 1)];
  return (
    <div
      ref={ref}
      className="ruler"
      aria-hidden="true"
      hidden={!line}
      style={line && { top: line.top, height: line.bottom - line.top }}
    />
  );
}
