// probe.mjs: throwaway diagnostic for the S11 film (loads the film, seeks frames, prints window.__err)
import {spawn} from "node:child_process";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const CHROME = "D:/P/project/persianArts/work/persian/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe";
const W = 1080, H = 1920, PORT = 9388;
const profile = mkdtempSync(join(tmpdir(), "probe-"));
const ch = spawn(CHROME, ["--headless", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`,
  "--disable-gpu", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--hide-scrollbars", "about:blank"], {stdio: "ignore"});
let pageWs = null;
for (let i = 0; i < 120 && !pageWs; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) pageWs = p.webSocketDebuggerUrl; } catch {} if (!pageWs) await new Promise(r => setTimeout(r, 100)); }
const ws = new WebSocket(pageWs); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let idc = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const {res, rej} = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++idc; pend.set(id, {res, rej}); ws.send(JSON.stringify({id, method, params})); });
const ev = async x => (await send("Runtime.evaluate", {expression: x, returnByValue: true, awaitPromise: true})).result.value;
await send("Page.enable");
const RATIO = process.argv[2] || "9x16";
await send("Emulation.setDeviceMetricsOverride", {width: RATIO === "16x9" ? 1920 : 1080, height: RATIO === "16x9" ? 1080 : 1920, deviceScaleFactor: 1, mobile: false});
await send("Page.navigate", {url: pathToFileURL(join(HERE, "film.html")).href + "?capture=1&ratio=" + RATIO});
for (let i = 0; i < 200; i++) { if (await ev("window.film && window.film.ready === true")) break; await new Promise(r => setTimeout(r, 50)); }
for (const f of process.argv.slice(3).map(Number)) { const r = await ev(`(window.__err=null, window.film.seek(${f}/30), window.__err)`); console.log("frame", f, "->", r === null ? "ok" : r); }
ws.close(); ch.kill();
