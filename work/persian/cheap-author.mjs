#!/usr/bin/env node
// Run ONE card's Persian localization (author or fix role) on a cheap worker (Codex account or GLM) through quota-hub.
// Usage: node work/persian/cheap-author.mjs --slug <slug> --worker codex-a|codex-b|glm --model <m> [--effort low|medium|high]
//          [--role author|fix] [--timeout 1500] [--review work/persian/out/<slug>/review.json]
// Guard: files outside this card's dirs that the worker changed are reported and restored (the repo holds the owner's
// uncommitted work; a worker must never clobber it). Prints one JSON summary line.
import {readFile, writeFile, mkdir, cp, rm} from "node:fs/promises";
import {existsSync} from "node:fs";
import {resolve, join, relative} from "node:path";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const slug = arg("slug"), worker = arg("worker"), model = arg("model"), effort = arg("effort", "low");
const role = arg("role", "author"), timeout = arg("timeout", "1500"), reviewFile = arg("review");
if (!slug || !worker || !model) { console.error("need --slug --worker --model"); process.exit(2); }
const root = resolve(import.meta.dirname, "..", "..");
const QH = "D:/P/tools/quota-hub/bin/qh.mjs";

const info = JSON.parse(spawnSync(process.execPath, ["work/persian/card-info.mjs", "--slug", slug], {cwd: root, encoding: "utf8"}).stdout);
const cardRel = relative(root, info.persianDir).replaceAll("\\", "/");
const outRel = `work/persian/out/${slug}`;
const tmpRel = `work/persian/src/workbench/.tmp/${slug}`;
const allowed = [cardRel + "/", outRel + "/", tmpRel + "/"];

// ---- prompt: the same COMMON checklist the Sonnet workflow uses
const wf = await readFile(join(root, "work/persian/workflow/persian-rtl-localize.js"), "utf8");
const a = wf.indexOf("const COMMON = `") + "const COMMON = `".length;
const b = wf.indexOf("\n`\n", a);
const COMMON = new Function("ROOT", "return `" + wf.slice(a, b + 1) + "`")(root.replaceAll("\\", "\\\\"));
const envNotes = `
WORKER ENVIRONMENT (read carefully)
- You are a cheaper model working autonomously; there is no human to ask. Decide and finish. A reviewer (a stronger model) will judge your result adversarially, so careless work will be rejected.
- Run everything from the repo root ${root}. Write ONLY inside: ${allowed.join(" , ")} . Any other change is automatically reverted and counts against you.
- You must LOOK at the rendered PNG frames (fa vs orig) before you declare anything clean. If your tools cannot open/view images, say so plainly in report.json "concerns" and do NOT claim visual verification you did not do.
- Never run git. Do not install packages. The render harness takes ~1-3 minutes per run; budget your iterations.
- Finish by writing work/persian/out/${slug}/report.json (font+reason, rtlDecisions per comp, raster handling, concerns, new lessons) and rendering the final video with --video.`;
const task = role === "fix"
  ? `${COMMON}\n${envNotes}\nYOUR TASK (FIX ROLE): card "${slug}" was localized already but an independent reviewer found problems. Fix every blocker and major issue (minor ones if cheap), re-render the affected frames and the video, and update report.json. Reviewer findings:\n${await readFile(resolve(root, reviewFile), "utf8")}`
  : `${COMMON}\n${envNotes}\nYOUR TASK: localize the card "${slug}" (every demo component of that card) into Persian/RTL with full craft, following the checklist and process above.`;
await mkdir(join(root, "work/persian/out", slug), {recursive: true});
const promptFile = join(root, "work/persian/out", slug, `${role}.prompt.md`);
await writeFile(promptFile, task, "utf8");

// ---- guard snapshot of everything dirty/untracked outside the allowed dirs
const git = (...a) => spawnSync("git", a, {cwd: root, encoding: "utf8", maxBuffer: 1 << 28}).stdout;
// infrastructure paths other workers edit concurrently: never reported or restored by the guard
const INFRA = ["scripts/", "docs/", "CLAUDE.md", "AGENTS.md", "work/persian/sound-task/", "work/persian/orders/", "work/persian/cheap-", "work/persian/review-prompt"];
const dirty = () => git("ls-files", "-m", "-o", "-d", "--exclude-standard").split("\n").map((s) => s.trim()).filter(Boolean)
  .filter((p) => !allowed.some((al) => p.startsWith(al)) && !(p.startsWith("work/persian/src/demos/") && !p.startsWith("work/persian/src/demos/_fa/")) && !p.startsWith("work/persian/out/") && !p.startsWith("work/persian/trial/") && !p.startsWith("work/persian/batch39") && !p.includes("/.tmp/") && !p.startsWith("work/persian/progress") && !p.startsWith("work/persian/reports/") && !p.startsWith("work/persian/PROGRESS") && !INFRA.some((ip) => p.startsWith(ip)));
const hashOf = (p) => { try { return createHash("sha1").update(require_read(p)).digest("hex"); } catch { return "MISSING"; } };
import {readFileSync} from "node:fs";
function require_read(p) { return readFileSync(join(root, p)); }
const before = new Map(dirty().map((p) => [p, hashOf(p)]));
const trackedAll = git("ls-files").split("\n").filter(Boolean);
const backup = join(process.env.TEMP, `qh-guard-${slug}-${Date.now()}`);
for (const p of before.keys()) if (existsSync(join(root, p))) { await mkdir(join(backup, p, ".."), {recursive: true}); await cp(join(root, p), join(backup, p)); }

const t0 = Date.now();
const runEnv = {...process.env, QH_CODEX_FULL: "1", QH_GLM_ALLOWED: "Bash(node work/persian/render-card.mjs:*)|Bash(node work/persian/card-info.mjs:*)|Bash(ls:*)|Bash(cat:*)|Bash(grep:*)|Read|Edit|Write|Glob|Grep"};
const run = spawnSync(process.execPath, [QH, "run", "--worker", worker, "--model", model, "--effort", effort, "--cwd", root,
  "--task-file", promptFile, "--kind", `persian-${role}`, "--title", `${role} ${slug}`, "--timeout", timeout, "--json"], {cwd: root, encoding: "utf8", maxBuffer: 1 << 28, env: runEnv});
let result = {}; try { result = JSON.parse(run.stdout.trim().split("\n").pop()); } catch { result = {status: "error", raw: (run.stdout + run.stderr).slice(-500)}; }

// ---- guard check + restore
const violations = [];
const after = dirty();
for (const p of new Set([...before.keys(), ...after])) {
  const h = hashOf(p);
  if (before.has(p)) {
    if (before.get(p) !== h) { violations.push(p); if (existsSync(join(backup, p))) await cp(join(backup, p), join(root, p)); else await rm(join(root, p), {force: true}); }
  } else { // newly dirty/untracked outside allowed
    violations.push(p);
    if (trackedAll.includes(p)) git("checkout", "--", p); /* new untracked files are only reported, never deleted (concurrent legit work) */
  }
}
await rm(backup, {recursive: true, force: true});

const reportPath = join(root, "work/persian/out", slug, "report.json");
const videos = existsSync(join(root, "work/persian/out", slug)) ? (await import("node:fs")).readdirSync(join(root, "work/persian/out", slug)).filter((f) => f.endsWith(".fa.mp4")) : [];
console.log(JSON.stringify({slug, role, worker, model, effort, jobId: result.jobId, status: result.status, durationS: Math.round((Date.now() - t0) / 1000),
  quotaDeltaPct: result.quotaDeltaPct, violations, hasReport: existsSync(reportPath), videos}));
