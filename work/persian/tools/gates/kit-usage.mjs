// C1 kit-usage (static, --src): does the film actually use the vocabulary the studio ships?
//
// The five delivered v1 films were MEASURED with this checker (see CRAFT-GATES.md "calibration"): fx=0, spring=0,
// ltr()=0 in all five; camera 0 in four of five; wobble/drawOn 0 in all five; design tokens 0 in all five. That is a
// TRUE finding, not a threshold artefact, so the floors below are the minimum a film must use to count as authored
// with the kit at all: one shader effect, one spring, one ltr() isolate, one camera/path follow, one hand-drawn
// helper, two distinct named easings, one declared+used token. A film below ANY floor FAILs and the row prints the
// full count vector. Nothing here is lowered to make a film pass.
//
// WHAT IT CANNOT SEE: a film that hand-rolls an equivalent of a missed helper under another name (a private spring
// implementation counts as spring only if it is called `spring`); a shader effect driven from an external .mjs outside
// the scanned tree; a token DECLARED in a CSS file the film never loads. It counts API call sites, so it proves the
// vocabulary is referenced, not that the result looks good.
import path from 'node:path';
import { scanSources, countHits } from './craft-src.mjs';
export const name = 'kit-usage';

// calibrated floors (see header). `hand` = wobble|drawOn, `camera` = camera|pathFollow|hop.
export const FLOORS = { fx: 1, spring: 1, ltr: 1, camera: 1, hand: 1, easings: 2, tokens: 1 };

const DEF = /\b(const|let|var|function)\s+(fx|spring|ltr|camera|pathFollow|hop|wobble|drawOn|ease)\b/;
export const SPECS = [
  { key: 'fx', re: /\bPA\s*\.\s*fx\b|\bpa-fx(\.js)?\b|\bfx\s*\.\s*(create|register|registry|parseUniforms)\s*\(/g, skip: DEF },
  { key: 'spring', re: /\.spring\s*\(/g, skip: DEF },
  { key: 'outBack', re: /\boutBack\b/g },
  { key: 'outExpo', re: /\boutExpo\b/g },
  { key: 'ltr', re: /(?<![.\w])ltr\s*\(/g, skip: /\bltr\s*=\s*(s|v|str)\b|\bfunction\s+ltr\b|\bconst\s+ltr\b/ },
  { key: 'camera', re: /\bPA\s*\.\s*camera\b|\bpa-camera(\.js)?\b/g, skip: DEF },
  { key: 'pathFollow', re: /\bPA\s*\.\s*pathFollow\b|\bpathFollow\s*\(/g, skip: /\bconst\s+pathFollow\b|\bfunction\s+pathFollow\b/ },
  { key: 'hop', re: /\bPA\s*\.\s*hop\b|\bhop\s*\(/g, skip: /\bconst\s+hop\b|\bfunction\s+hop\b/ },
  { key: 'wobble', re: /\bPA\s*\.\s*wobble\b|\bwobble\s*\(/g, skip: /\bconst\s+wobble\b|\bfunction\s+wobble\b/ },
  { key: 'drawOn', re: /\bPA\s*\.\s*drawOn\b|\bdrawOn\s*\(/g, skip: /\bconst\s+drawOn\b|\bfunction\s+drawOn\b/ },
  { key: 'tokensDeclared', re: /--[A-Za-z][A-Za-z0-9_-]*\s*:/g },
  { key: 'tokensUsed', re: /var\(\s*--[A-Za-z][A-Za-z0-9_-]*/g },
];

// distinct + total named easings: `ease.<name>(` (pa-motion.js:9-12 exposes outCubic/outBack/outExpo/spring/...)
export function easingUsage(scanned) {
  const names = new Set(); let total = 0, where = [];
  const re = /\bease\s*\.\s*([A-Za-z][A-Za-z0-9_]*)/g;
  for (const f of scanned.files) for (let i = 0; i < f.lines.length; i++) {
    for (const m of f.lines[i].matchAll(re)) { names.add(m[1]); total++; if (where.length < 6) where.push(`${path.basename(f.file)}:${i + 1}`); }
  }
  return { names: [...names].sort(), total, where };
}

export function run(srcDir) {
  const scanned = scanSources(srcDir);
  if (scanned.error) return { error: scanned.error, filesScanned: 0 };
  const { counts, where } = countHits(scanned, SPECS);
  const eas = easingUsage(scanned);
  counts.easings = eas.names.length;
  counts.easingUses = eas.total;
  counts.cameraAll = counts.camera + counts.pathFollow + counts.hop;
  counts.hand = counts.wobble + counts.drawOn;
  counts.tokens = Math.min(counts.tokensDeclared, counts.tokensUsed);
  return { filesScanned: scanned.files.length, files: scanned.files.map((f) => f.rel), skipped: scanned.skipped, counts, where, easingNames: eas.names, easingWhere: eas.where };
}

// verdict(): which floors are missed. `only` limits the verdict to a subset of floors (used by the report).
export function verdict(r, opt = {}) {
  if (r.error) return { status: 'N/A', reason: `--src: ${r.error} (static check needs the film's own source dir)` };
  if (!r.filesScanned) return { status: 'N/A', reason: `--src ${r.dir || ''} contains no .html/.js/.css authoring file to scan` };
  const floors = opt.floors ?? FLOORS;
  const short = [];
  for (const [k, need] of Object.entries(floors)) if ((r.counts[k] ?? 0) < need) short.push(`${k} ${r.counts[k] ?? 0}<${need}`);
  const vec = ['fx', 'spring', 'ltr', 'cameraAll', 'hand', 'easings', 'tokens']
    .map((k) => `${k === 'cameraAll' ? 'camera' : k}=${r.counts[k] ?? 0}`).join(' ');
  return {
    status: short.length ? 'FAIL' : 'PASS',
    reason: `${r.filesScanned} files; ${vec}; named easings [${r.easingNames.join(',') || 'none'}]` +
      (short.length ? `; below floor: ${short.join(', ')}` : ''),
    counts: r.counts,
  };
}
