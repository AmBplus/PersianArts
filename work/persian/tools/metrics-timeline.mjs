// Rebuilds the wall-clock timeline of one lead session from Claude Code transcripts and writes
// work/persian/status/metrics.json (read by the board panel "تفکیک زمان بر اساس فعالیت").
// Usage: node work/persian/tools/metrics-timeline.mjs [--session <id>] [--end <ISO>] [--out <path>]
// Defaults: newest session transcript of this project, end = last event, out = work/persian/status/metrics.json.
// Method: every wall-clock second is split evenly among the workers running in it; inside a worker, seconds
// covered by a tool call are classified by the command (render, npm, audio, search, git), the rest goes to the
// worker's own activity. Seconds with no worker go to "lead" (lead turn running) or "waiting" (nothing running).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const slug = root.replace(/[:\\/]/g, '-');
const tdir = arg('--dir', path.join(os.homedir(), '.claude', 'projects', slug));
const sess = arg('--session', fs.readdirSync(tdir).filter(f => f.endsWith('.jsonl'))
  .map(f => [f, fs.statSync(path.join(tdir, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0].replace('.jsonl', ''));
const out = arg('--out', path.join(root, 'work', 'persian', 'status', 'metrics.json'));
const read = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(e => e && e.timestamp);

const main = read(path.join(tdir, sess + '.jsonl')).filter(e => !e.isSidechain);
const S = Date.parse(main[0].timestamp);
const E = Date.parse(arg('--end', main[main.length - 1].timestamp));

// Activity of a whole worker, by its order description (first match wins).
const ACT = [
  [/blocked|P3 uni/i, 'blocked'], [/audit|locate/i, 'setup'], [/review of/i, 'review'], [/fix round/i, 'review'],
  [/creative brief|decision brief|status brief|record|fresh machine docs/i, 'docs'],
  [/board|status board|metering|stale board/i, 'dashboard'], [/checkpoint commit|git/i, 'git'],
  [/music|sfx|sound/i, 'audio'], [/first real|four ratios/i, 'render'], [/short cut|logo/i, 'build'],
  [/.*/, 'setup'],
];
// Tool calls, by command text.
const TOOL = [
  [/grep -rn "Uni9x16"|find \/c|Get-ChildItem C:\\Work -Recurse|-Recurse -Include \*\.js/i, 'search'],
  [/npm ci|unblock-smoke/i, 'npm'], [/remotion-cli|render_all|ffmpeg -v error -i .*contact/i, 'render'],
  [/make_short_sound|finish_short_sound|mix-final|music-bed/i, 'audio'], [/\bgit (add|commit|push)/i, 'git'],
];
const sub = path.join(tdir, sess, 'subagents');
const workers = [];
for (const f of fs.existsSync(sub) ? fs.readdirSync(sub).filter(x => x.endsWith('.jsonl')) : []) {
  const L = read(path.join(sub, f));
  if (!L.length) continue;
  let meta = {}; try { meta = JSON.parse(fs.readFileSync(path.join(sub, f.replace('.jsonl', '.meta.json')), 'utf8')); } catch {}
  const a = Date.parse(L[0].timestamp), b = Date.parse(L[L.length - 1].timestamp);
  if (a >= E) continue;
  const desc = meta.description || '';
  if (/precise metrics/i.test(desc)) continue; // this review itself
  const uses = {}, calls = [];
  for (const e of L) {
    if (e.type === 'assistant') for (const c of e.message?.content || []) if (c.type === 'tool_use') uses[c.id] = { t: Date.parse(e.timestamp), cmd: String(c.input?.command || '') };
    if (e.type === 'user' && Array.isArray(e.message?.content)) for (const c of e.message.content) if (c.type === 'tool_result' && uses[c.tool_use_id]) {
      const u = uses[c.tool_use_id]; const k = (TOOL.find(([r]) => r.test(u.cmd)) || [])[1];
      if (k) calls.push([u.t, Date.parse(e.timestamp), k]);
    }
  }
  workers.push({ id: f.slice(6, 14), desc, model: meta.model || '', a, b: Math.min(b, E), act: ACT.find(([r]) => r.test(desc))[1], calls });
}
// Lead turns: from each prompt (owner text or worker hand-back) to the lead's last event before the next prompt.
const isPrompt = e => e.type === 'user' && (typeof e.message?.content === 'string' || (e.message?.content || []).some(c => c.type === 'text'));
const lead = []; let open = null, last = null;
for (const e of main) { const t = Date.parse(e.timestamp); if (t > E) break;
  if (isPrompt(e)) { if (open !== null && last > open) lead.push([open, last]); open = t; last = null; } else if (e.type === 'assistant' || e.type === 'system' || e.type === 'user') last = t; }
if (open !== null && last > open) lead.push([open, last]);

const sec = {}; const add = (k, v) => { sec[k] = (sec[k] || 0) + v; };
const waits = []; let w0 = null;
for (let t = S; t < E; t += 1000) {
  const run = workers.filter(w => w.a <= t && t < w.b);
  if (run.length) { for (const w of run) { const c = w.calls.find(([x, y]) => x <= t && t < y); add(c ? c[2] : w.act, 1 / run.length); } }
  else if (lead.some(([x, y]) => x <= t && t < y)) add('lead', 1);
  else { add('waiting', 1); if (w0 === null) w0 = t; continue; }
  if (w0 !== null) { waits.push([w0, t]); w0 = null; }
}
if (w0 !== null) waits.push([w0, E]);
const LABEL = { render: 'رندر (استیل و ویدیو)', npm: 'نصب npm و bundle', audio: 'موسیقی، SFX و میکس', docs: 'نوشتن طرح، سند و گزارش',
  review: 'بازبینی و دور اصلاح', build: 'پیاده‌سازی کد فیلم', setup: 'قابل‌حمل‌سازی و راه‌اندازی', dashboard: 'ابزار تابلو و متر زمان',
  git: 'git و checkpoint', search: 'جست‌وجوی کند فایل', blocked: 'تلاش مسدودشده', lead: 'تصمیم و سفارش‌نویسی مدیر', waiting: 'انتظار برای مالک (بی‌کار)' };
const total = (E - S) / 1000;
const r1 = x => Math.round(x * 10) / 10;
const activities = Object.keys(LABEL).map(k => ({ id: k, label: LABEL[k], minutes: r1((sec[k] || 0) / 60), percent: r1((sec[k] || 0) / total * 100) }))
  .sort((x, y) => y.minutes - x.minutes);
const toolMinutes = {}; for (const w of workers) for (const [x, y, k] of w.calls) toolMinutes[k] = r1((toolMinutes[k] || 0) + (y - x) / 60000);
const workerMin = workers.reduce((s, w) => s + (w.b - w.a), 0) / 60000;
const res = {
  generatedAt: new Date().toISOString(), session: sess, windowStart: new Date(S).toISOString(), windowEnd: new Date(E).toISOString(),
  method: 'wall-clock seconds split evenly among concurrent workers; tool calls classified by command; source: Claude Code transcripts',
  wallMinutes: r1(total / 60), workerMinutes: r1(workerMin), orders: workers.length,
  leadTurnMinutes: r1(lead.reduce((s, [a, b]) => s + b - a, 0) / 60000),
  waits: waits.filter(([a, b]) => b - a >= 60000).map(([a, b]) => ({ from: new Date(a).toISOString(), to: new Date(b).toISOString(), minutes: r1((b - a) / 60000) })),
  activities, toolMinutes,
  workers: workers.sort((x, y) => x.a - y.a).map(w => ({ id: w.id, desc: w.desc, model: w.model, activity: w.act, start: new Date(w.a).toISOString(), minutes: r1((w.b - w.a) / 60000) })),
};
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(`wall ${res.wallMinutes} min, worker ${res.workerMinutes} min, orders ${res.orders}`);
for (const a of activities) console.log(String(a.minutes).padStart(6), String(a.percent).padStart(5) + '%', a.id);
for (const w of res.waits) console.log('wait', w.from.slice(11, 19), w.to.slice(11, 19), w.minutes);
