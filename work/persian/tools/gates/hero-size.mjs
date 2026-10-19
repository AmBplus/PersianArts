// (g) hero-text: measures the TALLEST TEXT LINE, not the tallest decorative blob.
//
// Method: foreground components ("glyphs") that are glyph-sized (<= 40% of the width and <= 30% of the height)
// and ink-dense enough (ink / bbox area >= 0.06, so ring/ellipse strokes and scenery silhouettes drop out) are
// clustered into horizontal lines (>= 50% vertical overlap). A line qualifies when it holds >= 3 glyphs, spans
// <= 95% of the width and is <= 28% of the frame height. heightShare = tallest qualifying line height / frame
// height. blobShare = the OLD metric (tallest foreground blob after a horizontal close) and is reported next
// to it so the difference stays visible in the log.
//
// It still cannot read the text: a tall glyph-free graphic made of many dense small marks could be counted, and
// a one-glyph hero (a single digit alone on screen) is reported through blobShare only, not as a text line.
import { dominant, fgMask, dilateX, components } from './lib.mjs';
export const name = 'hero-text';

// old metric, kept for the diagnostic column
function blobShare(img) {
  const { w, h } = img, bg = dominant(img).rgb, m = dilateX(fgMask(img, bg, 45), w, h, Math.max(1, Math.round(0.012 * w)));
  const { comps } = components(m, w, h, 20);
  let best = null;
  for (const c of comps) {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
    if (bw > 0.95 * w || bw * bh > 0.35 * w * h || bh > 0.6 * h) continue;
    if (!best || bh > best.bh) best = { bh, bw, x0: c.x0, y0: c.y0 };
  }
  return best ? { h: best.bh / h, w: best.bw / w, at: [best.x0 / w, best.y0 / h] } : null;
}

export function checkFrame(img, opt = {}) {
  const { w, h } = img;
  const bg = dominant(img).rgb;
  const m = fgMask(img, bg, opt.thr ?? 45);
  const minN = Math.max(5, Math.round(0.00003 * w * h));
  const { comps } = components(m, w, h, minN);
  const cands = [];
  for (const c of comps) {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
    if (bw > 0.40 * w || bh > 0.30 * h) continue;          // too big to be a glyph / word
    if (bw > 0.95 * w) continue;
    if (c.n / (bw * bh) < 0.06) continue;                   // sparse -> ring / ellipse / wire / scenery
    cands.push({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, bw, bh, n: c.n });
  }
  cands.sort((a, b) => a.y0 - b.y0);
  const lines = [];
  for (const c of cands) {
    let hit = null;
    for (const L of lines) {
      const ov = Math.min(L.y1, c.y1) - Math.max(L.y0, c.y0) + 1;
      if (ov >= 0.5 * Math.min(L.y1 - L.y0 + 1, c.bh)) { hit = L; break; }
    }
    if (!hit) { lines.push({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, n: c.n, count: 1 }); continue; }
    hit.x0 = Math.min(hit.x0, c.x0); hit.y0 = Math.min(hit.y0, c.y0);
    hit.x1 = Math.max(hit.x1, c.x1); hit.y1 = Math.max(hit.y1, c.y1); hit.n += c.n; hit.count++;
  }
  let best = null;
  for (const L of lines) {
    const bw = L.x1 - L.x0 + 1, bh = L.y1 - L.y0 + 1;
    if (L.count < 3) continue;
    if (bw > 0.95 * w || bh > 0.28 * h) continue;
    if (L.n / (bw * bh) < 0.04) continue;
    if (!best || bh > best.bh) best = { bh, bw, x0: L.x0, y0: L.y0, glyphs: L.count };
  }
  const blob = blobShare(img);
  if (!best) return blob ? { heightShare: null, blobShare: blob.h, widthShare: blob.w, at: blob.at, glyphs: 0 } : null;
  return { heightShare: best.bh / h, blobShare: blob ? blob.h : null, widthShare: best.bw / w, at: [best.x0 / w, best.y0 / h], glyphs: best.glyphs };
}
