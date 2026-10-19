// C5 scene-variety (static + pixel): audit D8 ("one template for the whole film: same frame, swapped prop") and D9
// ("ratio handling is a re-crop, not a re-composition").
//
// Rule. For every CONSECUTIVE pair of scenes, three axes are measured:
//   framing        - duplicate-template's pHash + occupancy-grid IoU between the two scene midpoints;
//   background     - dominant-colour Chebyshev distance between the two scene midpoints;
//   entrance       - the scene's declared entrance direction (from the film's own source), when it declares one.
// A pair "shares one form" when framing is similar (pHash >= FRAME_SIM or IoU >= IOU) AND the background is the same
// family (delta <= BG_DELTA) AND, when both scenes declare an entrance direction, those directions agree. A film
// FAILs when MAX_RUN = 3 or more consecutive scenes share one form (i.e. >= 2 consecutive sharing pairs), and the row
// prints the run with its numbers. Scene starts come from the events.json SCENE MACHINERY run-gates already uses
// (cut_frames + wipe event frames, lib.mjs sceneStartsInfo); when events.json yields fewer than 2 starts the gate
// falls back to evenly spaced samples and SAYS SO in the row: the pixel axes are then still measured, the run claim
// is weaker.
//
// WHAT IT CANNOT SEE: a film that changes its background HUE but repeats its composition (background axis goes
// "different", framing axis still catches it) and, worse, a film that changes composition but repeats its world - the
// gate deliberately does not punish a consistent world, so a palette that never varies is silent here. Entrance
// direction is N/A for the whole batch: no v1 events.json carries it. It cannot see a *re-crop* as such - D9 is
// caught only where the crop changes framing enough to break FRAME_SIM.
import { signature, compare } from './duplicate-template.mjs';
import { dominant } from './lib.mjs';
import { scanSources } from './craft-src.mjs';
export const name = 'scene-variety';

export const threshold = {
  frameSim: 0.85, iou: 0.60, bgDelta: 40, maxRun: 3, minStarts: 3,
};

export const ENTRY_RE = /\b(?:enterFrom|entrance|from|dir)\s*[:=]\s*['"]?(left|right|top|bottom|topleft|topright|bottomleft|bottomright)\b/gi;

// declared entrance directions in the film's own source (events.json v1 carries none - see header).
export function declaredEntrances(srcDir) {
  const scanned = scanSources(srcDir);
  if (scanned.error) return { error: scanned.error, hits: 0, dirs: [] };
  const dirs = [];
  for (const f of scanned.files) for (let i = 0; i < f.lines.length; i++) for (const m of f.lines[i].matchAll(ENTRY_RE)) dirs.push({ file: f.file, line: i + 1, dir: m[1].toLowerCase() });
  return { hits: dirs.length, dirs: dirs.slice(0, 12), filesScanned: scanned.files.length };
}

// scene midpoints -> one record per scene. `midOf(sceneIndex)` must return a sampled frame number or null.
export function sceneRecords(frames, sorted, starts, total) {
  const recs = [];
  starts.forEach((s, i) => {
    const e = starts[i + 1] ?? total, mid = Math.floor((s + e) / 2);
    const near = sorted.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a), sorted[0]);
    if (near == null || near < s || near >= e) return;
    const img = frames.get(near);
    if (!img) return;
    const dom = dominant(img);
    recs.push({ scene: i + 1, n: near, start: s, sig: signature(img), dom: dom.rgb, domShare: +dom.share.toFixed(3) });
  });
  return recs;
}

export function pairs(recs, opt = {}) {
  const th = { ...threshold, ...opt };
  const out = [];
  for (let i = 0; i + 1 < recs.length; i++) {
    const A = recs[i], B = recs[i + 1];
    const c = compare(A.sig, B.sig);
    const bgDelta = Math.max(...A.dom.map((v, k) => Math.abs(v - B.dom[k])));
    const framing = c.phash_sim >= th.frameSim || c.iou >= th.iou;
    const bgSame = bgDelta <= th.bgDelta;
    out.push({
      a: A.scene, b: B.scene, fa: A.n, fb: B.n, phash_sim: +c.phash_sim.toFixed(3), iou: +c.iou.toFixed(3),
      bgDelta: Math.round(bgDelta), domA: A.dom.map(Math.round), domB: B.dom.map(Math.round),
      framing, bgSame, same: framing && bgSame, sameFraming: framing, sameBg: bgSame,
    });
  }
  return out;
}

export function verdict(ps, meta = {}) {
  if (meta.error) return { status: 'N/A', reason: meta.error };
  if (!ps.length) return { status: 'N/A', reason: `fewer than 2 evaluable scenes (${meta.scenes ?? 0} starts, ${meta.recs ?? 0} with a sampled midpoint frame)` };
  // longest run of consecutive scenes in one form: a run of R scenes = R-1 consecutive sharing pairs
  let best = { len: 0, from: 0 };
  let cur = { len: 1, from: ps[0].a };
  for (const p of ps) {
    if (p.same) { cur.len++; } else { if (cur.len > best.len) best = cur; cur = { len: 1, from: p.b }; }
  }
  if (cur.len > best.len) best = cur;
  const share = ps.filter((p) => p.same).length;
  const strongest = [...ps].sort((a, b) => (b.iou + b.phash_sim) - (a.iou + a.phash_sim))[0];
  const srcNote = meta.startsSource ? `starts: ${meta.startsSource}; ` : '';
  const dirNote = meta.entrances && meta.entrances.hits
    ? `entrance axis: ${meta.entrances.hits} declared direction(s) in source`
    : 'entrance axis N/A (neither events.json nor the film source declares a per-scene entrance direction)';
  const bad = best.len >= (meta.maxRun ?? threshold.maxRun);
  return {
    status: bad ? 'FAIL' : (share >= ps.length * 0.6 ? 'WARN' : 'PASS'),
    reason: srcNote + `${ps.length} consecutive pairs / ${best.len} longest run of one form; ${share} pairs share framing+background (framing >=${threshold.frameSim} pHash or >=${threshold.iou} IoU, bg delta <=${threshold.bgDelta});` +
      (bad ? ` run S${best.from}..S${best.from + best.len - 1}` : ` closest pair S${strongest.a}~S${strongest.b} pHash ${strongest.phash_sim} IoU ${strongest.iou} bgDelta ${strongest.bgDelta}`) +
      `; ${dirNote}`,
    pairs: ps,
  };
}
