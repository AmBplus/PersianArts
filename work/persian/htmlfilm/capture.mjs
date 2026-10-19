// Frame-exact capture of pencil/film.html (9:16 only).
// Drives headless chrome-headless-shell over CDP (Node 22+ global WebSocket), steps film.seek(n/30),
// takes PNG screenshots and pipes them to ffmpeg (yuv420p, crf 16).
// Usage:
//   node capture.mjs                       -> full film to media/film-versions/pencil-html/v1/silent-9x16.mp4
//   node capture.mjs --frames 0-59         -> frame range (inclusive)
//   node capture.mjs --still 0.5,3.9       -> PNG stills at those seconds (into --stills dir)
//   node capture.mjs --out <path.mp4>      -> output file
//   node capture.mjs --draft               -> DRAFT/preview capture: jpeg q97 (faster); FINAL captures stay png
//   node capture.mjs --port 9333           -> pin the DevTools port (default: an automatically chosen free port)
import {spawn, spawnSync} from "node:child_process";
import {mkdtempSync, writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, unlinkSync} from "node:fs";
import net from "node:net";
import {tmpdir} from "node:os";
import {join, dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
// Browser resolution. A bundled chrome-headless-shell that cannot start a usable renderer makes every
// capture silently produce black video (the CDP socket opens, no command is ever answered, ffmpeg gets
// nothing), so system Chrome/Edge are tried first and every candidate is health-checked by the caller.
// Order: --browser <path> · PA_CHROME · system Chrome · system Edge · bundled chrome-headless-shell.
const CHROME_CANDIDATES = (() => {
  const argIdx = process.argv.indexOf("--browser");
  const explicit = argIdx >= 0 ? process.argv[argIdx + 1] : process.env.PA_CHROME;
  const out = [];
  if (explicit) out.push(explicit);
  if (process.platform === "win32") {
    out.push("C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe");
  } else if (process.platform === "darwin") {
    out.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge");
  } else {
    out.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge");
  }
  const exe = process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell";
  const find = (d, depth = 0) => { if (!existsSync(d) || depth > 4) return null; for (const e of readdirSync(d, {withFileTypes: true})) { const f = join(d, e.name); if (e.isFile() && e.name === exe) return f; if (e.isDirectory()) { const r = find(f, depth + 1); if (r) return r; } } return null; };
  for (const base of ["work/persian/.remotion", "work/persian/src/workbench/node_modules/.remotion"]) { const r = find(join(ROOT, base, "chrome-headless-shell")); if (r) out.push(r); }
  return out.filter((p, i, a) => a.indexOf(p) === i);
})();
let CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error(`no browser found (tried ${CHROME_CANDIDATES.length}): ${CHROME_CANDIDATES.join(", ")}\nrun \`pwsh -File work/persian/tools/pa.ps1 bootstrap\` or set PA_CHROME`);
  process.exit(3);
}
// chrome-headless-shell ships its own headless mode; a full Chrome/Edge needs --headless=new.
const HTML_IDX = process.argv.indexOf("--html");
const FILM = HTML_IDX >= 0 ? resolve(process.argv[HTML_IDX + 1]) : join(HERE, "pencil/film.html");
const RATIO = (() => { const i = process.argv.indexOf("--ratio"); return i >= 0 ? process.argv[i + 1] : "9x16"; })();
// --pr N = supersampling: the film draws at N x the delivered resolution and the compositor downsamples.
const PR = (() => { const i = process.argv.indexOf("--pr"); return i >= 0 ? Number(process.argv[i + 1]) : 1; })();
const [RW, RH] = RATIO === "16x9" ? [1920, 1080] : [1080, 1920];
const FPS = 30, W = RW, H = RH;
// F1: DevTools port. `--port <n>` is an explicit override with its old meaning; without it an ephemeral
// free port is chosen at launch. The old hard default 9333 made two concurrent captures attach to each
// other's page target and truncate the ffmpeg encode ("moov atom not found").
const PORT_ARG = (() => { const i = process.argv.indexOf("--port"); return i >= 0 ? Number(process.argv[i + 1]) : null; })();
let PORT = null; // resolved just before chrome launches (see pickFreePort)

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const OUT = resolve(ROOT, arg("--out", "media/film-versions/pencil-html/v1/silent-9x16.mp4"));
const STILLS = resolve(ROOT, arg("--stills-dir", "media/film-versions/pencil-html/v1/_stills"));
const stillArg = arg("--still", null);
const framesArg = arg("--frames", null);

// F4: resolve the asset-tools interpreter across OS layouts. This used to be the Windows-only path
// work/persian/tools/assets/.venv/Scripts/python.exe with a silent fallback to a bare `python` that
// normally lacks pillow/fonttools/brotli, so the asset pre-pass and the TV check did nothing on macOS/Linux.
const ASSETS_DIR = join(ROOT, "work/persian/tools/assets");
const PY = (() => {
  const cands = [
    ["assets venv, windows", join(ASSETS_DIR, ".venv/Scripts/python.exe")],
    ["assets venv, posix", join(ASSETS_DIR, ".venv/bin/python")],
    ["persian venv, windows", join(ROOT, "work/persian/.venv/Scripts/python.exe")],
    ["persian venv, posix", join(ROOT, "work/persian/.venv/bin/python")],
    ["sound venv, windows", join(ROOT, "sound/.venv/Scripts/python.exe")],
    ["sound venv, posix", join(ROOT, "sound/.venv/bin/python")],
    ["repo venv, windows", join(ROOT, ".venv/Scripts/python.exe")],
    ["repo venv, posix", join(ROOT, ".venv/bin/python")],
  ];
  const hit = cands.find(([, p]) => existsSync(p));
  if (!hit) {
    console.log(`[python] no venv found (checked ${cands.length}: ${cands.map(([, p]) => p).join(", ")}); falling back to bare "python" — pillow/fonttools/brotli may be missing, so the asset pre-pass and TV check may silently do nothing`);
    return "python";
  }
  console.log(`[python] asset tools interpreter: ${hit[1]} (${hit[0]})`);
  return hit[1];
})();

// F3: every local url() of a @font-face in the film must exist next to film.html. A missing font file
// used to render in a silent substituted system font (nothing detected it: no gate, and capture.mjs never
// awaited document.fonts.ready). http(s)/data/#refs and other CSS urls (e.g. svg fill url(#sky)) are ignored.
const FONT_FILES = [...readFileSync(FILM, "utf8").matchAll(/@font-face\s*\{[^}]*\}/gi)]
  .flatMap((b) => [...b[0].matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)].map((m) => m[2].trim()))
  .filter((u) => !/^(data:|https?:|\/\/|#)/i.test(u))
  .map((u) => { const p = u.split(/[?#]/)[0]; try { return decodeURIComponent(p); } catch { return p; } })
  .filter((u, i, arr) => arr.indexOf(u) === i);
const MISSING_FONTS = FONT_FILES.filter((u) => !existsSync(resolve(dirname(FILM), u)));
if (MISSING_FONTS.length) {
  console.error(`[fonts] FATAL: ${FILM} declares ${MISSING_FONTS.length} @font-face file(s) that do not exist next to it:`);
  for (const u of MISSING_FONTS) console.error(`  - url("${u}") -> ${resolve(dirname(FILM), u)}  MISSING`);
  console.error("[fonts] restore the font (canonical zero-setup path: ../../assets/fonts/Vazirmatn-Variable.woff2) before capturing; a substituted system font would be rendered silently otherwise");
  process.exit(4);
}
console.log(`[fonts] @font-face local files present (${FONT_FILES.length}): ${FONT_FILES.join(", ") || "none"}`);

// Asset compressor hook (work/persian/tools/assets): WebP for raster assets before Chrome opens the film.
// --no-optimize skips; --rewrite-refs rewrites refs also in tracked folders; --tv-fix repairs the mp4 for TVs (default: report only).
if (!args.includes("--no-optimize") && !stillArg) {
  const dir = dirname(FILM);
  const has = (d) => readdirSync(d, {withFileTypes: true}).some((e) => e.isDirectory() ? !/^(_orig|node_modules|\.git)$/.test(e.name) && has(join(d, e.name)) : /\.(png|jpe?g|gif|ttf|otf|svg)$/i.test(e.name));
  if (has(dir)) {
    const ignored = spawnSync("git", ["-C", ROOT, "check-ignore", "-q", dir]).status === 0;
    const flags = [dir, "--svg", "--fonts"].concat(ignored || args.includes("--rewrite-refs") ? ["--rewrite-refs"] : []);
    const r = spawnSync(PY, ["-P", join(ASSETS_DIR, "optimize_assets.py"), ...flags, "--no-tv"], {encoding: "utf8"});
    console.log("[assets] " + (ignored ? "ignored folder: converting + rewriting refs" : "tracked folder: convert + map only") + " " + (r.error ? "SKIPPED: " + r.error.message : (r.stdout || r.stderr || "").trim()));
  }
}

const t0 = Date.now();
const mark = (label) => console.log(`[${((Date.now() - t0) / 1000).toFixed(2)}s] ${label}`);

// browser — F1: bind port 0 to let the OS hand us a free ephemeral port when --port is not given.
const pickFreePort = () => new Promise((res, rej) => {
  const srv = net.createServer();
  srv.once("error", rej);
  srv.listen(0, "127.0.0.1", () => { const p = srv.address().port; srv.close(() => res(p)); });
});

async function getJson(url) {
  return (await fetch(url)).json();
}

const launchChrome = async (port, cand) => {
  const profile = mkdtempSync(join(tmpdir(), "pencil-html-chrome-"));
  const gpu = args.includes("--gpu") || process.env.PA_GPU === "1";
  const flags = [
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`, "--no-first-run", "--no-default-browser-check",
    ...(gpu
      ? ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--enable-zero-copy"]
      : ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"]),
    "--disable-extensions", "--mute-audio", "--allow-file-access-from-files", "--hide-scrollbars",
    // deterministic screenshots: without these the compositor can hand back a surface with tiles that
    // were never painted, and Page.captureScreenshot happily returns them as solid black rectangles
    "--run-all-compositor-stages-before-draw", "--disable-new-content-rendering-timeout",
    "--disable-checker-imaging", "--disable-gpu-vsync",
  ];
  if (!/chrome-headless-shell/i.test(cand)) flags.unshift("--headless=new");
  const proc = spawn(cand, [...flags, "about:blank"], {stdio: ["ignore", "ignore", "pipe"]});
  // keep the browser's own diagnostics: a crashing GPU/renderer is the difference between "film is black"
  // and "browser never answered", and that used to be invisible here.
  const log = [];
  proc.stderr.on("data", (d) => { log.push(String(d)); if (log.length > 60) log.shift(); });
  let dead = false;
  proc.once("exit", () => { dead = true; });
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl && !dead; i++) {
    try {
      const list = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = list.find((t) => t.type === "page");
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl && !dead) await new Promise((r) => setTimeout(r, 100));
  }
  if (!wsUrl) { try { proc.kill(); } catch {} }
  return {proc, wsUrl, log, dead: () => dead};
};

if (PORT_ARG === null) {
  PORT = await pickFreePort();
  console.log(`[port] auto-selected free DevTools port ${PORT} (pass --port <n> to pin one; concurrent captures no longer collide)`);
} else {
  PORT = PORT_ARG;
}

// CDP health check: open the page socket and require a real answer to Page.enable. A browser whose
// renderer/GPU process is broken accepts the socket and then answers nothing, which is exactly how a
// capture used to end with a black mp4 and exit 0. Every candidate gets one chance, in order.
const CDP_TIMEOUT_MS = Number(process.env.PA_CDP_TIMEOUT_MS || 20000);
let ws = null, chrome = null, pageWs = null, browserLog = [];
const openSocket = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const timer = setTimeout(() => { try { s.close(); } catch {} rej(new Error("socket open timeout")); }, CDP_TIMEOUT_MS);
  s.onopen = () => { clearTimeout(timer); res(s); };
  s.onerror = () => { clearTimeout(timer); rej(new Error("socket error")); };
});
for (let attempt = 0; attempt < CHROME_CANDIDATES.length; attempt++) {
  const cand = CHROME_CANDIDATES[attempt];
  if (!existsSync(cand)) continue;
  CHROME = cand;
  const needsFlag = !/chrome-headless-shell/i.test(cand);
  const b = await launchChrome(PORT, cand);
  if (!b.wsUrl) { try { b.proc.kill(); } catch {}; mark(`[browser] ${cand}: no page target, next candidate`); continue; }
  try {
    const s = await openSocket(b.wsUrl);
    const probe = await new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error(`no CDP reply within ${CDP_TIMEOUT_MS} ms (renderer/GPU died)`)), CDP_TIMEOUT_MS);
      s.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id === 1) { clearTimeout(timer); res(m); } };
      s.send(JSON.stringify({id: 1, method: "Page.enable"}));
    });
    if (!probe || probe.error) throw new Error("Page.enable returned an error: " + JSON.stringify(probe && probe.error));
    ws = s; chrome = b.proc; pageWs = b.wsUrl; browserLog = b.log;
    console.log(`[browser] using ${cand}${needsFlag ? "" : " (bundled headless shell)"}`);
    break;
  } catch (e) {
    mark(`[browser] ${cand}: ${e.message}; next candidate`);
    try { b.proc.kill(); } catch {}
    browserLog = b.log;
  }
}
if (!ws) {
  console.error("[browser] FATAL: no working browser. Last browser log:\n" + browserLog.join("").slice(-2000));
  process.exit(5);
}
mark(`chrome launched (DevTools port ${PORT}${PORT_ARG === null ? ", auto" : ", --port"})`);

let idc = 0;
const pending = new Map();
// F2: the renderer used to be blind to page errors, so a throwing film looked like a hang. Collect
// Runtime exceptions and console errors so a failure can be printed instead of guessed at.
const pageErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const {res, rej} = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
  } else if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails || {};
    const txt = (d.exception && (d.exception.description || d.exception.value)) || d.text || "unknown page exception";
    pageErrors.push(String(txt));
  } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
    pageErrors.push("console.error: " + (m.params.args || []).map((x) => x.value ?? x.description ?? x.type).join(" "));
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++idc;
    // Every CDP call is time-boxed: a dead renderer must surface as an error, never as a hang that
    // leaves a half-written (black) mp4 behind.
    const timer = setTimeout(() => { pending.delete(id); rej(new Error(`CDP timeout ${CDP_TIMEOUT_MS} ms on ${method} (browser stopped answering — renderer/GPU likely died)`)); }, CDP_TIMEOUT_MS);
    pending.set(id, {res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); }});
    try { ws.send(JSON.stringify({id, method, params})); } catch (e) { clearTimeout(timer); rej(e); }
  });
const errReport = () => pageErrors.length
  ? `\npage errors (${pageErrors.length}):\n` + pageErrors.map((e) => "  ! " + e).join("\n")
  : "\n(no page exception or console.error was reported by the page)";
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true});
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    const txt = (d.exception && (d.exception.description || d.exception.value)) || d.text || "evaluate failed";
    pageErrors.push(String(txt));
    throw new Error(`page exception while evaluating \`${String(expression).slice(0, 60)}\`: ${txt}`);
  }
  return r.result.value;
};
const abort = (msg) => {
  console.error(`[fatal] ${msg}${errReport()}`);
  // never leave a plausible-looking but empty/black mp4 at the delivery path
  try { if (existsSync(OUT)) unlinkSync(OUT); } catch {}
  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  process.exit(2);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {width: W, height: H, deviceScaleFactor: 1, mobile: false});
await send("Page.navigate", {url: pathToFileURL(FILM).href + "?capture=1&ratio=" + RATIO + "&pr=" + PR});
// F2: poll readiness, but fail fast with the page exception text instead of hanging or reading
// window.film.duration on an undefined window.film.
const READY_TIMEOUT_MS = 15000, FILM_GRACE_MS = 2500;
const tReady = Date.now();
let readyState = "missing";
while (Date.now() - tReady < READY_TIMEOUT_MS) {
  try {
    readyState = await evaluate("window.film ? (window.film.ready === true ? 'ready' : 'pending') : 'missing'");
  } catch { readyState = "missing"; }
  if (readyState === "ready") break;
  if (readyState === "missing" && (pageErrors.length > 0 || Date.now() - tReady > FILM_GRACE_MS)) {
    abort(`window.film was never assigned by ${FILM} (${Date.now() - tReady} ms after navigate)`);
  }
  await new Promise((r) => setTimeout(r, 50));
}
if (readyState !== "ready") abort(`window.film.ready never became true within ${READY_TIMEOUT_MS} ms (last state: ${readyState})`);
const duration = await evaluate("window.film.duration");
if (typeof duration !== "number" || !(duration > 0)) abort(`window.film.duration is not a positive number: ${JSON.stringify(duration)}`);
const totalFrames = Math.round(duration * FPS);
// F3b: a canvas-only film never asks the layout engine for its faces, so @font-face rules stay
// unloaded and the first painted frames silently use a fallback (Persian shaping still looks plausible,
// which is why this hid for so long). Force-load every declared family before the first capture.
const FAMILIES = [...new Set([...readFileSync(FILM, "utf8").matchAll(/@font-face\s*\{[^}]*?font-family\s*:\s*["']?([^;"'}]+)/gi)].map((m) => m[1].trim()))];
if (FAMILIES.length) {
  try {
    const res = await evaluate(`Promise.all(${JSON.stringify(FAMILIES)}.map(f => document.fonts.load('400 100px "' + f + '"').then(l => f + ':' + l.length).catch(e => f + ':ERR'))).then(a => a.join(' '))`);
    console.log(`[fonts] preload ${res}`);
  } catch (e) { console.log(`[fonts] preload failed: ${e.message}`); }
}
// F3: fonts must be settled before the first frame, otherwise a substituted system font is captured silently.
const fontState = await evaluate(`(async () => {
  const timeout = new Promise((r) => setTimeout(() => r("timeout"), 8000));
  const settled = await Promise.race([document.fonts.ready.then(() => "ready"), timeout]);
  const families = [...new Set([...document.fonts].map((f) => f.family))];
  return {
    settled,
    status: document.fonts.status,
    families,
    matched: families.map((f) => f + ":" + (document.fonts.check('16px "' + f + '"') ? "ok" : "NOT matched")),
  };
})()`);
console.log("[fonts] in-page " + JSON.stringify(fontState));
mark(`film ready, duration ${duration.toFixed(3)} s, ${totalFrames} frames`);

const TM = {seek: 0, shot: 0};
// Capture format (measured, docs/motion/PLAYBOOK-RENDER.md): default png = FINAL; --draft (or CAP_FORMAT=jpeg) = jpeg q97 for previews; CAP_QUALITY overrides q.
const USE_JPEG = args.includes("--draft") || process.env.CAP_FORMAT === "jpeg";
const SHOT_FORMAT = USE_JPEG ? {format: "jpeg", quality: Number(process.env.CAP_QUALITY || 97)} : {format: "png"};

// F5: canvas films must be exported from the canvas itself. On Windows/software rendering
// Page.captureScreenshot(fromSurface:true) returns the compositor's stale surface — the canvas layer is
// simply missing, so every frame comes back as flat background (measured: YAVG 16 vs 69 in the canvas).
// Mode is auto-detected: a single canvas covering the viewport => export it with toDataURL.
const SHOT_MODE_ARG = arg("--shot", "flatten");
const FLATTEN_MODE = SHOT_MODE_ARG === "flatten";
const canvasFit = await evaluate(`(() => {
  const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return {w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top)};
})()`);
const CANVAS_MODE = SHOT_MODE_ARG === "canvas";
console.log(`[shot] mode ${CANVAS_MODE ? "canvas" : "surface"} (${SHOT_MODE_ARG}); canvas ${canvasFit ? `${canvasFit.w}x${canvasFit.h} css ${canvasFit.cssW}x${canvasFit.cssH} @${canvasFit.left},${canvasFit.top}` : "none"}`);

// Flatten: compose WebGL + type in-page and return ONE image. Two hard-won constraints:
//  - the browser compositor can return unpainted tiles as solid black (that was the black square),
//    so we never let it composite;
//  - drawImage() straight off a large WebGL canvas stalls the GPU readback path here, while
//    gl.readPixels is fast, so we read pixels and blit them through a 2D canvas.
const grabFlatten = async () => {
  const mime = USE_JPEG ? "image/jpeg" : "image/png";
  const q = Number(process.env.CAP_QUALITY || 95);
  const dataUrl = await evaluate(`(() => {
    const E = window.__paE;
    const typ = document.getElementById("type");
    let out = window.__paFlat, full = window.__paFlatFull;
    if (!out) { out = window.__paFlat = document.createElement("canvas"); out.width = ${W}; out.height = ${H}; }
    const g = out.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, ${W}, ${H});
    if (E && E.gl) {
      const gl = E.gl, w = E.W * E.pr, h = E.H * E.pr;
      if (!window.__paPx || window.__paPx.length !== w * h * 4) window.__paPx = new Uint8Array(w * h * 4);
      const px = window.__paPx;
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      if (!full) { full = window.__paFlatFull = document.createElement("canvas"); full.width = w; full.height = h; }
      const fg = full.getContext("2d");
      const img = new ImageData(w, h);
      const row = w * 4;
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * row, (h - y) * row), y * row);
      fg.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
      g.drawImage(full, 0, 0, ${W}, ${H});
    }
    if (typ) g.drawImage(typ, 0, 0, ${W}, ${H});
    return out.toDataURL(${JSON.stringify(mime)}, ${q / 100});
  })()`);
  return Buffer.from(String(dataUrl).split(",")[1], "base64");
};

const shot = async (n) => {
  const t0 = Date.now();
  await evaluate(`window.film.seek(${n / FPS})`);
  const t1 = Date.now();
  let buf;
  if (FLATTEN_MODE) {
    buf = await grabFlatten();
  } else if (CANVAS_MODE) {
    const mime = USE_JPEG ? "image/jpeg" : "image/png";
    const q = Number(process.env.CAP_QUALITY || 97);
    const dataUrl = await evaluate(`(() => {
      const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      return c.toDataURL(${JSON.stringify(mime)}${USE_JPEG ? ", " + q : ""});
    })()`);
    buf = Buffer.from(String(dataUrl).split(",")[1], "base64");
  } else {
    await evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))");
    const r = await send("Page.captureScreenshot", {...SHOT_FORMAT, captureBeyondViewport: false, fromSurface: true, clip: {x: 0, y: 0, width: W, height: H, scale: 1}});
    buf = Buffer.from(r.data, "base64");
  }
  // a near-black frame encodes to a tiny JPEG. The GPU drops one now and then; re-capture the same
  // frame rather than shipping a black flash into the cut.
  if (USE_JPEG && buf.length < 12000) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await evaluate(`window.film.seek(${n / FPS})`);
      const again = FLATTEN_MODE ? await grabFlatten()
        : Buffer.from((await send("Page.captureScreenshot", {...SHOT_FORMAT, captureBeyondViewport: false, fromSurface: true, clip: {x: 0, y: 0, width: W, height: H, scale: 1}})).data, "base64");
      if (again.length > buf.length) buf = again;
      if (buf.length >= 12000) break;
    }
    TM.retries = (TM.retries || 0) + 1;
  }
  TM.seek += t1 - t0; TM.shot += Date.now() - t1;
  return buf;
};

// Black-frame / stale-surface gate: a uniform frame is never a valid film frame, and a capture path
// that returns the compositor's old surface looks plausible until you measure it. Sample three times
// before the long encode, and cross-check the captured pixels against the canvas's own pixels.
const canvasLuma = async (t) => {
  const has = await evaluate("typeof window.film.luma === 'function'");
  if (has) return evaluate(`(window.film.seek(${t}), window.film.luma())`);
  return evaluate(`(() => {
  window.film.seek(${t});
  const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!c) return -1;
  // a WebGL canvas has no 2d context; the caller falls back to measuring the captured frame
  const g = c.getContext("2d");
  if (!g) return -2;
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 137) { sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
  return sum / n;
})()`);
};
const frameLuma = async (buf) => {
  const f = join(tmpdir(), `pa-gate-${Date.now()}.png`);
  writeFileSync(f, buf);
  // decode to raw rgb24 and average in-process: signalstats reports limited-range Y, which cannot be
  // compared with the full-range value readPixels gives us. Same units or the check is noise.
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], {maxBuffer: 1 << 28});
  try { unlinkSync(f); } catch {}
  const px = r.stdout;
  if (!px || px.length < 3) return -1;
  let sum = 0, n = 0;
  for (let i = 0; i < px.length; i += 3 * 36) {
    sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    n++;
  }
  return n ? sum / n : -1;
};
{
  const samples = [];
  for (const t of [0.2, duration * 0.5, Math.max(0.2, duration - 0.3)]) samples.push([t, await canvasLuma(t)]);
  const known = samples.filter(([, y]) => y >= 0);
  console.log("[gate] canvas luma " + samples.map(([t, y]) => `t=${t.toFixed(1)}s Y=${y < 0 ? "n/a (webgl)" : y.toFixed(1)}`).join(" · "));
  if (known.length && known.every(([, y]) => y < 3)) abort(`every sampled frame is black (max Y ${Math.max(...known.map(([, y]) => y)).toFixed(2)}) — the film is not painting`);
  // probe the SAME instant the canvas sample was taken at, otherwise this compares two different frames
  const probeT = samples[0][0];
  const probe = await frameLuma(await shot(Math.round(probeT * FPS)));
  console.log(`[gate] captured frame Y=${probe.toFixed(1)}${known.length ? ` vs canvas Y=${known[0][1].toFixed(1)}` : ""} (t=${probeT.toFixed(1)}s)`);
  if (probe >= 0 && probe < 3) abort(`captured frame is black (Y=${probe.toFixed(1)}) — the capture path is not seeing the film`);
  // a WebGL canvas plus the 2D type overlay never match to the decimal (the overlay is not in readPixels)
  if (probe >= 0 && known.length && Math.abs(probe - known[0][1]) > 18) abort(`captured frame (Y=${probe.toFixed(1)}) does not match the canvas (Y=${known[0][1].toFixed(1)}) at t=${probeT.toFixed(1)}s: the capture path is returning a stale surface, not the film`);
}

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
  "-f", "image2pipe", "-c:v", (USE_JPEG ? "mjpeg" : "png"), "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", String(arg("--crf", process.env.PA_CRF || "18")), "-pix_fmt", "yuv420p", "-r", String(FPS),
  // 2 s keyframe interval is a delivery token (skill: keyframe ≤ 2s); x264's default put one every 8.3 s
  "-g", String(FPS * 2), "-keyint_min", String(FPS * 2),
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
mark(`timing: seek ${(TM.seek / count).toFixed(0)} ms/frame, screenshot ${(TM.shot / count).toFixed(0)} ms/frame`);
mark(`output ${OUT}`);
if (existsSync(OUT)) {
  const mb = readFileSync(OUT).length / 1048576;
  mark(`delivery: ${mb.toFixed(1)} MB = ${((mb * 8) / duration).toFixed(1)} Mbps for ${duration.toFixed(1)} s`);
}
// TV check of the produced mp4 (report only unless --tv-fix)
if (existsSync(OUT) && !stillArg && !args.includes("--no-optimize")) {
  const t = spawnSync(PY, ["-P", join(ASSETS_DIR, "tv_check.py"), OUT], {encoding: "utf8", cwd: ASSETS_DIR});
  console.log("[tv-check] " + (t.error ? "SKIPPED: " + t.error.message : (t.stdout || t.stderr || "").trim()));
  if (!t.error && t.status !== 0 && args.includes("--tv-fix")) {
    const f = spawnSync(PY, ["-P", join(ASSETS_DIR, "optimize_assets.py"), OUT, "--no-images", "--delete-originals"], {encoding: "utf8", cwd: ASSETS_DIR});
    console.log("[tv-fix] " + (f.stdout || f.stderr || "").trim());
  }
}
