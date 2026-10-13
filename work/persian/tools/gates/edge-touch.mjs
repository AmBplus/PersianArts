// (a) edge-touch: text-sized foreground blobs that touch the outer margin of the frame (clipped numbers/words).
// Heuristic: foreground = pixels far from the frame's dominant background colour; blobs wider/taller than
// 35% of the frame are treated as backgrounds/scenery and ignored. Small decorative shapes cut by the edge also flag.
import { dominant, fgMask, components } from './lib.mjs';
export const name = 'edge-touch';
export function checkFrame(img, opt = {}) {
  const { w, h } = img, k = opt.k || 1;
  const m = Math.max(1, Math.round((opt.marginPx ?? 6) * k));
  const bg = dominant(img).rgb, mask = fgMask(img, bg, opt.thr ?? 45);
  const { comps } = components(mask, w, h, 8);
  const hits = [];
  for (const c of comps) {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
    if (bw > 0.35 * w || bh > 0.35 * h || c.n < Math.max(30, 0.0015 * w * h) || Math.max(bw / w, bh / h) < 0.04) continue;
    const sides = [];
    if (c.x0 < m) sides.push('left'); if (c.x1 >= w - m) sides.push('right');
    if (c.y0 < m) sides.push('top'); if (c.y1 >= h - m) sides.push('bottom');
    if (sides.length) hits.push({ sides: sides.join('+'), bbox: [c.x0, c.y0, c.x1, c.y1].map((v) => Math.round(v / k)), px: Math.round(c.n / (k * k)) });
  }
  return hits;
}
