import { readStill } from "./lib.mjs";
import { textLines, inkMask, groundUnder, lineVisibility } from "./craft-common.mjs";
const img = readStill(process.argv[2], 960);
const base = { thr: { dark: 20, light: 13 } };
const { lines } = textLines(img, base);
for (const L of lines) {
  const { mask, L: lum } = inkMask(img, L.polarity, base);
  const g = groundUnder(img, mask, lum, {});
  const gs = [];
  for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) gs.push(g[y * img.w + x]);
  gs.sort((a, b) => a - b);
  const gLo = gs[Math.floor(0.1 * gs.length)], gHi = gs[Math.floor(0.9 * gs.length)];
  const v = lineVisibility(img, L, { mergeTol: 25, minInkPx: 60 });
  const dLo = Math.abs(v.inkLuma - gLo), dHi = Math.abs(v.inkLuma - gHi);
  const hi190 = gs.filter((x) => x >= 190).length / gs.length, lo24 = gs.filter((x) => x <= 24).length / gs.length;
  const sHi = gs.filter((x) => x >= 25 + gLo).length/gs.length, sHi2 = gs.filter((x) => x >= gHi - 25).length/gs.length;
  const hit = true;
  if (hit) console.log(`HIT ${L.polarity} [${L.x0},${L.y0},${L.x1},${L.y1}] gsd=${L.groundSd.toFixed(1)} gLo=${gLo.toFixed(0)} gHi=${gHi.toFixed(0)} ink=${v.inkLuma} dLo=${dLo.toFixed(0)} dHi=${dHi.toFixed(0)} share>=190=${hi190.toFixed(2)} share<=24=${lo24.toFixed(2)} h=${(L.heightShare*100).toFixed(1)}% marks=${L.marks}`);
}