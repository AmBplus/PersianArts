// C2 token-check (static, --src): a film must DECLARE its palette as a design-token layer (CSS custom properties, or
// one palette object) and must not paint with ad-hoc colour literals outside it.
//
// ART-DIRECTION-STANDARD.md §1 names six tokens (--ink/--page/--surface/--accent/--signal/--shadow-1..3) and states
// the current films declare ZERO, which is the mechanism by which palettes go ad hoc. So:
//   declared == 0                      -> FAIL  (no design-token layer exists; audit D5)
//   declared > 0 and outside > FLOOR    -> FAIL  (the layer exists but is bypassed)
//   declared > 0 and 0 < outside <= FLOOR -> WARN (a few legitimate one-off values)
//   declared > 0 and outside == 0       -> PASS
// FLOOR is calibrated on the five delivered v1 film sources (CRAFT-GATES.md).
//
// WHAT IT CANNOT SEE: a token layer that exists but is filled with six ad-hoc hues (the gate counts structure, not
// taste); a colour built by string concatenation or read from a JS object at runtime; a palette object that is not a
// literal (e.g. imported JSON). It also cannot tell a deliberate one-off from an accident: it names the file:line.
import path from 'node:path';
import { scanSources, stripTokenDecls, COLOUR_RE } from './craft-src.mjs';
export const name = 'token-check';

// calibrated: see CRAFT-GATES.md. Films that declare nothing are FAIL regardless of the literal count.
export const OUTSIDE_FLOOR = 12;

// A token layer is EITHER >= 3 CSS custom-property declarations, OR one JS palette object.
const PALETTE_OBJ = /(const|let|var)\s+(palette|tokens|PALETTE|TOKENS|colou?rs)\s*=\s*\{/;

export function run(srcDir) {
  const scanned = scanSources(srcDir);
  if (scanned.error) return { error: scanned.error, filesScanned: 0 };
  const tokens = [], outside = [], paletteObjs = [];
  let coloursTotal = 0;
  for (const f of scanned.files) {
    for (let i = 0; i < f.lines.length; i++) {
      const raw = f.lines[i];
      for (const m of raw.matchAll(/--([A-Za-z][A-Za-z0-9_-]*)\s*:\s*([^;"'}]+)/g)) tokens.push({ file: f.file, line: i + 1, name: m[1], value: m[2].trim() });
      if (PALETTE_OBJ.test(raw)) paletteObjs.push({ file: f.file, line: i + 1, decl: raw.trim().slice(0, 80) });
      const stripped = stripTokenDecls(raw);
      for (const m of stripped.matchAll(COLOUR_RE)) { coloursTotal++; if (outside.length < 40) outside.push({ file: f.file, line: i + 1, value: m[1], text: stripped.trim().slice(0, 90) }); }
    }
  }
  const names = [...new Set(tokens.map((t) => t.name))];
  return {
    filesScanned: scanned.files.length,
    declared: tokens.length, declaredNames: names, tokens: tokens.slice(0, 40), paletteObjs,
    outside, outsideCount: outside.length >= 40 ? coloursTotal - [...new Set()].length : coloursTotal,
    coloursTotal,
  };
}

export function verdict(r, opt = {}) {
  if (r.error) return { status: 'N/A', reason: `--src: ${r.error} (static check needs the film's own source dir)` };
  if (!r.filesScanned) return { status: 'N/A', reason: '--src contains no .html/.js/.css authoring file to scan' };
  const floor = opt.outsideFloor ?? OUTSIDE_FLOOR;
  const hasLayer = r.declared >= 3 || r.paletteObjs.length > 0;
  const eg = r.outside.slice(0, 4).map((o) => `${path.basename(o.file)}:${o.line} ${o.value}`).join('; ');
  if (!hasLayer) return { status: 'FAIL', reason: `no design-token layer (${r.declared} CSS custom-property declaration(s), 0 palette object); ${r.coloursTotal} ad-hoc colour literal(s); e.g. ${eg || 'none'}` };
  if (r.coloursTotal > floor) return { status: 'FAIL', reason: `token layer declared (${r.declaredNames.length} names: ${r.declaredNames.slice(0, 8).join(', ')}) but ${r.coloursTotal} colour literal(s) outside it > floor ${floor}; e.g. ${eg}` };
  if (r.coloursTotal > 0) return { status: 'WARN', reason: `token layer declared (${r.declaredNames.length} names); ${r.coloursTotal} colour literal(s) outside it <= floor ${floor}; e.g. ${eg}` };
  return { status: 'PASS', reason: `token layer declared (${r.declaredNames.length} names: ${r.declaredNames.slice(0, 8).join(', ')}); no colour literal outside it` };
}
