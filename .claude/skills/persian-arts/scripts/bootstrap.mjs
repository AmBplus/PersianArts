#!/usr/bin/env node
/* bootstrap.mjs — make the persian-arts skill self-sufficient.
 *
 * The skill must work on a fresh clone: every dependency it needs is either installed, vendored or
 * fetched here. Run it once per session (or when something is missing) and it reports what it did.
 *
 *   node .claude/skills/persian-arts/scripts/bootstrap.mjs            # check + repair
 *   node .claude/skills/persian-arts/scripts/bootstrap.mjs --offline  # check only, never touches the network
 *   node .claude/skills/persian-arts/scripts/bootstrap.mjs --json     # machine-readable report
 *
 * Exit codes: 0 = everything ready (or repaired), 3 = something is missing and could not be repaired.
 *
 * Note: cmd.exe is not spawnable in every sandbox, so nothing here goes through a shell —
 * npm runs as `node <npm-cli.js>` and powershell as its own exe.
 */
import {existsSync, statSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..");           // .claude/skills/persian-arts/scripts -> repo root
const OFFLINE = process.argv.includes("--offline");
const AS_JSON = process.argv.includes("--json");
const NPM_CLI = process.env.NPM_CLI || "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js";
const PS_EXE = process.env.PS_EXE || "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";

const report = [];
let failures = 0;

const rel = (p) => path.relative(REPO, p).replace(/\\/g, "/");
function say(line) { if (!AS_JSON) console.log(line); }
function ok(name, detail) { report.push({name, state: "ok", detail}); say(`  ok    ${name} — ${detail}`); }
function repaired(name, detail) { report.push({name, state: "repaired", detail}); say(`  fixed ${name} — ${detail}`); }
function missing(name, detail) { report.push({name, state: "missing", detail}); failures++; say(`  MISS  ${name} — ${detail}`); }

function has(p) { try { return existsSync(p) && statSync(p).isFile(); } catch { return false; } }
function dir(p) { try { return existsSync(p) && statSync(p).isDirectory(); } catch { return false; } }
function node(args, opts = {}) {
  return execFileSync(process.execPath, args, {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 900000, ...opts});
}
function npm(args, cwd) { return node([NPM_CLI, ...args], {cwd}); }
function powershell(script, cwd) {
  return execFileSync(PS_EXE, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 900000});
}

// ---------------------------------------------------------------- 1. node-side tool packages
const TOOLS_PKG = path.join(REPO, "work", "persian", "tools", "assets");
const TOOLS_DEPS = ["sharp", "pixelmatch", "svg-path-properties", "web-audio-beat-detector", "gl-transitions", "svgo"];
say("node-side tools (work/persian/tools/assets)");
if (!has(path.join(TOOLS_PKG, "package.json"))) {
  missing("tools package.json", "work/persian/tools/assets/package.json is gone — the repo layout changed");
} else {
  let deps = {};
  try { deps = JSON.parse(node(["-e", 'process.stdout.write(JSON.stringify(require("./package.json").dependencies||{}))'], {cwd: TOOLS_PKG})); }
  catch (e) { missing("tools deps", `cannot read package.json: ${String(e.message).split("\n")[0]}`); }
  const gone = TOOLS_DEPS.filter((d) => !deps[d]);
  if (!gone.length) ok("tools deps", `${TOOLS_DEPS.length} packages present`);
  else if (OFFLINE) missing("tools deps", `not installed: ${gone.join(", ")}`);
  else {
    try {
      npm(["install", "--save", "--no-audit", "--no-fund", ...gone], TOOLS_PKG);
      repaired("tools deps", `installed ${gone.join(", ")}`);
    } catch (e) { missing("tools deps", `npm install failed: ${String(e.message).split("\n")[0]}`); }
  }
}

// ---------------------------------------------------------------- 2. browser-side vendor package
const VENDOR = path.join(REPO, "work", "persian", "htmlfilm", "vendor");
const VENDOR_DEPS = ["three", "postprocessing", "pixi.js"];
say("browser vendor (work/persian/htmlfilm/vendor)");
if (!has(path.join(VENDOR, "package.json"))) {
  missing("vendor package.json", "work/persian/htmlfilm/vendor/package.json is gone");
} else {
  const gone = VENDOR_DEPS.filter((d) => !dir(path.join(VENDOR, "node_modules", d)));
  if (!gone.length) ok("vendor deps", `${VENDOR_DEPS.join(", ")} present`);
  else if (OFFLINE) missing("vendor deps", `not installed: ${gone.join(", ")}`);
  else {
    try {
      npm(["install", "--no-audit", "--no-fund"], VENDOR);
      repaired("vendor deps", `installed ${gone.join(", ")}`);
    } catch (e) { missing("vendor deps", `npm install failed: ${String(e.message).split("\n")[0]}`); }
  }
}

// ---------------------------------------------------------------- 3. fonts
say("fonts");
const FONT_SETS = [
  [path.join(REPO, ".claude", "skills", "persian-arts", "assets", "fonts"), ["Vazirmatn-Variable.ttf", "Estedad-Variable.ttf", "Amiri-Regular.ttf", "Lalezar-Regular.ttf"]],
  [path.join(REPO, "work", "persian", "htmlfilm", "fonts"), ["Vazirmatn-Variable.woff2"]],
];
for (const [dirPath, files] of FONT_SETS) {
  const gone = files.filter((f) => !has(path.join(dirPath, f)));
  if (!gone.length) ok(`fonts ${rel(dirPath)}`, `${files.length} file(s)`);
  else missing(`fonts ${rel(dirPath)}`, `missing: ${gone.join(", ")}`);
}

// ---------------------------------------------------------------- 4. craft kit + tools
say("craft kit and tools");
const FILES = [
  ["work/persian/htmlfilm/lib/pa-film.js", "PF kit"],
  ["work/persian/htmlfilm/lib/pa-motion.js", "motion kit"],
  ["work/persian/htmlfilm/lib/pa-effects.js", "canvas effect kit (PF.fx)"],
  ["work/persian/htmlfilm/lib/pa-fx.js", "WebGL2 effect/transition runner"],
  ["work/persian/htmlfilm/lib/pa-world.js", "three.js world kit"],
  ["work/persian/htmlfilm/lib/shaders/index.js", "GLSL shader registry"],
  ["work/persian/htmlfilm/capture.mjs", "renderer"],
  ["work/persian/tools/qc/contact.mjs", "review sheets"],
  ["work/persian/tools/gates/motion-energy.mjs", "motion metric"],
  ["work/persian/tools/gates/craft-scan.mjs", "static craft scan"],
  [".claude/skills/persian-arts/references/motion-anti.md", "anti-pattern list"],
  [".claude/skills/persian-arts/references/effects.md", "effect kit reference"],
  [".claude/skills/persian-arts/references/persian-text.md", "Persian text rules"],
];
for (const [p, label] of FILES) {
  if (has(path.join(REPO, p))) ok(label, p);
  else missing(label, `${p} is missing`);
}

// ---------------------------------------------------------------- 5. reference gallery (network)
say("reference gallery (professional films to look at)");
const GALLERY = path.join(REPO, "work", "persian", "reference-motion");
const galleryIndex = path.join(GALLERY, "index.html");
if (has(galleryIndex)) {
  let n = "?";
  try { n = node(["-e", 'const s=require("fs").readFileSync(process.argv[1],"utf8");console.log((s.match(/class=.?item/g)||[]).length||0)', galleryIndex]).trim(); } catch {}
  ok("reference gallery", `${rel(galleryIndex)} (${n} items)`);
} else if (OFFLINE) {
  missing("reference gallery", "not fetched yet (offline mode)");
} else {
  const ps = path.join(GALLERY, "fetch-reference.ps1");
  if (!has(ps)) missing("reference gallery", "fetch-reference.ps1 is gone — cannot fetch");
  else {
    try {
      powershell('-ExecutionPolicy Bypass -File "fetch-reference.ps1"', GALLERY);
      node(["build-gallery.mjs"], {cwd: GALLERY});
      repaired("reference gallery", "fetched and built");
    } catch (e) { missing("reference gallery", `fetch failed: ${String(e.message).split("\n")[0]}`); }
  }
}

// ---------------------------------------------------------------- 6. starters
say("starters (copy one instead of starting from scratch)");
const STARTERS = path.join(REPO, "work", "persian", "htmlfilm", "starters");
let starters = "";
if (dir(STARTERS)) {
  try { starters = node(["-e", 'const fs=require("fs");console.log(fs.readdirSync(process.argv[1],{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).join(", "))', STARTERS]).trim(); }
  catch {}
}
if (starters) ok("starters", starters);
else missing("starters", "work/persian/htmlfilm/starters has no starter folders");

// ---------------------------------------------------------------- report
say("");
if (AS_JSON) console.log(JSON.stringify({ready: failures === 0, failures, items: report}, null, 2));
else console.log(failures === 0 ? "bootstrap: ready" : `bootstrap: ${failures} item(s) still missing`);
process.exit(failures === 0 ? 0 : 3);
