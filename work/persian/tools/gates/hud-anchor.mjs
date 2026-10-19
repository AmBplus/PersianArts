// C8 hud-anchor (pixel): a recurring small UI/HUD element must hold ONE position for the whole film.
// ART-DIRECTION-STANDARD.md §2: "One text anchor per film. The HUD/label block is placed once and does not move
// between scenes. (s12's counter migrates across the frame - that is a defect, not a style.)"
//
// Method. On every evaluated frame, text-collision's textLines() finds live text lines; the small ones (height
// <= 7% of the frame, width <= 50%) are HUD candidates. Candidates are matched ACROSS frames into groups by
// polarity + stroke height (+-25%) + line width (+-30%) + mark count (+-3), which is what a fixed HUD block keeps
// when only its digits change. A group seen in >= 3 frames whose normalised centroid travels more than
// DRIFT_X of the frame width (or DRIFT_Y of the height) between its first and last appearance is a FAIL.
//
// Evidence: s12's counter HUD walks from frame centre to the left edge (_frames/s12-9x16/s12_00.30s.png ->
// s12_19.80s.png; audit D3). The row prints the per-frame centroid so the migration is visible, not asserted.
//
// WHAT IT CANNOT SEE: a HUD whose SIZE changes (the size key breaks the match, so it becomes two groups), a HUD with
// fewer than 3 glyph marks, a HUD in a film where every frame has no other text (candidates are still found, but a
// group of one frame cannot drift), and drift smaller than the thresholds - a deliberate 8 px optical nudge is
// silent. A moving DECORATIVE mark that is not text is not tracked at all.
import { textLines } from './craft-common.mjs';
export const name = 'hud-anchor';

export const threshold = {
  hudHeightMax: 0.07, hudWidthMax: 0.50, minMarks: 3,
  heightTol: 0.25, widthTol: 0.30, markTol: 3,
  driftX: 0.08, driftY: 0.10, minFrames: 3,
};

function sameGroup(a, b, th) {
  if (a.polarity !== b.polarity) return false;
  if (Math.abs(a.heightShare - b.heightShare) > th.heightTol * Math.max(a.heightShare, b.heightShare)) return false;
  if (Math.abs(a.widthShare - b.widthShare) > th.widthTol * Math.max(a.widthShare, b.widthShare)) return false;
  if (Math.abs(a.marks - b.marks) > th.markTol) return false;
  return true;
}

export function analyse(frames, sorted, opt = {}) {
  const th = { ...threshold, ...opt };
  const groups = [];
  let framesWithText = 0;
  for (const n of sorted) {
    const img = frames.get(n);
    if (!img) continue;
    const { lines } = textLines(img, opt);
    if (lines.length) framesWithText++;
    const cands = lines
      .filter((L) => L.marks >= th.minMarks && L.heightShare <= th.hudHeightMax && L.widthShare <= th.hudWidthMax)
      .map((L) => ({ polarity: L.polarity, heightShare: L.heightShare, widthShare: L.widthShare, marks: L.marks, cx: (L.x0 + L.x1) / 2 / img.w, cy: (L.y0 + L.y1) / 2 / img.h, n, box: [L.x0, L.y0, L.x1, L.y1] }));
    for (const c of cands) {
      const g = groups.find((G) => sameGroup(G.ref, c, th));
      if (g) g.points.push(c);
      else groups.push({ ref: c, points: [c] });
    }
  }
  const seen = new Set();
  const scored = groups.map((G) => {
    const xs = G.points.map((p) => p.cx), ys = G.points.map((p) => p.cy);
    return {
      frames: G.points.length, uniqueFrames: new Set(G.points.map((p) => p.n)).size,
      polarity: G.ref.polarity, heightShare: +G.ref.heightShare.toFixed(3), widthShare: +G.ref.widthShare.toFixed(3), marks: G.ref.marks,
      cxMin: +Math.min(...xs).toFixed(3), cxMax: +Math.max(...xs).toFixed(3), cyMin: +Math.min(...ys).toFixed(3), cyMax: +Math.max(...ys).toFixed(3),
      driftX: +(Math.max(...xs) - Math.min(...xs)).toFixed(3), driftY: +(Math.max(...ys) - Math.min(...ys)).toFixed(3),
      track: G.points.map((p) => `f${p.n}(${p.cx.toFixed(2)},${p.cy.toFixed(2)})`).slice(0, 12),
      points: G.points,
    };
  }).filter((g) => { const k = `${g.polarity}${g.heightShare}${g.widthShare}`; if (seen.has(k)) return false; seen.add(k); return g.uniqueFrames >= th.minFrames; });
  const bad = scored.filter((g) => g.driftX >= th.driftX || g.driftY >= th.driftY).sort((a, b) => (b.driftX + b.driftY) - (a.driftX + a.driftY));
  return { groups: scored.sort((a, b) => (b.driftX + b.driftY) - (a.driftX + a.driftY)), bad, framesWithText, frames: sorted.length, scenes: opt.scenes ?? null };
}

export function verdict(res, opt = {}) {
  if (!res.frames) return { status: 'N/A', reason: 'no frames inspected' };
  if (!res.groups.length) return { status: 'N/A', reason: `no recurring HUD-sized text group found in ${res.frames} frames (${res.framesWithText} with text): a drift test needs one element seen >= ${opt.minFrames ?? threshold.minFrames} times` };
  const w = res.bad[0];
  const sceneNote = res.scenes ? `${res.scenes} scene starts from events.json; ` : 'no events.json scene starts, sampled frames used in time order; ';
  return {
    status: w ? 'FAIL' : 'PASS',
    reason: sceneNote + (w
      ? `${res.groups.length} HUD-sized groups; drifting: ${w.polarity} line h ${w.heightShare} w ${w.widthShare} in ${w.uniqueFrames} frames, x drift ${w.driftX} (limit ${opt.driftX ?? threshold.driftX}), y drift ${w.driftY}; track ${w.track.join(' ')}`
      : `${res.groups.length} HUD-sized groups in ${res.frames} frames; worst x drift ${res.groups[0].driftX}, y drift ${res.groups[0].driftY} (limits ${opt.driftX ?? threshold.driftX}/${opt.driftY ?? threshold.driftY})`),
    groups: res.groups.slice(0, 6),
  };
}
