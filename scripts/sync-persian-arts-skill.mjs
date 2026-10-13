#!/usr/bin/env node
// Mirrors ALL persian-arts* skills from .claude/skills/ into the Codex mirror .agents/skills/.
// Usage: node scripts/sync-persian-arts-skill.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, '.claude/skills');
const dstRoot = path.join(root, '.agents/skills');
const check = process.argv.includes('--check');

const skills = fs.readdirSync(srcRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('persian-arts') && fs.existsSync(path.join(srcRoot, d.name, 'SKILL.md')))
  .map((d) => d.name).sort();
if (!skills.length) { console.error('no persian-arts* skills found'); process.exit(2); }

let bad = 0;
for (const skill of skills) {
  const src = path.join(srcRoot, skill, 'SKILL.md');
  const dst = path.join(dstRoot, skill, 'SKILL.md');
  const rel = path.relative(root, src).split(path.sep).join('/');
  const text = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { console.error(rel + ': no frontmatter'); process.exit(2); }
  const name = (m[1].match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const description = (m[1].match(/^description:\s*(.+)$/m) || [])[1]?.trim();
  if (!name || !description) { console.error(rel + ': name/description missing'); process.exit(2); }
  const out = `---
name: ${name}
description: ${description}
---

<!-- GENERATED from ${rel} by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $${name}  (Claude Code: /${name} or the Skill tool)
${m[2].replace(/^\n+/, '\n')}`;
  if (check) {
    const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== out) { console.error('DIFF: ' + path.relative(root, dst).split(path.sep).join('/') + ' differs from canonical'); bad++; }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, out);
    console.log('wrote ' + path.relative(root, dst).split(path.sep).join('/'));
  }
}
if (check) {
  if (bad) { console.error(bad + ' skill(s) out of sync; run without --check'); process.exit(1); }
  console.log('OK: Codex mirror in sync (' + skills.length + ' skills)'); process.exit(0);
}
