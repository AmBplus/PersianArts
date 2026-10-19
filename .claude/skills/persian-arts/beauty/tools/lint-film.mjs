#!/usr/bin/env node
// lint-film.mjs — static BEAUTY/CRAFT linter for html-film AND workbench-card film sources (persian-arts studio).
//
// Usage:
//   node .claude/skills/persian-arts/beauty/tools/lint-film.mjs <film.html | manifest.tsx | folder> [--json <out>] [--only <ids>] [--accents <n>] [--hero-floor <ratio>]
//
//   <folder> may be a film folder (containing film.html) or a folder of film folders; when no
//   film.html is found anywhere the folder is searched for workbench-card manifests instead.
//   --only  comma-separated ids or prefixes, e.g. --only purity  or  --only P01,T04,K01
//   --json  writes the full machine-readable result (every check, every finding) to <out>
//   --accents    accent-hue budget for the card lane (default 1)
//   --hero-floor hero type-band floor as a fraction of frame height (default 0.0917, the measured
//                library typography-poster median)
//
// LANES
//   html-film      a film.html with window.film.seek(t) — unchanged behaviour.
//   workbench-card a .ts/.tsx exporting a WorkbenchManifest (fps/width/height/total + a units array,
//                  or an import of cards/manifest). Such a film is spread over the manifest, the card
//                  sources it references and the library card sources it composes; all of those are
//                  resolved statically (imports followed, nothing executed) and linted as a UNION.
//
// CHECK LEVELS: PASS | WARN | FAIL | SKIP. SKIP means "this check could not evaluate anything here"
//   (wrong lane for the check, or nothing in the source to look at). SKIP is never counted as PASS:
//   a check that found nothing to look at must not report PASS.
//
// Exit code: 0 = no FAIL, 1 = at least one FAIL, 2 = usage/IO error.
//
// WHAT THIS IS: a source-level proxy for the craft defects diagnosed in
// media/briefs-local/storylab-craft/CRAFT-AUDIT.md (D1..D10), made mechanical because
// "a prose lesson is advisory; only a mechanical check is not".
// WHAT IT IS NOT: it cannot see the rendered frame, it cannot judge taste, it cannot
// measure lighting, hierarchy or composition. PASS means "none of the source patterns
// below were found", never "this film is good". bug-free != good.
//
// Zero dependencies, plain Node (>= 16), Windows-safe. No network, no writes except --json.

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------- CLI
const argv = process.argv.slice(2);
const optJson = valueOf('--json');
const optOnly = valueOf('--only');
const optAccents = valueOf('--accents');
const optHeroFloor = valueOf('--hero-floor');
const VALUE_FLAGS = ['--json', '--only', '--accents', '--hero-floor'];
function valueOf(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
}
const targets = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && VALUE_FLAGS.includes(argv[i - 1])));
if (!targets.length) {
  console.error('usage: node lint-film.mjs <film.html | manifest.tsx | folder> [--json <out>] [--only <ids>] [--accents <n>] [--hero-floor <ratio>]');
  process.exit(2);
}
const only = optOnly ? optOnly.split(',').map((s) => s.trim()).filter(Boolean) : null;

// ---------------------------------------------------------------------------- thresholds (STATED, calibrated on s08..s12 + rebuilt s10, 2026-10-17)
const TH = {
  // design system
  tokenMin: 8,          // CSS custom properties (or JS palette keys) below this = no token layer
  paletteKeysMin: 6,    // a single palette object counts as a token layer at >= 6 named colours
  typeRoleMin: 3,       // named roles (display/headline/deck/label/...). < this = WARN "no named scale"
  typeWeightMin: 2,     // at least two text roles must differ in WEIGHT (D2), not only in size
  // kit usage (measured facts: shader 0, spring 0, ltr() 0, camera 0 in 4 of 5 films)
  kitFamiliesFail: 1,   // <= 1 distinct kit family used = FAIL (the film reinvented everything)
  kitFamiliesWarn: 2,   // <= 2 distinct kit families = WARN
  fxMinSeconds: 12,     // shader check only applies to films >= 12 s
  // text-over-text proxy (source rectangles, NOT pixels)
  overlapFrac: 0.15,    // intersection / smaller-rect-area above this = WARN
  // workbench-card lane (C0x)
  accentBudget: 1,      // declared saturated accent hues allowed across a card-lane film; above = FAIL
  accentSatMin: 0.45,   // HSL saturation at/above which a colour counts as an accent hue
  typeBandMin: 0.0917,  // hero type band = fontSize / frameHeight; measured library typography-poster median
  unionMaxFiles: 40,    // unit-graph safety caps (static import following)
  unionMaxDepth: 3,
};
if (optAccents != null && Number.isFinite(Number(optAccents))) TH.accentBudget = Number(optAccents);
if (optHeroFloor != null && Number.isFinite(Number(optHeroFloor))) TH.typeBandMin = Number(optHeroFloor);

// ---------------------------------------------------------------------------- source scanner
// Strips comments (HTML, //, /* */) while respecting string literals, preserving line numbers.
function stripComments(src) {
  const out = src.split('');
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) { i++; break; }
        if (src[i] === '\n' && q !== '`') break; // unterminated single-line string
        i++;
      }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') { out[i] = ' '; i++; } continue; }
    if (c === '/' && src[i + 1] === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] !== '\n') out[i] = ' '; i++; }
      if (i < n) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === '<' && src.startsWith('<!--', i)) {
      while (i < n && !src.startsWith('-->', i)) { if (src[i] !== '\n') out[i] = ' '; i++; }
      if (i < n) { out[i] = ' '; out[i + 1] = ' '; out[i + 2] = ' '; i += 3; }
      continue;
    }
    i++;
  }
  return out.join('');
}
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;
const lineText = (raw, n) => (raw.split('\n')[n - 1] || '').trim();
const clip = (s, k = 120) => (s.length > k ? s.slice(0, k - 1) + '…' : s);

const FA = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const FA_DIGIT = /[\u06F0-\u06F9\u0660-\u0669]/;
const hasFa = (s) => FA.test(s);

// Extract the body of the frame renderer (the pure function of t) + the seek entry point.
function renderRegion(code) {
  const decl = /(?:function\s+(?:render|drawFrame|renderFrame|frame)\s*\(|(?:window\.)?film\.seek\s*=\s*(?:function\s*)?\(|(?:const|let|var)\s+(?:render|drawFrame)\s*=\s*(?:function\s*)?\()/g;
  let m, lo = Infinity, hi = -Infinity;
  while ((m = decl.exec(code))) {
    const brace = code.indexOf('{', m.index);
    if (brace < 0) continue;
    let depth = 0, i = brace, q = null;
    for (; i < code.length; i++) {
      const c = code[i];
      if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    lo = Math.min(lo, brace); hi = Math.max(hi, i);
  }
  if (lo === Infinity) return null;
  return { start: lo, end: hi, from: lineOf(code, lo), to: lineOf(code, hi) };
}
// Flatten a source span into statements (semicolon-terminated, line-numbered) for per-statement checks.
function statements(raw, from, to) {
  const lines = raw.split('\n');
  const out = [];
  let buf = '', startLine = from;
  for (let n = from; n <= Math.min(to, lines.length); n++) {
    const t = lines[n - 1];
    if (!buf) startLine = n;
    buf += (buf ? ' ' : '') + t;
    if (/[;{}]\s*$/.test(t) || buf.length > 600) { out.push({ line: startLine, text: buf }); buf = ''; }
  }
  if (buf) out.push({ line: startLine, text: buf });
  return out;
}
function headerText(raw) {
  const end = raw.indexOf('-->');
  if (end > 0 && end < 40000) return raw.slice(0, end);
  return raw.split('\n').slice(0, 140).join('\n');
}

// ---------------------------------------------------------------------------- lanes
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
function findRepoRoot() {
  const up = SCRIPT_DIR;
  const cands = [process.cwd(), path.resolve(up, '..', '..', '..', '..', '..')];
  for (const c of cands) if (fs.existsSync(path.join(c, 'work', 'persian', 'src', 'workbench'))) return c;
  return process.cwd();
}
const REPO_ROOT = findRepoRoot();
const DEMOS_ROOT = path.join(REPO_ROOT, 'work', 'persian', 'src', 'workbench', 'demosrc');
const isTsFile = (p) => /\.(tsx|ts)$/.test(p);
const skip = (reason) => ({ level: 'SKIP', note: reason, findings: [] });

// A workbench manifest: fps+width+height+total numbers AND a units array, or an import of cards/manifest.
function looksLikeManifest(text) {
  const importsManifest = /from\s+["'][^"']*cards\/manifest["']/.test(text) || /\bWorkbenchManifest\b/.test(text);
  const hasMeta = /\bfps\s*:\s*\d/.test(text) && /\bwidth\s*:\s*\d/.test(text) && /\bheight\s*:\s*\d/.test(text) && /\btotal\s*:\s*\d/.test(text);
  const hasUnits = /\b(shots|units|transitions|captions|overlays)\s*:\s*\[/.test(text);
  return (importsManifest && hasUnits) || (hasMeta && hasUnits);
}

function bracketSpan(text, i) {
  if (i < 0) return null;
  const open = text[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : ')';
  if (!'{[('.includes(open)) return null;
  let depth = 0, q = null;
  for (let k = i; k < text.length; k++) {
    const ch = text[k];
    if (q) { if (ch === '\\') { k++; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '/' && text[k + 1] === '/') { while (k < text.length && text[k] !== '\n') k++; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (!depth) return { start: i, end: k + 1 }; }
  }
  return null;
}
function topObjects(text, arrStart, arrEnd) {
  const out = [];
  let depth = 0, start = -1, q = null;
  for (let i = arrStart; i < arrEnd; i++) {
    const ch = text[i];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && text[i + 1] === '/') { while (i < arrEnd && text[i] !== '\n') i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '{') { if (!depth) start = i; depth++; }
    else if (ch === '}') { depth--; if (!depth && start >= 0) { out.push({ start, end: i + 1, text: text.slice(start, i + 1) }); start = -1; } }
  }
  return out;
}
function importSpecs(text) {
  const specs = [];
  for (const m of text.matchAll(/import\s+(?:type\s+)?[\s\S]{0,300}?from\s*["']([^"']+)["']/g)) specs.push(m[1]);
  for (const m of text.matchAll(/(?:^|\n)\s*import\s*["']([^"']+)["']/g)) specs.push(m[1]);
  return specs;
}
function resolveFile(base) {
  const tries = [base, base + '.tsx', base + '.ts', base + '.jsx', base + '.js',
    path.join(base, 'index.tsx'), path.join(base, 'index.ts'), path.join(base, 'index.jsx'), path.join(base, 'index.js')];
  for (const t of tries) { try { if (fs.statSync(t).isFile()) return path.resolve(t); } catch { /* keep trying */ } }
  return null;
}
function resolveSpec(spec, fromFile) {
  if (spec.startsWith('.')) return resolveFile(path.resolve(path.dirname(fromFile), spec));
  if (spec.startsWith('@demos/')) return resolveFile(path.join(DEMOS_ROOT, spec.slice('@demos/'.length)));
  return null; // bare package (react, remotion, ...) — not part of the film's own source
}
function buildUnitGraph(manifestFile) {
  const files = [path.resolve(manifestFile)];
  const seen = new Set(files);
  const missing = [];
  const queue = [{ f: files[0], depth: 0 }];
  let truncated = false;
  while (queue.length) {
    const cur = queue.shift();
    if (cur.depth >= TH.unionMaxDepth) continue;
    let text = '';
    try { text = fs.readFileSync(cur.f, 'utf8'); } catch { continue; }
    for (const spec of importSpecs(text)) {
      const own = spec.startsWith('.') || spec.startsWith('@demos/');
      const r = resolveSpec(spec, cur.f);
      if (!r) { if (own) missing.push({ spec, from: cur.f }); continue; }
      if (seen.has(r)) continue;
      if (files.length >= TH.unionMaxFiles) { truncated = true; continue; }
      seen.add(r); files.push(r); queue.push({ f: r, depth: cur.depth + 1 });
    }
  }
  return { files, missing, truncated };
}

function extractManifest(raw, file) {
  const missing = [];
  const exp = /export\s+const\s+[A-Za-z_$][\w$]*\s*(?::\s*[^=]+)?=\s*\{/.exec(raw);
  let body = raw, bodyStart = 0;
  if (exp) {
    const span = bracketSpan(raw, raw.indexOf('{', exp.index));
    if (span) { body = raw.slice(span.start, span.end); bodyStart = span.start; }
  }
  const num = (re) => { const m = body.match(re); return m ? Number(m[1]) : null; };
  const fps = num(/\bfps\s*:\s*(\d+(?:\.\d+)?)/);
  const width = num(/\bwidth\s*:\s*(\d+(?:\.\d+)?)/);
  const height = num(/\bheight\s*:\s*(\d+(?:\.\d+)?)/);
  const total = num(/\btotal\s*:\s*(\d+(?:\.\d+)?)/);
  if (fps == null) missing.push('fps');
  if (width == null) missing.push('width');
  if (height == null) missing.push('height');
  if (total == null) missing.push('total');
  if (!exp) missing.push('export const <manifest> = { ... }');
  const units = [];
  for (const key of ['shots', 'units', 'transitions', 'captions', 'overlays']) {
    const km = new RegExp('\\b' + key + '\\s*:\\s*\\[').exec(body);
    if (!km) continue;
    const arr = bracketSpan(body, body.indexOf('[', km.index));
    if (!arr) continue;
    for (const obj of topObjects(body, arr.start, arr.end)) {
      const t = obj.text;
      const g = (re) => { const m = t.match(re); return m ? m[1] : null; };
      const compSrc = g(/component\s*:\s*([^,\n]+)/) || '';
      const comps = [...compSrc.matchAll(/\b([A-Z][A-Za-z0-9_$]*)\b/g)].map((m) => m[1]).filter((n) => n !== 'React');
      units.push({
        kind: key,
        file,
        line: lineOf(raw, bodyStart + obj.start),
        id: g(/(?:^|[{,\s])id\s*:\s*["']([^"']+)["']/) || '',
        from: g(/\bfrom\s*:\s*(-?\d+(?:\.\d+)?)/) != null ? Number(g(/\bfrom\s*:\s*(-?\d+(?:\.\d+)?)/)) : null,
        duration: g(/\bduration\s*:\s*(\d+(?:\.\d+)?)/) != null ? Number(g(/\bduration\s*:\s*(\d+(?:\.\d+)?)/)) : null,
        accent: (g(/\baccent\s*:\s*([^,\n}]+)/) || '').trim() || null,
        cardId: g(/\bcardId\s*:\s*["']([^"']+)["']/),
        fontSize: g(/\bfontSize\s*:\s*(\d+(?:\.\d+)?)/) != null ? Number(g(/\bfontSize\s*:\s*(\d+(?:\.\d+)?)/)) : null,
        components: comps,
      });
    }
  }
  return { file, raw, body, fps, width, height, total, missing, units };
}

function declaredNames(units) {
  const s = new Set();
  for (const u of units) {
    for (const m of u.code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) s.add(m[1]);
    for (const m of u.code.matchAll(/import\s+(?:type\s+)?([\s\S]{0,300}?)\sfrom\s*["'][^"']+["']/g)) {
      const clause = m[1];
      const dflt = /^\s*([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(clause);
      if (dflt) s.add(dflt[1]);
      const braced = /\{([\s\S]*?)\}/.exec(clause);
      if (braced) for (const part of braced[1].split(',')) {
        const nm = part.trim().split(/\s+as\s+/).pop().trim();
        if (/^[A-Za-z_$][\w$]*$/.test(nm)) s.add(nm);
      }
    }
  }
  return s;
}

function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (h.length === 8) h = h.slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let s = 0, hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  return { h: hue, s, l };
}
function countCssVars(code) {
  const s = new Set();
  for (const m of code.matchAll(/--([A-Za-z][\w-]*)\s*:/g)) s.add(m[1]);
  return s;
}
function bestPalette(code) {
  let keys = 0, line = 0;
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{([\s\S]{0,4000}?)\n\s*\}/g)) {
    const body = m[2];
    const k = [...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:\s*["'`]?(?:#[0-9a-fA-F]{3,8}|rgba?\()/gm)].length;
    if (k > keys) { keys = k; line = lineOf(code, m.index); }
  }
  return { keys, line };
}
function perUnit(c, fn) {
  const out = [];
  for (const u of c.units) for (const h of (fn(u) || [])) out.push(Object.assign({ file: u.file }, h));
  return out;
}

// ---------------------------------------------------------------------------- checks
const CHECKS = [];
const def = (id, title, fn) => CHECKS.push({ id, title, fn });

// ---- purity ----------------------------------------------------------------
def('P01', 'purity: requestAnimationFrame for animation state', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): there is no film.seek(t) render body in this lane, so "rAF inside render" cannot be evaluated — frame purity here means "no unseeded clock/random", checked by C02');
  const f = [];
  const inRender = c.region && new RegExp('requestAnimationFrame').test(c.raw.slice(c.region.start, c.region.end));
  if (inRender) {
    const idx = c.raw.slice(c.region.start, c.region.end).indexOf('requestAnimationFrame');
    const ln = lineOf(c.raw, c.region.start + idx);
    f.push({ level: 'FAIL', line: ln, reason: 'requestAnimationFrame inside the render/seek body (frames must be a pure function of t, seek-able in any order)' });
  }
  const all = [...c.raw.matchAll(/requestAnimationFrame/g)];
  for (const m of all) {
    const ln = lineOf(c.raw, m.index);
    if (f.some((x) => x.line === ln)) continue;
    f.push({ level: 'WARN', line: ln, reason: 'requestAnimationFrame outside the render body — allowed ONLY as the human preview player; verify capture uses film.seek(t) (e.g. ' + clip(lineText(c.raw, ln), 70) + ')' });
  }
  if (!all.length && !inRender) return { level: 'PASS', findings: [] };
  const level = f.some((x) => x.level === 'FAIL') ? 'FAIL' : 'WARN';
  return { level, findings: f };
});

def('P02', 'purity: wall-clock time (Date.now / performance.now) in render', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): P02 tests wall-clock time INSIDE the seek render body; this lane has no such body — clock purity over the union is checked by C02');
  const scope = c.region ? c.raw.slice(c.region.start, c.region.end) : null;
  const base = c.region ? c.region.start : 0;
  const hits = [];
  for (const re of [/Date\.now\s*\(/g, /performance\.now\s*\(/g, /new\s+Date\s*\(\s*\)/g, /\bDate\.now\b/g]) {
    for (const m of (scope || c.raw).matchAll(re)) {
      const ln = lineOf(c.raw, base + m.index);
      if (!hits.some((h) => h.line === ln)) hits.push({ line: ln, what: m[0] });
    }
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return {
    level: c.region ? 'FAIL' : 'WARN',
    findings: hits.map((h) => ({ level: c.region ? 'FAIL' : 'WARN', line: h.line, reason: (c.region ? 'wall-clock time inside render' : 'wall-clock time (render region not located, whole-file scan)') + ': ' + h.what + ' — frames must not depend on the clock' })),
  };
});

def('P03', 'purity: unseeded Math.random in render', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): P03 tests Math.random INSIDE the seek render body; this lane has no such body — C02 scans the whole unit graph for it');
  const scope = c.region ? c.raw.slice(c.region.start, c.region.end) : c.raw;
  const base = c.region ? c.region.start : 0;
  const hits = [...scope.matchAll(/Math\.random\s*\(/g)];
  if (!hits.length) return { level: 'PASS', findings: [] };
  // A seeded generator (PA.rng / mulberry32) somewhere in the file does not excuse a raw call inside render.
  return {
    level: c.region ? 'FAIL' : 'WARN',
    findings: hits.map((m) => {
      const ln = lineOf(c.raw, base + m.index);
      return { level: c.region ? 'FAIL' : 'WARN', line: ln, reason: 'unseeded Math.random() in render (use PA.rng(seed) — same seed, same capture): ' + clip(lineText(c.raw, ln), 70) };
    }),
  };
});

def('P04', 'purity: remote asset URL', (c) => {
  if (c.lane === 'workbench-card') {
    const hits = perUnit(c, (u) => {
      const out = [];
      for (const m of u.code.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
        const url = m[0];
        const ns = /^https?:\/\/www\.w3\.org\//.test(url) || /^https?:\/\/schemas\./.test(url);
        out.push({ level: ns ? 'WARN' : 'FAIL', line: lineOf(u.raw, m.index), reason: (ns ? 'XML namespace (not fetched)' : 'remote asset URL') + ' — films must be self-contained, local assets only: ' + clip(url, 80) });
      }
      return out;
    });
    if (!hits.length) return { level: 'PASS', note: 'scanned ' + c.units.length + ' unit-graph file(s): no remote asset URL' };
    return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
  }
  const hits = [];
  for (const m of c.code.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
    const ln = lineOf(c.code, m.index);
    const url = m[0];
    // SVG/XML namespaces are not fetched; they are identifiers.
    const ns = /^https?:\/\/www\.w3\.org\//.test(url) || /^https?:\/\/schemas\./.test(url);
    hits.push({ level: ns ? 'WARN' : 'FAIL', line: ln, reason: (ns ? 'XML namespace (not fetched)' : 'remote asset URL') + ' — films must be self-contained, local assets only: ' + clip(url, 80) });
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
});

def('P05', 'purity: scroll-driven API', (c) => {
  const pats = [/addEventListener\s*\(\s*["']scroll["']/g, /\bscrollY\b/g, /\bscrollX\b/g, /\bscrollTop\b/g, /\bscrollLeft\b/g, /\bscrollIntoView\b/g, /\bIntersectionObserver\b/g];
  if (c.lane === 'workbench-card') {
    const hits = perUnit(c, (u) => {
      const out = [];
      for (const re of pats) for (const m of u.code.matchAll(re)) {
        const ln = lineOf(u.raw, m.index);
        if (!out.some((h) => h.line === ln)) out.push({ level: 'FAIL', line: ln, reason: 'scroll-driven state (' + m[0] + ') — a rendered film must not depend on scroll position' });
      }
      return out;
    });
    if (!hits.length) return { level: 'PASS', note: 'scanned ' + c.units.length + ' unit-graph file(s): no scroll-driven API' };
    return { level: 'FAIL', findings: hits };
  }
  const scope = c.region ? c.raw.slice(c.region.start, c.region.end) : c.raw;
  const base = c.region ? c.region.start : 0;
  const hits = [];
  for (const re of pats) for (const m of scope.matchAll(re)) {
    const ln = lineOf(c.raw, base + m.index);
    if (!hits.some((h) => h.line === ln)) hits.push({ level: 'FAIL', line: ln, reason: 'scroll-driven state (' + m[0] + ') — seek(t) must not depend on scroll position' });
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: 'FAIL', findings: hits };
});

// ---- Persian typography ----------------------------------------------------
def('T01', 'type: letter-spacing on Persian text', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): T01 is the html-film CSS/JS tracker check — in this lane the same rule (non-zero value only, per unit-graph file) is evaluated by C01');
  const hits = [];
  const re = /letter-?[Ss]pacing/g;
  for (const m of c.code.matchAll(re)) {
    const ln = lineOf(c.code, m.index);
    // window: the enclosing CSS rule (nearest braces) or the same statement in JS
    const st = statements(c.raw, Math.max(1, ln - 4), ln + 4).find((s) => new RegExp(re.source).test(s.text)) || { text: lineText(c.raw, ln), line: ln };
    const faHere = FA.test(st.text) || FA.test(lineText(c.raw, ln));
    hits.push({
      level: faHere ? 'FAIL' : 'WARN',
      line: ln,
      reason: (faHere ? 'letter-spacing applied where Persian text is present' : 'letter-spacing present (Latin-only tracking is legal; confirm no Persian run passes through this rule)') + ' — tracking breaks Persian letter joins (PERSIAN-LOCALIZATION-LESSONS.md)',
    });
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
});

def('T02', 'type: text stroke', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): T02 is the html-film stroke scan — in this lane the same rule is evaluated per unit-graph file by C01');
  const hits = [];
  for (const m of c.code.matchAll(/-webkit-text-stroke/g)) hits.push({ level: 'FAIL', line: lineOf(c.code, m.index), reason: '-webkit-text-stroke declared — a stroke on connected Persian glyphs destroys the joins' });
  for (const m of c.code.matchAll(/ctx\.strokeText\s*\(|\.strokeText\s*\(/g)) hits.push({ level: 'WARN', line: lineOf(c.code, m.index), reason: 'canvas strokeText() — outlined Persian is a legibility risk; if used for a Latin-only run, ignore' });
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
});

def('T03', 'type: per-character split of Persian', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): T03 is the html-film split scan — in this lane the same rule is evaluated per unit-graph file by C01');
  const hits = [];
  const lines = c.raw.split('\n');
  const pats = [
    { re: /\.split\s*\(\s*(["'`])\1\s*\)/g, wide: true },
    { re: /Array\.from\s*\(/g, wide: false, skip: /Array\.from\s*\(\s*\{/ },
    { re: /\[\s*\.\.\.[A-Za-z_$][\w$.]*\s*\]/g, wide: false },
  ];
  for (const p of pats) for (const m of c.code.matchAll(p.re)) {
    if (p.skip && p.skip.test(m[0])) continue;
    const ln = lineOf(c.code, m.index);
    const here = lines[ln - 1] || '';
    if (p.skip && p.skip.test(here)) continue;
    const win = p.wide ? lines.slice(Math.max(0, ln - 5), ln + 4).join(' ') : here;
    if (!FA.test(win)) continue;
    hits.push({ level: 'FAIL', line: ln, reason: 'per-character split (' + m[0].trim() + ') on/near Persian text — splitting a connected Persian string severs the joins and reverses glyph order' });
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: 'FAIL', findings: hits };
});

def('T04', 'type: Persian numerals not wrapped in an LTR isolate', (c) => {
  if (c.lane === 'workbench-card') {
    const DRAW = /(?:ctx\.)?(?:fillText|strokeText|txt)\s*\(/;
    const drawUnits = c.units.filter((u) => DRAW.test(u.code));
    if (!drawUnits.length) return skip('N/A (lane: workbench-card): no canvas/text-draw call site anywhere in the unit graph — the LTR-isolate rule has no call to inspect (JSX text is laid out by the browser)');
    const out = [];
    for (const u of drawUnits) {
      const lines = u.raw.split('\n');
      for (let n = 1; n <= lines.length; n++) {
        const line = lines[n - 1];
        if (!DRAW.test(line)) continue;
        const st = statements(u.raw, n, n + 4).find((s) => DRAW.test(s.text));
        if (!st) continue;
        const arg = firstArgOf(st.text, st.text.search(DRAW) + st.text.match(DRAW)[0].length);
        if (!/[\u06F0-\u06F9\u0660-\u0669]|[۰-۹]/.test(arg)) continue;
        if (/\bltr\s*\(|\biso\s*\(|LRI|PDI|ltrIso|dir\s*=\s*["']ltr["']/.test(st.text)) continue;
        out.push({ level: 'WARN', file: u.file, line: st.line, reason: 'Persian numeral run drawn with no LTR isolate — wrap in ltr()/iso() (U+2066..U+2069) so bidi does not reorder it: ' + clip(arg, 80) });
      }
    }
    if (!out.length) return { level: 'PASS', note: 'scanned ' + drawUnits.length + ' file(s) with draw calls: no un-isolated Persian numeral run' };
    return { level: 'WARN', findings: out };
  }
  const ISOL = /ltr\s*\(|\biso\s*\(|\bISO\b|LRI|PDI|NUM\s*\(|GROUP\s*\(|PCT\s*\(|\bltrIso\b|\\u2066|\\u2069|\u2066|\u2069|2066|2069|dir\s*=\s*["']ltr["']/;
  const DRAW = /(?:ctx\.)?(?:fillText|strokeText|txt)\s*\(/;
  const hits = [];
  const lines = c.raw.split('\n');
  // first top-level argument of a draw call (handles multi-line calls)
  const firstArg = (text, at) => {
    let depth = 0, q = null, out = '';
    for (let i = at; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '\\') { out += ch + (text[++i] || ''); continue; } if (ch === q) q = null; out += ch; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; out += ch; continue; }
      if ('([{'.includes(ch)) { depth++; out += ch; continue; }
      if (')]}'.includes(ch)) { if (depth === 0) break; depth--; out += ch; continue; }
      if (ch === ',' && depth === 0) break;
      out += ch;
    }
    return out;
  };
  for (let n = 1; n <= lines.length; n++) {
    const line = lines[n - 1];
    if (!DRAW.test(line)) continue;
    const st = statements(c.raw, n, n + 4).find((s) => DRAW.test(s.text));
    if (!st) continue;
    const call = st.text.match(DRAW);
    const arg = firstArg(st.text, call.index + call[0].length);
    if (!/faDigits\s*\(|[\u06F0-\u06F9\u0660-\u0669]|[۰-۹]/.test(arg)) continue;
    if (ISOL.test(st.text)) continue;
    const glued = /[%٪]|تومان|px|٬|:/.test(arg);
    hits.push({
      level: glued ? 'FAIL' : 'WARN',
      line: st.line,
      reason: (glued ? 'numeral run glued to a unit/separator with no LTR isolate' : 'numeral run drawn with no LTR isolate') + ' — wrap in ltr()/iso() (U+2066..U+2069) so bidi does not reorder it: ' + clip(arg, 80),
    });
    n = st.line;
  }
  // thin spaces outside an isolate (SKILL §4: U+2009/U+202F only inside the helper)
  for (const m of c.raw.matchAll(/\\u2009|\\u202F|\u2009|\u202F/g)) {
    const ln = lineOf(c.raw, m.index);
    const st = statements(c.raw, ln, ln + 2).find((s) => /2009|202F|\u2009|\u202F/.test(s.text)) || { text: lines[ln - 1] };
    if (ISOL.test(st.text)) continue;
    if (!hits.some((h) => h.line === ln)) hits.push({ level: 'WARN', line: ln, reason: 'thin space U+2009/U+202F outside an LTR isolate (SKILL §4)' });
  }
  if (!hits.length) return { level: 'PASS', findings: [] };
  return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
});
function firstArgOf(text, at) {
  let depth = 0, q = null, out = '';
  for (let i = at; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '\\') { out += ch + (text[++i] || ''); continue; } if (ch === q) q = null; out += ch; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; out += ch; continue; }
    if ('([{'.includes(ch)) { depth++; out += ch; continue; }
    if (')]}'.includes(ch)) { if (depth === 0) break; depth--; out += ch; continue; }
    if (ch === ',' && depth === 0) break;
    out += ch;
  }
  return out;
}

// ---- design system ---------------------------------------------------------
def('D01', 'design: declared token layer (CSS custom properties or one palette object)', (c) => {
  if (c.lane === 'workbench-card') {
    const vars = new Set();
    let pal = { keys: 0, line: 0, file: '' };
    for (const u of c.units) {
      for (const v of countCssVars(u.code)) vars.add(v);
      const p = bestPalette(u.code);
      if (p.keys > pal.keys) pal = { keys: p.keys, line: p.line, file: u.file };
    }
    const note = 'union scan of ' + c.units.length + ' file(s) | CSS custom properties: ' + vars.size + ' (threshold ' + TH.tokenMin + ')'
      + ' | largest palette object: ' + pal.keys + ' colour keys (threshold ' + TH.paletteKeysMin + ')'
      + (pal.file ? ' in ' + path.basename(pal.file) + (pal.line ? ':' + pal.line : '') : '');
    if (vars.size >= TH.tokenMin || pal.keys >= TH.paletteKeysMin) return { level: 'PASS', findings: [], note };
    return { level: 'FAIL', findings: [{ level: 'FAIL', file: c.file, line: 1, reason: 'no design-token layer anywhere in the unit graph — ' + note + ' (CRAFT-AUDIT.md ROOT CAUSE #3)' }] };
  }
  const cssVars = new Set([...c.code.matchAll(/--([A-Za-z][\w-]*)\s*:/g)].map((m) => m[1]));
  // a single JS palette object: const P = { name: "#hex", ... } with >= 6 hex/colour entries
  let palKeys = 0, palLine = 0;
  for (const m of c.code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{([\s\S]{0,4000}?)\n\s*\}/g)) {
    const body = m[2];
    const keys = [...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:#[0-9a-fA-F]{3,8}|rgba?\()/gm)].length;
    if (keys > palKeys) { palKeys = keys; palLine = lineOf(c.code, m.index); }
  }
  const ok = cssVars.size >= TH.tokenMin || palKeys >= TH.paletteKeysMin;
  if (ok) return { level: 'PASS', findings: [], note: 'CSS custom properties: ' + cssVars.size + ' | largest palette object keys: ' + palKeys };
  return {
    level: 'FAIL',
    findings: [{ level: 'FAIL', line: palLine || 1, reason: 'no design-token layer (CSS custom properties: ' + cssVars.size + ', threshold ' + TH.tokenMin + '; palette-object colour keys: ' + palKeys + ', threshold ' + TH.paletteKeysMin + ') — with no token layer there is no place to put a colour system, so each scene picks colours ad hoc (CRAFT-AUDIT.md ROOT CAUSE #3)' }],
  };
});

def('D02', 'design: key light declared in the film header', (c) => {
  if (c.lane === 'workbench-card') {
    // Re-pointed at the lane's real light source: a glow/gradient declaration with direction + colour + softness.
    const cands = [];
    for (const u of c.units) {
      const localConsts = [...u.code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*["'](#[0-9a-fA-F]{3,8})["']/g)].map((m) => ({ name: m[1], hex: m[2] }));
      const lines = u.raw.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/radial-gradient|linear-gradient|glow|key[\s-]?light|نورپردازی|bloom|lightSource|lights?\s*[:=]/i.test(line)) continue;
        const direction = /\bat\s|\d+%|\b(top|bottom|left|right|center)\b|glowX|glowY|direction|angle/i.test(line);
        const softness = /\d+(?:\.\d+)?\s*px|\bsoft\b|\bblur\b|falloff|transparent\s+\d/i.test(line);
        const colour = /#[0-9a-fA-F]{3,8}|rgba?\(/i.test(line) || localConsts.some((k) => new RegExp('\\b' + k.name + '\\b').test(line));
        cands.push({ file: u.file, line: i + 1, direction, softness, colour, text: clip(line.trim(), 90) });
      }
    }
    const full = cands.filter((x) => x.direction && x.softness && x.colour);
    if (full.length) {
      const best = full[0];
      return { level: 'PASS', findings: [], note: 'key light/glow declared at ' + rel(best.file) + ':' + best.line + ' with direction + colour + softness (declaration: ' + best.text + ')' };
    }
    if (cands.length) {
      return { level: 'WARN', findings: [{ level: 'WARN', file: cands[0].file, line: cands[0].line, reason: 'a glow/gradient is present but incomplete (missing: ' + ['direction', 'colour', 'softness'].filter((k) => !cands[0][k]).join(', ') + ') — BTY-LIGHT-001 needs direction + colour + softness: ' + cands[0].text }] };
    }
    return { level: 'FAIL', findings: [{ level: 'FAIL', file: c.file, line: 1, reason: 'no key light declared anywhere in the unit graph — CRAFT-AUDIT.md D1: every surface is lit by nothing; declare direction, colour and softness (BTY-LIGHT-001). Looked for a glow/gradient/key-light declaration in ' + c.units.length + ' file(s)' }] };
  }
  const h = headerText(c.raw);
  const idx = h.search(/\bKEY\b|key[\s-]?light|نور[ِ\s]*(?:کلید|اصلی)|نورپردازی/i);
  if (idx < 0) {
    return { level: 'FAIL', findings: [{ level: 'FAIL', line: 1, reason: 'no key light declared in the film header — CRAFT-AUDIT.md D1: every surface is lit by nothing; declare direction, colour and softness (BTY-LIGHT-001)' }] };
  }
  const near = h.slice(Math.max(0, idx - 60), idx + 220);
  const has = {
    direction: /\b(top|bottom|left|right|top-left|top-right|bottom-left|bottom-right|side|back|front)\b|بالا|پایین|راست|چپ|کنار/i.test(near),
    colour: /#[0-9a-fA-F]{3,8}|rgba?\(/i.test(near),
    softness: /\b(hard|soft|very soft|medium|diffuse)\b|نرم|سخت/i.test(near),
  };
  const missing = Object.entries(has).filter(([, v]) => !v).map(([k]) => k);
  if (!missing.length) return { level: 'PASS', findings: [], note: 'key light at line ' + lineOf(c.raw, idx) };
  return {
    level: 'WARN',
    findings: [{ level: 'WARN', line: lineOf(c.raw, idx), reason: 'key light declared but incomplete (missing: ' + missing.join(', ') + ') — BTY-LIGHT-001 needs direction + colour hex + softness' }],
  };
});

def('D03', 'design: type roles, at least two differing in WEIGHT', (c) => {
  const scope = c.lane === 'workbench-card' ? c.code : c.code;
  const rawScope = c.lane === 'workbench-card' ? c.raw : c.raw;
  const weights = new Set();
  const add = (re) => { for (const m of scope.matchAll(re)) weights.add(m[1]); };
  add(/font-weight\s*:\s*(\d{3})\s*[;}]/g);                                   // single-value CSS weight (not the "100 900" variable range)
  add(/(?:^|[^\w])(?:F|FONT|setFont|setType|font)\s*\(\s*(\d{2,3})\s*[,)\n]/g); // F(800, …)  setFont(700, …)
  add(/(?:weight|fontWeight)\s*:\s*(\d{2,3})/g);                              // {weight: 700}
  add(/`\s*(\d{2,3})\s+(?:\d+(?:\.\d+)?px|\$\{)/g);                           // `800 ${size}px PAHead`
  add(/["']\s*(\d{2,3})\s*["']\s*\+/g);                                       // "900 " + osz + "px PAHead"
  add(/(?:^|[^\w])txt\s*\([^,]*,[^,]*,[^,]*,[^,]*,\s*(\d{2,3})\s*,/g);        // txt(str,x,y,size,WEIGHT, …)
  const roleNames = new Set();
  for (const m of rawScope.matchAll(/\b(display|headline|deck|eyebrow|label|body|legal|lede|kicker|subtitle|numeral|button)\b/gi)) roleNames.add(m[1].toLowerCase());
  const wt = [...weights].map(Number).sort((a, b) => a - b);
  const note = 'distinct text weights: [' + wt.join(', ') + '] (n=' + wt.length + ', threshold ' + TH.typeWeightMin + ') | named type roles seen: ' + roleNames.size + ' [' + [...roleNames].join(', ') + ']'
    + (c.lane === 'workbench-card' ? ' | union scan of ' + c.units.length + ' file(s)' : '');
  if (wt.length < TH.typeWeightMin) {
    return { level: 'FAIL', findings: [{ level: 'FAIL', line: 1, reason: 'only ' + wt.length + ' distinct text weight(s) — CRAFT-AUDIT.md D2: hierarchy must differ in WEIGHT, not only in size. ' + note }] };
  }
  if (roleNames.size < TH.typeRoleMin) {
    return { level: 'WARN', findings: [{ level: 'WARN', line: 1, reason: 'no named type scale (' + roleNames.size + ' role names, threshold ' + TH.typeRoleMin + ') — name the roles (display/headline/deck/label/legal/numeral) so hierarchy is a stated relationship. ' + note }] };
  }
  return { level: 'PASS', findings: [], note };
});

// ---- kit usage -------------------------------------------------------------
def('K01', 'kit: usage counts and density', (c) => {
  const k = c.kit;
  const families = Object.entries(k).filter(([name, v]) => name !== 'total' && v > 0).map(([name]) => name);
  const total = k.total;
  const N = c.duration || 0;
  const note = 'N=' + (N ? N.toFixed(1) : '?') + 's | counts: fx/shader ' + k.fx + ', spring ' + k.spring + ', outBack/outExpo ' + k.overshoot + ', ltr()/iso ' + k.isolate + ', camera/pathFollow/hop ' + k.camera + ', wobble/drawOn ' + k.ink + ' | total ' + total + ' call(s), ' + families.length + ' distinct famil' + (families.length === 1 ? 'y' : 'ies') + ' [' + families.join(', ') + ']'
    + (c.lane === 'workbench-card' ? ' | counted over the whole unit graph (' + c.units.length + ' file(s))' : '');
  if (families.length <= TH.kitFamiliesFail) {
    return { level: 'FAIL', findings: [{ level: 'FAIL', line: 1, reason: 'a film of ' + (N ? N.toFixed(0) : '?') + ' s uses ' + families.length + ' kit famil' + (families.length === 1 ? 'y' : 'ies') + ' (FAIL threshold <= ' + TH.kitFamiliesFail + ') — the shipped kit is being reinvented. ' + note }] };
  }
  if (families.length <= TH.kitFamiliesWarn) {
    return { level: 'WARN', findings: [{ level: 'WARN', line: 1, reason: 'thin kit usage: ' + families.length + ' distinct families (WARN threshold <= ' + TH.kitFamiliesWarn + '). ' + note }] };
  }
  return { level: 'PASS', findings: [], note };
});

def('K02', 'kit: secondary action (spring / overshoot)', (c) => {
  const k = c.kit;
  if (k.spring + k.overshoot > 1) return { level: 'PASS', findings: [], note: 'spring ' + k.spring + ' + overshoot ' + k.overshoot };
  return { level: 'WARN', findings: [{ level: 'WARN', line: 1, reason: 'no secondary action: spring ' + k.spring + ', outBack/outExpo ' + k.overshoot + ' — physical arrivals need anticipation + overshoot + settle (CRAFT-AUDIT.md ROOT CAUSE: overshoot, anticipation and settle are all available and unused)' }] };
});

def('K03', 'kit: shader effect used via story', (c) => {
  if (!c.duration || c.duration < TH.fxMinSeconds) return { level: 'PASS', findings: [], note: 'n/a (< ' + TH.fxMinSeconds + ' s)' };
  if (c.kit.fx > 0) return { level: 'PASS', findings: [], note: 'fx/shader references: ' + c.kit.fx };
  return { level: 'WARN', findings: [{ level: 'WARN', line: 1, reason: 'no shader effect used (37-entry catalogue available via `pa fx find`) — measured across the batch: shader effects 0. A transition chosen by story is part of the standard, not optional decoration' }] };
});

// ---- text over text --------------------------------------------------------
def('X01', 'text: declared rectangle overlap (source proxy, NOT pixels)', (c) => {
  if (c.lane === 'workbench-card') return skip('N/A (lane: workbench-card): this lane declares no per-ratio text-rectangle LAYOUT table; the layout lives in JSX/CSS and cannot be read as rectangles here');
  const lines = c.raw.split('\n');
  const groups = [];
  let cur = null;
  const KEY = /["']?(9x16|16x9)["']?\s*:\s*\{/;
  for (let n = 1; n <= lines.length; n++) {
    const line = lines[n - 1];
    const g = line.match(KEY);
    if (g) { cur = { ratio: g[1], w: g[1] === '16x9' ? 1920 : 1080, entries: [] }; groups.push(cur); continue; }
    const e = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*\{([^{}]*)\}/);
    if (!e || !cur) continue;
    const body = e[2];
    const num = (k) => { const m = body.match(new RegExp('\\b' + k + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)')); return m ? parseFloat(m[1]) : null; };
    const size = num('size');
    const x = num('x');
    if (size == null || x == null) continue;
    const y = num('y') ?? 0;
    const w = num('maxW') ?? size * 6;
    cur.entries.push({ name: e[1], line: n, x, y, size, w, h: size * 1.5 });
  }
  const entries = groups.reduce((a, g) => a + g.entries.length, 0);
  if (!entries) {
    // FIX (vacuous PASS): with no parseable text rectangle there is nothing to compare — say so, do not PASS.
    return skip('no parseable declared text rectangle (found ' + groups.length + ' per-ratio table(s), 0 entries carrying both `size` and `x`) — nothing to compare, a PASS here would be vacuous');
  }
  const hits = [];
  for (const g of groups) {
    for (let i = 0; i < g.entries.length; i++) for (let j = i + 1; j < g.entries.length; j++) {
      const a = g.entries[i], b = g.entries[j];
      const ax = a.x - a.w / 2, ay = a.y - a.h / 2;
      const bx = b.x - b.w / 2, by = b.y - b.h / 2;
      const ix = Math.max(0, Math.min(ax + a.w, bx + b.w) - Math.max(ax, bx));
      const iy = Math.max(0, Math.min(ay + a.h, by + b.h) - Math.max(ay, by));
      const inter = ix * iy;
      if (inter <= 0) continue;
      const frac = inter / Math.min(a.w * a.h, b.w * b.h);
      if (frac < TH.overlapFrac) continue;
      const variant = a.x === b.x && a.w === b.w;
      hits.push({
        level: 'WARN',
        line: b.line,
        reason: 'declared text rectangles ' + g.ratio + ' overlap ' + (frac * 100).toFixed(0) + '%: "' + a.name + '" (line ' + a.line + ') vs "' + b.name + '" (line ' + b.line + ').' +
          (variant ? ' Same x and same maxW: most likely two mutually exclusive variants of ONE slot, so verify before acting.' : '') +
          ' SOURCE-LEVEL PROXY, not a pixel proof — if both entries are live on the same frame this is CRAFT-AUDIT.md D3 (live text over live text, the batch\'s worst failure); if they are exclusive variants of one slot, ignore it',
      });
    }
  }
  if (!hits.length) return { level: 'PASS', findings: [], note: 'no declared text rectangles overlap in the parsed per-ratio tables (' + entries + ' entries)' };
  return { level: 'WARN', findings: hits };
});

// ---- card lane: new decidable checks (C01..C05) ----------------------------
def('C01', 'persian-safety: tracking / per-char split / text-transform / stroke on Persian (card lane)', (c) => {
  if (c.lane !== 'workbench-card') return skip('N/A (lane: html-film): the html-film lane evaluates the same rules as T01/T02/T03 on the single film file');
  const hits = [];
  let faFiles = 0;
  for (const u of c.units) {
    const lines = u.raw.split('\n');
    if (FA.test(u.raw)) faFiles++;
    const win = (ln, r = 4) => lines.slice(Math.max(0, ln - 1 - r), ln + r).join(' ');
    // 1 · letter-spacing / letterSpacing with a NON-ZERO value
    for (const m of u.code.matchAll(/letter-?[Ss]pacing\s*[:=]\s*([^,;}\n)]+)/g)) {
      const val = (m[1] || '').trim();
      const ln = lineOf(u.raw, m.index);
      if (/^(0|0px|0em|0rem|0%|normal|["']0px?["']|["']normal["'])\b/.test(val)) continue;
      const faHere = FA.test(win(ln));
      hits.push({ level: faHere ? 'FAIL' : 'WARN', line: ln, file: u.file, reason: (faHere ? 'non-zero letter-spacing where Persian text is in scope' : 'non-zero letter-spacing (Latin-only tracking is legal; confirm no Persian run passes through this rule)') + ': ' + clip(val, 40) + ' — tracking breaks Persian letter joins' });
    }
    // 2 · per-character split of a Persian string
    const splitters = [
      { re: /\.split\s*\(\s*(["'`])\1\s*\)/g, wide: true, what: '' },
      { re: /Array\.from\s*\(/g, wide: false, what: 'Array.from(' },
      { re: /\[\s*\.\.\.[A-Za-z_$][\w$.]*\s*\]/g, wide: false, what: '' },
    ];
    for (const p of splitters) for (const m of u.code.matchAll(p.re)) {
      const ln = lineOf(u.raw, m.index);
      if (/Array\.from\s*\(\s*\{/.test(m[0]) || /Array\.from\s*\(\s*\{/.test(lines[ln - 1] || '')) continue;
      const text = p.wide ? win(ln, 5) : (lines[ln - 1] || '');
      if (!FA.test(text)) continue;
      hits.push({ level: 'FAIL', line: ln, file: u.file, reason: 'per-character split (' + m[0].trim() + ') on/near Persian text — splitting a connected Persian string severs the joins and reverses glyph order' });
    }
    // 3 · text-transform / textTransform
    for (const m of u.code.matchAll(/text-?[Tt]ransform\s*[:=]\s*([^,;}\n)]+)/g)) {
      const val = (m[1] || '').trim();
      const ln = lineOf(u.raw, m.index);
      if (/^(none|["']none["'])/.test(val)) continue;
      const faHere = FA.test(win(ln));
      hits.push({ level: faHere ? 'FAIL' : 'WARN', line: ln, file: u.file, reason: (faHere ? 'text-transform where Persian text is in scope' : 'text-transform present (Latin-only casing is legal; confirm no Persian run passes through this rule)') + ': ' + clip(val, 40) + ' — casing transforms are meaningless/destructive on Persian' });
    }
    // 4 · stroke
    for (const m of u.code.matchAll(/-webkit-text-stroke/g)) {
      const ln = lineOf(u.raw, m.index);
      hits.push({ level: FA.test(win(ln)) ? 'FAIL' : 'WARN', line: ln, file: u.file, reason: '-webkit-text-stroke declared — a stroke on connected Persian glyphs destroys the joins' });
    }
    for (const m of u.code.matchAll(/ctx\.strokeText\s*\(|\.strokeText\s*\(/g)) {
      const ln = lineOf(u.raw, m.index);
      hits.push({ level: FA.test(win(ln)) ? 'FAIL' : 'WARN', line: ln, file: u.file, reason: 'canvas strokeText() — outlined Persian is a legibility risk; if the run is Latin-only, ignore' });
    }
  }
  if (!faFiles) return skip('no Persian text anywhere in the ' + c.units.length + '-file unit graph — the Persian-safety rules have nothing to look at');
  if (!hits.length) return { level: 'PASS', findings: [], note: 'Persian-bearing file(s): ' + faFiles + '/' + c.units.length + '; no non-zero letter-spacing, no per-character split, no text-transform, no text stroke found' };
  return { level: hits.some((h) => h.level === 'FAIL') ? 'FAIL' : 'WARN', findings: hits };
});

def('C02', 'determinism: no unseeded Math.random() / Date.now() / performance.now() (card lane)', (c) => {
  if (c.lane !== 'workbench-card') return skip('N/A (lane: html-film): the html-film lane checks the render region in P02/P03');
  const hits = perUnit(c, (u) => {
    const out = [];
    const pats = [/Math\.random\s*\(/g, /Date\.now\s*\(/g, /performance\.now\s*\(/g, /new\s+Date\s*\(\s*\)/g];
    for (const re of pats) for (const m of u.code.matchAll(re)) {
      const ln = lineOf(u.raw, m.index);
      if (out.some((h) => h.line === ln)) continue;
      out.push({ level: 'FAIL', line: ln, reason: 'unseeded non-determinism in the render path: ' + m[0].replace(/\s+/g, '') + ' — same frame must render the same pixels (seed it, or read useCurrentFrame())' });
    }
    return out;
  });
  if (!hits.length) return { level: 'PASS', findings: [], note: 'scanned ' + c.units.length + ' unit-graph file(s): no Math.random() / Date.now() / performance.now() / new Date()' };
  return { level: 'FAIL', findings: hits };
});

def('C03', 'accent discipline: distinct saturated accent hues vs budget (card lane)', (c) => {
  if (c.lane !== 'workbench-card') return skip('N/A (lane: workbench-card only): the html-film lane has no declared per-unit accent field');
  const seen = new Map(); // hue bucket -> {hex, file, line, where}
  const add = (hex, file, line, where) => {
    const { h, s, l } = hexToHsl(hex);
    if (s < TH.accentSatMin || l < 0.12 || l > 0.88) return; // near-neutral: not an accent
    const bucket = Math.round(h / 15) * 15;
    if (!seen.has(bucket)) seen.set(bucket, { hex: hex.toLowerCase(), file, line, where, h, s, l });
  };
  const constHex = new Map();
  for (const u of c.units) for (const cm of u.code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*["'`](#[0-9a-fA-F]{3,8})["'`]/g)) constHex.set(cm[1], { hex: cm[2], file: u.file, line: lineOf(u.raw, cm.index) });
  const unresolvedAccent = [];
  for (const u of c.manifest.units) {
    if (!u.accent) continue;
    if (/^#/.test(u.accent)) { add(u.accent, u.file, u.line, 'manifest unit "' + u.id + '" accent'); continue; }
    const k = constHex.get(u.accent);
    if (k) { add(k.hex, k.file, k.line, 'constant ' + u.accent + ' used as the accent of manifest unit "' + u.id + '"'); continue; }
    unresolvedAccent.push({ level: 'WARN', file: u.file, line: u.line, reason: 'accent field "' + u.accent + '" on unit "' + u.id + '" is neither a hex literal nor a resolvable constant in the unit graph — the accent budget cannot be checked against it' });
  }
  const dir = path.dirname(path.resolve(c.file));
  for (const u of c.units) {
    if (path.dirname(path.resolve(u.file)) !== dir) continue; // film-local sources only; library cards carry their own palettes
    for (const m of u.code.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      const ln = lineOf(u.raw, m.index);
      add(m[0], u.file, ln, 'hex literal');
    }
  }
  const list = [...seen.values()].sort((a, b) => a.h - b.h);
  const note = 'threshold: ' + TH.accentBudget + ' distinct saturated accent hue(s) (--accents, default 1; HSL saturation >= ' + TH.accentSatMin + ', 15-degree hue buckets) | measured: ' + list.length
    + (list.length ? ' [' + list.map((x) => x.hex + ' h=' + Math.round(x.h) + ' at ' + rel(x.file) + ':' + x.line + ' (' + x.where + ')').join(', ') + ']' : '');
  if (unresolvedAccent.length) return { level: 'WARN', findings: unresolvedAccent, note: 'threshold: ' + TH.accentBudget + ' accent hue(s) | measured (resolved): ' + list.length + ' — some accent fields could not be resolved, so the budget is only partially checked' };
  if (list.length > TH.accentBudget) {
    return { level: 'FAIL', findings: list.map((x) => ({ level: 'FAIL', file: x.file, line: x.line, reason: 'accent hue ' + x.hex + ' (h=' + Math.round(x.h) + ', s=' + x.s.toFixed(2) + ') from ' + x.where + ' — ' + list.length + ' distinct accent hues for a budget of ' + TH.accentBudget + '; pick one accent and let it carry the film' })) };
  }
  if (!list.length) return skip('no saturated accent hue found in the manifest accents or the film-local sources — nothing to compare against the budget (' + TH.accentBudget + ')');
  return { level: 'PASS', findings: [], note };
});

def('C04', 'sanity: manifest duration/frame coverage + every card reference resolves (card lane)', (c) => {
  if (c.lane !== 'workbench-card') return skip('N/A (lane: workbench-card only)');
  const hits = [];
  const m = c.manifest;
  if (m.missing.length) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'manifest field(s) missing, so duration/timeline cannot be derived: ' + m.missing.join(', ') });
  const shots = m.units.filter((u) => u.kind === 'shots' || u.kind === 'units');
  if (!shots.length) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'no shot list found (looked for shots[]/units[] inside the exported manifest object)' });
  const noTime = shots.filter((u) => u.from == null || u.duration == null);
  if (noTime.length) hits.push({ level: 'FAIL', file: c.file, line: noTime[0].line, reason: noTime.length + ' shot(s) have no numeric from/duration (e.g. "' + noTime[0].id + '") — the timeline is not derivable' });
  const sumDur = shots.reduce((a, u) => a + (u.duration || 0), 0);
  const reach = shots.reduce((a, u) => Math.max(a, (u.from || 0) + (u.duration || 0)), 0);
  const first = shots.reduce((a, u) => Math.min(a, u.from == null ? Infinity : u.from), Infinity);
  const gaps = [];
  const ordered = shots.filter((u) => u.from != null && u.duration != null).sort((a, b) => a.from - b.from);
  for (let i = 1; i < ordered.length; i++) if (ordered[i].from !== ordered[i - 1].from + ordered[i - 1].duration) gaps.push(ordered[i - 1].id + ' ends ' + (ordered[i - 1].from + ordered[i - 1].duration) + ' vs ' + ordered[i].id + ' starts ' + ordered[i].from);
  const score = 'shots: ' + shots.length + ' | sum(duration) ' + sumDur + ' | max(from+duration) ' + reach + ' | manifest total ' + (m.total == null ? '?' : m.total) + ' | first from ' + (first === Infinity ? '?' : first) + ' | total/fps = ' + (c.duration ? c.duration.toFixed(2) + ' s' : 'n/a') + ' | transitions/captions/overlays: ' + (m.units.length - shots.length);
  if (m.total != null && sumDur !== m.total) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'sum of shot durations (' + sumDur + ') != manifest total (' + m.total + ') — ' + score });
  if (m.total != null && reach !== m.total) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'shots do not reach the manifest total: max(from+duration) ' + reach + ' vs total ' + m.total + ' — ' + score });
  if (gaps.length) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'shot timeline has gap(s)/overlap(s): ' + gaps.slice(0, 3).join('; ') + ' — ' + score });
  for (const ref of c.missingRefs) hits.push({ level: 'FAIL', file: ref.from, line: 1, reason: 'referenced source does not resolve on disk: "' + ref.spec + '" — the film will not build' });
  const declared = declaredNames(c.units);
  const unresolved = new Set();
  for (const u of m.units) for (const comp of u.components) if (!declared.has(comp)) unresolved.add(comp);
  for (const comp of unresolved) hits.push({ level: 'FAIL', file: c.file, line: 1, reason: 'unit component "' + comp + '" is not declared or imported anywhere in the unit graph — every referenced composition must exist' });
  const note = score + ' | unit-graph files: ' + c.units.length + ' | unresolved refs: ' + (hits.filter((h) => h.reason.startsWith('referenced source') || h.reason.startsWith('unit component')).length) + (c.graphTruncated ? ' | WARNING: unit graph truncated at ' + TH.unionMaxFiles + ' files' : '');
  if (hits.length) return { level: 'FAIL', findings: hits };
  return { level: 'PASS', findings: [], note };
});

def('C05', 'type scale: hero type band vs the measured library bar (card lane)', (c) => {
  if (c.lane !== 'workbench-card') return skip('N/A (lane: workbench-card only): the html-film lane declares a per-ratio type table, which X01/T04 read');
  if (!c.manifest.height) return skip('manifest has no `height`, so a type band relative to frame height cannot be computed (missing: height)');
  const heroes = c.manifest.units.filter((u) => u.fontSize != null);
  if (!heroes.length) return skip('no numeric fontSize prop on any manifest unit (' + c.manifest.units.length + ' units) — hero size is not stated anywhere the linter can read');
  const rated = heroes.map((u) => ({ u, ratio: u.fontSize / c.manifest.height })).sort((a, b) => b.ratio - a.ratio);
  const worst = rated[rated.length - 1];
  const note = 'hero floor ' + TH.typeBandMin + ' = measured library typography-poster median type-band ratio (fontSize / frameHeight ' + c.manifest.height + '; override with --hero-floor)'
    + ' | largest hero: ' + rated[0].u.id + ' ' + rated[0].u.fontSize + 'px = ' + rated[0].ratio.toFixed(4) + ' (' + (rated[0].ratio / TH.typeBandMin).toFixed(2) + 'x the floor)'
    + ' | smallest hero: ' + worst.u.id + ' ' + worst.u.fontSize + 'px = ' + worst.ratio.toFixed(4) + ' (' + (worst.ratio / TH.typeBandMin).toFixed(2) + 'x the floor)'
    + ' | measured units: ' + rated.length + '/' + c.manifest.units.length + ' (library cards size themselves and carry no fontSize prop)';
  const below = rated.filter((x) => x.ratio < TH.typeBandMin);
  if (!below.length) return { level: 'PASS', findings: [], note };
  const findings = below.map((x) => ({ level: 'WARN', file: c.file, line: x.u.line, reason: 'hero "' + x.u.id + '" fontSize ' + x.u.fontSize + 'px on a ' + c.manifest.height + 'px tall frame = type band ' + x.ratio.toFixed(4) + ', below the stated floor ' + TH.typeBandMin + ' (' + (TH.typeBandMin * c.manifest.height).toFixed(0) + 'px)' }));
  if (rated[0].ratio < TH.typeBandMin) return { level: 'FAIL', findings: findings.map((f) => Object.assign({}, f, { level: 'FAIL', reason: f.reason + ' — and no unit in the film reaches the floor, so the film has no hero type at all' })), note };
  return { level: 'WARN', findings, note };
});

// ---------------------------------------------------------------------------- runner
function rel(p) { return path.relative(process.cwd(), p).split(path.sep).join('/') || p; }
function gatherKit(code) {
  const count = (re) => [...code.matchAll(re)].length;
  const fx = count(/\bPA\.fx\b|pa-fx|createProgram|gl\.draw|\.fx\./g);
  const spring = count(/\bspring\s*\(|\bease\.spring\b/g);
  const overshoot = count(/\boutBack\b|\boutExpo\b|\boutElastic\b/g);
  const isolate = count(/\bltr\s*\(|\biso\s*\(|\bLRI\b|\bPDI\b|\bNUM\s*\(|\bGROUP\s*\(|\bPCT\s*\(|\\u2066|\\u2069|\u2066|\u2069/g);
  const camera = count(/\bcamera\s*\(|pathFollow|\bhop\s*\(|PA\.camera|pa-camera|\.zoom\s*\(/g);
  const ink = count(/\bwobble\s*\(|\bdrawOn\s*\(/g);
  return { fx, spring, overshoot, isolate, camera, ink, total: fx + spring + overshoot + isolate + camera + ink };
}
function durationSeconds(code) {
  const m = code.match(/\bDURATION\s*=\s*(\d+(?:\.\d+)?)/);
  const f = code.match(/\bFPS\s*=\s*(\d+(?:\.\d+)?)/);
  if (m && f) return parseFloat(m[1]) / parseFloat(f[1]);
  if (m) return parseFloat(m[1]) / 30;
  return 0;
}
function runChecks(ctx) {
  const checks = [];
  for (const chk of CHECKS) {
    if (only && !only.some((o) => o === chk.id || chk.id.startsWith(o) || chk.title.startsWith(o))) continue;
    let r;
    try { r = chk.fn(ctx); } catch (err) { r = { level: 'WARN', findings: [{ level: 'WARN', line: 0, reason: 'check crashed: ' + err.message }] }; }
    checks.push({ id: chk.id, title: chk.title, level: r.level, note: r.note || '', findings: r.findings || [] });
  }
  return checks;
}
function lintOne(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw);
  const region = renderRegion(code);
  const ctx = { lane: 'html-film', raw, code, region, file, units: null, duration: durationSeconds(code), kit: gatherKit(code) };
  const checks = [];
  for (const chk of CHECKS) {
    if (only && !only.some((o) => o === chk.id || chk.id.startsWith(o) || chk.title.startsWith(o))) continue;
    let r;
    try { r = chk.fn(ctx); } catch (err) { r = { level: 'WARN', findings: [{ level: 'WARN', line: 0, reason: 'check crashed: ' + err.message }] }; }
    checks.push({ id: chk.id, title: chk.title, level: r.level, note: r.note || '', findings: r.findings || [] });
  }
  return { file, duration: ctx.duration, kit: ctx.kit, region: region ? { from: region.from, to: region.to } : null, checks };
}
function lintCardLaneOne(file) {
  const abs = path.resolve(file);
  const graph = buildUnitGraph(abs);
  if (!graph.files.length) throw new Error('empty unit graph');
  const units = graph.files.map((f) => {
    const raw = fs.readFileSync(f, 'utf8');
    return { file: f, raw, code: stripComments(raw) };
  });
  const manifest = extractManifest(units[0].code, units[0].file);
  const duration = manifest.total != null && manifest.fps ? manifest.total / manifest.fps : 0;
  const raw = units.map((u) => u.raw).join('\n');
  const code = units.map((u) => u.code).join('\n');
  const ctx = {
    lane: 'workbench-card', raw, code, region: null, file: abs, units,
    manifest, missingRefs: graph.missing, graphTruncated: graph.truncated,
    duration, kit: gatherKit(code),
  };
  return {
    lane: 'workbench-card',
    file: abs,
    files: graph.files,
    duration,
    durationMissing: manifest.missing,
    manifestMeta: 'fps ' + manifest.fps + ', ' + manifest.width + 'x' + manifest.height + ', total ' + manifest.total + 'f',
    manifest: { fps: manifest.fps, width: manifest.width, height: manifest.height, total: manifest.total, declaredUnits: manifest.units.length, units: manifest.units },
    checks: runChecks(ctx),
  };
}

function findManifests(dir) {
  const out = [];
  const scan = (d) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isFile() || !isTsFile(e.name)) continue;
      const p = path.join(d, e.name);
      let txt = '';
      try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
      if (looksLikeManifest(txt)) out.push(p);
    }
  };
  scan(dir);
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) if (e.isDirectory()) scan(path.join(dir, e.name));
  return out.sort();
}
function renderedMediaCount(dir) {
  let n = 0;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isFile() && /\.(mp4|mov|webm|png|jpe?g|gif|wav|mp3)$/i.test(e.name)) n++;
  } catch { /* ignore */ }
  return n;
}
function collectJobs(targets) {
  const jobs = [];
  const notes = [];
  for (const t of targets) {
    const st = fs.existsSync(t) ? fs.statSync(t) : null;
    if (!st) { console.error('not found: ' + t); process.exit(2); }
    if (st.isFile()) {
      if (isTsFile(t)) {
        let text = '';
        try { text = fs.readFileSync(t, 'utf8'); } catch { /* read below fails loudly */ }
        if (looksLikeManifest(text)) { jobs.push({ lane: 'workbench-card', file: path.resolve(t) }); continue; }
      }
      jobs.push({ lane: 'html-film', file: t });
      continue;
    }
    const direct = path.join(t, 'film.html');
    if (fs.existsSync(direct)) { jobs.push({ lane: 'html-film', file: direct }); continue; }
    const htmlKids = [];
    for (const d of fs.readdirSync(t, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const p = path.join(t, d.name, 'film.html');
      if (fs.existsSync(p)) htmlKids.push(p);
    }
    if (htmlKids.length) { for (const p of htmlKids) jobs.push({ lane: 'html-film', file: p }); continue; }
    const man = findManifests(t);
    if (man.length) { for (const m of man) jobs.push({ lane: 'workbench-card', file: m }); continue; }
    const media = renderedMediaCount(t);
    notes.push('no lintable source in ' + rel(path.resolve(t)) + ': no film.html and no workbench manifest '
      + '(*.tsx/*.ts exporting fps+width+height+total with a units array) here or in an immediate subfolder'
      + (media ? ' — ' + media + ' rendered media file(s) present, i.e. output without source: there is nothing to lint' : ''));
  }
  jobs.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return { jobs, notes };
}

const { jobs, notes } = collectJobs(targets);
const results = jobs.map((j) => {
  try { return j.lane === 'workbench-card' ? lintCardLaneOne(j.file) : lintOne(j.file); }
  catch (e) { return { lane: j.lane, file: j.file, error: e.message, checks: [], kit: {}, duration: 0 }; }
});

// ---------------------------------------------------------------------------- report
let fails = 0, warns = 0, skips = 0;
for (const r of results) {
  console.log('');
  console.log('=== ' + rel(r.file) + (r.lane === 'workbench-card' ? '   [lane: workbench-card]' : ''));
  if (r.error) { console.log('  ERROR  could not read: ' + r.error); fails++; continue; }
  if (r.lane === 'workbench-card') {
    const dur = (r.duration ? r.duration.toFixed(2) + ' s' : 'unknown' + (r.durationMissing && r.durationMissing.length ? ' (manifest missing: ' + r.durationMissing.join(', ') + ')' : ''));
    console.log('  lane workbench-card  |  ' + r.manifestMeta + '  |  duration ' + dur + '  |  render region n/a (lane: workbench-card)');
    console.log('  unit graph: ' + r.files.length + ' file(s) — ' + r.files.map((f) => rel(f)).join(', '));
  } else {
    console.log('  duration ' + (r.duration ? r.duration.toFixed(2) + ' s' : 'unknown') + '  |  render region lines ' + (r.region ? r.region.from + '-' + r.region.to : 'NOT FOUND'));
  }
  for (const chk of r.checks) {
    const tag = chk.level === 'PASS' ? 'PASS' : chk.level === 'WARN' ? 'WARN' : chk.level === 'SKIP' ? 'SKIP' : 'FAIL';
    if (chk.level === 'FAIL') fails++; else if (chk.level === 'WARN') warns++; else if (chk.level === 'SKIP') skips++;
    const locF = chk.findings.find((f) => f.line) || null;
    const locFile = (locF && locF.file) || r.file;
    console.log('  ' + tag + '  ' + chk.id + '  ' + chk.title + (locF ? '  [' + rel(locFile) + ':' + locF.line + ']' : ''));
    if (chk.note) console.log('        · ' + chk.note);
    for (const f of chk.findings) {
      const l2 = f.line ? (f.file ? rel(f.file) + ':' + f.line + ': ' : 'line ' + f.line + ': ') : '';
      if (f.level === 'PASS') continue;
      console.log('        - ' + (f.level === 'FAIL' ? 'FAIL' : 'warn') + ' ' + l2 + f.reason);
    }
  }
}
for (const n of notes) console.log('NOTE  ' + n);
console.log('');
console.log('--- summary: ' + results.length + ' file(s), ' + fails + ' FAIL, ' + warns + ' WARN' + (skips ? ', ' + skips + ' SKIP' : '') + ' ---');
console.log('    cannot see: the rendered frame, taste, lighting, hierarchy in pixels, motion.');
console.log('    PASS means "no known source pattern found", never "this film is good". bug-free != good.');
if (skips) console.log('    SKIP means the check had nothing to evaluate (wrong lane or empty input), never a PASS.');
if (optJson) {
  const out = path.resolve(optJson);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ generated_note: 'static source-level lint; not a pixel proof', thresholds: TH, results }, null, 2));
  console.log('json written: ' + out);
}
process.exit(fails ? 1 : 0);
