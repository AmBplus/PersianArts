#!/usr/bin/env node
// motion-energy.mjs — G-MOTION: the MEASURED motion loop for a rendered film.
//
// WHY: our films read as "slides with jitter" instead of real motion. The reference motion-graphics
// projects (Mort1d/motion-graphics-skills, bangtutorial/bang-motion, Tejashmakwana/motionmaxxing) all
// ship the same loop: motion energy is computed FROM THE RENDERED FRAMES and the film FAILS when the
// picture does not move enough. This tool is that loop for this repo: it measures the delivered pixels
// and refuses a film that is mostly still.
//
// METHOD — no npm dependency, no network, no JS PNG decoder:
//   * A frames DIRECTORY is decoded through ffmpeg's CONCAT demuxer into a raw RGB24 stream:
//       ffmpeg -f concat -safe 0 -i list.txt -f rawvideo -pix_fmt rgb24 -
//     (list.txt holds one `file '<abs path>'` + `duration` line per frame, in sorted order). A VIDEO is
//     decoded with the same rawvideo pipe (`-i <video>`). The pixels always come out of ffmpeg, so the
//     tool stays dependency-free.
//   * Frames are scaled to a small working size (default max side 480, `flags=area`) before comparison
//     so a 1080x1920 film decodes in seconds. Every number below is a PERCENTAGE, so the scale cancels.
//   * change[i] = share of pixels where frame i differs from frame i-1 by >= PIXEL_DELTA on any channel
//     (default 12/255). The delta absorbs codec noise and film grain, so only real picture change counts.
//   * "moving" frame = change >= --still-pct (default 0.5 % of the pixels changed)
//   * "hit" frame    = change >= --hit-pct   (default 4 % of the pixels changed)
//   * moving %       = moving frames / comparable frame pairs (the first frame has no predecessor and
//     is not counted in the denominator)
//   * static run     = longest run of consecutive frames whose change is below --still-pct
//   * hits/min       = hits / (frames / fps) * 60
//   * a per-second timeline of change values (mean / max / moving / hits per second) is written into
//     the JSON report.
//
// USAGE:
//   node tools/gates/motion-energy.mjs <frames-dir|video.mp4> [--out report.json] [--fps 30]
//        [--still-pct 0.5] [--hit-pct 4] [--min-moving 75] [--max-static 3]
//        [--hits-min 55] [--hits-max 90] [--delta 12] [--max-dim 480]
//
// EXIT CODES: 1 = a documented threshold is violated (reason printed), 2 = usage / input error,
//              0 = every threshold holds.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { scaledSize, streamVideo } from './lib.mjs';
import { pathToFileURL } from 'node:url';

export const name = 'motion-energy';

const IMG_RE = /\.(png|jpe?g|webp|bmp|tiff?)$/i;

export const DEFAULTS = {
  fps: 30, stillPct: 0.5, hitPct: 4,
  // Thresholds are OFF by default. The numbers quoted by the reference projects
  // (>=75% moving frames, <=3 static frames, 55-90 hits/min) were calibrated against
  // THEIR OWN definition of a "hit" (a designed beat), not against a pixel-difference metric:
  // measured on professional reference films they all FAIL. See
  // docs/motion/MOTION-METRICS-2026-10-19.md. Use the metric as a diagnostic, and pass the
  // thresholds explicitly when a project has its own measured band.
  minMovingPct: 0, maxStaticRun: 1000000000, hitsMin: 0, hitsMax: 1000000000,
  delta: 12, maxDim: 320,
};

// Corpus bands measured 2026-10-19 on 8 films (our 2 + 6 professional references),
// motion-graphics subset only (UI screen-recordings excluded):
//   moving %      : min 39.7  median 63.0  max 82.1
//   static run    : min 14    median 37    max 66   (frames)
//   hits / minute : min 276   median 358   max 605
export const CORPUS = { movingPct: [39.7, 63.0, 82.1], staticRun: [14, 37, 66], hitsPerMin: [276, 358, 605] };

// Frame files of a rendered-frames directory, in playback order (natural sort: f2 before f10).
export function listFrames(dir) {
  return fs.readdirSync(dir)
    .filter((f) => IMG_RE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

// Stream a frames directory as raw RGB24 through ffmpeg's concat demuxer.
// onFrame(n, {w, h, data}) — data is a view into a reused buffer, copy it if you keep it.
export function streamFrameDir(dir, maxDim, onFrame) {
  const files = listFrames(dir);
  if (!files.length) throw new Error(`no image file in ${dir}`);
  const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', path.join(dir, files[0])], { encoding: 'utf8' });
  const st = JSON.parse(pr.stdout).streams[0];
  const sz = scaledSize(+st.width, +st.height, maxDim);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-motion-'));
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, files.map((f) => `file '${path.resolve(dir, f).replace(/\\/g, '/')}'\nduration 0.04`).join('\n') + '\n');
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', list,
      '-vf', `scale=${sz.w}:${sz.h}:flags=area,setsar=1`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
      { stdio: ['ignore', 'pipe', 'inherit'] });
    const fsz = sz.w * sz.h * 3;
    let buf = Buffer.alloc(0), n = 0;
    ff.stdout.on('data', (c) => {
      buf = buf.length ? Buffer.concat([buf, c]) : c;
      while (buf.length >= fsz) { onFrame(n++, { w: sz.w, h: sz.h, data: buf.subarray(0, fsz) }); buf = buf.subarray(fsz); }
    });
    ff.on('error', reject);
    ff.on('close', () => { fs.rmSync(tmp, { recursive: true, force: true }); resolve({ w: sz.w, h: sz.h, count: n, source: `frames-dir (${files.length} files)` }); });
  });
}

// Stream a video as raw RGB24 through ffmpeg (same pipe as lib.mjs streamVideo).
export function streamVideoFrames(file, maxDim, onFrame) {
  return streamVideo(file, maxDim, (n, img) => onFrame(n, { w: img.w, h: img.h, data: img.data }));
}

// Share of pixels that changed by >= delta on any channel, in percent.
export function changedPct(prev, cur, delta = DEFAULTS.delta) {
  const a = prev.data, b = cur.data, n = prev.w * prev.h;
  let changed = 0;
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    const dr = Math.abs(a[j] - b[j]), dg = Math.abs(a[j + 1] - b[j + 1]), db = Math.abs(a[j + 2] - b[j + 2]);
    if (dr >= delta || dg >= delta || db >= delta) changed++;
  }
  return (changed / n) * 100;
}

// Measure a frame stream. push(cur) is called once per frame in order; result() returns the metrics.
export function createMeter(opt = {}) {
  const o = { ...DEFAULTS, ...opt };
  let prev = null, n = 0;
  const pairs = [];
  const timeline = new Map(); // second -> bucket
  const bucket = (s) => {
    let b = timeline.get(s);
    if (!b) { b = { t: s, moving: 0, hits: 0, changeSum: 0, changeMax: 0, frames: 0 }; timeline.set(s, b); }
    return b;
  };
  const push = (cur) => {
    n++;
    if (!prev) { prev = { data: Buffer.from(cur.data), w: cur.w, h: cur.h }; return; }
    const pct = changedPct(prev, cur, o.delta);
    prev = { data: Buffer.from(cur.data), w: cur.w, h: cur.h };
    const moving = pct >= o.stillPct;
    const hit = pct >= o.hitPct;
    pairs.push(pct);
    const s = Math.floor((n - 1) / o.fps);
    const b = bucket(s);
    b.frames++; b.changeSum += pct; if (pct > b.changeMax) b.changeMax = pct;
    if (moving) b.moving++;
    if (hit) b.hits++;
  };
  const result = () => {
  const comparisons = pairs.length;
  const moving = pairs.filter((p) => p >= o.stillPct).length;
  const hits = pairs.filter((p) => p >= o.hitPct).length;
  let staticRun = 0, run = 0, runStart = -1, bestStart = -1;
  pairs.forEach((p, i) => {
    if (p < o.stillPct) { if (run === 0) runStart = i; run++; if (run > staticRun) { staticRun = run; bestStart = runStart; } }
    else run = 0;
  });
  const durationS = n / o.fps;
  const hitsPerMin = durationS > 0 ? (hits / durationS) * 60 : 0;
  const tl = [...timeline.values()].map((b) => ({
    t: b.t, frames: b.frames, moving: b.moving, hits: b.hits,
    changeMean: +(b.changeSum / Math.max(1, b.frames)).toFixed(3), changeMax: +b.changeMax.toFixed(3),
  }));
  return {
    frames: n, comparisons, fps: o.fps, durationS: +durationS.toFixed(3),
    movingFrames: moving, movingPct: comparisons ? +((moving / comparisons) * 100).toFixed(2) : 0,
    staticFrames: comparisons - moving, staticRun, staticRunStart: bestStart,
    hits, hitsPerMin: +hitsPerMin.toFixed(2),
    changeMean: comparisons ? +(pairs.reduce((a, b) => a + b, 0) / comparisons).toFixed(3) : 0,
    changeMax: comparisons ? +Math.max(...pairs).toFixed(3) : 0,
    timeline: tl,
  };
}
  return { push, result };
}

// Threshold verdict. Every threshold is overridable from the CLI.
export function verdict(m, o = DEFAULTS) {
  const reasons = [];
  if (m.movingPct < o.minMovingPct) reasons.push(`moving frames ${m.movingPct}% < ${o.minMovingPct}% (${m.movingFrames}/${m.comparisons} frame pairs move)`);
  if (m.staticRun > o.maxStaticRun) reasons.push(`longest static run ${m.staticRun} frames > ${o.maxStaticRun} (dead hold starting at pair ${m.staticRunStart})`);
  if (m.hitsPerMin < o.hitsMin) reasons.push(`motion hits ${m.hitsPerMin}/min < ${o.hitsMin}/min (${m.hits} hits in ${m.durationS}s)`);
  if (m.hitsPerMin > o.hitsMax) reasons.push(`motion hits ${m.hitsPerMin}/min > ${o.hitsMax}/min (${m.hits} hits in ${m.durationS}s)`);
  return { pass: reasons.length === 0, reasons };
}

const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

export function parseArgs(argv) {
  const VALUE = new Set(['out', 'fps', 'still-pct', 'hit-pct', 'min-moving', 'max-static', 'hits-min', 'hits-max', 'delta', 'max-dim']);
  const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
  const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && VALUE.has(argv[i - 1].slice(2))));
  const o = {
    fps: num(opt('fps'), DEFAULTS.fps), stillPct: num(opt('still-pct'), DEFAULTS.stillPct),
    hitPct: num(opt('hit-pct'), DEFAULTS.hitPct), minMovingPct: num(opt('min-moving'), DEFAULTS.minMovingPct),
    maxStaticRun: num(opt('max-static'), DEFAULTS.maxStaticRun), hitsMin: num(opt('hits-min'), DEFAULTS.hitsMin),
    hitsMax: num(opt('hits-max'), DEFAULTS.hitsMax), delta: num(opt('delta'), DEFAULTS.delta),
    maxDim: num(opt('max-dim'), DEFAULTS.maxDim),
  };
  return { target, o, out: opt('out', null) };
}

// Run the metric over a frames dir or a video. Returns {metrics, verdict, source}.
export async function analyse(target, o = DEFAULTS) {
  if (!fs.existsSync(target)) throw new Error(`input not found: ${target}`);
  const isDir = fs.statSync(target).isDirectory();
  const meter = createMeter(o);
  let meta = null;
  const onFrame = (idx, cur) => { if (!meta) meta = cur; meter.push(cur); };
  if (isDir) await streamFrameDir(target, o.maxDim, onFrame);
  else await streamVideoFrames(target, o.maxDim, onFrame);
  const m = meter.result();
  return { metrics: m, source: meta ? `${meta.w}x${meta.h} ${isDir ? 'frames-dir' : 'video'}` : 'unknown' };
}

export async function main(argv = process.argv.slice(2)) {
  const { target, o, out } = parseArgs(argv);
  if (!target) {
    console.error('usage: motion-energy.mjs <frames-dir|video.mp4> [--out report.json] [--fps 30] [--still-pct 0.5] [--hit-pct 4] [--min-moving 75] [--max-static 3] [--hits-min 55] [--hits-max 90] [--delta 12] [--max-dim 480]');
    return 2;
  }
  let res;
  try { res = await analyse(target, o); }
  catch (e) { console.error(`motion-energy: ${e.message || e}`); return 2; }
  const m = res.metrics;
  const v = verdict(m, o);
  console.log(`# motion-energy ${path.basename(target)}  ${res.source}  frames=${m.frames}  fps=${m.fps}  duration=${m.durationS}s`);
  console.log(`moving frames    : ${m.movingFrames}/${m.comparisons} = ${m.movingPct}%   (need >= ${o.minMovingPct}%)  ${m.movingPct >= o.minMovingPct ? 'PASS' : 'FAIL'}`);
  console.log(`longest static   : ${m.staticRun} frames (at pair ${m.staticRunStart})   (need <= ${o.maxStaticRun})  ${m.staticRun <= o.maxStaticRun ? 'PASS' : 'FAIL'}`);
  console.log(`motion hits      : ${m.hits} hits = ${m.hitsPerMin}/min   (need ${o.hitsMin}-${o.hitsMax}/min)  ${m.hitsPerMin >= o.hitsMin && m.hitsPerMin <= o.hitsMax ? 'PASS' : 'FAIL'}`);
  console.log(`change mean/max  : ${m.changeMean}% / ${m.changeMax}% per frame pair   (still<=${o.stillPct}%, hit>=${o.hitPct}%)`);
  if (!v.pass) { console.log('FAIL:'); for (const r of v.reasons) console.log(`  - ${r}`); }
  else console.log('PASS: every motion-energy threshold holds.');
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({
      tool: 'motion-energy', target: path.resolve(target), source: res.source,
      thresholds: o, metrics: m, verdict: v,
    }, null, 1));
    console.log(`report: ${path.resolve(out)}`);
  }
  return v.pass ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().then((code) => { process.exit(code); });
}
