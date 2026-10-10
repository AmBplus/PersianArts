#!/usr/bin/env node
// Renders every Shotcraft workbench card (original Remotion source, unmodified) to MP4 for the "faithful baseline".
// Usage: node scripts/render-upstream-batch.mjs [--only id1,id2] [--limit N]
import {readFile, mkdir, access} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve, join} from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const wb = resolve("work/upstream/src/workbench"), outDir = resolve("work/upstream/out/video");
const entry = join(wb, "src/remotion/index.ts");
const only = arg("only") ? new Set(arg("only").split(",")) : null, limit = Number(arg("limit", Infinity));
const comps = (await readFile(resolve("work/upstream/comps.txt"), "utf8")).split(/\r?\n/).filter(Boolean)
  .map((l) => l.split(/\s+/)[0]).filter((id) => id.startsWith("demo-") && (!only || only.has(id))).slice(0, limit);
await mkdir(outDir, {recursive: true});
const bundleDir = resolve("work/upstream/bundle");
const run = (args) => spawnSync("npx", ["remotion", ...args], {cwd: wb, stdio: "inherit", shell: true});
if (run(["bundle", entry, "--out-dir", bundleDir]).status !== 0) throw new Error("bundle failed");
let ok = 0, failed = [];
for (const [i, id] of comps.entries()) {
  const out = join(outDir, `${id}.mp4`);
  if (await access(out).then(() => true, () => false)) { ok++; continue; }
  const r = run(["render", bundleDir, id, out, "--log=error"]);
  if (r.status === 0) ok++; else failed.push(id);
  console.log(`[${i + 1}/${comps.length}] ${id} ${r.status === 0 ? "ok" : "FAILED"}`);
}
console.log(JSON.stringify({total: comps.length, ok, failed}, null, 2));
