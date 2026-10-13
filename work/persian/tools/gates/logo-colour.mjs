// (f) logo-colour: in the finale frame, find the emblem by its brand colours (from emblem-layers.svg / layers.json hex values).
// FAIL when (1) brand colours are absent (recoloured white/mono), or (2) the emblem sits on a near-white/cream plate.
import fs from 'node:fs';
import { dominant } from './lib.mjs';
export const name = 'logo-colour';
export function brandColours(files) {
  const set = new Set();
  for (const f of files) if (fs.existsSync(f)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/#([0-9a-fA-F]{6})\b/g)) set.add(m[1].toLowerCase());
  return [...set].map((h) => [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16)))
    .filter(([r, g, b]) => !(Math.min(r, g, b) > 215) && !(Math.max(r, g, b) < 40)); // drop white/black helpers
}
const near = (d, i, c, t) => Math.max(Math.abs(d[i] - c[0]), Math.abs(d[i + 1] - c[1]), Math.abs(d[i + 2] - c[2])) <= t;
export function checkFrame(img, coloursIn) {
  const bgc = dominant(img).rgb;
  const colours = coloursIn.filter((c) => Math.max(Math.abs(c[0] - bgc[0]), Math.abs(c[1] - bgc[1]), Math.abs(c[2] - bgc[2])) > 70); // drop brand colours equal to the background
  if (!colours.length) return { status: "PASS", reason: "all brand colours match the background; cannot test" };
  const { w, h, data } = img, xs = [], ys = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (colours.some((c) => near(data, i, c, 34))) { xs.push(x); ys.push(y); }
  }
  const share = xs.length / (w * h);
  const uniq = colours.filter((c, i) => colours.findIndex((d) => Math.max(Math.abs(c[0]-d[0]),Math.abs(c[1]-d[1]),Math.abs(c[2]-d[2])) < 24) === i);
  for (const c of uniq) { let n = 0; for (let i = 0; i < w * h; i++) if (near(data, i * 3, c, 24)) n++; if (n / (w * h) < 0.0004) return { status: 'FAIL', reason: 'brand colour rgb(' + c.map(Math.round).join(',') + ') absent from the finale (' + (n / (w * h) * 100).toFixed(3) + '% of frame): emblem recoloured or missing' }; }
  if (share < 0.0015) return { status: 'FAIL', reason: `brand colours absent (${(share * 100).toFixed(3)}% of frame): emblem recoloured or missing` };
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  const x0 = q(xs, 0.02), x1 = q(xs, 0.98), y0 = q(ys, 0.02), y1 = q(ys, 0.98);
  const px = Math.round((x1 - x0) * 0.12) + 2, py = Math.round((y1 - y0) * 0.12) + 2;
  let ring = 0, white = 0;
  for (let y = Math.max(0, y0 - py); y <= Math.min(h - 1, y1 + py); y++) for (let x = Math.max(0, x0 - px); x <= Math.min(w - 1, x1 + px); x++) {
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue;
    const i = (y * w + x) * 3; ring++;
    if (Math.min(data[i], data[i + 1], data[i + 2]) > 215) white++;
  }
  const plate = ring ? white / ring : 0;
  if (plate > 0.5) return { status: 'FAIL', reason: `emblem bbox [${x0},${y0},${x1},${y1}] surrounded by near-white/cream (${(plate * 100).toFixed(0)}% of ring): plate`, bbox: [x0, y0, x1, y1] };
  return { status: 'PASS', reason: `brand colours present (${(share * 100).toFixed(2)}% of frame), ring near-white ${(plate * 100).toFixed(0)}%`, bbox: [x0, y0, x1, y1] };
}
