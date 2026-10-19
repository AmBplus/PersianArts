// craft-src.mjs: tiny source-scanning helpers shared by the STATIC craft gates (C1 kit-usage, C2 token-check,
// C7 light-model (a) header-declaration half, C5 scene-variety's per-ratio/scene-form half).
//
// Only the film's OWN authoring files are scanned. The shipped kit (lib/pa-*.js) DEFINES the vocabulary, so counting
// its own definitions would make every film look like it uses everything; the kit directory and the various scratch
// dumps/caches are skipped by path. No dependency, same style as lib.mjs.
import fs from 'node:fs';
import path from 'node:path';

export const SRC_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.css']);
const SKIP_DIR = /^(lib|node_modules|\.git|_orig|_build|_ft|_dump|_tmp|_probe|_frames|fonts|assets)$/i;
const SKIP_FILE = /^(_dump|_tmp_dump|pa-selftest)/i;

export function scanSources(srcDir, cwd = process.cwd()) {
  const out = { dir: srcDir, files: [], skipped: [], error: null };
  if (!srcDir) { out.error = 'no source directory'; return out; }
  const abs = path.resolve(cwd, srcDir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) { out.error = `not a directory: ${srcDir}`; return out; }
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(p); else out.skipped.push(path.relative(abs, p)); continue; }
      if (!e.isFile()) continue;
      if (SKIP_FILE.test(e.name)) { out.skipped.push(path.relative(abs, p)); continue; }
      if (!SRC_EXT.has(path.extname(e.name).toLowerCase())) continue;
      let txt = '';
      try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
      out.files.push({ file: path.relative(cwd, p).replace(/\\/g, '/'), rel: path.relative(abs, p).replace(/\\/g, '/'), lines: txt.split(/\r?\n/), text: txt });
    }
  };
  walk(abs);
  out.files.sort((a, b) => a.rel.localeCompare(b.rel));
  return out;
}

// Count every regex hit in the scanned tree. `where` maps a hit to a file:line for the report.
export function countHits(scanned, specs) {
  const counts = {}, where = {};
  for (const s of specs) {
    counts[s.key] = 0; where[s.key] = [];
    for (const f of scanned.files) {
      for (let i = 0; i < f.lines.length; i++) {
        const line = f.lines[i];
        if (s.skip && s.skip.test(line)) continue;
        const m = line.match(s.re);
        if (!m) continue;
        const n = s.all ? m.length : 1;
        counts[s.key] += n;
        if (where[s.key].length < 6) where[s.key].push(`${path.basename(f.file)}:${i + 1}`);
      }
    }
  }
  return { counts, where };
}

// Strip a CSS custom-property DECLARATION (--name: value) from a line so the token-check does not count the token's
// own value as an ad-hoc colour. Keeps everything else on the line.
export function stripTokenDecls(line) {
  return line.replace(/--[A-Za-z0-9_-]+\s*:[^;"'}]*;?/g, '--TOKEN;');
}

// Colour literals in a line: hex, rgb()/rgba()/hsl()/hsla(). `&#8217;` (an HTML entity) is NOT a colour.
export const COLOUR_RE = /(?<![&\w-])(#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\))/g;
