// Pulls the offline-rendered score out of a film page (window.film.audio() -> base64 WAV).
// Separate from capture.mjs on purpose: capture stays a pure video pipeline.
//   node audio.mjs <film.html> <out.wav>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:net';

const FILM = resolve(process.argv[2] || '');
const OUT = resolve(process.argv[3] || 'score.wav');
if (!existsSync(FILM)) { console.error('film not found:', FILM); process.exit(2); }

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) { console.error('no chrome found'); process.exit(2); }

const port = await new Promise((r) => {
  const s = createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); });
});

const profile = mkdtempSync(join(tmpdir(), 'pa-audio-'));
const proc = spawn(chrome, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--no-first-run', '--no-default-browser-check',
  '--disable-extensions',
  '--autoplay-policy=no-user-gesture-required',
  '--allow-file-access-from-files',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl = null;
for (let i = 0; i < 120 && !wsUrl; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`);
    const j = await r.json();
    wsUrl = j.webSocketDebuggerUrl;
  } catch { await sleep(100); }
}
if (!wsUrl) { console.error('chrome did not expose devtools'); proc.kill(); process.exit(3); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const raw = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

const { targetId } = await raw('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await raw('Target.attachToTarget', { targetId, flatten: true });
const send = (method, params) => raw(method, params, sessionId);

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: pathToFileURL(FILM).href });

let ready = false;
for (let i = 0; i < 200 && !ready; i++) {
  try {
    const r = await send('Runtime.evaluate', { expression: '!!(window.film && window.film.ready)', returnByValue: true });
    ready = r.result.value === true;
  } catch {}
  if (!ready) await sleep(100);
}
if (!ready) {
  const err = await send('Runtime.evaluate', { expression: 'window.__filmError || document.title', returnByValue: true });
  console.error('film never became ready:', err.result.value);
  proc.kill(); process.exit(4);
}
console.log('[audio] film ready, rendering score offline…');

const r = await send('Runtime.evaluate', {
  expression: 'window.film.audio()',
  awaitPromise: true,
  returnByValue: true,
});
if (r.exceptionDetails) {
  console.error('[audio] exception:', JSON.stringify(r.exceptionDetails).slice(0, 600));
  proc.kill(); process.exit(5);
}
const b64 = r.result.value;
if (typeof b64 !== 'string' || b64.length < 1000) {
  console.error('[audio] bad payload:', typeof b64, b64 && b64.length);
  proc.kill(); process.exit(6);
}
const buf = Buffer.from(b64, 'base64');
writeFileSync(OUT, buf);
console.log(`[audio] wrote ${OUT} (${(buf.length / 1048576).toFixed(2)} MB, ${(buf.length / 2 / 48000).toFixed(2)} s @48k)`);

ws.close();
proc.kill();
