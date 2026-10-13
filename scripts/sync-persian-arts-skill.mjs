#!/usr/bin/env node
// Generates the Codex mirror .agents/skills/persian-arts/SKILL.md from the canonical Claude skill.
// Usage: node scripts/sync-persian-arts-skill.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, '.claude/skills/persian-arts/SKILL.md');
const dst = path.join(root, '.agents/skills/persian-arts/SKILL.md');

const text = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) { console.error('canonical skill has no frontmatter'); process.exit(2); }
const fm = m[1];
const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
const description = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim();
if (!name || !description) { console.error('name/description missing'); process.exit(2); }

const out = `---
name: ${name}
description: ${description}
---

<!-- GENERATED from .claude/skills/persian-arts/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts <brief>  (Claude Code: /persian-arts <brief>)
${m[2].replace(/^\n+/, '\n')}`;

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8').replace(/\r\n/g, '\n') : null;
  if (cur === out) { console.log('OK: Codex mirror is in sync'); process.exit(0); }
  console.error('DIFF: ' + path.relative(root, dst) + ' differs from canonical; run without --check');
  process.exit(1);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, out);
console.log('wrote ' + path.relative(root, dst));
