// Portability tools of persian-arts: doctor | bootstrap | sync | vault | todo | meter | metrics | track
//   node pa-portable.mjs <cmd> [args]     (called by work/persian/tools/pa.ps1)
// Repo root = PA_ROOT or three levels above this file. No absolute paths. No secrets are stored or printed.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.PA_ROOT ? path.resolve(process.env.PA_ROOT) : path.resolve(HERE, '../../../..');
const P = (...a) => path.join(ROOT, ...a);
const [cmd, ...rest] = process.argv.slice(2);
const flags = {}; const pos = [];
for (let i = 0; i < rest.length; i++) { const a = rest[i]; if (a.startsWith('--')) { const k = a.slice(2); const n = rest[i + 1]; if (n === undefined || n.startsWith('--')) flags[k] = true; else { flags[k] = n; i++; } } else pos.push(a); }
const now = () => new Date().toISOString();
const IS_WIN = process.platform === 'win32';
const run = (c, a, o = {}) => spawnSync(c, a, { encoding: 'utf8', cwd: ROOT, shell: false, ...o });
const has = (c, a = ['--version']) => { try { const r = run(c, a); return r.status === 0 ? ((r.stdout || r.stderr || '').split('\n')[0].trim()) : null; } catch { return null; } };
const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const appendJsonl = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.appendFileSync(f, JSON.stringify(o) + '\n'); };
const venvPy = (v) => (IS_WIN ? path.join(v, 'Scripts', 'python.exe') : path.join(v, 'bin', 'python'));
const PYTHON = () => has('python3') ? 'python3' : has('python') ? 'python' : null;
const table = (rows) => { const w = [0, 0, 0]; rows.forEach((r) => r.forEach((c, i) => { if (i < 2) w[i] = Math.max(w[i], String(c).length); })); rows.forEach((r) => console.log(`${String(r[0]).padEnd(w[0])}  ${String(r[1]).padEnd(w[1])}  ${r[2] ?? ''}`)); };

// ---------------- doctor ----------------
function doctor(quick) {
  const R = [];
  const add = (name, status, fix) => R.push([status, name, fix || '']);
  const g = has('git'); add('git', g ? 'PASS' : 'FAIL', g ? g : 'install git: https://git-scm.com');
  const n = has('node'); add('node >= 20', n && +/v(\d+)/.exec(n)[1] >= 20 ? 'PASS' : 'FAIL', n || 'install Node 20+: https://nodejs.org');
  const py = PYTHON(); const pv = py && has(py, ['--version']); const pm = pv && /(\d+)\.(\d+)/.exec(pv);
  add('python >= 3.12', pm && (+pm[1] > 3 || (+pm[1] === 3 && +pm[2] >= 12)) ? 'PASS' : 'FAIL', pv || 'install Python 3.12+');
  for (const t of ['ffmpeg', 'ffprobe']) { const v = has(t, ['-version']); add(t, v ? 'PASS' : 'FAIL', v ? v.slice(0, 40) : 'install ffmpeg (winget install Gyan.FFmpeg | brew install ffmpeg | apt install ffmpeg)'); }
  const opens = has('openssl', ['version']); add('openssl (optional, vault uses node crypto)', opens ? 'PASS' : 'WARN', opens || 'optional');
  const wb = P('work/persian/src/workbench');
  add('workbench node_modules', fs.existsSync(path.join(wb, 'node_modules')) ? 'PASS' : 'WARN', 'pwsh -File work/persian/tools/pa.ps1 bootstrap');
  let chrome = false; const rem = path.join(wb, 'node_modules/.remotion');
  if (fs.existsSync(rem)) chrome = fs.readdirSync(rem).some((d) => /chrome-headless-shell/.test(d));
  add('Remotion chrome-headless-shell', chrome ? 'PASS' : 'WARN', '(cd work/persian/src/workbench && npx remotion browser ensure)');
  add('assets tools node_modules (svgo)', fs.existsSync(P('work/persian/tools/assets/node_modules')) ? 'PASS' : 'WARN', '(cd work/persian/tools/assets && npm ci)');
  for (const v of ['sound/.venv', 'work/persian/tools/assets/.venv']) {
    const ex = venvPy(P(v));
    if (!fs.existsSync(ex)) { add('venv ' + v, 'WARN', 'pa bootstrap (python -m venv ' + v + ' && pip install -r requirements-pa.txt)'); continue; }
    const r = run(ex, ['-c', 'import numpy' + (v.startsWith('sound') ? ',scipy,librosa,soundfile' : '')]);
    add('venv ' + v + (v.startsWith('sound') ? ' (numpy scipy librosa soundfile)' : ' (numpy)'), r.status === 0 ? 'PASS' : 'WARN', ex + ' -m pip install -r requirements-pa.txt');
  }
  // fonts referenced by sources
  const need = new Set(); const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(ts|tsx|mjs|css|html)$/.test(e.name)) { const t = fs.readFileSync(f, 'utf8'); for (const m of t.matchAll(/fonts\/([A-Za-z0-9_.-]+\.(?:ttf|otf|woff2?))/g)) need.add(m[1]); } } };
  if (!quick && fs.existsSync(P('work/persian/src'))) walk(P('work/persian/src'));
  if (!quick) { const have = fs.existsSync(P('work/persian/assets/fonts')) ? new Set(fs.readdirSync(P('work/persian/assets/fonts'))) : new Set(); const miss = [...need].filter((f) => !have.has(f)); add(`fonts referenced by sources (${need.size})`, miss.length ? 'WARN' : 'PASS', miss.length ? `missing in work/persian/assets/fonts: ${miss.slice(0, 5).join(', ')}${miss.length > 5 ? ' ...' : ''} (restore from the owner font folder; see docs/motion/PORTABILITY.md)` : ''); }
  // kit
  const catF = P('sound/library/kit/catalog.json');
  if (fs.existsSync(catF)) { const cat = JSON.parse(fs.readFileSync(catF, 'utf8')); let miss = 0; for (const e of cat.entries) if (!fs.existsSync(P('sound/library/kit', e.path.replace(/^sound\/library\/kit\//, '')))) miss++; const mus = fs.readdirSync(P('sound/library/kit/music')).filter((f) => f.endsWith('.music.json')).length; add(`kit: ${cat.entries.length} sfx catalogued, ${mus} music maps`, miss ? 'FAIL' : 'PASS', miss ? `${miss} sfx files missing: pwsh -File sound/tools/restore_library.ps1` : ''); }
  else add('kit catalog', 'FAIL', 'git checkout -- sound/library/kit');
  for (const e of ['work/persian/.freesound.env', 'work/persian/.jamendo.env']) add('env file ' + e + ' (optional, fills the sfx/music library)', fs.existsSync(P(e)) ? 'PASS' : 'WARN', 'copy ' + e.replace('.env', '.env.example') + ' to ' + e + ' and fill your own key');
  add('env PA_VAULT_PASS (vault passphrase, name only)', process.env.PA_VAULT_PASS ? 'PASS' : 'WARN', 'set PA_VAULT_PASS in your shell before pa vault pack/unpack');
  const qh = process.env.PA_QH || 'qh'; add('qh (optional worker hub)', has(qh, ['--version']) || has(qh, ['help']) ? 'PASS' : 'WARN', 'optional; without it use the Agent/studio flow (docs/motion/PORTABILITY.md)');
  try { const free = fs.statfsSync(ROOT); const gb = (free.bavail * free.bsize) / 1e9; add(`disk free ${gb.toFixed(1)} GB`, gb > 5 ? 'PASS' : gb > 1 ? 'WARN' : 'FAIL', 'free disk space (renders need ~5 GB)'); } catch { /* old node */ }
  add('git remote is SSH', /git@github\.com/.test(run('git', ['remote', 'get-url', 'origin']).stdout || '') ? 'PASS' : 'WARN', 'git remote set-url origin git@github.com:AmBplus/PersianArts.git');
  const cnt = { PASS: 0, WARN: 0, FAIL: 0 }; R.forEach((r) => cnt[r[0]]++);
  console.log(`PA DOCTOR  (${ROOT})`); table(R.map((r) => [r[0], r[1], r[2] && r[0] !== 'PASS' ? 'fix: ' + r[2] : '']));
  console.log(`\nPASS ${cnt.PASS}  WARN ${cnt.WARN}  FAIL ${cnt.FAIL}`);
  return cnt.FAIL ? 1 : 0;
}

// ---------------- bootstrap ----------------
function bootstrap() {
  const dry = !!flags['dry-run']; const steps = [];
  const py = PYTHON(); const wb = P('work/persian/src/workbench'); const at = P('work/persian/tools/assets');
  const S = (label, c, a, cwd) => steps.push({ label, c, a, cwd });
  if (py) { for (const v of ['sound/.venv', 'work/persian/tools/assets/.venv']) { if (!fs.existsSync(venvPy(P(v)))) S('create venv ' + v, py, ['-m', 'venv', P(v)]); S('pip install -r requirements-pa.txt in ' + v, venvPy(P(v)), ['-m', 'pip', 'install', '-q', '-r', P('requirements-pa.txt')]); } }
  if (!fs.existsSync(path.join(wb, 'node_modules'))) S('npm ci (workbench)', IS_WIN ? 'npm.cmd' : 'npm', ['ci'], wb);
  if (!fs.existsSync(path.join(at, 'node_modules'))) S('npm ci (assets tools)', IS_WIN ? 'npm.cmd' : 'npm', ['ci'], at);
  S('Remotion browser', IS_WIN ? 'npx.cmd' : 'npx', ['remotion', 'browser', 'ensure'], wb);
  S('kit verify', 'pwsh', ['-File', P('sound/tools/restore_library.ps1')]);
  for (const s of steps) {
    console.log((dry ? '[dry-run] ' : '> ') + s.label);
    if (dry) continue;
    const r = spawnSync(s.c, s.a, { cwd: s.cwd || ROOT, stdio: 'inherit', shell: IS_WIN && /\.cmd$/.test(s.c) });
    if (r.status !== 0) console.log(`  WARN step failed (${s.label}); run doctor for the exact fix`);
  }
  console.log('> doctor'); return doctor(false);
}

// ---------------- sync ----------------
function sync() {
  if (!flags['no-pull']) { console.log('> git pull --ff-only'); const r = run('git', ['pull', '--ff-only'], { stdio: 'inherit' }); if (r.status !== 0) console.log('WARN pull failed (offline, auth or diverged): fix before working; nothing was changed.'); }
  console.log('> doctor (quick)'); doctor(true);
  console.log('\n> RESUME (head)'); const rf = P('docs/motion/RESUME.md'); if (fs.existsSync(rf)) console.log(fs.readFileSync(rf, 'utf8').split('\n').slice(0, 14).join('\n'));
  console.log('\n> TODO next 10'); todoList({ limit: 10, open: true });
  console.log('\n> metrics (7 days)'); metrics(7, true);
  console.log('\n> deliver --list'); const r2 = run('node', [P('work/persian/tools/deliver/deliver.mjs'), '--list']); console.log(r2.stdout.split('\n').slice(0, 14).join('\n'));
}

// ---------------- todo ----------------
const TF = P('docs/motion/todo.jsonl'); const TM = P('docs/motion/TODO.md');
const loadTodo = () => readJsonl(TF);
const saveTodo = (items) => { fs.writeFileSync(TF, items.map((i) => JSON.stringify(i)).join('\n') + '\n'); renderTodoMd(items); };
function renderTodoMd(items) {
  const sec = (title, f) => { const l = items.filter(f); return `## ${title}\n` + (l.length ? l.map((i) => `- [${i.status === 'done' ? 'x' : ' '}] ${i.id} ${i.title} (${i.owner}${i.est_minutes ? ', est ' + i.est_minutes + ' min' : ''}${i.actual_minutes ? ', actual ' + i.actual_minutes : ''})${i.links?.length ? ' - ' + i.links.join(', ') : ''}`).join('\n') : '- (none)') + '\n'; };
  const today = now().slice(0, 10);
  fs.writeFileSync(TM, `# TODO (living; generated from todo.jsonl by \`pa todo\`; edit through the tool)\nAfter every completed task the lead orders \`pa todo done <id>\` plus a checkpoint commit.\n\n` +
    [sec('Now', (i) => i.status === 'now'), sec('Next', (i) => i.status === 'next'), sec('Waiting for owner', (i) => i.status === 'waiting-owner'), sec('Done today', (i) => i.status === 'done' && (i.updated || '').startsWith(today))].join('\n'));
}
function todoList(o = {}) {
  const items = loadTodo(); const order = { now: 0, next: 1, 'waiting-owner': 2, done: 3 };
  let l = items.filter((i) => (o.open ? i.status !== 'done' : true)).sort((a, b) => order[a.status] - order[b.status]);
  if (o.limit) l = l.slice(0, o.limit);
  for (const i of l) console.log(`${i.id.padEnd(12)} ${i.status.padEnd(14)} ${i.owner.padEnd(7)} ${String(i.est_minutes ?? '-').padStart(4)}m  ${i.title}`);
  if (!l.length) console.log('(no open items)');
}
function todo() {
  const [sub, ...a] = pos; const items = loadTodo();
  if (sub === 'add') {
    const title = a.join(' '); if (!title) return console.error('usage: pa todo add <title> [--owner lead|studio|owner] [--status now|next|waiting-owner] [--est 20] [--links a,b]');
    const n = items.length + 1; const id = flags.id || 'T' + String(n).padStart(3, '0');
    items.push({ id, title, status: flags.status || (flags.owner === 'owner' ? 'waiting-owner' : 'next'), owner: flags.owner || 'lead', est_minutes: flags.est ? +flags.est : null, actual_minutes: null, created: now(), updated: now(), links: flags.links ? String(flags.links).split(',') : [] });
    saveTodo(items); console.log('added ' + id);
  } else if (sub === 'done') {
    const it = items.find((i) => i.id === a[0]); if (!it) return console.error('no such id ' + a[0]);
    it.status = 'done'; it.updated = now(); if (flags.minutes) it.actual_minutes = +flags.minutes; saveTodo(items); console.log('done ' + it.id + ' - now order a checkpoint commit');
  } else if (sub === 'next') {
    const n = items.filter((i) => i.status === 'now').concat(items.filter((i) => i.status === 'next'))[0]; console.log(n ? `${n.id} ${n.title} (${n.owner})` : 'nothing queued');
  } else if (sub === 'list') todoList({ open: !flags.all });
  else console.error('usage: pa todo add|done|list|next');
}

// ---------------- meter / metrics ----------------
const TASKS = P('docs/motion/ledger/tasks.jsonl');
function meter() {
  const [sub, ...a] = pos;
  if (sub === 'seed') {
    const have = new Set(readJsonl(TASKS).map((t) => t.source_id).filter(Boolean)); let n = 0;
    for (const o of readJsonl(P('docs/motion/ledger/ledger.jsonl'))) { if (o.kind !== 'order' || !o.id || have.has('ledger:' + o.id)) continue; appendJsonl(TASKS, { title: o.title, kind: o.task_kind || o.phase || 'order', worker: o.worker, model: (o.worker || '').split('/')[1] || null, start: o.start, end: o.end, minutes: o.seconds != null ? +(o.seconds / 60).toFixed(2) : null, result: o.result === 'ok' ? 'done' : o.result || 'done', outputs: [], quota: null, source_id: 'ledger:' + o.id }); n++; }
    readJsonl(P('docs/motion/ledger/manual-orders.jsonl')).forEach((o, i) => { if (have.has('manual:' + i)) return; const m = o.start && o.end ? +((Date.parse(o.end) - Date.parse(o.start)) / 60000).toFixed(2) : null; appendJsonl(TASKS, { title: o.title, kind: o.phase || 'manual', worker: 'studio', model: null, start: o.start, end: o.end, minutes: m, result: 'done', outputs: o.outputs || [], quota: null, source_id: 'manual:' + i }); n++; });
    return console.log('seeded ' + n + ' task lines into docs/motion/ledger/tasks.jsonl');
  }
  if (sub !== 'task') return console.error('usage: pa meter task <title> --kind <k> --worker <w> [--model m] [--start iso --end iso | --minutes n] [--result done|partial|failed] [--outputs a,b] [--quota note]\n       pa meter seed');
  const title = a.join(' '); const end = flags.end || now(); const start = flags.start || null;
  const minutes = flags.minutes ? +flags.minutes : start ? +((Date.parse(end) - Date.parse(start)) / 60000).toFixed(2) : null;
  appendJsonl(TASKS, { title, kind: flags.kind || 'other', worker: flags.worker || 'studio', model: flags.model || null, start, end, minutes, result: flags.result || 'done', outputs: flags.outputs ? String(flags.outputs).split(',') : [], quota: flags.quota || null });
  console.log('logged: ' + title);
}
function metrics(days = 7, brief = false) {
  const cut = Date.now() - days * 86400000;
  const t = readJsonl(TASKS).filter((x) => !x.end || Date.parse(x.end) >= cut);
  if (!t.length) return console.log(`no task lines in the last ${days} days (docs/motion/ledger/tasks.jsonl)`);
  const g = (f) => { const m = new Map(); for (const x of t) { const k = f(x) || '-'; const e = m.get(k) || { n: 0, min: 0, partial: 0, failed: 0 }; e.n++; e.min += x.minutes || 0; if (x.result === 'partial') e.partial++; if (x.result === 'failed') e.failed++; m.set(k, e); } return [...m].sort((a, b) => b[1].min - a[1].min); };
  const show = (title, rows) => { console.log(title); rows.slice(0, brief ? 5 : 15).forEach(([k, e]) => console.log(`  ${String(k).slice(0, 38).padEnd(38)} tasks ${String(e.n).padStart(3)}  min ${e.min.toFixed(1).padStart(7)}  partial ${e.partial}  failed ${e.failed}`)); };
  console.log(`METRICS last ${days} days: ${t.length} tasks, ${t.reduce((s, x) => s + (x.minutes || 0), 0).toFixed(1)} min`);
  show('by kind', g((x) => x.kind)); show('by worker', g((x) => x.worker));
  if (!brief) { console.log('top delays (longest tasks)'); t.slice().sort((a, b) => (b.minutes || 0) - (a.minutes || 0)).slice(0, 5).forEach((x) => console.log(`  ${(x.minutes || 0).toFixed(1).padStart(6)} min  ${x.result}  ${x.title}`)); }
  const tf = readJsonl(P('docs/motion/ledger/overruns.jsonl')); if (tf.length && !brief) console.log(`overruns logged: ${tf.length}`);
  const qh = process.env.PA_QH || 'qh'; const q = has(qh, ['--version']); console.log(q ? 'quota: run `qh quota` for the live snapshot (optional)' : 'quota snapshot: qh not available (optional)');
}

// ---------------- vault ----------------
const VAULT = P('vault');
const TARX = (spawnSync('tar', ['--version'], { encoding: 'utf8' }).stdout || '').includes('GNU') ? ['--force-local'] : []; // GNU tar reads C: as a host
const passphrase = async () => {
  if (flags.pass) return String(flags.pass); // tests only; never write it anywhere
  if (process.env.PA_VAULT_PASS) return process.env.PA_VAULT_PASS;
  if (!process.stdin.isTTY) { console.error('set PA_VAULT_PASS or run interactively'); process.exit(2); }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((res) => rl.question('vault passphrase: ', (a) => { rl.close(); res(a); }));
};
function encryptFile(src, dst, pass) { // openssl-compatible: "Salted__"+salt, PBKDF2-SHA256 10000 iter, AES-256-CBC
  const salt = crypto.randomBytes(8); const kd = crypto.pbkdf2Sync(pass, salt, 10000, 48, 'sha256'); const c = crypto.createCipheriv('aes-256-cbc', kd.subarray(0, 32), kd.subarray(32));
  fs.writeFileSync(dst, Buffer.concat([Buffer.from('Salted__'), salt, c.update(fs.readFileSync(src)), c.final()]));
}
function decryptFile(src, pass) {
  const b = fs.readFileSync(src); if (b.subarray(0, 8).toString() !== 'Salted__') throw new Error('not a vault file');
  const kd = crypto.pbkdf2Sync(pass, b.subarray(8, 16), 10000, 48, 'sha256'); const d = crypto.createDecipheriv('aes-256-cbc', kd.subarray(0, 32), kd.subarray(32));
  return Buffer.concat([d.update(b.subarray(16)), d.final()]);
}
async function vault() {
  const [sub, ...a] = pos; const base = flags.base ? path.resolve(flags.base) : ROOT; const vdir = flags.base ? path.join(base, 'vault') : VAULT;
  const cfgF = P('docs/motion/portable.json'); const cfg = fs.existsSync(cfgF) ? JSON.parse(fs.readFileSync(cfgF, 'utf8')) : { client_films: [] };
  if (sub === 'list') { if (!fs.existsSync(vdir)) return console.log('(no vault yet)'); for (const f of fs.readdirSync(vdir).filter((x) => x.endsWith('.tar.enc'))) console.log(f.padEnd(40), (fs.statSync(path.join(vdir, f)).size / 1048576).toFixed(2) + ' MB'); return; }
  if (sub !== 'pack' && sub !== 'unpack') return console.error('usage: pa vault pack [label ...] | unpack [label ...] | list   (passphrase: env PA_VAULT_PASS or prompt)');
  const pass = await passphrase(); if (!pass) return console.error('empty passphrase');
  fs.mkdirSync(vdir, { recursive: true });
  if (sub === 'pack') {
    const bl = path.join(base, 'media/briefs-local'); const labels = a.length ? a : (fs.existsSync(bl) ? fs.readdirSync(bl, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);
    if (!labels.length) return console.log('nothing to pack (no media/briefs-local/<label> folders)');
    for (const l of labels) {
      const items = [`media/briefs-local/${l}`]; if (fs.existsSync(path.join(base, 'output', l))) items.push(`output/${l}`); if (fs.existsSync(path.join(base, 'output/LATEST'))) { /* finals handled per label below */ }
      const tmp = path.join(os.tmpdir(), `vault-${l}-${process.pid}.tar.gz`);
      const lim = +(flags['max-mb'] || 50) * 1048576; const mk = (noVideo) => { const ex = noVideo ? ['--exclude=*.mp4', '--exclude=*.mov', '--exclude=*.webm'] : []; const r = spawnSync('tar', [...TARX, '-czf', tmp, ...ex, ...items.filter((i) => fs.existsSync(path.join(base, i)))], { cwd: base, encoding: 'utf8' }); if (r.status !== 0) throw new Error('tar failed: ' + r.stderr); return fs.statSync(tmp).size; };
      let size = mk(false), note = 'full';
      if (size > lim) { size = mk(true); note = 'videos skipped (over ' + lim / 1048576 + ' MB)'; if (size > lim) { fs.rmSync(tmp); console.log(`SKIP ${l}: still ${(size / 1048576).toFixed(1)} MB without videos`); continue; } }
      const dst = path.join(vdir, `${l}.tar.enc`); encryptFile(tmp, dst, pass); fs.rmSync(tmp); console.log(`packed ${l} -> vault/${l}.tar.enc (${(fs.statSync(dst).size / 1048576).toFixed(2)} MB, ${note})`);
    }
  } else {
    const files = fs.readdirSync(vdir).filter((x) => x.endsWith('.tar.enc') && (!a.length || a.includes(x.replace('.tar.enc', ''))));
    for (const f of files) { const tmp = path.join(os.tmpdir(), `vault-un-${process.pid}.tar.gz`); try { fs.writeFileSync(tmp, decryptFile(path.join(vdir, f), pass)); } catch { console.error(`FAIL ${f}: wrong passphrase or corrupt file`); continue; } const r = spawnSync('tar', [...TARX, '-xzf', tmp], { cwd: base, encoding: 'utf8' }); fs.rmSync(tmp); console.log(r.status === 0 ? `unpacked ${f}` : `FAIL ${f}: ${r.stderr}`); }
  }
}

// ---------------- track finals ----------------
function track() {
  const cfg = JSON.parse(fs.readFileSync(P('docs/motion/portable.json'), 'utf8')); const own = cfg.own_films; const maxEach = cfg.final_max_mb_each * 1048576, maxAll = cfg.final_max_mb_total * 1048576;
  const dir = P('deliver'); fs.mkdirSync(dir, { recursive: true }); let total = 0; const lf = P('output/LATEST');
  if (!fs.existsSync(lf)) return console.log('no output/LATEST');
  for (const f of fs.readdirSync(lf).filter((x) => x.endsWith('.mp4'))) {
    const film = own.find((o) => f.startsWith(o)); if (!film) { console.log(`skip ${f} (client or unknown film: vault only)`); continue; }
    const s = fs.statSync(path.join(lf, f)).size; if (s > maxEach) { console.log(`skip ${f}: ${(s / 1048576).toFixed(1)} MB > ${cfg.final_max_mb_each} MB each`); continue; }
    if (total + s > maxAll) { console.log(`skip ${f}: total budget ${cfg.final_max_mb_total} MB`); continue; }
    fs.copyFileSync(path.join(lf, f), path.join(dir, f)); total += s; console.log(`tracked-copy deliver/${f} (${(s / 1048576).toFixed(2)} MB)`);
  }
  console.log(`deliver/ total ${(total / 1048576).toFixed(1)} MB of ${cfg.final_max_mb_total} MB. Staging is the checkpoint's job: git add deliver/ (gitignore exception exists).`);
}

const main = async () => {
  switch (cmd) {
    case 'doctor': process.exit(doctor(!!flags.quick)); break;
    case 'bootstrap': process.exit(bootstrap()); break;
    case 'sync': sync(); break;
    case 'todo': todo(); break;
    case 'meter': meter(); break;
    case 'metrics': metrics(+(flags.days || 7), false); break;
    case 'vault': await vault(); break;
    case 'track': track(); break;
    default: console.error('usage: doctor [--quick] | bootstrap [--dry-run] | sync [--no-pull] | todo | meter | metrics | vault | track');
  }
};
await main();
