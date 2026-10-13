// node fx-apply.mjs demo | apply --a a.png --b b.png --shader name [--frames 45] [--out file.mp4]
// demo: 6 shaders of different families between a neutral pattern and a Persian text card, 60 frames (2 s) each -> mp4 + strip + determinism (fresh browser session, same frame, same PNG md5).
// apply: transition between two stills (e.g. the frames around a hard cut of a neutral film). Outputs under media/film-versions/_fx-lab/ (ignored).
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = resolve(HERE, '../../../..'); const OUT = join(ROOT, 'media/film-versions/_fx-lab'); mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2); const mode = args[0]; const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const exe = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
const find = (d, depth = 0) => { if (!existsSync(d) || depth > 4) return null; for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isFile() && e.name === exe) return f; if (e.isDirectory()) { const r = find(f, depth + 1); if (r) return r; } } return null; };
const CHROME = process.env.PA_CHROME || ['work/persian/.remotion', 'work/persian/src/workbench/node_modules/.remotion'].map((b) => find(join(ROOT, b, 'chrome-headless-shell'))).find(Boolean);
async function session(port) {
  const ch = spawn(CHROME, ['--headless', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pa-fxa-'))}`, '--window-size=540,960', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let u = null; for (let i = 0; i < 100 && !u; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) u = p.webSocketDebuggerUrl; } catch {} if (!u) await new Promise((r) => setTimeout(r, 100)); }
  const ws = new WebSocket(u); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
  await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(join(HERE, 'fx-lab.html')).href }); await new Promise((r) => setTimeout(r, 700)); await ev('window.labReady'); const info = await ev('window.labInit()');
  return { ev, info, close: () => ch.kill() };
}
const png = (d) => Buffer.from(d.split(',')[1], 'base64');
async function renderClip(S, kind, shader, frames, out) {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  const t0 = Date.now(); const md = {};
  for (let i = 0; i < frames; i++) { const b = png(await S.ev(`window.labFrame(${JSON.stringify(kind)}, ${JSON.stringify(shader)}, ${i / (frames - 1)})`)); if (i === Math.floor(frames / 2)) md.mid = createHash('md5').update(b).digest('hex'); ff.stdin.write(b); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); return { ms: Date.now() - t0, ...md };
}
const sheet = (clip, n, outJpg) => spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', clip, '-vf', "select=not(mod(n\\," + n + ")),scale=180:-2,tile=" + Math.ceil(60 / n) + "x1", '-frames:v', '1', '-q:v', '4', outJpg]);
if (mode === 'demo') {
  const six = ['circle-reveal', 'displace-dissolve', 'swirl', 'cube', 'GlitchDisplace', 'page-curl-lite'];
  let S = await session(9421); console.log('GL backend:', S.info.backend, '|', S.info.version);
  const rows = [];
  for (const name of six) { const r = await renderClip(S, 'transition', name, 60, join(OUT, `demo-${name}.mp4`)); sheet(join(OUT, `demo-${name}.mp4`), 8, join(OUT, `strip-${name}.jpg`)); rows.push({ name, ...r }); console.log(`${name.padEnd(18)} 60 frames in ${r.ms} ms (${(60000 / r.ms).toFixed(1)} fps incl. PNG encode+pipe)`); }
  S.close(); S = await session(9422); let ok = 0;
  for (const r of rows) { const b = png(await S.ev(`window.labFrame("transition", ${JSON.stringify(r.name)}, ${Math.floor(60 / 2) / 59})`)); const h = createHash('md5').update(b).digest('hex'); const same = h === r.mid; ok += same ? 1 : 0; console.log(`determinism ${r.name}: fresh browser session, frame 30 md5 ${same ? 'IDENTICAL' : 'DIFFERENT'}`); }
  S.close(); console.log(`determinism: ${ok}/${rows.length} identical across separate browser sessions`);
  spawnSync('ffmpeg', ['-v', 'error', '-y', ...six.flatMap((n) => ['-i', join(OUT, `strip-${n}.jpg`)]), '-filter_complex', `vstack=inputs=${six.length}`, '-q:v', '4', join(OUT, 'demo-strips.jpg')]); console.log('strips:', join(OUT, 'demo-strips.jpg'));
} else if (mode === 'apply') {
  const S = await session(9423); await S.ev(`window.labSetImages(${JSON.stringify(pathToFileURL(resolve(arg('--a'))).href)}, ${JSON.stringify(pathToFileURL(resolve(arg('--b'))).href)})`);
  const name = arg('--shader', 'circle-reveal'); const out = resolve(arg('--out', join(OUT, `apply-${name}.mp4`))); const fr = +arg('--frames', 45);
  const r = await renderClip(S, 'transition', name, fr, out); sheet(out, 6, out.replace(/\.mp4$/, '-strip.jpg')); console.log(`apply ${name}: ${fr} frames -> ${out} (${((fr * 1000) / r.ms).toFixed(1)} fps incl. encode)`); S.close();
} else console.log('usage: fx-apply.mjs demo | apply --a a.png --b b.png --shader name');
process.exit(0);
