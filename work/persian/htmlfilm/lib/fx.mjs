// pa fx find "<text>" | list [--status verified] | check [--n 60] | demo
// find ranks docs/motion/fx/catalog.json entries by name/alias/family/description/use-case match (Persian and English queries) and prints the reasons.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(HERE, '../../../..');
const [cmd, ...rest] = process.argv.slice(2);
const norm = (s) => String(s).toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‍]/g, ' ').replace(/[ً-ٟ]/g, '').replace(/[^\p{L}\p{N} -]/gu, ' ').replace(/\s+/g, ' ').trim();
const cat = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/motion/fx/catalog.json'), 'utf8'));
if (cmd === 'find') {
  const q = norm(rest.join(' ')); const toks = q.split(' ').filter((t) => t.length > 1); if (!toks.length) { console.error('usage: pa fx find "<text>"'); process.exit(1); }
  const rows = [];
  for (const e of cat().entries) {
    let s = 0; const why = [];
    const al = e.aliases.map(norm); const desc = norm(e.description + ' ' + e.use_cases.join(' '));
    if (al.some((a) => a === q)) { s += 6; why.push('exact alias'); }
    for (const t of toks) {
      if (norm(e.technique).includes(t)) { s += 4; why.push(`name~${t}`); }
      else if (al.some((a) => a.includes(t) || t.includes(a))) { s += 3; why.push(`alias~${t}`); }
      if (norm(e.family) === t) { s += 2; why.push(`family ${e.family}`); }
      if (desc.includes(t)) { s += 1; why.push(`text~${t}`); }
    }
    if (s) rows.push({ s: s + (e.status === 'verified' ? 0.5 : 0), e, why: [...new Set(why)] });
  }
  rows.sort((a, b) => b.s - a.s);
  if (!rows.length) { console.log('no match; try: fade, wipe, wave, swirl, dissolve, glitch, pixel, fold, reveal, zoom (or Persian: موج، پیچش، متلاشی، مچاله، فرو ریختن)'); process.exit(0); }
  for (const r of rows.slice(0, 8)) console.log(`${r.e.technique.padEnd(18)} ${r.e.kind.padEnd(10)} ${r.e.family.padEnd(10)} ${r.e.status.padEnd(12)} score ${r.s.toFixed(1)}  [${r.why.join(', ')}]\n    ${r.e.description}${r.e.params.length ? '\n    params: ' + r.e.params.join(', ') : ''}`);
  console.log('\nuse: PA.fx.create(canvas,{width,height}).transition({from,to,shader:"<name>",progress}) or .effect({source,shader,t}); recipe: docs/motion/PLAYBOOK-BUILD-MOTION.md#image-fx. Choose by story, not novelty.');
} else if (cmd === 'list') {
  const st = rest.includes('--status') ? rest[rest.indexOf('--status') + 1] : null; const c = cat();
  for (const e of c.entries.filter((x) => !st || x.status === st)) console.log(`${e.technique.padEnd(18)} ${e.kind.padEnd(10)} ${e.family.padEnd(10)} ${e.status.padEnd(12)} ${e.measured.fps_540x960} fps`);
  console.log(`${c.entries.length} entries, ${c.entries.filter((x) => x.status === 'verified').length} verified (GL: ${c._meta.gl})`);
} else if (cmd === 'check') { const r = spawnSync('node', [path.join(HERE, 'fx-lab.mjs'), 'check', ...rest], { stdio: 'inherit' }); process.exit(r.status ?? 0); }
else if (cmd === 'demo') { const r = spawnSync('node', [path.join(HERE, 'fx-apply.mjs'), 'demo'], { stdio: 'inherit' }); process.exit(r.status ?? 0); }
else console.log('usage: pa fx find "<text>" | list [--status verified] | check | demo');
