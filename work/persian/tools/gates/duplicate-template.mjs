// (d) duplicate-template: perceptual hash (DCT pHash on luma) AND foreground-layout overlap between scene midpoints.
// Flags a pair when pHash similarity >= 0.88 or occupancy-grid IoU >= 0.55 (layout repeated even if palette changed).
import { luma, dominant, fgMask } from './lib.mjs';
export const name = 'duplicate-template';
function pHash(img) {
  const N = 32, g = luma(img, N, N), F = 8, coef = [];
  for (let u = 0; u < F; u++) for (let v = 0; v < F; v++) {
    let s = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s += g[y * N + x] * Math.cos(((2 * x + 1) * v * Math.PI) / (2 * N)) * Math.cos(((2 * y + 1) * u * Math.PI) / (2 * N));
    coef.push(s);
  }
  const rest = coef.slice(1), med = [...rest].sort((a, b) => a - b)[rest.length >> 1];
  return rest.map((c) => (c > med ? 1 : 0));
}
function grid(img, G = 24) {
  const bg = dominant(img).rgb, m = fgMask(img, bg, 45), { w, h } = img, cells = new Uint8Array(G * G);
  for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
    let c = 0, t = 0;
    for (let y = Math.floor(gy * h / G); y < Math.floor((gy + 1) * h / G); y++) for (let x = Math.floor(gx * w / G); x < Math.floor((gx + 1) * w / G); x++) { c += m[y * w + x]; t++; }
    cells[gy * G + gx] = c / t > 0.08 ? 1 : 0;
  }
  return cells;
}
export function signature(img) { return { ph: pHash(img), grid: grid(img) }; }
export function compare(a, b) {
  let d = 0; for (let i = 0; i < a.ph.length; i++) if (a.ph[i] !== b.ph[i]) d++;
  let inter = 0, uni = 0; for (let i = 0; i < a.grid.length; i++) { if (a.grid[i] && b.grid[i]) inter++; if (a.grid[i] || b.grid[i]) uni++; }
  return { phash_sim: 1 - d / a.ph.length, iou: uni ? inter / uni : 0 };
}
