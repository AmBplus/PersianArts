// (b) empty-band: largest run of rows with no foreground, as a share of frame height.
// A row is empty when <= 0.4% of its pixels deviate from the ROW's median colour by > thr (handles vertical gradients).
//
// PER-RATIO CALIBRATION (G5). A large empty band is normal in a 9:16 centred column and abnormal in a 16:9 wide
// stage, so a single 30% threshold made the same film fail 177/194 frames in 9:16 and only 6/194 in 16:9. The
// baseline below was MEASURED with this same checkFrame() over the five v1 masters (s08..s12, both ratios,
// maxDim 320, every 6th frame; n = 490 sampled frames per ratio):
//     9:16  median-of-medians 0.375  median-of-p90 0.400  worst p90 0.688  absolute max 0.794
//     16:9  median-of-medians 0.289  median-of-p90 0.367  worst p90 0.556  absolute max 0.644
// Thresholds: thr = max(0.30, baseline p90) per ratio; extreme = baseline p90 + 0.30. FAIL when >= 25% of the
// sampled frames exceed thr, or when any single frame exceeds extreme. The row prints both numbers, so a 9:16 and
// a 16:9 verdict are compared on the same footing instead of against one magic 30%.
export const name = 'empty-band';

export const RATIO_BASELINE = {
  '9:16': { films: 5, frames: 490, median: 0.375, p90: 0.400, max: 0.794 },
  '16:9': { films: 5, frames: 490, median: 0.289, p90: 0.367, max: 0.644 },
};

export function ratioOf(w, h) { return h / w > 1.6 ? '9:16' : '16:9'; }

export function calibration(w, h) {
  const ratio = ratioOf(w, h);
  const b = RATIO_BASELINE[ratio];
  return { ratio, baseline: b, thr: Math.max(0.30, b.p90), extreme: b.p90 + 0.30, failFrameShare: 0.25 };
}

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

// Verdict over the sampled frames, using the ratio's own measured baseline.
export function verdict(shares, w, h) {
  const cal = calibration(w, h);
  const n = shares.length;
  if (!n) return { ...cal, n, status: 'N/A', reason: 'no frames inspected' };
  const over = shares.filter((s) => s.share > cal.thr).length;
  const extreme = shares.filter((s) => s.share > cal.extreme).length;
  const worst = shares.reduce((a, b) => (b.share > a.share ? b : a), shares[0]);
  const bad = over / n >= cal.failFrameShare || extreme > 0;
  return {
    ...cal, n, over, extreme, worst,
    status: bad ? 'FAIL' : 'PASS',
    reason: `${over}/${n} frames above thr ${(cal.thr * 100).toFixed(0)}%` +
      (extreme ? `; ${extreme} frame(s) above extreme ${(cal.extreme * 100).toFixed(0)}%` : '') +
      `; worst f${worst.n} ${(worst.share * 100).toFixed(0)}% (y ${(worst.from * 100).toFixed(0)}-${(worst.to * 100).toFixed(0)}%)`,
  };
}
