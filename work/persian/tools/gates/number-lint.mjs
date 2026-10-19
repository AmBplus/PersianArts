// (e) number-lint (static, real files only). Scans the FILM'S OWN SOURCE (film.html, *.mjs, *.tsx, ...).
// Comments (HTML <!-- -->, /* */, //) are blanked out first, so storyboards/copy plans are not linted.
//
// Rules, both about bidi isolation of numbers/units in an RTL (Persian) text run:
//   high  bidi-mixed     : a number token (faDigits()/toFa()/faNum()/literal ۰-۹ run) AND a bidi-neutral or
//                          Latin-unit token (+/-/%, x/div/deg, mm, cm, kg, km, ml, ms) within 50 characters in
//                          the same expression, with no LTR isolate nearby. This is the s10 «±0٫02 mm» draw call,
//                          which renders as a scrambled sign/unit order.
//   warn  isolate-missing: an un-isolated number token with no neutral/unit neighbour. Reported, never hidden,
//                          but it does not by itself fail the film (Persian digits inside pure Persian text are fine).
//
// HONEST POLICY: run() reports filesScanned; run-gates FAILs (never PASSes) when --src was given but zero source
// files matched. What this gate CANNOT catch: it never looks at pixels, so it cannot see a number that is
// invisible (contrast/opacity), clipped, or reordered by anything other than source-level bidi (runtime CSS, a
// font's own glyph order, or a wrong value typed by hand). Render-level digits would need OCR: out of reach
// here, and therefore declared out of reach instead of reported as a pass.
import fs from 'node:fs';
import path from 'node:path';
export const name = 'number-lint';
const ISO = /<Ltr\b|<Bidi\b|<bdi\b|\bdir\s*[=:]\s*\{?["']ltr["']|unicodeBidi|isolate|\u2066|\u2067|\u2068|\u2069|\\u206[6-9]|data-ltr|direction\s*=\s*["']ltr["']|direction:\s*["']ltr["']|\b(LRI|RLI|FSI|PDI|LRE|RLE|PDF)\b|\biso\s*\(|\bbidi\w*\s*\(/;
const SEP = /[\u2009\u202F]|\\u2009|\\u202[fF]|\\u\{2009\}/;
const NUMTOK = /faDigits\s*\(|toFaDigits?\s*\(|faNum\s*\(|numFa\s*\(|persianDigits\s*\(|toPersianDigits\s*\(|[\u06F0-\u06F9\u0660-\u0669]{2,}/g;
// A bidi-relevant neutral token must be a QUOTED sign/symbol or a Latin unit word. A bare "+" or "=" is JS
// concatenation/assignment and would flag every string build, so it is deliberately not a neutral token.
const NEUTRALTOK = /["'`]\s*[\u00B1+\u2212-]\s*["'`]|["'`][^"'`\n]{0,4}[\u00B1%\u00D7\u00F7\u00B0][^"'`\n]{0,4}["'`]|\b(?:mm|cm|kg|km|ml|ms)\b/g;
const SKIP = /^\s*(\/\/|\*|\/\*|import\s)|const\s+PD\s*=|\[\\u06F0-\\u06F9|\[\u06F0-\u06F9\]|\.replace\(\/\[|Persian digit map|^\s*(export\s+)?(const|let|var)\s+\w*(DIGIT|digit)\w*\s*=/;
const EXT = /\.(html?|jsx?|tsx?|mjs|cjs|vue|svelte)$/i;
const SRC_EXT = /\.(tsx|jsx|ts|js|mjs|cjs|html?|vue|svelte)$/i;

// Blank out comments but keep every newline, so line numbers stay true.
export function stripComments(txt, isHtml) {
  let s = txt.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  if (isHtml) s = s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  return s;
}

function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(node_modules|\.git|_dev|dist|build|_dump)$/.test(e.name)) walk(p, out); }
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

// nearest distance (in characters) between any NUMTOK match and any NEUTRALTOK match on the same line
export function minNeutralGap(line) {
  const nums = [], neu = [];
  for (const m of line.matchAll(NUMTOK)) nums.push(m.index);
  for (const m of line.matchAll(NEUTRALTOK)) neu.push(m.index);
  if (!nums.length || !neu.length) return Infinity;
  let best = Infinity;
  for (const a of nums) for (const b of neu) best = Math.min(best, Math.abs(a - b));
  return best;
}

// Lint ONE source text (used by run() and by the self-test evidence). Returns the hits of that text.
export function lintText(txt, rel = '<text>', isHtml = false) {
  const hits = [];
  const L = stripComments(txt, isHtml).split(/\r?\n/);
  L.forEach((line, i) => {
    if (!line.trim() || SKIP.test(line)) return;
    if (ISO.test(L.slice(Math.max(0, i - 2), i + 2).join('\n'))) return;
    const hasCall = /[(\u06F0-\u06F9]/.test(line);
    const digitTok = /[\u06F0-\u06F9\u0660-\u0669]{2,}/.test(line) || /(faDigits|toFaDigits?|faNum|numFa|persianDigits|toPersianDigits)\s*\(/.test(line);
    const sep = SEP.test(line) && !/replace\(|THIN\s*=|const\s+\w*(THIN|SEP)\w*\s*=/.test(line);
    const gap = minNeutralGap(line);
    if (!digitTok && !sep && !(gap <= 50)) return;
    if (!hasCall) return; // pure data definitions (const X = "۸۴") are not rendered copy
    const high = gap <= 50;
    hits.push({
      file: rel, line: i + 1, text: line.trim().slice(0, 100),
      kind: high ? 'bidi-mixed' : sep ? 'separator' : 'isolate-missing',
      severity: high ? 'high' : 'warn',
      gap: Number.isFinite(gap) ? gap : null,
    });
  });
  return hits;
}

export function run(srcDir) {
  const exists = fs.existsSync(srcDir);
  const isDir = exists && fs.statSync(srcDir).isDirectory();
  const found = !exists ? [] : isDir ? walk(srcDir, []) : SRC_EXT.test(srcDir) ? [srcDir] : [];
  const hits = [];
  let filesScanned = 0;
  for (const f of found) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
    filesScanned++;
    const rel = path.relative(process.cwd(), f).split(path.sep).join('/');
    hits.push(...lintText(txt, rel, /\.html?$/i.test(f)));
  }
  return { srcDir, dirExisted: exists, filesFound: found.length, filesScanned, hits, high: hits.filter((h) => h.severity === 'high').length };
}
