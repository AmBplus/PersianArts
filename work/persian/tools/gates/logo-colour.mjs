// (f) logo-colour, unified behaviour (G4).
//
// The three old behaviours on a film with an inline brand mark and no external asset were all wrong:
//   (a) without --no-logo it FALSE-FAILED, hunting for the hardcoded uni-local blue rgb(105,131,208) that belongs
//       to a different client, while the film's own orange #ff7a1a mark was on screen;
//   (b) with --no-logo it printed "skipped (no brand asset)" although the film does have an inline mark;
//   (c) with --only logo-colour it printed no row at all and exited 0, which reads as a silent pass.
//
// New single rule: use the film's OWN brand colours when they can be derived from its source (or from an explicit
// --logo-files), and otherwise report an explicit N/A with an honest message. There is no hardcoded fallback
// palette any more, and every N/A is printed as a ROW, so no invocation form can end in an invisible pass.
//
// Derivation: comments are blanked first (prose is not evidence), then a code line that names a brand mark
// (logo/emblem/wordmark/seal/brand mark/MARK_SVG) anchors a 30-line span whose hex literals are the mark's own
// colours; palette references (C.orange) on such a line are resolved against `const X = { name: "#hex" }`.
//
// What it cannot catch: a mark drawn from a raster asset, a gradient-only recolour, or a mark whose colours are
// computed at runtime (no hex literal anywhere in the source). Those end in N/A, never PASS.
import fs from 'node:fs';
import path from 'node:path';
import { dominant } from './lib.mjs';
export const name = 'logo-colour';

const toRgb = (h) => [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16));
const keep = ([r, g, b]) => !(Math.min(r, g, b) > 215) && !(Math.max(r, g, b) < 40); // drop white/black helpers

export function brandColours(files) {
  const set = new Set();
  for (const f of files) if (f && fs.existsSync(f)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/#([0-9a-fA-F]{6})\b/g)) set.add(m[1].toLowerCase());
  return [...set].map(toRgb).filter(keep);
}

const BRAND_LINE = /brand\s*mark|logo|emblem|wordmark|monogram|\bseal\b|MARK_SVG|LOGO_SVG|BRAND_SVG/i;
const STOP = /^(function |\/\/ -{3,}|const [A-Z][A-Z0-9_]*\s*=\s*\(|const \w+\s*=\s*\[)/;

// Blank comments but keep every newline, so line numbers stay true.
function strip(txt, isHtml) {
  let s = txt.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  if (isHtml) s = s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  return s;
}

export function sourceBrandColours(srcDir, cwd = process.cwd()) {
  const dir = path.resolve(cwd, srcDir || '');
  if (!srcDir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return { colours: [], refs: [], hexes: [], note: `no source directory (${srcDir || 'none'})` };
  const files = fs.readdirSync(dir).filter((f) => /\.(html?|mjs|js|tsx?|jsx)$/i.test(f) && !/^_/.test(f)).map((f) => path.join(dir, f));
  const refs = [];
  for (const f of files) {
    const rel = path.relative(cwd, f).split(path.sep).join('/');
    const raw = fs.readFileSync(f, 'utf8');
    const L = raw.split(/\r?\n/);
    const C = strip(raw, /\.html?$/i.test(f)).split(/\r?\n/);
    // palette literals: `const C = { orange: "#ff7a1a", ... }`
    const pal = new Map();
    C.forEach((line, i) => {
      const owner = /^\s*(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\{/.exec(line);
      let cur = owner ? owner[1] : null;
      if (!cur && /^\s+\w+\s*:\s*"#/.test(line)) for (let k = i; k >= 0 && k > i - 40; k--) { const mm = /^\s*(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\{/.exec(C[k]); if (mm) { cur = mm[1]; break; } }
      if (!cur) return;
      for (const m of line.matchAll(/(\w+)\s*:\s*"(#[0-9a-fA-F]{6})"/g)) pal.set(cur + '.' + m[1], m[2].toLowerCase());
    });
    L.forEach((line, i) => {
      if (!BRAND_LINE.test(C[i])) return; // anchors must be CODE: prose is not evidence
      const span = [];
      for (let k = i; k < Math.min(C.length, i + 31); k++) { if (k > i && STOP.test(C[k])) break; span.push(C[k]); }
      const why = `${rel}:${i + 1}`;
      const tag = line.trim().slice(0, 58);
      for (const m of span.join('\n').matchAll(/#([0-9a-fA-F]{6})\b/g)) refs.push({ hex: m[1].toLowerCase(), why: `${why} "${tag}"` });
      for (const m of C[i].matchAll(/\b([A-Z]\w*)\.(\w+)\b/g)) { const hex = pal.get(m[1] + '.' + m[2]); if (hex) refs.push({ hex, why: `${why} ${m[1]}.${m[2]}` }); }
    });
  }
  const seen = new Map();
  for (const r of refs) if (!seen.has(r.hex)) seen.set(r.hex, r);
  const colours = [...seen.keys()].map(toRgb).filter(keep);
  return {
    colours,
    refs: [...seen.values()],
    hexes: colours.map((c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')),
    note: colours.length ? `${colours.length} brand colour(s) derived from the film source` : 'no brand-mark hex literal found in the film source',
  };
}

const near = (d, i, c, t) => Math.max(Math.abs(d[i] - c[0]), Math.abs(d[i + 1] - c[1]), Math.abs(d[i + 2] - c[2])) <= t;

export function checkFrame(img, coloursIn) {
  const bgc = dominant(img).rgb;
  const colours = coloursIn.filter((c) => Math.max(Math.abs(c[0] - bgc[0]), Math.abs(c[1] - bgc[1]), Math.abs(c[2] - bgc[2])) > 70); // drop brand colours equal to the background
  if (!colours.length) return { status: 'N/A', reason: 'every derived brand colour equals the frame background; the mark cannot be separated from the ground (not a pass)' };
  const { w, h, data } = img, xs = [], ys = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (colours.some((c) => near(data, i, c, 34))) { xs.push(x); ys.push(y); }
  }
  const share = xs.length / (w * h);
  const uniq = colours.filter((c, i) => colours.findIndex((d) => Math.max(Math.abs(c[0] - d[0]), Math.abs(c[1] - d[1]), Math.abs(c[2] - d[2])) < 24) === i);
  const present = [], absent = [];
  for (const c of uniq) {
    let n = 0; for (let i = 0; i < w * h; i++) if (near(data, i * 3, c, 24)) n++;
    (n / (w * h) >= 0.0004 ? present : absent).push(c.map(Math.round).join(','));
  }
  const fmt = (a) => a.map((s) => 'rgb(' + s + ')').join(' ');
  if (!present.length) return { status: 'FAIL', reason: `none of the film's own brand colours are in the finale (absent: ${fmt(absent)}): mark recoloured or missing` };
  if (share < 0.0015) return { status: 'FAIL', reason: `brand colours cover only ${(share * 100).toFixed(3)}% of the finale: mark recoloured or missing` };
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
  const note = absent.length ? `; not found: ${fmt(absent)}` : '';
  if (plate > 0.5) return { status: 'FAIL', reason: `mark bbox [${x0},${y0},${x1},${y1}] surrounded by near-white/cream (${(plate * 100).toFixed(0)}% of ring): plate on a transparent-ground mark${note}`, bbox: [x0, y0, x1, y1] };
  return { status: 'PASS', reason: `film's own brand colour(s) present (${(share * 100).toFixed(2)}% of frame), ring near-white ${(plate * 100).toFixed(0)}%${note}`, bbox: [x0, y0, x1, y1] };
}
