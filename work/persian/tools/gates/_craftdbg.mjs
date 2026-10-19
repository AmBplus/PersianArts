// _craftdbg.mjs (scratch, not part of the gate set): prints text-collision / text-envelope internals for one still.
// Usage: node work/persian/tools/gates/_craftdbg.mjs <still.png> [--max-dim 480]
import { readStill } from './lib.mjs';
import { textLines, lineContrast, lineVisibility, inkMask, flatRegions } from './craft-common.mjs';
import { checkFrame } from './text-collision.mjs';

const file = process.argv[2];
const i = process.argv.indexOf('--max-dim');
const img = readStill(file, i >= 0 ? +process.argv[i + 1] : 480);
console.log(`# ${file} ${img.w}x${img.h}`);
const base = { thr: { dark: 20, light: 13 } };
const { lines } = textLines(img, base);
console.log(`textLines: ${lines.length}`);
for (const L of lines) {
  const c = lineContrast(img, L, {});
  const v = lineVisibility(img, L, { mergeTol: 25, minInkPx: 60 });
  console.log(` line pol=${L.polarity} box=${[L.x0, L.y0, L.x1, L.y1]} marks=${L.marks} h=${(L.heightShare * 100).toFixed(1)}% w=${(L.widthShare * 100).toFixed(0)}% cov=${L.coverage.toFixed(2)} cv=${L.heightCv.toFixed(2)} gsd=${L.groundSd.toFixed(1)} gmean=${Math.round(L.groundMean)} ink=${c.ink} contrast=${c.meanContrast.toFixed(0)} collapse=${c.collapseShare.toFixed(2)} merge=${v.mergeShare.toFixed(2)} inkLuma=${v.inkLuma} inkSd=${v.inkSd}`);
}
// (d) diagnostics per line
import { groundUnder } from './craft-common.mjs';
for (const L of lines) {
  const { mask } = inkMask(img, L.polarity, base);
  const g = groundUnder(img, mask, L, {});
  const gs = [];
  for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) gs.push(g[y * img.w + x]);
  gs.sort((a, b) => a - b);
  const p10 = gs[Math.floor(0.1 * gs.length)], p90 = gs[Math.floor(0.9 * gs.length)];
  const sLo = gs.filter((v) => v <= p10 + 25).length / gs.length, sHi = gs.filter((v) => v >= p90 - 25).length / gs.length;
  const v2 = lineVisibility(img, L, { mergeTol: 25, minInkPx: 60 });
  console.log(` (d) [${L.x0},${L.y0},${L.x1},${L.y1}] pol=${L.polarity} gsd=${L.groundSd.toFixed(1)} p10=${p10.toFixed(0)} p90=${p90.toFixed(0)} range=${(p90 - p10).toFixed(0)} sLo=${sLo.toFixed(2)} sHi=${sHi.toFixed(2)} inkLuma=${v2.inkLuma} inkSd=${v2.inkSd}`);
}
const r = checkFrame(img, {});
console.log(`hits: ${JSON.stringify(r.hits, null, 1)}`);
for (const o of [{ minMarks: 2 }, { minMarks: 2, minCoverage: 0.10 }, { minMarks: 2, minCoverage: 0.10, maxHeightCv: 1.2 }, { thr: { dark: 10, light: 6 }, minMarks: 2, minCoverage: 0.10, maxHeightCv: 1.2 }]) {
  const s = textLines(img, { ...base, ...o });
  console.log(`sweep ${JSON.stringify(o)} -> ${s.lines.length}: ${s.lines.map((L) => `${L.polarity}[${L.x0},${L.y0},${L.x1},${L.y1}]m${L.marks}h${(L.heightShare * 100).toFixed(1)}c${L.coverage.toFixed(2)}cv${L.heightCv.toFixed(2)}`).join(' ')}`);
}
const fields = flatRegions(img, { minShare: 0.005 }).filter((f) => (0.299 * f.rgb[0] + 0.587 * f.rgb[1] + 0.114 * f.rgb[2]) >= 190 && f.lumaSd <= 14 && f.share <= 0.6);
console.log(`bright fields: ${fields.map((f) => `share ${f.share.toFixed(3)} box ${[f.x0, f.y0, f.x1, f.y1]} rgb ${f.rgb} sd ${f.lumaSd.toFixed(1)}`).join(' | ') || 'none'}`);
console.log(`all flat >=2%: ${flatRegions(img, { minShare: 0.02 }).slice(0, 8).map((f) => `${f.share.toFixed(3)}@${[f.x0, f.y0, f.x1, f.y1]}(sd ${f.lumaSd.toFixed(1)})`).join(' ')}`);
