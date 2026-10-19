// Shared helpers for the film detectors. Node only + ffmpeg/ffprobe on PATH. No npm packages.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
    'stream=width,height,r_frame_rate,nb_read_frames', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 24 });
  const s = JSON.parse(r.stdout).streams[0];
  const [a, b] = s.r_frame_rate.split('/').map(Number);
  return { w: +s.width, h: +s.height, fps: a / (b || 1), frames: +s.nb_read_frames };
}

export function scaledSize(w, h, maxDim) {
  const k = maxDim / Math.max(w, h);
  return { w: Math.max(2, Math.round(w * k)), h: Math.max(2, Math.round(h * k)), k };
}

// Streams every frame of a video as RGB at a reduced size. onFrame(n, {w,h,data}) is called for every frame;
// the callback must copy data (Buffer.from) if it wants to keep it.
export function streamVideo(file, maxDim, onFrame) {
  const p = probe(file);
  const sz = scaledSize(p.w, p.h, maxDim);
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${sz.w}:${sz.h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const fsz = sz.w * sz.h * 3;
    let buf = Buffer.alloc(0), n = 0;
    ff.stdout.on('data', (c) => {
      buf = buf.length ? Buffer.concat([buf, c]) : c;
      while (buf.length >= fsz) { onFrame(n++, { w: sz.w, h: sz.h, data: buf.subarray(0, fsz) }); buf = buf.subarray(fsz); }
    });
    ff.on('error', reject);
    ff.on('close', () => resolve({ ...p, scale: sz.k, w2: sz.w, h2: sz.h, count: n }));
  });
}

export function readStill(file, maxDim) {
  const probeR = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', file], { encoding: 'utf8' });
  const st = JSON.parse(probeR.stdout).streams[0];
  const sz = scaledSize(+st.width, +st.height, maxDim);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${sz.w}:${sz.h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  return { w: sz.w, h: sz.h, data: r.stdout, fullW: +st.width, fullH: +st.height, k: sz.k };
}

// Dominant colour via a 4-bit-per-channel histogram, refined to the bin mean.
export function dominant(img) {
  const { w, h, data } = img;
  const hist = new Uint32Array(4096), sr = new Float64Array(4096), sg = new Float64Array(4096), sb = new Float64Array(4096);
  for (let i = 0; i < w * h; i += 2) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    hist[k]++; sr[k] += r; sg[k] += g; sb[k] += b;
  }
  let best = 0;
  for (let k = 1; k < 4096; k++) if (hist[k] > hist[best]) best = k;
  const c = hist[best] || 1;
  return { rgb: [sr[best] / c, sg[best] / c, sb[best] / c], share: hist[best] / Math.ceil(w * h / 2) };
}

// Foreground mask: Chebyshev distance to bg colour above thr.
export function fgMask(img, bg, thr = 45) {
  const { w, h, data } = img;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d = Math.max(Math.abs(data[i * 3] - bg[0]), Math.abs(data[i * 3 + 1] - bg[1]), Math.abs(data[i * 3 + 2] - bg[2]));
    m[i] = d > thr ? 1 : 0;
  }
  return m;
}

// 4-connected components. Returns [{x0,y0,x1,y1,n}] (+ per-pixel labels if wantLabels).
export function components(mask, w, h, minN = 1) {
  const lab = new Int32Array(w * h).fill(-1), out = [], stack = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || lab[s] >= 0) continue;
    const id = out.length; let sp = 0; stack[sp++] = s; lab[s] = id;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    while (sp) {
      const p = stack[--sp], x = p % w, y = (p / w) | 0;
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[p - 1] && lab[p - 1] < 0) { lab[p - 1] = id; stack[sp++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && lab[p + 1] < 0) { lab[p + 1] = id; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - w] && lab[p - w] < 0) { lab[p - w] = id; stack[sp++] = p - w; }
      if (y < h - 1 && mask[p + w] && lab[p + w] < 0) { lab[p + w] = id; stack[sp++] = p + w; }
    }
    out.push({ x0, y0, x1, y1, n });
  }
  return { comps: out.filter((c) => c.n >= minN), lab };
}

export function dilateX(mask, w, h, g) {
  const o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let last = -1e9;
    for (let x = 0; x < w; x++) { if (mask[y * w + x]) last = x; if (x - last <= g) o[y * w + x] = 1; }
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) { if (mask[y * w + x]) last = x; if (last - x <= g) o[y * w + x] = 1; }
  }
  return o;
}

export function luma(img, gw, gh) { // box-averaged grayscale gw x gh
  const { w, h, data } = img, out = new Float64Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const x0 = Math.floor(gx * w / gw), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * w / gw));
    const y0 = Math.floor(gy * h / gh), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * h / gh));
    let s = 0, c = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 3; s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; c++; }
    out[gy * gw + gx] = s / c;
  }
  return out;
}

export const frameFromName = (f) => { const m = /f(\d+)/i.exec(path.basename(f)); return m ? +m[1] : null; };

// ---------------------------------------------------------------------------
// Scene starts. Sources, in priority order: events.cut_frames (authoritative,
// already in frames), wipe events with an explicit `frame`, wipe events with
// only `t_s` (x fps). A one-take film has cut_frames [0] and no wipes, so it
// yields exactly one start; run-gates then falls back to detectSceneCuts() on
// the encoded video instead of reporting N/A.
export function readEvents(eventsPath) {
  if (!eventsPath || !fs.existsSync(eventsPath)) return null;
  try { return JSON.parse(fs.readFileSync(eventsPath, 'utf8')); } catch { return null; }
}

export function sceneStartsInfo(eventsPath, total, opt = {}) {
  const starts = new Set([0]);
  const detail = { source: 'none', fps: opt.fps || 30, wipes: 0, cuts: 0 };
  const j = readEvents(eventsPath);
  if (j) {
    const fps = +j.fps || detail.fps; detail.fps = fps;
    for (const e of j.events || []) {
      const isWipe = e.type === 'wipe' || /^wipe\d*/i.test(e.id || '');
      if (!isWipe) continue;
      if (Number.isFinite(+e.frame)) { starts.add(Math.round(+e.frame)); detail.wipes++; }
      else if (Number.isFinite(+e.t_s)) { starts.add(Math.round(+e.t_s * fps)); detail.wipes++; }
    }
    const cuts = Array.isArray(j.cut_frames) ? j.cut_frames.map(Number).filter(Number.isFinite) : [];
    if (cuts.length > 1) { for (const f of cuts) starts.add(Math.round(f)); detail.cuts = cuts.length; }
    detail.source = [detail.cuts ? `cut_frames(${detail.cuts})` : null, detail.wipes ? `wipe events(${detail.wipes})` : null].filter(Boolean).join('+') || 'events (no cuts)';
  }
  const out = [...starts].filter((f) => Number.isFinite(f) && f >= 0 && (total == null || f < total)).sort((a, b) => a - b);
  return { starts: out, ...detail };
}

export function sceneStarts(eventsPath, total) { return sceneStartsInfo(eventsPath, total).starts; }

// Encoded-video scene detection, used when the events file yields < 2 starts (one-take films).
export function detectSceneCuts(file, fps, thr = 0.30) {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-an', '-vf', `select='gt(scene,${thr})',metadata=print`, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 26 });
  const txt = `${r.stderr || ''}\n${r.stdout || ''}`;
  const frames = new Set([0]);
  for (const m of txt.matchAll(/pts_time:([0-9.]+)/g)) frames.add(Math.round(+m[1] * (fps || 30)));
  return [...frames].sort((a, b) => a - b);
}

// Locate the events.json that belongs to `target` (video or stills dir) without --events:
// next to it, one level up, or by the film label found in the path (work/persian/htmlfilm/<label>/).
export function findEventsPath(target, cwd = process.cwd()) {
  const dir = fs.statSync(target).isDirectory() ? target : path.dirname(target);
  for (const c of [path.join(dir, 'events.json'), path.join(dir, '..', 'events.json')]) if (fs.existsSync(c)) return c;
  const abs = path.resolve(target).split(path.sep);
  for (let i = abs.length - 1; i >= 0; i--) {
    if (/^s\d{2}-[a-z0-9][a-z0-9-]*$/i.test(abs[i])) {
      const c = path.join(cwd, 'work', 'persian', 'htmlfilm', abs[i], 'events.json');
      if (fs.existsSync(c)) return c;
    }
  }
  for (const n of ['VERSION.json', 'meta.json']) {
    const j = readEvents(path.join(dir, n));
    if (j && (j.film || j.label)) {
      const c = path.join(cwd, 'work', 'persian', 'htmlfilm', String(j.film || j.label), 'events.json');
      if (fs.existsSync(c)) return c;
    }
  }
  return null;
}

// The film's own source directory (what number-lint should lint), derived from
// --events, the film label in the path, or a VERSION.json/meta.json "film" field.
export function findFilmSourceDir(target, eventsPath, cwd = process.cwd()) {
  const cands = [];
  if (eventsPath) cands.push(path.dirname(eventsPath));
  const dir = fs.statSync(target).isDirectory() ? target : path.dirname(target);
  for (const n of ['VERSION.json', 'meta.json']) {
    const j = readEvents(path.join(dir, n));
    if (j && (j.film || j.label)) cands.push(path.join(cwd, 'work', 'persian', 'htmlfilm', String(j.film || j.label)));
  }
  const abs = path.resolve(target).split(path.sep);
  for (let i = abs.length - 1; i >= 0; i--) if (/^s\d{2}-[a-z0-9][a-z0-9-]*$/i.test(abs[i])) cands.push(path.join(cwd, 'work', 'persian', 'htmlfilm', abs[i]));
  for (const c of cands) if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
  return null;
}

// Uniform near-black rows/columns touching the frame borders (letterbox / raster padding).
export function borderBlackBands(img, opt = {}) {
  const { w, h, data } = img;
  const dark = opt.dark ?? 24, flat = opt.flat ?? 14;
  const rowStat = [], colStat = [];
  for (let y = 0; y < h; y++) {
    let mean = 0, mx = 0;
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; mean += l; if (l > mx) mx = l; }
    rowStat.push({ mean: mean / w, max: mx });
  }
  for (let x = 0; x < w; x++) {
    let mean = 0, mx = 0;
    for (let y = 0; y < h; y++) { const i = (y * w + x) * 3; const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; mean += l; if (l > mx) mx = l; }
    colStat.push({ mean: mean / h, max: mx });
  }
  const isBand = (s) => s.mean < dark && s.max < dark + flat;
  const runFrom = (stats, fromEnd) => {
    let n = 0;
    for (let k = 0; k < stats.length; k++) { const s = stats[fromEnd ? stats.length - 1 - k : k]; if (isBand(s)) n++; else break; }
    return n;
  };
  return [
    { side: 'top', px: runFrom(rowStat, false) },
    { side: 'bottom', px: runFrom(rowStat, true) },
    { side: 'left', px: runFrom(colStat, false) },
    { side: 'right', px: runFrom(colStat, true) },
  ].filter((b) => b.px > 0);
}
