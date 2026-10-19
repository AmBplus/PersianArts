// C4 text-envelope (pixel): LIVE TEXT clipped by the canvas edge, or drawn outside the per-ratio text envelope
// that ART-DIRECTION-STANDARD.md §2 declares (9:16 -> 6.7% sides / 7.3% top / 9.4% bottom of the master;
// 16:9 -> 5.0% sides / 5.9% top+bottom). Distinguishing CLIPPED LIVE TEXT from INTENTIONAL FULL-BLEED SCENERY is
// the whole job, and it is done by the same shape test the other craft gates use: text is a row of THIN
// locally-high-contrast strokes clustered into a line with >= 3 marks and a stroke height inside the text band
// (0.8%..14% of the frame). Scenery, floor stripes, wall bands, sky and panel edges are either thick (they
// survive erosion and are dropped), too tall, or not line-clustered — the existing edge-touch gate, which only
// looks at "not the dominant background colour", flags exactly those scenery edges; this gate does not.
//
// A frame FAILs when a text line either crosses the canvas border (any ink mark inside 0.4% of an edge, or a
// line box clipped at an edge) or sits outside the envelope. Evidence: the s09 9:16 headline clipped by the
// bottom edge, media/briefs-local/storylab-craft/_frames/s09-9x16/s09_04.50s.png (audit D3).
//
// WHAT IT CANNOT SEE: scenery intentionally drawn to the edge (correctly ignored as a design choice, not a
// defect), text that is thin enough to be counted as a stroke but has fewer than 3 marks, and a text block
// inside the envelope whose optical margin is violated only by letterform overhang. It also cannot tell a
// deliberate full-bleed display word from a clipping accident — both are reported, and the row cites the frame.
import { textLines } from './craft-common.mjs';
export const name = 'text-envelope';
export const threshold = { edgePx: 0.004, minMarks: 3, maxHeightShare: 0.14, minHeightShare: 0.008 };

// envelope as a fraction of the frame, per ratio (from ART-DIRECTION-STANDARD.md §2, expressed over the master)
export function envelopeFor(w, h) {
  const portrait = h / w > 1.6;
  return portrait
    ? { l: 0.067, r: 0.067, t: 0.073, b: 0.094 }
    : { l: 0.050, r: 0.050, t: 0.059, b: 0.059 };
}

export function checkFrame(img, opt = {}) {
  const th = { ...threshold, ...opt };
  const { w, h } = img;
  const env = opt.envelope ?? envelopeFor(w, h);
  const edge = Math.max(1, Math.round(th.edgePx * Math.min(w, h)));
  const { lines } = textLines(img, opt);
  const hits = [];
  for (const L of lines) {
    if (L.marks < th.minMarks) continue;
    if (L.heightShare > th.maxHeightShare || L.heightShare < th.minHeightShare) continue;
    const sides = [];
    if (L.x0 <= edge) sides.push('left');
    if (L.x1 >= w - 1 - edge) sides.push('right');
    if (L.y0 <= edge) sides.push('top');
    if (L.y1 >= h - 1 - edge) sides.push('bottom');
    const outside = [];
    if (L.x0 < env.l * w) outside.push('left');
    if (L.x1 > (1 - env.r) * w) outside.push('right');
    if (L.y0 < env.t * h) outside.push('top');
    if (L.y1 > (1 - env.b) * h) outside.push('bottom');
    if (!sides.length && !outside.length) continue;
    hits.push({ box: [L.x0, L.y0, L.x1, L.y1], marks: L.marks, polarity: L.polarity, clipped: sides.join('+') || null, outsideEnvelope: outside.join('+') || null, heightShare: +L.heightShare.toFixed(3) });
  }
  return { hits, envelope: env, lines: lines.length };
}

export function analyse(frames, sorted, opt = {}) {
  const bad = [], per = [];
  for (const n of sorted) {
    const r = checkFrame(frames.get(n), opt);
    per.push({ n, hits: r.hits.length });
    if (r.hits.length) bad.push({ n, ...r });
  }
  return { bad, per };
}
