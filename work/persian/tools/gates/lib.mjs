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

export function sceneStarts(eventsPath, total) {
  const starts = [0];
  if (eventsPath && fs.existsSync(eventsPath)) {
    const ev = JSON.parse(fs.readFileSync(eventsPath, 'utf8')).events || [];
    for (const e of ev) if (/^wipe\d*/i.test(e.id || '') || e.type === 'wipe') starts.push(e.frame);
  }
  return [...new Set(starts)].sort((a, b) => a - b).filter((f) => f < total);
}
