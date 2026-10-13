// (b) empty-band: largest run of rows with no foreground, as a share of frame height.
// A row is empty when <= 0.4% of its pixels deviate from the ROW's median colour by > thr (handles vertical gradients).
export const name = 'empty-band';
export function checkFrame(img, opt = {}) {
  const { w, h, data } = img, thr = opt.thr ?? 28, rowTol = Math.max(1, Math.floor(0.004 * w));
  const empty = new Uint8Array(h);
  for (let y = 0; y < h; y++) {
    const ch = [[], [], []];
    for (let x = 0; x < w; x += 2) { const i = (y * w + x) * 3; ch[0].push(data[i]); ch[1].push(data[i + 1]); ch[2].push(data[i + 2]); }
    const med = ch.map((a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
    let dev = 0;
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; if (Math.max(Math.abs(data[i] - med[0]), Math.abs(data[i + 1] - med[1]), Math.abs(data[i + 2] - med[2])) > thr) dev++; }
    empty[y] = dev <= rowTol ? 1 : 0;
  }
  let best = 0, bestAt = 0, run = 0;
  for (let y = 0; y < h; y++) { if (empty[y]) { run++; if (run > best) { best = run; bestAt = y - run + 1; } } else run = 0; }
  return { share: best / h, from: bestAt / h, to: (bestAt + best) / h };
}
