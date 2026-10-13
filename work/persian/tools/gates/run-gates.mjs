#!/usr/bin/env node
// run-gates.mjs: automatic picture detectors for a motion film.
// Usage: node work/persian/tools/gates/run-gates.mjs <video.mp4 | stills-folder> [--events events.json] [--src <film source dir>]
//        [--logo-files a.svg,b.json] [--no-logo] [--step 3] [--max-dim 480] [--only edge,empty,dead,dup,num,logo,hero] [--json out.json]
// Exit code 1 if any gate FAILs (hero-size is an estimate and only WARNs).
import fs from 'node:fs';
import path from 'node:path';
import { streamVideo, readStill, probe, frameFromName, sceneStarts } from './lib.mjs';
import * as edge from './edge-touch.mjs';
import * as empty from './empty-band.mjs';
import * as dead from './dead-frames.mjs';
import * as dup from './duplicate-template.mjs';
import * as num from './number-lint.mjs';
import * as logo from './logo-colour.mjs';
import * as hero from './hero-size.mjs';
const isBlank = (img) => dead.uniformShare(img) >= 0.985;

const argv = process.argv.slice(2);
const VALUE_FLAGS = new Set(['events', 'src', 'logo-files', 'step', 'max-dim', 'only', 'json', 'edge-margin']);
const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && VALUE_FLAGS.has(argv[i - 1].slice(2))));
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
if (!target) { console.error('usage: run-gates.mjs <video|stills-folder> [--events f] [--src dir] [--only a,b] [--step N] [--json out]'); process.exit(2); }
// --no-logo (or a VERSION.json / meta.json next to the video with "logo": false, or no_brand_asset) skips the logo-colour gate
let noLogo = argv.includes('--no-logo');
if (!noLogo) { try { for (const dir of [path.dirname(target), path.dirname(path.dirname(target))]) for (const n of ['VERSION.json', 'meta.json']) { const f = path.join(dir, n); if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.logo === false || j.no_brand_asset === true || j.brand_asset === false) noLogo = true; } } } catch { /* ignore */ } }
const only = opt('only', 'edge,empty,dead,dup,num,logo,hero').split(',').filter((x) => !(noLogo && x === 'logo'));
if (noLogo) console.log('logo-colour gate skipped (no brand asset)');
const step = +opt('step', 3), maxDim = +opt('max-dim', 480);
const isDir = fs.statSync(target).isDirectory();
const dirOf = isDir ? target : path.dirname(target);
let eventsPath = opt('events', null);
if (!eventsPath) for (const c of [path.join(dirOf, 'events.json'), path.join(dirOf, '..', 'events.json')]) if (fs.existsSync(c)) { eventsPath = c; break; }
const logoFiles = opt('logo-files', 'work/persian/src/workbench/public/uni-local/emblem-layers.svg,work/persian/src/workbench/public/uni-local/layers.json').split(',');
const EDGE_PX = +opt('edge-margin', 6);

const frames = new Map(); // n -> img (kept subset)
const uniform = new Map();
let total, fullW, fullH, k;
const pickScene = (n, starts) => { let s = 0; starts.forEach((v, i) => { if (n >= v) s = i; }); return s; };

if (!isDir) {
  const p = probe(target); total = p.frames; fullW = p.w; fullH = p.h;
  const starts0 = sceneStarts(eventsPath, total);
  const keep = new Set();
  for (let n = 0; n < total; n += step) keep.add(n);
  starts0.forEach((s, i) => { for (let f = s; f <= s + 10; f++) keep.add(f); const e = starts0[i + 1] ?? total; keep.add(Math.floor((s + e) / 2)); });
  for (let n = total - 40; n < total; n += 4) keep.add(n);
  const meta = await streamVideo(target, maxDim, (n, img) => {
    if (only.includes('dead')) uniform.set(n, dead.uniformShare(img));
    if (keep.has(n)) frames.set(n, { w: img.w, h: img.h, data: Buffer.from(img.data) });
  });
  k = meta.scale; total = meta.count;
} else {
  const files = fs.readdirSync(target).filter((f) => /\.png$/i.test(f) && frameFromName(f) != null && /still/i.test(f)).sort();
  if (!files.length) { console.error('no still-*-f<N>.png in ' + target); process.exit(2); }
  for (const f of files) { const im = readStill(path.join(target, f), maxDim); frames.set(frameFromName(f), im); fullW = im.fullW; fullH = im.fullH; k = im.k; }
  total = Math.max(...frames.keys()) + 1;
}
const starts = sceneStarts(eventsPath, total);
const portrait = fullH / fullW > 1.6;
const rows = [], detail = {};
const fmtFrames = (a) => { // collapse a sorted frame list into ranges
  const out = []; let s = a[0], p = a[0];
  for (const f of a.slice(1).concat([null])) { if (f !== null && f - p <= step + 1) { p = f; continue; } out.push(s === p ? `${s}` : `${s}-${p}`); s = f; p = f; }
  return out.join(', ');
};
const sorted = [...frames.keys()].sort((a, b) => a - b);

if (only.includes('edge')) {
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

console.log(`# run-gates ${path.basename(target)}  ${fullW}x${fullH}${portrait ? ' (portrait)' : ''}  frames=${total}  sampled=${sorted.length}  scenes=${starts.length}${eventsPath ? '' : ' (no events.json)'}`);
const wid = Math.max(...rows.map((r) => r[0].length));
for (const r of rows) console.log(`${r[0].padEnd(wid)} | ${r[1].padEnd(4)} | ${r[2]}`);
const jo = opt('json', null); if (jo) fs.writeFileSync(jo, JSON.stringify({ target, rows, detail }, null, 1));
process.exit(rows.some((r) => r[1] === 'FAIL') ? 1 : 0);
