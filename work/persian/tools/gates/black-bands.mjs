// Black border bands (new gate: black-bands). Detects uniform near-black rows/columns clinging to the frame
// border: letterboxing, or a render raster larger than its content (the s09 v1 16:9 master carries ~40 px of
// black on the right and bottom INSIDE the 1920x1080 raster).
//
// A border run counts when the row/column mean luma is < 24 and its brightest pixel is < 38, i.e. a genuinely
// flat black strip, not dark artwork. The run is measured from each side of the scaled frame and converted back
// to full-resolution pixels with the scale factor k. FAIL when any side holds >= 2 full-res pixels of band in
// >= 80% of the sampled frames. The frame must be video or stills with a known full size; an all-black frame is
// reported by dead-frames, not here.
import { borderBlackBands } from './lib.mjs';
export const name = 'black-bands';

export function checkFrame(img, opt = {}) {
  const bands = borderBlackBands(img, opt);
  const k = opt.k || 1;
  return bands.map((b) => ({ side: b.side, px: Math.round(b.px / k) }));
}

// frames: Map frame -> img, sortedKeys: sampled frame numbers in order
export function analyse(frames, sorted, opt = {}) {
  const k = opt.k || 1, minPx = opt.minPx ?? 2, need = opt.need ?? 0.8;
  const perSide = new Map(); // side -> {count, maxPx, frame}
  let seen = 0;
  for (const n of sorted) {
    const img = frames.get(n);
    if (!img) continue;
    seen++;
    for (const b of checkFrame(img, { ...opt, k })) {
      if (b.px < minPx) continue;
      const cur = perSide.get(b.side) || { side: b.side, count: 0, maxPx: 0, frame: n };
      cur.count++; if (b.px > cur.maxPx) { cur.maxPx = b.px; cur.frame = n; }
      perSide.set(b.side, cur);
    }
  }
  const firing = [...perSide.values()].filter((s) => s.count / Math.max(1, seen) >= need).sort((a, b) => b.maxPx - a.maxPx);
  return { seen, firing, perSide: [...perSide.values()] };
}
