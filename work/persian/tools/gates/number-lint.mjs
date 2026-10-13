// (e) number-run lint (static). Flags source lines that emit Persian/Arabic-Indic digit runs or U+2009/U+202F thousands
// separators without an LTR isolate nearby (same line, 2 lines above, 1 below): <Ltr>, <Bidi>, <bdi>, dir="ltr",
// unicodeBidi isolate, U+2066. Heuristic: a wrapper two lines away that does not really contain the number is not detected.
import fs from 'node:fs';
import path from 'node:path';
export const name = 'number-lint';
const ISO = /<Ltr\b|<Bidi\b|<bdi\b|\bdir\s*[=:]\s*\{?["']ltr["']|unicodeBidi|isolate|⁦|\\u2066|data-ltr|direction:\s*["']ltr["']/;
const DIGITS = /[۰-۹٠-٩]/;
const SEP = /[  ]|\\u2009|\\u202[fF]|\\u\{2009\}/;
const SKIP = /^\s*(\/\/|\*|\/\*|import\s)|const\s+PD\s*=|\[\\u06F0-\\u06F9|\[۰-۹\]|\.replace\(\/\[|Persian digit map/;
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git/.test(e.name)) walk(p, out); }
    else if (/\.(tsx|jsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}
export function run(srcDir) {
  const files = fs.statSync(srcDir).isDirectory() ? walk(srcDir, []) : [srcDir];
  const hits = [];
  for (const f of files) {
    const L = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    L.forEach((line, i) => {
      if (SKIP.test(line)) return;
      const digit = DIGITS.test(line) && /[۰-۹٠-٩]{2,}/.test(line);
      const sep = SEP.test(line) && !/replace\(|THIN\s*=|const\s+\w*(THIN|SEP)\w*\s*=/.test(line);
      if (!digit && !sep) return;
      const ctx = L.slice(Math.max(0, i - 2), i + 2).join('\n');
      if (!ISO.test(ctx)) hits.push({ file: path.relative(process.cwd(), f).split(path.sep).join('/'), line: i + 1, kind: sep ? 'separator' : 'digits', text: line.trim().slice(0, 90) });
    });
  }
  return { filesScanned: files.length, hits };
}
