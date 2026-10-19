#!/usr/bin/env node
// run-gates.mjs: automatic picture detectors for a motion film.
// Usage: node work/persian/tools/gates/run-gates.mjs <video.mp4 | stills-folder | single .png> [--events events.json] [--src <film source dir>]
//        [--logo-files a.svg,b.json] [--no-logo] [--step 3] [--max-dim 480] [--only edge,empty,dead,dup,num,logo,hero] [--json out.json]
//        [--craft] [--frames-dir <folder of arbitrary-named stills>]
// Exit code 1 if any gate FAILs (hero-size is an estimate and only WARNs).
//
// --craft ADDS the ten CRAFT gates (C1-C8 + the two orphans) to the default set; without the flag nothing about the
// output changes (see CRAFT-GATES.md). Craft ids for --only:
//   kit, token, collision, envelope, variety, material, light, hud, overlay, bands
// A gate that inspects ZERO evidence prints N/A with a reason, never PASS.
import fs from 'node:fs';
import path from 'node:path';
import { streamVideo, readStill, probe, frameFromName, sceneStarts, sceneStartsInfo, findFilmSourceDir } from './lib.mjs';
import * as edge from './edge-touch.mjs';
import * as empty from './empty-band.mjs';
import * as dead from './dead-frames.mjs';
import * as dup from './duplicate-template.mjs';
import * as num from './number-lint.mjs';
import * as logo from './logo-colour.mjs';
import * as hero from './hero-size.mjs';
import * as kitUsage from './kit-usage.mjs';
import * as tokenCheck from './token-check.mjs';
import * as collision from './text-collision.mjs';
import * as envelope from './text-envelope.mjs';
import * as variety from './scene-variety.mjs';
import * as material from './material-flatness.mjs';
import * as light from './light-model.mjs';
import * as hud from './hud-anchor.mjs';
import * as overlay from './overlay-hud.mjs';
import * as bands from './black-bands.mjs';
const isBlank = (img) => dead.uniformShare(img) >= 0.985;
const CRAFT_IDS = ['kit', 'token', 'collision', 'envelope', 'variety', 'material', 'light', 'hud', 'overlay', 'bands'];
const BASE_IDS = 'edge,empty,dead,dup,num,logo,hero';

const argv = process.argv.slice(2);
const VALUE_FLAGS = new Set(['events', 'src', 'logo-files', 'step', 'max-dim', 'only', 'json', 'edge-margin', 'frames-dir']);
let target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && VALUE_FLAGS.has(argv[i - 1].slice(2))));
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const craft = argv.includes('--craft');
const framesDir = opt('frames-dir', null);
if (!target && framesDir) target = framesDir;
if (!target) { console.error('usage: run-gates.mjs <video|stills-folder|still.png> [--craft] [--events f] [--src dir] [--only a,b] [--step N] [--json out]'); process.exit(2); }
// --no-logo (or a VERSION.json / meta.json next to the video with "logo": false, or no_brand_asset) skips the logo-colour gate
let noLogo = argv.includes('--no-logo');
// --scenery (or VERSION.json / meta.json "scenery": true): the film's world is full-bleed scenery (sky, hills, maze walls): edge-touch is not applicable
let scenery = argv.includes('--scenery');
if (!scenery) { try { for (const dir of [path.dirname(target), path.dirname(path.dirname(target))]) for (const n of ['VERSION.json', 'meta.json']) { const f = path.join(dir, n); if (fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).scenery === true) scenery = true; } } catch (e) { /* ignore */ } }
if (!noLogo) { try { for (const dir of [path.dirname(target), path.dirname(path.dirname(target))]) for (const n of ['VERSION.json', 'meta.json']) { const f = path.join(dir, n); if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.logo === false || j.no_brand_asset === true || j.brand_asset === false) noLogo = true; } } } catch { /* ignore */ } }
const only = opt('only', craft ? `${BASE_IDS},${CRAFT_IDS.join(',')}` : BASE_IDS).split(',').filter((x) => !(noLogo && x === 'logo'));
if (noLogo) console.log('logo-colour gate skipped (no brand asset)');
const step = +opt('step', 3), maxDim = +opt('max-dim', 480);
const isDir = fs.statSync(target).isDirectory();
const dirOf = isDir ? target : path.dirname(target);
let eventsPath = opt('events', null);
if (!eventsPath) for (const c of [path.join(dirOf, 'events.json'), path.join(dirOf, '..', 'events.json')]) if (fs.existsSync(c)) { eventsPath = c; break; }
const logoFiles = opt('logo-files', 'work/persian/src/workbench/public/uni-local/emblem-layers.svg,work/persian/src/workbench/public/uni-local/layers.json').split(',');
const EDGE_PX = +opt('edge-margin', 6);
// overlay-hud needs EVERY frame of the stream (a frozen rectangle is only provable over the whole film), so it
// accumulates during the single decode pass that already runs - no second decode.
const overlayAcc = overlay.createAccum(160);

const frames = new Map(); // n -> img (kept subset)
const uniform = new Map();
const frameNames = new Map(); // n -> source file basename (--frames-dir / single still), for evidence rows
let total, fullW, fullH, k;
const pickScene = (n, starts) => { let s = 0; starts.forEach((v, i) => { if (n >= v) s = i; }); return s; };
const isImage = !fs.statSync(target).isDirectory() && /\.(png|jpe?g|webp)$/i.test(target);
// C1/C2/C7(a) are static and need the film's own source; --src wins, else the label in the path is used the same way
// number-lint's sourceBrandColours() does. If neither yields a directory the static gates report N/A (never PASS).
const craftSrc = opt('src', null) || (isImage || framesDir ? null : findFilmSourceDir(target, eventsPath));

if (isImage) {
  const im = readStill(target, maxDim);
  frames.set(0, im); frameNames.set(0, path.basename(target));
  fullW = im.fullW; fullH = im.fullH; k = im.k; total = 1;
} else if (!isDir) {
  const p = probe(target); total = p.frames; fullW = p.w; fullH = p.h;
  const starts0 = sceneStarts(eventsPath, total);
  const keep = new Set();
  for (let n = 0; n < total; n += step) keep.add(n);
  starts0.forEach((s, i) => { for (let f = s; f <= s + 10; f++) keep.add(f); const e = starts0[i + 1] ?? total; keep.add(Math.floor((s + e) / 2)); });
  for (let n = total - 40; n < total; n += 4) keep.add(n);
  const meta = await streamVideo(target, maxDim, (n, img) => {
    if (only.includes('dead')) uniform.set(n, dead.uniformShare(img));
    if (only.includes('overlay')) overlayAcc.add(img);
    if (keep.has(n)) frames.set(n, { w: img.w, h: img.h, data: Buffer.from(img.data) });
  });
  k = meta.scale; total = meta.count;
} else {
  const files = (framesDir
    ? fs.readdirSync(target).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()
    : fs.readdirSync(target).filter((f) => /\.png$/i.test(f) && frameFromName(f) != null && /still/i.test(f)).sort());
  if (!files.length) { console.error((framesDir ? 'no image in ' : 'no still-*-f<N>.png in ') + target); process.exit(2); }
  if (framesDir) files.forEach((f, i) => { const im = readStill(path.join(target, f), maxDim); frames.set(i, im); frameNames.set(i, f); fullW = im.fullW; fullH = im.fullH; k = im.k; });
  else for (const f of files) { const im = readStill(path.join(target, f), maxDim); frames.set(frameFromName(f), im); fullW = im.fullW; fullH = im.fullH; k = im.k; }
  total = framesDir ? files.length : Math.max(...frames.keys()) + 1;
}
const startsInfo = sceneStartsInfo(eventsPath, total);
const starts = startsInfo.starts;
const label = (n) => frameNames.get(n) ?? `f${n}`;
const portrait = fullH / fullW > 1.6;
const rows = [], detail = {};
const fmtFrames = (a) => { // collapse a sorted frame list into ranges
  const out = []; let s = a[0], p = a[0];
  for (const f of a.slice(1).concat([null])) { if (f !== null && f - p <= step + 1) { p = f; continue; } out.push(s === p ? `${s}` : `${s}-${p}`); s = f; p = f; }
  return out.join(', ');
};
const sorted = [...frames.keys()].sort((a, b) => a - b);

if (only.includes('edge') && scenery) rows.push(['edge-touch', 'N/A', 'scenery film (full-bleed world): not run (--scenery / VERSION.json scenery:true)']);
else if (only.includes('edge')) {
  const bad = [];
  for (const n of sorted) { const hits = edge.checkFrame(frames.get(n), { k, marginPx: EDGE_PX }); if (hits.length) bad.push({ n, hits }); }
  detail.edge = bad;
  rows.push(['edge-touch', bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length}/${sorted.length} sampled frames; frames ${fmtFrames(bad.map((b) => b.n))}; e.g. f${bad[0].n} ${bad[0].hits[0].sides} bbox ${bad[0].hits[0].bbox}` : `${sorted.length} frames sampled, margin ${EDGE_PX}px`]);
}
if (only.includes('empty')) {
  const bad = []; let worst = { share: 0 };
  for (const n of sorted) { if (isBlank(frames.get(n))) continue; const r = empty.checkFrame(frames.get(n)); if (r.share > worst.share) worst = { ...r, n }; if (r.share > 0.30) bad.push({ n, ...r }); }
  detail.empty = bad;
  rows.push(['empty-band', bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length} frames > 30%; frames ${fmtFrames(bad.map((b) => b.n))}; worst f${worst.n} ${(worst.share * 100).toFixed(0)}% (y ${(worst.from * 100).toFixed(0)}-${(worst.to * 100).toFixed(0)}%)` : `worst f${worst.n} ${(worst.share * 100).toFixed(0)}%`]);
}
if (only.includes('dead')) {
  if (isDir || !starts.length) rows.push(['dead-frames', 'N/A', 'needs a video and scene starts (events.json wipe ids)']);
  else { const r = dead.analyse(uniform, starts); detail.dead = r; rows.push(['dead-frames', r.length ? 'FAIL' : 'PASS', r.length ? r.map((x) => `scene@${x.scene_start}: frames ${x.frames} (${x.len})`).join('; ') : `${starts.length} scene starts checked (window start-2..start+10)`]); }
}
if (only.includes('dup')) {
  if (starts.length < 2) rows.push(['duplicate-template', 'N/A', 'needs scene starts (events.json)']);
  else {
    const sig = [];
    starts.forEach((s, i) => {
      const e = starts[i + 1] ?? total, mid = Math.floor((s + e) / 2);
      const near = sorted.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a), sorted[0]);
      if (near >= s && near < e) sig.push({ scene: i + 1, n: near, s: dup.signature(frames.get(near)) });
    });
    const pairs = [];
    for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) { const c = dup.compare(sig[i].s, sig[j].s); pairs.push({ a: sig[i].scene, b: sig[j].scene, ...c }); }
    const strong = pairs.filter((p) => p.phash_sim >= 0.85 || p.iou >= 0.70), weak = pairs.filter((p) => p.phash_sim >= 0.80 || p.iou >= 0.60); const bad = strong.length ? strong : (weak.length >= 3 ? weak : []);
    const top = [...pairs].sort((x, y) => y.iou - x.iou)[0];
    detail.dup = pairs;
    rows.push(['duplicate-template', bad.length ? 'FAIL' : 'PASS', `${sig.length} scene midpoints; ` + (bad.length ? bad.map((p) => `S${p.a}~S${p.b} pHash ${p.phash_sim.toFixed(2)} IoU ${p.iou.toFixed(2)}`).join('; ') : `closest S${top?.a}~S${top?.b} pHash ${top?.phash_sim.toFixed(2)} IoU ${top?.iou.toFixed(2)}`)]);
  }
}
if (only.includes('num')) {
  const src = opt('src', null);
  if (!src) rows.push(['number-lint', 'N/A', 'pass --src <film source dir> (static check)']);
  else { const r = num.run(src); detail.num = r; rows.push(['number-lint', r.hits.length ? 'FAIL' : 'PASS', `${r.filesScanned} files; ` + (r.hits.length ? r.hits.slice(0, 6).map((h) => `${h.file}:${h.line} [${h.kind}]`).join('; ') + (r.hits.length > 6 ? ` ... +${r.hits.length - 6}` : '') : 'no un-isolated number runs')]); }
}
if (only.includes('logo')) {
  const colours = logo.brandColours(logoFiles);
  if (!colours.length) rows.push(['logo-colour', 'N/A', 'no brand colours found in --logo-files']);
  else {
    const fin = sorted.filter((n) => n >= total - 45);
    const res = fin.map((n) => ({ n, ...logo.checkFrame(frames.get(n), colours) }));
    const bad = res.filter((r) => r.status === 'FAIL');
    detail.logo = res;
    rows.push(['logo-colour', bad.length ? 'FAIL' : 'PASS', bad.length ? `f${bad[0].n}: ${bad[0].reason}` : `f${res.at(-1).n}: ${res.at(-1).reason}`]);
  }
}
if (only.includes('hero')) {
  const per = new Map();
  for (const n of sorted) { const r = hero.checkFrame(frames.get(n)); if (!r) continue; const s = pickScene(n, starts.length ? starts : [0]); const cur = per.get(s); if (!cur || r.heightShare > cur.h) per.set(s, { h: r.heightShare, n }); }
  detail.hero = [...per.entries()].map(([s, v]) => ({ scene: s + 1, ...v }));
  const low = detail.hero.filter((x) => x.h < 0.12);
  const txt = detail.hero.map((x) => `S${x.scene} ${(x.h * 100).toFixed(0)}%@f${x.n}`).join(' ');
  rows.push(['hero-size (estimate)', portrait && low.length ? 'WARN' : 'INFO', (portrait ? `9:16 target >= 12%; below: ${low.map((x) => 'S' + x.scene).join(',') || 'none'}; ` : 'target 12% applies to 9:16 only; ') + txt]);
}

// ---------------------------------------------------------------------------------------------------------------
// CRAFT gates (--craft). Same row contract as above: PASS/FAIL/WARN, --only, exit code 1 on FAIL, and N/A with a
// reason whenever the gate saw no evidence (a craft gate never prints PASS on zero evidence).
if (craft) {
  const srcTag = craftSrc ? `--src ${craftSrc}` : 'no --src and no film label in the path';

  if (only.includes('kit')) {
    if (!craftSrc) rows.push(['kit-usage', 'N/A', `static check needs the film source: ${srcTag}`]);
    else { const r = kitUsage.run(craftSrc); const v = kitUsage.verdict(r); detail.kit = r; rows.push(['kit-usage', v.status, `${srcTag}: ${v.reason}`]); }
  }
  if (only.includes('token')) {
    if (!craftSrc) rows.push(['token-check', 'N/A', `static check needs the film source: ${srcTag}`]);
    else { const r = tokenCheck.run(craftSrc); const v = tokenCheck.verdict(r); detail.token = r; rows.push(['token-check', v.status, `${srcTag}: ${v.reason}`]); }
  }
  if (only.includes('collision')) {
    if (!sorted.length) rows.push(['text-collision', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else {
      const r = collision.analyse(frames, sorted, {});
      detail.collision = r.bad;
      const first = r.bad[0];
      rows.push(['text-collision', r.bad.length ? 'FAIL' : (r.framesWithText ? 'PASS' : 'N/A'),
        r.bad.length
          ? `${r.bad.length}/${r.frames} sampled frames with live text over live text / lost ink; e.g. ${label(first.n)} ${first.hits[0].kind} ${JSON.stringify(first.hits[0].box ?? first.hits[0].cardBox ?? '')}`
          : (r.framesWithText ? `${r.frames} frames sampled, ${r.framesWithText} with live text lines: no ink-equals-ground line, no opposite-polarity layer overlap, no bright-card ink loss` : `${r.frames} frames sampled and NONE held a live text line the detector could prove (no evidence: not a pass)`)]);
    }
  }
  if (only.includes('envelope')) {
    if (!sorted.length) rows.push(['text-envelope', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else {
      const r = envelope.analyse(frames, sorted, {});
      detail.envelope = r.bad.map((b) => ({ n: b.n, hits: b.hits }));
      const withText = r.per.filter((p) => p.hits).length;
      const bad = r.bad.filter((b) => b.hits.length);
      rows.push(['text-envelope', bad.length ? 'FAIL' : (withText ? 'PASS' : 'N/A'),
        bad.length
          ? `${bad.length} frames clip or push live text outside the envelope; e.g. ${label(bad[0].n)} box ${bad[0].hits[0].box} clipped=${bad[0].hits[0].clipped ?? '-'} outside=${bad[0].hits[0].outsideEnvelope ?? '-'} h ${bad[0].hits[0].heightShare}`
          : `${r.per.length} frames sampled, ${r.per.reduce((a, p) => a + p.hits, 0)} text lines measured, none crossing the border or the envelope (9:16 6.7/7.3/9.4%, 16:9 5.0/5.9%)`]);
    }
  }
  if (only.includes('variety')) {
    if (!sorted.length) rows.push(['scene-variety', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else if (starts.length < 2) rows.push(['scene-variety', 'N/A', `needs >= 2 scene starts (events.json cut_frames/wipe frames or the video fallback yielded ${starts.length})`]);
    else {
      const recs = variety.sceneRecords(frames, sorted, starts, total);
      const ps = variety.pairs(recs, {});
      const entrances = craftSrc ? variety.declaredEntrances(craftSrc) : { hits: 0, dirs: [] };
      const v = variety.verdict(ps, { startsSource: startsInfo.source, scenes: starts.length, recs: recs.length, entrances, maxRun: 3 });
      detail.variety = ps;
      rows.push(['scene-variety', v.status, v.reason]);
    }
  }
  if (only.includes('material')) {
    if (!sorted.length) rows.push(['material-flatness', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else {
      const r = material.analyse(frames, sorted, {});
      const v = material.verdict(r.per, {});
      detail.material = r.per.filter((p) => p.nBad > 0);
      rows.push(['material-flatness', v.status, v.reason]);
    }
  }
  if (only.includes('light')) {
    const pix = sorted.length ? light.analyse(frames, sorted, {}) : null;
    const declared = craftSrc ? light.declaredLight(craftSrc) : { error: `no film source (${srcTag})` };
    const v = light.verdict(declared, pix, {});
    detail.light = { declared, pix: pix ? pix.per.filter((p) => p.object) : [] };
    rows.push(['light-model', v.status, v.reason]);
  }
  if (only.includes('hud')) {
    if (!sorted.length) rows.push(['hud-anchor', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else {
      const r = hud.analyse(frames, sorted, { scenes: starts.length >= 3 ? starts.length : null });
      const v = hud.verdict(r, {});
      detail.hud = r.groups;
      rows.push(['hud-anchor', v.status, v.reason]);
    }
  }
  if (only.includes('overlay')) {
    const r = overlay.detect(overlayAcc, {});
    detail.overlay = r;
    rows.push(['overlay-hud', r.status === 'N/A' ? 'N/A' : r.status, r.status === 'FAIL' ? `${r.kind} at cell box x${r.x0}-${r.x0 + r.w} y${r.y0}-${r.y0 + r.h} of ${r.gw}x${r.gh} cells; contrast ${Math.round(r.contrast)} luma, frozen sd ${r.sd.toFixed(1)}, present in ${r.frames}/${r.frames} frames` : r.reason]);
  }
  if (only.includes('bands')) {
    const r = bands.analyse(frames, sorted, { k, minPx: 2, need: 0.8 });
    detail.bands = r;
    if (!r.seen) rows.push(['black-bands', 'N/A', 'no frame inspected (the target produced no sampled frame)']);
    else rows.push(['black-bands', r.firing.length ? 'FAIL' : 'PASS',
      r.firing.length
        ? `uniform near-black border band on ${r.firing.map((s) => `${s.side} ~${s.maxPx}px at full res (${s.frame} frame(s) of ${r.seen}, ${(s.count / r.seen * 100).toFixed(0)}%)`).join('; ')}`
        : `${r.seen} frames sampled; no border run >= 2 full-res px in >= 80% of frames (worst ${r.perSide.map((s) => `${s.side} ${s.maxPx}px/${(s.count / r.seen * 100).toFixed(0)}%`).join(' ') || 'none'})`]);
  }
}

console.log(`# run-gates ${path.basename(target)}  ${fullW}x${fullH}${portrait ? ' (portrait)' : ''}  frames=${total}  sampled=${sorted.length}  scenes=${starts.length}${eventsPath ? '' : ' (no events.json)'}${craft ? `  [--craft: ${CRAFT_IDS.filter((c) => only.includes(c)).join(',') || 'no craft gate selected'}]` : ''}`);

const wid = Math.max(...rows.map((r) => r[0].length));
for (const r of rows) console.log(`${r[0].padEnd(wid)} | ${r[1].padEnd(4)} | ${r[2]}`);
const jo = opt('json', null); if (jo) fs.writeFileSync(jo, JSON.stringify({ target, rows, detail }, null, 1));
process.exit(rows.some((r) => r[1] === 'FAIL') ? 1 : 0);
