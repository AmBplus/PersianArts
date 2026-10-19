// node palette-contrast.mjs [--write]
// Recomputes the contrast_notes column of data/palettes.csv from the actual token hexes:
// WCAG 2.1 contrast ratio of ink/muted/accent/signal against page, and the L* distance
// surface-page (the palette system's "surface must sit >= 12% L* from page" rule).
// --write rewrites the CSV in place; without it, prints the table only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.resolve(HERE, '..', 'data', 'palettes.csv');

function hex2rgb(h) {
  const s = String(h).trim().replace('#', '');
  if (s.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
function lum(rgb) { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
function lstar(rgb) {
  const Y = lum(rgb);
  return Y > 0.008856 ? 116 * Y ** (1 / 3) - 16 : 903.3 * Y;
}

function parseCsv(text) {
  const rows = []; let f = ''; let row = []; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';

const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
const cols = rows[0].map((c) => c.trim());
let fails = 0;
const out = [rows[0]];

for (const r of rows.slice(1)) {
  const o = {}; cols.forEach((c, i) => { o[c] = (r[i] || '').trim(); });
  const rgb = (k) => hex2rgb(o[k]);
  const page = rgb('page');
  const dl = Math.abs(lstar(rgb('surface')) - lstar(page));
  const cr = (k) => ratio(rgb(k), page);
  const tag = (v, need) => (v >= need ? 'PASS' : 'FAIL');
  const body = ['ink', 'muted'].map((k) => `${k}/page ${cr(k).toFixed(1)}:1 ${tag(cr(k), 4.5)}`).join('; ');
  const large = ['accent', 'signal'].map((k) => `${k}/page ${cr(k).toFixed(1)}:1 ${tag(cr(k), 3)} large`).join('; ');
  const sep = `surface-page L* ${dl.toFixed(1)} ${tag(dl, 12)} (>=12)`;
  const bad = ['ink', 'muted'].some((k) => cr(k) < 4.5) || ['accent', 'signal'].some((k) => cr(k) < 3) || dl < 12;
  if (bad) fails++;
  o.contrast_notes = `${body}; ${large}; ${sep}${bad ? ' -- REVIEW' : ''}`;
  console.log(`${o.id.padEnd(12)} ${bad ? 'REVIEW' : 'ok    '} ink ${cr('ink').toFixed(1)} muted ${cr('muted').toFixed(1)} accent ${cr('accent').toFixed(1)} signal ${cr('signal').toFixed(1)} L* ${dl.toFixed(1)}`);
  out.push(cols.map((c) => q(o[c])));
}
console.log(`\n${out.length - 1} palettes, ${fails} needing review`);
if (process.argv.includes('--write')) {
  fs.writeFileSync(CSV, out.map((r) => r.join(',')).join('\n') + '\n', 'utf8');
  console.log(`wrote ${CSV}`);
}
