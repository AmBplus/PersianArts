// scratch (dev only): craft text-gate diagnostics, compact output
import { readStill } from '../lib.mjs';
import * as tc from '../text-collision.mjs';
import * as te from '../text-envelope.mjs';
const FRAMES = [
  's09-16x9/s09_24.80s.png',
  's10-16x9/s10_19.80s.png',
  's11-16x9/s11_17.80s.png',
  's09-9x16/s09_04.50s.png',
  's11-9x16/s11_15.48s.png',
  's12-9x16/s12_00.30s.png',
  's12-9x16/s12_19.80s.png',
  's08-16x9/s08_14.80s.png',
  's09-9x16/s09_14.50s.png',
];
const prefix = 'media/briefs-local/storylab-craft/_frames/';
for (const rel of FRAMES) {
  const img = readStill(prefix + rel, 960);
  const c = tc.checkFrame(img);
  const e = te.checkFrame(img);
  const lines = c.textLines.map((L) => `${L.polarity}${L.marks}[${L.x0},${L.y0},${L.x1},${L.y1}]h${L.mh}g${Math.round(L.groundSd)}m${L.meanContrast}mg${L.mergeShare}i${L.inkSd}`).join(' ');
  console.log(`${rel} ${img.w}x${img.h} L=${c.lines}/T=${c.textLines.length} loose=${c.loose} bf=${c.brightFields} col=${c.hits.length} env=${e.hits.length}`);
  console.log(`   ${lines}`);
  if (c.hits.length) console.log(`   COL ${JSON.stringify(c.hits.slice(0, 3))}`);
  if (e.hits.length) console.log(`   ENV ${JSON.stringify(e.hits.slice(0, 3))}`);
}
