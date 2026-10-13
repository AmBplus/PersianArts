// Frame-exact capture of pencil/film.html (9:16 only).
// Drives headless chrome-headless-shell over CDP (Node 22+ global WebSocket), steps film.seek(n/30),
// takes PNG screenshots and pipes them to ffmpeg (yuv420p, crf 16).
// Usage:
//   node capture.mjs                       -> full film to media/film-versions/pencil-html/v1/silent-9x16.mp4
//   node capture.mjs --frames 0-59         -> frame range (inclusive)
//   node capture.mjs --still 0.5,3.9       -> PNG stills at those seconds (into --stills dir)
//   node capture.mjs --out <path.mp4>      -> output file
import {spawn} from "node:child_process";
import {mkdtempSync, writeFileSync, mkdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const CHROME = join(ROOT, "work/persian/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
const HTML_IDX = process.argv.indexOf("--html");
const FILM = HTML_IDX >= 0 ? resolve(process.argv[HTML_IDX + 1]) : join(HERE, "pencil/film.html");
const FPS = 30, W = 1080, H = 1920, PORT = 9333;

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const OUT = resolve(ROOT, arg("--out", "media/film-versions/pencil-html/v1/silent-9x16.mp4"));
const STILLS = resolve(ROOT, arg("--stills-dir", "media/film-versions/pencil-html/v1/_stills"));
const stillArg = arg("--still", null);
const framesArg = arg("--frames", null);

const t0 = Date.now();
const mark = (label) => console.log(`[${((Date.now() - t0) / 1000).toFixed(2)}s] ${label}`);

// browser
const profile = mkdtempSync(join(tmpdir(), "pencil-html-chrome-"));
const chrome = spawn(CHROME, [
  "--headless", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1080,1920", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--allow-file-access-from-files", "--hide-scrollbars", "about:blank",
], {stdio: "ignore"});

async function getJson(url) {
  return (await fetch(url)).json();
}
let pageWs = null;
for (let i = 0; i < 100 && !pageWs; i++) {
  try {
    const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = list.find((t) => t.type === "page");
    if (page) pageWs = page.webSocketDebuggerUrl;
  } catch {}
  if (!pageWs) await new Promise((r) => setTimeout(r, 100));
}
if (!pageWs) {
  chrome.kill();
  throw new Error("no page target from chrome-headless-shell");
}
mark("chrome launched");

const ws = new WebSocket(pageWs);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let idc = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const {res, rej} = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++idc;
    pending.set(id, {res, rej});
    ws.send(JSON.stringify({id, method, params}));
  });
const evaluate = async (expression) => (await send("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true})).result.value;

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {width: W, height: H, deviceScaleFactor: 1, mobile: false});
await send("Page.navigate", {url: pathToFileURL(FILM).href + "?capture=1&ratio=9x16"});
for (let i = 0; i < 200; i++) {
  if (await evaluate("window.film && window.film.ready === true")) break;
  await new Promise((r) => setTimeout(r, 50));
}
const duration = await evaluate("window.film.duration");
const totalFrames = Math.round(duration * FPS);
mark(`film ready, duration ${duration.toFixed(3)} s, ${totalFrames} frames`);

const shot = async (n) => {
  await evaluate(`window.film.seek(${n / FPS})`);
  const r = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false, clip: {x: 0, y: 0, width: W, height: H, scale: 1}});
  return Buffer.from(r.data, "base64");
};

// stills mode
if (stillArg) {
  mkdirSync(STILLS, {recursive: true});
  for (const ts of stillArg.split(",").map(Number)) {
    const n = Math.round(ts * FPS);
    const buf = await shot(n);
    const name = join(STILLS, `t${ts.toFixed(2).replace(".", "_")}s_f${String(n).padStart(3, "0")}.png`);
    writeFileSync(name, buf);
    console.log("still", name);
  }
  ws.close();
  chrome.kill();
  mark("stills done");
  process.exit(0);
}

let a = 0, b = totalFrames - 1;
if (framesArg) [a, b] = framesArg.split("-").map(Number);
mkdirSync(dirname(OUT), {recursive: true});
const ff = spawn("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  "-f", "image2pipe", "-c:v", "png", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-movflags", "+faststart", OUT,
], {stdio: ["pipe", "inherit", "inherit"]});

let encodeStart = 0;
const tStart = Date.now();
for (let n = a; n <= b; n++) {
  const buf = await shot(n);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
const encodeCode = await new Promise((r) => ff.on("close", r));
const wall = (Date.now() - tStart) / 1000;
ws.close();
chrome.kill();
const count = b - a + 1;
mark(`capture+encode: ${count} frames in ${wall.toFixed(2)} s = ${(count / wall).toFixed(1)} fps (ffmpeg exit ${encodeCode})`);
mark(`output ${OUT}`);
