// Persistent overlay / HUD detector (new gate: overlay-hud).
//
// The s09 v1 masters shipped with a white debug box burned into EVERY frame (the film forced ?debug=2); the old
// suite surfaced it only as a 2-frame 16:9 edge-touch hit. This gate looks for the class of defect directly:
// a rectangular region that is PIXEL-STABLE across the whole film while the rest of the frame changes.
//
// How: every frame is box-averaged into a coarse grid of luma. Across the streamed frames the accumulator keeps
// per-cell mean, mean-of-squares and "near-white in this frame" counts. From that it derives
//   - sd: temporal standard deviation per cell (an overlay cell is frozen, sd ~ 0)
//   - white: share of frames in which the cell was near-white
// A candidate is the largest axis-aligned rectangle of cells that are near-white in >= 85% of frames, at least
// 0.05% and at most 30% of the frame, filled to >= 50%, and whose border jumps by >= 55 luma against the ring
// just outside it. A second, colour-agnostic pass does the same on cells with sd <= 8 and requires the rectangle
// to sit inside the outer 25% band of the frame (HUDs are edge-anchored), so flat backgrounds are not flagged.
//
// What it cannot catch: an overlay that moves, blinks, or changes opacity; a semi-transparent HUD whose border
// contrast stays under 55 luma; a full-frame tint. Those need a reference render, not a statistic.
export const name = 'overlay-hud';

export function createAccum(gw = 160) {
  return {
    gw, gh: 0, n: 0, sum: null, sum2: null, white: null,
    add(img) {
      const { w, h, data } = img;
      if (!this.gh) { this.gh = Math.max(2, Math.round(gw * h / w)); const n = gw * this.gh; this.sum = new Float64Array(n); this.sum2 = new Float64Array(n); this.white = new Uint32Array(n); }
      const { gw: GX, gh: GY } = this;
      for (let gy = 0; gy < GY; gy++) {
        const y0 = Math.floor(gy * h / GY), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * h / GY));
        for (let gx = 0; gx < GX; gx++) {
          const x0 = Math.floor(gx * w / GX), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * w / GX));
          let s = 0, c = 0, wt = 0;
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const i = (y * w + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
            s += 0.299 * r + 0.587 * g + 0.114 * b; c++;
            if (r > 215 && g > 215 && b > 215) wt++;
          }
          const k = gy * GX + gx;
          this.sum[k] += s / c; this.sum2[k] += (s / c) * (s / c); this.white[k] += wt / c >= 0.8 ? 1 : 0;
        }
      }
      this.n++;
      return this;
    },
    stats() {
      const n = this.n || 1, N = this.gw * this.gh;
      const mean = new Float64Array(N), sd = new Float64Array(N), wht = new Float64Array(N);
      for (let k = 0; k < N; k++) {
        const m = this.sum[k] / n;
        mean[k] = m; sd[k] = Math.sqrt(Math.max(0, this.sum2[k] / n - m * m)); wht[k] = this.white[k] / n;
      }
      return { mean, sd, white: wht, frames: this.n, gw: this.gw, gh: this.gh };
    },
  };
}

// largest all-true rectangle in a binary matrix (histogram method)
function largestRect(bin, gw, gh) {
  const hgt = new Int32Array(gw); let best = null;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) hgt[x] = bin[y * gw + x] ? hgt[x] + 1 : 0;
    const st = [];
    for (let x = 0; x <= gw; x++) {
      const cur = x < gw ? hgt[x] : 0;
      while (st.length && hgt[st[st.length - 1]] >= cur) {
        const hh = hgt[st.pop()], x0 = st.length ? st[st.length - 1] + 1 : 0, ww = x - x0;
        if (!best || ww * hh > best.w * best.h) best = { x0, y0: y - hh + 1, w: ww, h: hh };
      }
      st.push(x);
    }
  }
  return best;
}

function evaluate(bin, st, opt) {
  const { gw, gh, mean, sd } = st;
  const r = largestRect(bin, gw, gh);
  if (!r || r.w < 2 || r.h < 2) return null;
  const area = r.w * r.h, total = gw * gh;
  if (area / total < (opt.minArea ?? 0.0005) || area / total > (opt.maxArea ?? 0.30)) return null;
  if (r.w < (opt.minW ?? 0.10) * gw) return null;
  // fill ratio: the white/static cells inside must fill the box
  let inBin = 0;
  for (let y = r.y0; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) if (bin[y * gw + x]) inBin++;
  if (inBin / area < (opt.minFill ?? 0.5)) return null;
  // contrast against the ring just outside the box
  let inSum = 0, inN = 0, outSum = 0, outN = 0;
  for (let y = Math.max(0, r.y0 - 2); y < Math.min(gh, r.y0 + r.h + 2); y++) for (let x = Math.max(0, r.x0 - 2); x < Math.min(gw, r.x0 + r.w + 2); x++) {
    const inside = x >= r.x0 && x < r.x0 + r.w && y >= r.y0 && y < r.y0 + r.h;
    if (inside) { inSum += mean[y * gw + x]; inN++; } else { outSum += mean[y * gw + x]; outN++; }
  }
  const contrast = outN ? Math.abs(inSum / inN - outSum / outN) : 0;
  if (contrast < (opt.minContrast ?? 55)) return null;
  let sdSum = 0;
  for (let y = r.y0; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) sdSum += sd[y * gw + x];
  return { ...r, fill: inBin / area, contrast, sd: sdSum / area, areaShare: area / total, pixelBox: null };
}

export function detect(acc, opt = {}) {
  const st = acc.stats();
  if (st.frames < 8) return { status: 'N/A', reason: `only ${st.frames} frames accumulated; a persistent-overlay test needs the whole film` };
  const { gw, gh, white, sd } = st;
  const N = gw * gh;
  const whiteBin = new Uint8Array(N);
  for (let k = 0; k < N; k++) whiteBin[k] = white[k] >= 0.85 ? 1 : 0;
  const w = evaluate(whiteBin, st, { minContrast: 40, minFill: 0.5, minW: 0.10 });
  if (w) return { status: 'FAIL', kind: 'near-white frozen rectangle', ...w, frames: st.frames, gw, gh };
  // colour-agnostic pass, restricted to the outer band where HUDs live
  const band = opt.band ?? 0.25;
  const flatBin = new Uint8Array(N);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const edge = y < band * gh || y >= (1 - band) * gh || x < band * gw || x >= (1 - band) * gw;
    flatBin[y * gw + x] = edge && sd[y * gw + x] <= 8 ? 1 : 0;
  }
  const f = evaluate(flatBin, st, { minContrast: 70, minFill: 0.75, minW: 0.20, minArea: 0.002 });
  if (f) return { status: 'FAIL', kind: 'frozen high-contrast rectangle (edge-anchored)', ...f, frames: st.frames, gw, gh };
  return { status: 'PASS', reason: `no pixel-stable overlay rectangle in ${st.frames} frames (longest frozen white run below threshold)` };
}
