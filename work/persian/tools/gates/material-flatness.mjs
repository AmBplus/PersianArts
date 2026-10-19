// C6 material-flatness (pixel): a large region of ONE colour is a sticker, not a material (audit D6: "single-fill
// stickers: no shadow, gradient, rim or texture").
//
// Rule. flatRegions() quantises each pixel to 5 bits/channel (two colours within 8/255 share a bin) and takes the
// connected components. A component whose share of the frame is >= MIN_SHARE and that is not a documented legitimate
// flat field is a FAIL. The row names the biggest three with rgb and box so a human can see which object it is.
//
// DOCUMENTED LEGITIMATE EXCLUSIONS (why a frame can hold a big flat area and still pass):
//   1. THE FIELD     - a region covering >= FIELD_SHARE of the frame (or a bbox >= 0.90 of the frame) is the film's
//                      background/page. Flat backgrounds are D4's business (empty-band/edge-touch), not D6's.
//   2. LETTERBOX/BAND- a region that hugs a border for >= 0.6 of that side and is thinner than 0.12 of the frame is
//                      a band: that is black-bands' business.
//   3. NEAR-BLACK     - mean luma < 12: shadow/void areas carry no material claim.
//   4. HIGH-VALUE TEXT AREA - a region whose bbox is dominated by thin strokes of another value is a text field, and
//                      its flat "paper" is measured by text-collision, not here.
//
// WHAT IT CANNOT SEE: a two-tone sticker (a flat fill plus one hard rim line) passes, because its region is small once
// the rim splits it - the gate measures the flat AREA, so a textured-but-flat film (paper grain, noise) passes; a
// gradient built from <= 8/255 steps passes. It measures area, never "does this read as glass".
import { flatRegions, textLines } from './craft-common.mjs';
export const name = 'material-flatness';

export const threshold = {
  minShare: 0.06,      // calibrated: the defect frames in CRAFT-GATES.md are far above this; see calibration table
  fieldShare: 0.80,
  bboxFieldShare: 0.90,
  bandThin: 0.12, bandHug: 0.60,
  voidLuma: 12,
};

export function checkFrame(img, opt = {}) {
  const th = { ...threshold, ...opt };
  const { w, h } = img;
  const regions = flatRegions(img, { minShare: Math.min(th.minShare, 0.02), bits: 5 });
  const excluded = [], bad = [];
  const lines = opt.skipText ? null : textLines(img, { minMarks: 3 }).lines;
  for (const f of regions) {
    const bw = f.x1 - f.x0 + 1, bh = f.y1 - f.y0 + 1;
    const luma = 0.299 * f.rgb[0] + 0.587 * f.rgb[1] + 0.114 * f.rgb[2];
    const rec = { share: +f.share.toFixed(3), rgb: f.rgb, box: [f.x0, f.y0, f.x1, f.y1], lumaSd: +f.lumaSd.toFixed(1), luma: Math.round(luma) };
    if (f.share >= th.fieldShare || (bw * bh) / (w * h) >= th.bboxFieldShare) { excluded.push({ ...rec, why: 'field: >=80% of the frame is one colour (background, D4 not D6)' }); continue; }
    const hugX = bw / w, hugY = bh / h;
    const bandTop = f.y0 === 0 && hugX >= th.bandHug && hugY <= th.bandThin;
    const bandBot = f.y1 === h - 1 && hugX >= th.bandHug && hugY <= th.bandThin;
    const bandL = f.x0 === 0 && hugY >= th.bandHug && hugX <= th.bandThin;
    const bandR = f.x1 === w - 1 && hugY >= th.bandHug && hugX <= th.bandThin;
    if (bandTop || bandBot || bandL || bandR) { excluded.push({ ...rec, why: 'border band (black-bands territory)' }); continue; }
    if (luma < th.voidLuma) { excluded.push({ ...rec, why: `void: mean luma ${Math.round(luma)} < ${th.voidLuma}` }); continue; }
    if (f.share < th.minShare) continue;
    if (lines && lines.some((L) => L.x0 < f.x1 && L.x1 > f.x0 && L.y0 < f.y1 && L.y1 > f.y0 && L.marks >= 3 && (L.x1 - L.x0 + 1) / bw > 0.6 && (L.y1 - L.y0 + 1) / bh < 0.35)) {
      excluded.push({ ...rec, why: 'text field: a live text block spans this region (text-collision territory)' }); continue;
    }
    bad.push(rec);
  }
  return { bad, excluded, regions: regions.length };
}

export function analyse(frames, sorted, opt = {}) {
  const per = [];
  for (const n of sorted) {
    const r = checkFrame(frames.get(n), opt);
    per.push({ n, bad: r.bad, excluded: r.excluded, nBad: r.bad.length, nExcluded: r.excluded.length, regions: r.regions });
  }
  return { per };
}

export function verdict(per, opt = {}) {
  if (!per.length) return { status: 'N/A', reason: 'no frames inspected' };
  const bad = per.filter((p) => p.nBad > 0);
  const top = bad.length ? bad[0].bad[0] : null;
  return {
    status: bad.length ? 'FAIL' : 'PASS',
    reason: bad.length
      ? `${bad.length}/${per.length} frames hold a flat region >= ${((opt.minShare ?? threshold.minShare) * 100).toFixed(0)}% of the frame; e.g. f${bad[0].n} ${top.share} share rgb(${top.rgb.join(',')}) box ${top.box} sd ${top.lumaSd}` +
        (bad.length > 1 ? ` ... +${bad.length - 1}` : '')
      : `no frame holds a flat region >= ${((opt.minShare ?? threshold.minShare) * 100).toFixed(0)}% outside the field/band/void exclusions (${per.filter((p) => p.nExcluded).length} frames had only excluded flat areas)`,
    per,
  };
}
