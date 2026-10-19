// node fx-lab2d.mjs [--n 60] : run every canvas-2D effect in pa-effects.js on a deterministic scene,
//                                    render an N-frame run each, measure determinism / continuity / ms-per-frame,
//                                    write thumbs to _fx-lab2d/ (self-ignored) and a report to fx-lab2d.json.
// Browser: PA_CHROME or the Remotion download (same resolver/env as fx-lab.mjs). Repo-relative, no CDN.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const N = +(args.includes('--n') ? args[args.indexOf('--n') + 1] : 60) || 60;
const exe = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
const find = (d, depth = 0) => { if (!existsSync(d) || depth > 4) return null; for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isFile() && e.name === exe) return f; if (e.isDirectory()) { const r = find(f, depth + 1); if (r) return r; } } return null; };
const CHROME = process.env.PA_CHROME || ['work/persian/.remotion', 'work/persian/src/workbench/node_modules/.remotion'].map((b) => find(join(HERE, '../../../..', b, 'chrome-headless-shell'))).find(Boolean);
if (!CHROME) { console.error('chrome-headless-shell not found: pa bootstrap'); process.exit(3); }
const PORT = 9412;
const chrome = spawn(CHROME, ['--headless', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pa-fx2d-'))}`, '--window-size=540,960', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let wsUrl = null; for (let i = 0; i < 100 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch {} if (!wsUrl) await new Promise((r) => setTimeout(r, 100)); }
if (!wsUrl) { console.error('no chrome devtools target'); chrome.kill(); process.exit(3); }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(join(HERE, 'fx-lab2d.html')).href });
for (let i = 0; i < 60; i++) { try { if (await ev('typeof window.labReady') === 'object') break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
await ev('window.labReady');
const info = await ev('window.labInit()'); console.log('scene:', info.width + 'x' + info.height, '| effects:', info.effects.length);
const list = await ev('window.labList()');
const OUT = join(HERE, '_fx-lab2d'); mkdirSync(OUT, { recursive: true });
try { writeFileSync(join(OUT, '.gitignore'), '*\n'); } catch {}

// verdict: verified = no throw + deterministic + (motion effects) step_ratio <= 6 and step_jump <= 25
const verdict = (r) => {
  if (r.error) return ['experimental', 'threw: ' + r.error];
  if (!r.deterministic) return ['experimental', 'not deterministic (hash differs after re-render)'];
  if (r.static_overlay) return ['verified', 'static overlay (no frame-to-frame motion)'];
  const why = [];
  if (r.step_ratio > 6) why.push(`step_ratio ${r.step_ratio} > 6`);
  if (r.step_jump > 25) why.push(`step_jump ${r.step_jump} > 25`);
  return why.length ? ['experimental', why.join('; ')] : ['verified', 'smooth and deterministic'];
};

const results = []; let failed = 0;
for (const e of list) {
  const r = await ev(`window.labRun(${JSON.stringify(e.name)}, ${N})`);
  results.push(r);
  const [st, why] = verdict(r);
  if (r.error) failed++;
  let thumbFile = null;
  if (r.thumb) { thumbFile = `_fx-lab2d/${e.name}.jpg`; writeFileSync(join(OUT, `${e.name}.jpg`), Buffer.from(r.thumb.split(',')[1], 'base64')); }
  r.thumb_file = thumbFile; r.status = st; r.status_reason = why;
  console.log(`${r.error ? 'ERR ' : 'ok  '} ${e.name.padEnd(9)} det=${r.error ? '-' : (r.deterministic ? 'yes' : 'NO ')} med=${r.step_median ?? '-'} max=${r.step_max ?? '-'} ratio=${r.step_ratio ?? '-'} jump=${r.step_jump ?? '-'} span=${r.span ?? '-'} ${r.ms_per_frame ?? '-'}ms ${r.fps ?? '-'}fps ${r.static_overlay ? 'static ' : ''}${st}${why ? ' (' + why + ')' : ''}`);
}

const report = {
  _meta: {
    generated: new Date().toISOString(),
    engine: 'pa-fx2d (canvas 2D, deterministic, SwiftShader/CPU raster in headless)',
    kit: 'work/persian/htmlfilm/lib/pa-effects.js',
    page: 'work/persian/htmlfilm/lib/fx-lab2d.html',
    test: `${N} frames per effect at 540x960, 30 fps time base, one static baked scene`,
    rules: 'verified = no throw + hash identical after re-render + (motion effects) step_ratio <= 6 and step_jump <= 25; static overlays (step_median < 0.5) verified on determinism alone',
    note: 'verified/experimental is measured by `node work/persian/htmlfilm/lib/fx-lab2d.mjs`',
  },
  effects: results.map((r) => ({
    name: r.name, deterministic: !!r.deterministic, hash: r.hash ?? null, hash_frame0: r.hash_frame0 ?? null,
    step_median: r.step_median ?? null, step_max: r.step_max ?? null, step_ratio: r.step_ratio ?? null, step_jump: r.step_jump ?? null, span: r.span ?? null,
    ms_per_frame: r.ms_per_frame ?? null, fps: r.fps ?? null, static_overlay: !!r.static_overlay,
    status: r.status, status_reason: r.status_reason, error: r.error ?? null, thumb: r.thumb_file,
  })),
};
writeFileSync(join(HERE, 'fx-lab2d.json'), JSON.stringify(report, null, 1));
const v = report.effects.filter((e) => e.status === 'verified').length;
console.log(`report: ${report.effects.length} effects, ${v} verified, ${report.effects.length - v} experimental -> ${join(HERE, 'fx-lab2d.json')}; thumbs -> ${OUT}`);
chrome.kill();
// exit code: non-zero only when an effect threw (experimental = measured verdict, not a crash)
process.exit(failed ? 1 : 0);
