// C3 text-collision (pixel): live text printed over live text / text made unreadable by the ground it lands on.
//
// Detection. Text = clusters of THIN, locally high-contrast GLYPH marks (glyph-sized, one x-height, ground smooth)
// split by polarity, so a dark certificate line and a white headline are two different layers. A frame FAILs when
//   (a) ink-equals-ground — >= 30% of a text line's box has ground luma within 25 of the line's own ink luma, i.e.
//       the words disappear into the surface they were printed on (the s09 headline crossing the white certificate); or
//   (b) two-text-layers-overlap — a dark line and a light line overlap by >= 30% of the smaller box AND their glyph
//       heights differ by >= 1.5x (so one glyph run with an outline/shadow copy is not mistaken for two layers).
//
// Thresholds are calibrated on the audit's own frames; see CRAFT-GATES.md.
// WHAT IT CANNOT SEE: a collision between two SAME-polarity lines (they read as one line), a line with fewer than 3
// glyph marks, a line whose ink is a multi-value gradient (inkSd > 30 is rejected); text hidden by a translucent
// scrim (the ground is the scrim, not the text behind it); and it never reads the words, so it proves two layers
// share pixels, not that the copy collides in meaning. A legitimately low-contrast caption (design choice) can fire
// (a): the row names the frame so a human decides.
import { textLines, lineContrast, lineVisibility, inkMask, flatRegions, groundUnder } from './craft-common.mjs';
import { components } from './lib.mjs';
export const name = 'text-collision';
export const threshold = {
  mergeShare: 0.30, mergeTol: 25,     // (a) ink value == ground value over this share of the line box
  overlapShare: 0.30, heightRatio: 1.5, // (b) two opposite-polarity layers sharing pixels
  minMarks: 3, minContrast: 45, maxGroundSd: 26, minInkPx: 60,
  mixedRange: 80, minSep: 60, maxInkSd: 30, mixedGroundSd: 30, mixedSideShare: 0.15, // (d) one ink value over a two-surface ground: see the (d) comment
  brightLuma: 190, brightSd: 14, brightMinShare: 0.005, brightMinBoxShare: 0.10, lostRatio: 0.35, cardMinShare: 0.02, // (c)
};

export function checkFrame(img, opt = {}) {
  const th = { ...threshold, ...opt };
  const base = { thr: { dark: 20, light: 13 }, ...opt };
  const { lines } = textLines(img, base);
  const loose = textLines(img, { ...base, minMarks: 2 });       // 2-mark runs: a big display word can be 2 strokes
  const kept = [];
  for (const L of lines) {
    if (L.marks < th.minMarks) continue;
    if (L.groundSd > th.maxGroundSd) continue;                 // text over a striped/burst ground: out of scope here
    const c = lineContrast(img, L, opt);
    if (c.ink < th.minInkPx || c.meanContrast < th.minContrast) continue;
    kept.push({ ...L, meanContrast: Math.round(c.meanContrast) });
  }
  const hits = [];
  for (const L of kept) {
    const v = lineVisibility(img, L, { ...opt, mergeTol: th.mergeTol, minInkPx: th.minInkPx });
    L.mergeShare = +v.mergeShare.toFixed(2); L.inkLuma = v.inkLuma; L.inkSd = v.inkSd;
    if (v.inkSd <= 30 && v.mergeShare >= th.mergeShare) {
      hits.push({ kind: 'ink-equals-ground', polarity: L.polarity, box: [L.x0, L.y0, L.x1, L.y1], marks: L.marks, mergeShare: +v.mergeShare.toFixed(2), inkLuma: v.inkLuma, groundMean: Math.round(L.groundMean), heightShare: +L.heightShare.toFixed(3) });
    }
  }
  for (let i = 0; i < kept.length; i++) for (let j = i + 1; j < kept.length; j++) {
    const A = kept[i], B = kept[j];
    if (A.polarity === B.polarity) continue;
    const ix = Math.max(0, Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) + 1);
    const iy = Math.max(0, Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) + 1);
    if (!ix || !iy) continue;
    const small = Math.min(A.bw * A.bh, B.bw * B.bh);
    const share = (ix * iy) / small;
    const hr = Math.max(A.mh, B.mh) / Math.min(A.mh, B.mh);
    if (share >= th.overlapShare && hr >= th.heightRatio) {
      hits.push({ kind: 'two-text-layers-overlap', overlapShare: +share.toFixed(2), heightRatio: +hr.toFixed(2), a: { p: A.polarity, box: [A.x0, A.y0, A.x1, A.y1], marks: A.marks }, b: { p: B.polarity, box: [B.x0, B.y0, B.x1, B.y1], marks: B.marks } });
    }
  }
  // (d) MIXED-GROUND COLLISION - the s09 16:9 end card, and the reason rules (a)-(c) alone miss it. The headline's
  // second line sits half on the dark blue sunburst and half on the white certificate. Its ink is ONE value (white);
  // the ground under its own box straddles TWO surfaces (ground p90-p10 >= 80). Where the ink matches the ground it
  // vanishes (|ink-ground| <= 25); where it does not, it is perfectly readable (>= 60 apart). That is the physical
  // signature of live text printed across another live surface, and it needs no bright-card assumption, so it also
  // catches a headline crossing grey faculty names or a jar's lid.
  // Measured evidence (960x540): light box=[446,107,721,178] inkLuma 236, ground p10 20 / p90 242 -> dLo 216,
  // dHi 6 -> HIT. The clean s10 end card's ISO row over the orange band has both distances > 25 -> silent.
  const w = img.w;
  for (const L of lines) {
    if (L.marks < th.minMarks) continue;
    if (hits.some((h) => h.box && h.box[0] === L.x0 && h.box[1] === L.y0)) continue;
    const c = lineContrast(img, L, opt);
    if (c.ink < th.minInkPx || c.meanContrast < th.minContrast) continue;
    const v = lineVisibility(img, L, { ...opt, mergeTol: th.mergeTol, minInkPx: th.minInkPx });
    if (v.inkLuma == null || v.inkSd > th.maxInkSd) continue;
    const { mask, L: lum } = inkMask(img, L.polarity, base);   // 3rd arg of groundUnder() is the LUMA ARRAY, not the line
    const g = groundUnder(img, mask, lum, opt);
    const gs = [];
    for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) gs.push(g[y * w + x]);
    if (gs.length < 200) continue;
    if (L.groundSd < th.mixedGroundSd) continue;   // a genuinely two-surface ground is not smooth
    gs.sort((a, b) => a - b);
    // Split the box's own ground into its two value populations and take each population's MEDIAN. A median is not
    // dragged by a thin tail the way a p90 is: on the s09 card the bright population's median is 242, its p90 only 205.
    const gMid = (gs[Math.floor(0.10 * gs.length)] + gs[Math.floor(0.90 * gs.length)]) / 2;
    const lowPop = gs.filter((v) => v <= gMid), highPop = gs.filter((v) => v > gMid);
    if (!lowPop.length || !highPop.length) continue;
    const gLo = lowPop[lowPop.length >> 1], gHi = highPop[highPop.length >> 1];
    if (gHi - gLo < th.mixedRange) continue;
    if (Math.min(lowPop.length, highPop.length) / gs.length < th.mixedSideShare) continue;  // both surfaces must carry the box
    const dLo = Math.abs(v.inkLuma - gLo), dHi = Math.abs(v.inkLuma - gHi);
    if (Math.min(dLo, dHi) > th.mergeTol || Math.max(dLo, dHi) < th.minSep) continue;
    if (dLo < dHi) continue;                 // BRIGHT-sink case only: LIGHT ink dissolving into a BRIGHT surface
    if (gHi < th.brightLuma) continue;       // ...and that surface must be a real bright field, not the orange hazard band
    hits.push({
      kind: 'text-crosses-value-boundary', polarity: L.polarity, box: [L.x0, L.y0, L.x1, L.y1], marks: L.marks,
      inkLuma: v.inkLuma, groundLo: Math.round(gLo), groundHi: Math.round(gHi), groundRange: Math.round(gHi - gLo),
      distToLow: Math.round(dLo), distToHigh: Math.round(dHi), invisibleOn: dLo < dHi ? 'dark' : 'bright', meanContrast: Math.round(c.meanContrast),
    });
  }
  // (e) the line's strokes stop being visible exactly where a large BRIGHT smooth surface begins — the s09 white
  // headline crossing the white certificate. BRIGHT = mean luma >= 190 with sd <= 14 (a paper card); the s10 orange
  // hazard band (luma ~150) is deliberately outside this test, so the gate stays silent on the s10 end card.
  const fields = flatRegions(img, { minShare: th.brightMinShare }).filter((f) => (0.299 * f.rgb[0] + 0.587 * f.rgb[1] + 0.114 * f.rgb[2]) >= th.brightLuma && f.lumaSd <= th.brightSd && f.share <= 0.6);
  if (fields.length) {
    const { w, h } = img;
    const fieldMask = new Uint8Array(w * h);
    for (const f of fields) for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) fieldMask[y * w + x] = 1;
    // (c1) the line's ink density collapses where the bright field starts
    for (const L of loose.lines) {
      if (L.marks < 2 || L.groundSd > th.maxGroundSd) continue;
      const c = lineContrast(img, L, opt);
      if (c.ink < th.minInkPx || c.meanContrast < th.minContrast) continue;
      const { mask } = inkMask(img, L.polarity, base);
      let inA = 0, inInk = 0, outA = 0, outInk = 0;
      for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) {
        const i = y * w + x;
        if (fieldMask[i]) { inA++; inInk += mask[i]; } else { outA++; outInk += mask[i]; }
      }
      if (inA < th.brightMinBoxShare * L.bw * L.bh) continue;
      const din = inInk / inA, dout = outA ? outInk / outA : 0;
      if (dout >= 0.04 && din < th.lostRatio * dout) {
        hits.push({ kind: 'text-lost-on-bright-surface', polarity: L.polarity, box: [L.x0, L.y0, L.x1, L.y1], marks: L.marks, boxOnField: +(inA / (L.bw * L.bh)).toFixed(2), inkDensityOnField: +din.toFixed(3), inkDensityOffField: +dout.toFixed(3) });
      }
    }
    // (c2) glyph strokes running INTO a bright card off a darker ground: two layers share those pixels. The card's
    // top edge must itself be a real edge (the field is a panel on a darker ground), which excludes the ruled-paper
    // strips of an all-bright world.
    for (const F of fields) {
      if (F.share < th.cardMinShare) continue;
      const fw = F.x1 - F.x0 + 1, fl = 0.299 * F.rgb[0] + 0.587 * F.rgb[1] + 0.114 * F.rgb[2];
      let above = 0, an = 0;
      for (let y = Math.max(0, F.y0 - 5); y < F.y0; y++) for (let x = F.x0; x <= F.x1; x += 2) { const i = (y * w + x) * 3; above += 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]; an++; }
      if (!an || above / an > fl - 40) continue;
      const crossing = [];
      for (const polarity of ['dark', 'light']) {
        const { mask } = inkMask(img, polarity, base);
        const { comps } = components(mask, w, h, Math.max(12, Math.round(0.00004 * w * h)));
        for (const c of comps) {
          const bh = c.y1 - c.y0 + 1, bw = c.x1 - c.x0 + 1;
          if (bh < 0.012 * h || bh > 0.13 * h || bw > 0.14 * w || bw / bh > 3) continue;
          if (c.x0 > F.x1 || c.x1 < F.x0) continue;
          const above0 = F.y0 - c.y0, inside0 = c.y1 - F.y0;
          if (c.y0 >= F.y0 || above0 < 0.25 * bh || inside0 < 0.25 * bh) continue;
          crossing.push({ polarity, box: [c.x0, c.y0, c.x1, c.y1], above: above0, inside: inside0 });
        }
      }
      const span = crossing.length ? Math.max(...crossing.map((c) => c.box[2])) - Math.min(...crossing.map((c) => c.box[0])) : 0;
      if (crossing.length >= 2 && span >= 0.05 * w) {
        hits.push({ kind: 'glyph-strokes-cross-into-bright-card', cardLuma: Math.round(fl), cardBox: [F.x0, F.y0, F.x1, F.y1], strokes: crossing.length, spanShare: +(span / w).toFixed(2), sample: crossing.slice(0, 4) });
      }
      break;
    }
  }
  return { hits, lines: lines.length, textLines: kept, loose: loose.lines.length, brightFields: fields.length };
}

export function analyse(frames, sorted, opt = {}) {
  const bad = [];
  let total = 0, sawText = 0;
  for (const n of sorted) {
    const r = checkFrame(frames.get(n), opt);
    total++;
    if (r.textLines.length) sawText++;
    if (r.hits.length) bad.push({ n, hits: r.hits, textLines: r.textLines.length });
  }
  return { bad, frames: total, framesWithText: sawText };
}
