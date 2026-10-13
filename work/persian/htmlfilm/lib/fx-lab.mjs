// node fx-lab.mjs check [--n 60]   : compile every shader in headless chrome, render a 2 s (60 frame) run each, measure determinism / continuity /
//                                    endpoints / fps, write contact sheet media/film-versions/_fx-lab/sheet.jpg (ignored) and docs/motion/fx/catalog.json
// Browser: PA_CHROME or the Remotion download (same resolver as capture.mjs); GL: ANGLE/SwiftShader flags. Repo-relative, no CDN.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = resolve(HERE, '../../../..');
const args = process.argv.slice(2); const N = +(args[args.indexOf('--n') + 1] || 60);
const exe = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
const find = (d, depth = 0) => { if (!existsSync(d) || depth > 4) return null; for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isFile() && e.name === exe) return f; if (e.isDirectory()) { const r = find(f, depth + 1); if (r) return r; } } return null; };
const CHROME = process.env.PA_CHROME || ['work/persian/.remotion', 'work/persian/src/workbench/node_modules/.remotion'].map((b) => find(join(ROOT, b, 'chrome-headless-shell'))).find(Boolean);
if (!CHROME) { console.error('chrome-headless-shell not found: pa bootstrap'); process.exit(3); }
const PORT = 9411;
const chrome = spawn(CHROME, ['--headless', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pa-fx-'))}`, '--window-size=540,960', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 100 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch {} if (!wsUrl) await new Promise((r) => setTimeout(r, 100)); }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(join(HERE, 'fx-lab.html')).href }); await new Promise((r) => setTimeout(r, 800));
await ev('window.labReady');
const info = await ev('window.labInit()'); console.log('GL backend:', info.backend, '|', info.version);
const list = await ev('window.labList()');
const OUT = join(ROOT, 'media/film-versions/_fx-lab'); mkdirSync(OUT, { recursive: true });
const results = []; let k = 0;
for (const s of list) {
  const r = await ev(`window.labRun(${JSON.stringify(s.name)}, ${JSON.stringify(s.kind)}, ${N})`); results.push(r);
  if (r.thumb) { writeFileSync(join(OUT, `t${String(k++).padStart(2, '0')}.jpg`), Buffer.from(r.thumb.split(',')[1], 'base64')); }
  console.log(`${r.compiled ? 'ok ' : 'ERR'} ${s.kind.padEnd(10)} ${s.name.padEnd(18)} ${r.compiled ? `det=${r.deterministic} ratio=${r.step_ratio} e0=${r.end0_diff ?? '-'} e1=${r.end1_diff ?? r.end1_diff_vs_source} ${r.fps}fps` : r.error}`);
}
spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', join(OUT, 't%02d.jpg'), '-vf', 'tile=9x4', '-frames:v', '1', '-q:v', '4', join(OUT, 'sheet.jpg')]);
// verdicts
const verdict = (r) => {
  if (!r.compiled) return ['experimental', 'does not compile: ' + r.error];
  const why = []; if (!r.deterministic) why.push('not deterministic');
  if (r.kind === 'transition') { if (r.end0_diff > 3) why.push(`start frame differs from source (${r.end0_diff})`); if (r.end1_diff > 3) why.push(`end frame differs from target text card (${r.end1_diff})`); }
  if (r.step_jump > 25 && r.step_ratio > 6) why.push(`jumpy frame diffs (ratio ${r.step_ratio}, jump ${r.step_jump})`);
  return [why.length ? 'experimental' : 'verified', why.join('; ')];
};
const shaderMeta = {}; for (const kind of ['transitions', 'effects']) { const d = join(HERE, 'shaders', kind); for (const f of readdirSync(d)) { const t = readFileSync(join(d, f), 'utf8'); const g = (k) => (new RegExp(`^// ${k}: (.*)$`, 'm').exec(t) || [])[1] || ''; shaderMeta[f.replace('.glsl', '')] = { family: g('family'), behaviour: g('behaviour'), params: [...t.matchAll(/uniform\s+(\w+)\s+(\w+);\s*\/\/\s*=\s*([^\n]+)/g)].map((m) => `${m[2]}=${m[3].trim()}`), source: /gl-transitions/.test(g('source')) ? g('source').split(' (author')[0] : 'native (persian-arts)' }; } }
const FAM = { fade: ['محو', 'کم‌رنگ شدن', 'crossfade', 'dissolve'], wipe: ['جارو', 'کشیدن', 'پرده', 'wipe', 'slide reveal'], warp: ['موج', 'پیچش', 'تاب', 'warp', 'wave', 'liquid'], dissolve: ['متلاشی', 'فرو ریختن', 'ذره ذره', 'dissolve', 'disintegrate', 'noise'], reveal: ['باز شدن', 'دایره', 'reveal', 'iris', 'open'], fold: ['مچاله', 'تا شدن', 'ورق', 'fold', 'crumple', 'page turn'], glitch: ['اختلال', 'گلیچ', 'glitch', 'digital', 'rgb split'], pixel: ['پیکسل', 'مربعی', 'pixelate', 'mosaic'], zoom: ['زوم', 'بزرگ‌نمایی', 'zoom', 'burst'], '3d': ['مکعب', 'سه بعدی', 'cube', '3d'], blur: ['محو حرکت', 'blur'], burn: ['سوختن', 'burn'], grid: ['شبکه', 'grid'], distortion: ['موج', 'پیچش', 'اعوجاج', 'distort', 'ripple', 'swirl'], misc: [] };
const EXTRA = { ripple: ['موج', 'ریپل', 'water'], swirl: ['پیچش', 'گرداب', 'vortex', 'twirl'], 'swirl-vortex': ['گرداب', 'پیچش', 'vortex'], 'ripple-wave': ['موج', 'آب', 'ripple'], 'crumple-fold': ['مچاله', 'چروک', 'کاغذ', 'crumple'], 'pixel-dissolve': ['متلاشی', 'فرو ریختن', 'پیکسل', 'disintegrate'], 'noise-dissolve': ['فرو ریختن', 'دود', 'noise dissolve'], 'displace-dissolve': ['مایع', 'liquid', 'شناور'], 'page-curl-lite': ['ورق زدن', 'صفحه', 'page curl'], 'circle-reveal': ['دایره', 'دریچه', 'iris'], 'rgb-glitch': ['اختلال', 'گلیچ', 'سیگنال'], 'noise-displace': ['گرما', 'heat haze', 'لرزش'], cube: ['مکعب', 'چرخش'], CrossZoom: ['زوم', 'انفجار'], pixelize: ['پیکسل'] };
const catalog = { _meta: { generated: new Date().toISOString().slice(0, 10), engine: 'pa-fx (WebGL2, deterministic, SwiftShader in headless)', gl: info.backend, test: `${N} frames per shader at 540x960; verified = compiles + deterministic (hash identical after other frames) + start/end frames match sources + smooth frame diffs`, note: 'verified/experimental is measured by `pa fx check`' }, entries: [] };
for (const r of results) {
  const m = shaderMeta[r.name] || { family: 'misc', behaviour: r.name, params: [], source: '' }; const [status, reason] = verdict(r);
  catalog.entries.push({ technique: r.name, kind: r.kind, family: m.family, aliases: [...new Set([r.name, ...(EXTRA[r.name] || []), ...(FAM[m.family] || [])])], description: m.behaviour,
    use_cases: r.kind === 'transition' ? ['scene change where an image becomes another', `${m.family} feel`] : ['single image treatment: entrance, emphasis, tension'], engine: 'pa-fx WebGL2 shader', params: m.params, timeline_control: r.kind === 'transition' ? 'progress 0..1 (pure function, seekable)' : 't 0..1 (pure function, seekable)',
    dependencies: ['work/persian/htmlfilm/lib/pa-fx.js', 'work/persian/htmlfilm/lib/shaders/index.js'], limits: ['needs WebGL2 (SwiftShader flags in capture.mjs)', 'inputs are rasterised canvases/images (DOM must be drawn to a canvas first)'], source: m.source,
    status, ...(reason ? { status_reason: reason } : {}), measured: { fps_540x960: r.fps, deterministic: r.deterministic, step_ratio: r.step_ratio, start_diff: r.end0_diff ?? null, end_diff: r.end1_diff ?? r.end1_diff_vs_source ?? null }, recipe: 'docs/motion/PLAYBOOK-BUILD-MOTION.md#image-fx' });
}
mkdirSync(join(ROOT, 'docs/motion/fx'), { recursive: true }); writeFileSync(join(ROOT, 'docs/motion/fx/catalog.json'), JSON.stringify(catalog, null, 1));
const v = catalog.entries.filter((e) => e.status === 'verified').length;
console.log(`catalog: ${catalog.entries.length} entries, ${v} verified, ${catalog.entries.length - v} experimental -> docs/motion/fx/catalog.json; sheet ${join(OUT, 'sheet.jpg')}`);
chrome.kill(); process.exit(0);
