// craft-common.mjs: shared pixel primitives for the CRAFT gates (C3 text-collision, C4 text-envelope,
// C6 material-flatness, C7 light-model, C8 hud-anchor). Node only, no dependency, same style as lib.mjs.
//
// The one idea all of them share: LIVE TEXT is a set of THIN, locally high-contrast strokes clustered into
// horizontal lines. Scenery, panels, bands, gradients and flat fills are either thick, or low-contrast, or not
// line-clustered — so a "text line" here means: thin strokes, signed contrast against the LOCAL mean (so white
// text on dark and dark text on light are both found), clustered into a row with >= minGlyphs marks.
import { components } from './lib.mjs';

export function lumaOf(img) {
  const { w, h, data } = img, L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  return L;
}

// separable box blur (pass 1 horizontal, pass 2 vertical)
export function boxBlur(src, w, h, r) {
  const t = new Float32Array(w * h), o = new Float32Array(w * h);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      t[y * w + x] = s / n;
      s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      o[y * w + x] = s / n;
      s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
    }
  }
  return o;
}

// erode n times with the 4-neighbourhood (a stroke of thickness <= 2n disappears)
export function erode(mask, w, h, n = 2) {
  let m = mask;
  for (let it = 0; it < n; it++) {
    const o = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!m[i]) continue;
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && m[i - 1] && m[i + 1] && m[i - w] && m[i + w]) o[i] = 1;
    }
    m = o;
  }
  return m;
}

// Thin-stroke ink mask for one polarity. `dark`: ink is darker than its local mean; else lighter.
export function inkMask(img, polarity, opt = {}) {
  const { w, h } = img, L = lumaOf(img);
  const r = opt.blurR ?? Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const M = boxBlur(L, w, h, r);
  const thr = opt.thr ?? 20;
  const t = typeof thr === 'object' ? (polarity === 'dark' ? thr.dark : thr.light) : thr;
  const raw = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) raw[i] = polarity === 'dark' ? (L[i] < M[i] - t ? 1 : 0) : (L[i] > M[i] + t ? 1 : 0);
  // opt.erode > 0 additionally drops thick shapes by erosion (off by default: a bold display glyph is thick but
  // is still text; big panels and bands are rejected by component GEOMETRY in textLines instead).
  let out = raw;
  if (opt.erode) {
    const thick = erode(raw, w, h, opt.erode);
    out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = raw[i] && !thick[i] ? 1 : 0;
  }
  return { mask: out, L, M, raw };
}

// Ground value under a mask: mean of the NON-ink pixels around each ink pixel.
export function groundUnder(img, mask, L, opt = {}) {
  const { w, h } = img;
  const r = opt.groundR ?? Math.max(3, Math.round(Math.min(w, h) * 0.012));
  const ink = Float32Array.from(mask);
  const gNum = new Float32Array(w * h), keep = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { gNum[i] = ink[i] ? 0 : L[i]; keep[i] = ink[i] ? 0 : 1; }
  const a = boxBlur(gNum, w, h, r), b = boxBlur(keep, w, h, r);
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = b[i] > 0.02 ? a[i] / b[i] : L[i];
  return g;
}

// Cluster thin-stroke GLYPH marks into horizontal text lines. A mark must be glyph-sized; a line is accepted only
// when its marks agree on height (real text has one x-height) and its ground is smooth (text sits on a field, not
// on a striped band or a sunburst). Returns lines sorted by y, each with the diagnostics the report cites.
export function textLines(img, opt = {}) {
  const { w, h } = img;
  const minN = opt.minN ?? Math.max(6, Math.round(0.00004 * w * h));
  const out = [];
  for (const polarity of ['dark', 'light']) {
    const { mask, L } = inkMask(img, polarity, opt);
    const ground = groundUnder(img, mask, L, opt);
    const { comps } = components(mask, w, h, minN);
    const marks = [];
    for (const c of comps) {
      const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
      if (bw > 0.30 * w || bh > 0.11 * h) continue;                 // glyph-sized only: not a card, band, ray or panel
      if (bh < 0.006 * h) continue;
      const fill = c.n / (bw * bh);
      if (fill < (opt.minFill ?? 0.14)) continue;                    // sparse -> hairline / ray
      if (bw / bh > 5) continue;                                     // long flat slabs (stripes, rules) are not glyphs
      marks.push({ ...c, bh, bw, cx: (c.x0 + c.x1) / 2, cy: (c.y0 + c.y1) / 2 });
    }
    // union marks into lines: same row, similar height, no big horizontal gap
    marks.sort((a, b) => a.cx - b.cx);
    const lines = [];
    for (const m of marks) {
      let best = null, bestGap = Infinity;
      for (const Ln of lines) {
        if (Math.abs(Ln.cy - m.cy) > 0.6 * Ln.mh) continue;
        const hr = Math.max(Ln.mh, m.bh) / Math.min(Ln.mh, m.bh);
        if (hr > 1.8) continue;
        const gapX = Math.max(0, Math.max(Ln.x0, m.x0) - Math.min(Ln.x1, m.x1)) - 1;
        if (gapX > 2.2 * Ln.mh) continue;
        if (gapX < bestGap) { bestGap = gapX; best = Ln; }
      }
      if (!best) { lines.push({ x0: m.x0, y0: m.y0, x1: m.x1, y1: m.y1, n: m.n, marks: 1, polarity, mh: m.bh, hs: [m.bh], widths: [m.bw], cys: [m.cy], cy: m.cy }); continue; }
      best.x0 = Math.min(best.x0, m.x0); best.y0 = Math.min(best.y0, m.y0);
      best.x1 = Math.max(best.x1, m.x1); best.y1 = Math.max(best.y1, m.y1);
      best.n += m.n; best.marks++; best.hs.push(m.bh); best.widths.push(m.bw); best.cys.push(m.cy);
      best.cy = best.cys.reduce((a, b) => a + b, 0) / best.cys.length;
      best.mh = best.hs.slice().sort((a, b) => a - b)[best.hs.length >> 1];
    }
    for (const l of lines) {
      const bh = l.y1 - l.y0 + 1, bw = l.x1 - l.x0 + 1;
      if (l.marks < (opt.minMarks ?? 3)) continue;
      if (bh > 1.9 * l.mh || bw > 0.62 * w || bw < 0.02 * w) continue;
      const hs = l.hs.slice().sort((a, b) => a - b);
      const cv = hs[hs.length >> 1] ? (hs[hs.length - 1] - hs[0]) / hs[hs.length >> 1] : 1;
      if (cv > (opt.maxHeightCv ?? 0.75)) continue;                  // one x-height, not a mixed-size band
      const coverage = l.widths.reduce((a, b) => a + b, 0) / bw;
      if (coverage < (opt.minCoverage ?? 0.22)) continue;            // glyphs must span the line box, not one blob
      // ground smoothness across the line box: text sits on a field, not on a striped band / sunburst
      let gs = 0, gn = 0, gs2 = 0;
      for (let y = l.y0; y <= l.y1; y++) for (let x = l.x0; x <= l.x1; x++) { const g = ground[y * w + x]; gs += g; gs2 += g * g; gn++; }
      const gm = gs / Math.max(1, gn);
      const groundSd = Math.sqrt(Math.max(0, gs2 / Math.max(1, gn) - gm * gm));
      l.bh = bh; l.bw = bw; l.heightShare = bh / h; l.widthShare = bw / w;
      l.fill = l.n / Math.max(1, bh * bw); l.coverage = coverage; l.heightCv = cv; l.groundSd = groundSd; l.groundMean = gm;
      delete l.hs; delete l.widths; delete l.cys;
      out.push(l);
    }
  }
  out.sort((a, b) => a.y0 - b.y0);
  return { lines: out, w, h };
}

// The line's own ink value against the surface it is drawn on: a text block whose ink equals its ground for a
// large share of its box is invisible there (the s09 headline crossing the white certificate).
export function lineVisibility(img, line, opt = {}) {
  const { w } = img;
  const { mask, L } = inkMask(img, line.polarity, opt);
  const g = groundUnder(img, mask, L, opt);
  const inkOf = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) {
    const x = i % w, y = (i / w) | 0;
    if (x >= line.x0 && x <= line.x1 && y >= line.y0 && y <= line.y1) inkOf.push(L[i]);
  }
  if (inkOf.length < (opt.minInkPx ?? 25)) return { ink: inkOf.length, inkLuma: null, mergeShare: 1, inkSd: 0 };
  inkOf.sort((a, b) => a - b);
  const inkLuma = inkOf[inkOf.length >> 1];
  const mean = inkOf.reduce((a, b) => a + b, 0) / inkOf.length;
  const inkSd = Math.sqrt(inkOf.reduce((a, b) => a + (b - mean) ** 2, 0) / inkOf.length);
  let over = 0, n = 0;
  for (let y = line.y0; y <= line.y1; y++) for (let x = line.x0; x <= line.x1; x++) { n++; if (Math.abs(g[y * w + x] - inkLuma) <= (opt.mergeTol ?? 25)) over++; }
  return { ink: inkOf.length, inkLuma: Math.round(inkLuma), inkSd: Math.round(inkSd), mergeShare: over / Math.max(1, n) };
}

// Ink-ground contrast per line: mean |ink - ground| plus the share of the line's ink that has collapsed.
export function lineContrast(img, line, opt = {}) {
  const { w } = img;
  const m = new Uint8Array(w * img.h);
  for (let y = line.y0; y <= line.y1; y++) for (let x = line.x0; x <= line.x1; x++) m[y * w + x] = 1;
  const { mask, L } = inkMask(img, line.polarity, opt);
  const g = groundUnder(img, mask, L, opt);
  const use = new Uint8Array(w * img.h);
  for (let i = 0; i < mask.length; i++) use[i] = mask[i] && m[i] ? 1 : 0;
  let n = 0, sum = 0, collapsed = 0;
  for (let i = 0; i < use.length; i++) if (use[i]) { const d = Math.abs(L[i] - g[i]); sum += d; n++; if (d < (opt.collapseThr ?? 25)) collapsed++; }
  return n ? { ink: n, meanContrast: sum / n, collapseShare: collapsed / n } : { ink: 0, meanContrast: 0, collapseShare: 1 };
}

// Quantised-colour connected components: large regions of ONE colour. Returns the biggest first.
export function flatRegions(img, opt = {}) {
  const { w, h, data } = img;
  const minShare = opt.minShare ?? 0.02;
  const lab = new Int32Array(w * h).fill(-1);
  const key = new Int32Array(w * h);
  const q = opt.bits ?? 5; // 5 bits per channel: two colours within 8/255 of each other share a bin
  const sh = 8 - q;
  for (let i = 0; i < w * h; i++) key[i] = ((data[i * 3] >> sh) << (2 * q)) | ((data[i * 3 + 1] >> sh) << q) | (data[i * 3 + 2] >> sh);
  const out = [];
  const stack = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (lab[s] >= 0) continue;
    const k = key[s], id = out.length;
    let sp = 0; stack[sp++] = s; lab[s] = id;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    let sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0;
    while (sp) {
      const p = stack[--sp], x = p % w, y = (p / w) | 0;
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const r = data[p * 3], g2 = data[p * 3 + 1], b = data[p * 3 + 2];
      sr += r; sg += g2; sb += b; const l = 0.299 * r + 0.587 * g2 + 0.114 * b; sl += l; sl2 += l * l;
      if (x > 0 && lab[p - 1] < 0 && key[p - 1] === k) { lab[p - 1] = id; stack[sp++] = p - 1; }
      if (x < w - 1 && lab[p + 1] < 0 && key[p + 1] === k) { lab[p + 1] = id; stack[sp++] = p + 1; }
      if (y > 0 && lab[p - w] < 0 && key[p - w] === k) { lab[p - w] = id; stack[sp++] = p - w; }
      if (y < h - 1 && lab[p + w] < 0 && key[p + w] === k) { lab[p + w] = id; stack[sp++] = p + w; }
    }
    const share = n / (w * h);
    if (share < minShare) continue;
    const mean = sl / n;
    out.push({
      x0, y0, x1, y1, n, share, rgb: [sr / n, sg / n, sb / n].map(Math.round), lumaSd: Math.sqrt(Math.max(0, sl2 / n - mean * mean)),
      border: x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1,
    });
  }
  out.sort((a, b) => b.share - a.share);
  // merge adjacent same-key boxes that were split by the scan order is unnecessary: components are exact.
  return out;
}
