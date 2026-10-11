const fs = require('fs');
const doctrine = fs.readFileSync('work/persian/sound-task/doctrine-rules-1-11.txt', 'utf8').trim();

// (1) new memory file brain-and-hands-rule.md
const memDir = 'C:/Users/Amir/.claude/projects/D--P-project-persianArts/memory/';
const memFile = memDir + 'brain-and-hands-rule.md';
const memBody = [
  '---',
  'name: brain-and-hands-rule',
  'description: "Owner\'s philosophy: Claude is only the brain (decide/order/judge); GLM/Sol workers are hands, eyes and legs for ALL research, reading, writing, running and git"',
  'metadata:',
  '  type: feedback',
  '---',
  '',
  doctrine,
  '',
  '**Why:** owner insisted (2026-10-11) - the brain does not read files, search, or write; hands do.',
  '**How to apply:** before any tool call other than orders/reading short reports, ask \'is this a hand/eye/leg action?\' and if yes order a worker.',
  '',
  'Related: [[delegation-routing-rule]]',
  ''
].join('\n');
fs.writeFileSync(memFile, memBody, 'utf8');

// (2) MEMORY.md one line
const memoryMd = memDir + 'MEMORY.md';
let mm = fs.readFileSync(memoryMd, 'utf8');
if (!mm.includes('brain-and-hands-rule.md')) {
  if (!mm.endsWith('\n')) mm += '\n';
  mm += '- [Brain and hands rule](brain-and-hands-rule.md) — Claude is only the brain (decide/order/judge); workers do ALL research, reading, writing, running and git\n';
  fs.writeFileSync(memoryMd, mm, 'utf8');
}

// (3) delegation-routing-rule.md first paragraph points to [[brain-and-hands-rule]]
const drr = memDir + 'delegation-routing-rule.md';
let d = fs.readFileSync(drr, 'utf8');
const anchor = 'Claude (main session, Opus/Sonnet) makes every decision';
if (!d.includes('[[brain-and-hands-rule]]')) {
  if (!d.includes(anchor)) { console.error('drr anchor not found'); process.exit(1); }
  d = d.replace(anchor, 'This rule operates under the [[brain-and-hands-rule]]: Claude is only the brain; workers are hands, eyes and legs. ' + anchor);
}
fs.writeFileSync(drr, d, 'utf8');

console.log('memory files patched OK');
