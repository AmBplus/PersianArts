// (g) hero-size ESTIMATE from pixels: tallest foreground blob (after a horizontal close of 1.2% of width, so digits and
// words merge), excluding scenery (blob wider than 95% of the frame or covering > 35% of its area). Reports height / frame height.
// It cannot tell text from graphics (a tall tree trunk counts), so treat it as an upper-bound estimate, not a measurement.
import { dominant, fgMask, dilateX, components } from './lib.mjs';
export const name = 'hero-size';
export function checkFrame(img, opt = {}) {
  const { w, h } = img, bg = dominant(img).rgb, m = dilateX(fgMask(img, bg, 45), w, h, Math.max(1, Math.round(0.012 * w)));
  const { comps } = components(m, w, h, 20);
  let best = null;
  for (const c of comps) {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
    if (bw > 0.95 * w || bw * bh > 0.35 * w * h || bh > 0.6 * h) continue;
    if (!best || bh > best.bh) best = { bh, bw, x0: c.x0, y0: c.y0 };
  }
  return best ? { heightShare: best.bh / h, widthShare: best.bw / w, at: [best.x0 / w, best.y0 / h] } : null;
}
