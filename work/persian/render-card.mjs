#!/usr/bin/env node
// Per-card render harness for the Persian shotcraft localization.
// Bundles ONLY the demos of one card (so a half-edited file in another card can never break this build) and renders
// comparison stills (original English/Chinese render vs Persian) and/or the full Persian MP4.
//
// Usage (from repo root):
//   node work/persian/render-card.mjs --slug <card-slug> [--frames 0,40,80] [--video] [--no-orig]
// Output: work/persian/out/<slug>/{<Stem>.fa.f<F>.png, <Stem>.orig.f<F>.png, <Stem>.fa.mp4} and a JSON summary on stdout.
import {readFile, writeFile, mkdir, rm} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve, join} from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : (process.argv[i + 1]?.startsWith("--") ? true : process.argv[i + 1] ?? true); };
const slug = arg("slug");
if (!slug || slug === true) { console.error("usage: --slug <card-slug> [--frames a,b,c] [--video] [--no-orig]"); process.exit(2); }
const wantVideo = process.argv.includes("--video"), wantOrig = !process.argv.includes("--no-orig");

const root = resolve("work/persian");
const wb = join(root, "src/workbench");
const outDir = join(root, "out", slug);
const idx = await readFile(join(wb, "src/cards/demo-index.ts"), "utf8");
const comps = new Map((await readFile(resolve("work/upstream/comps.txt"), "utf8")).split(/\r?\n/).filter(Boolean).map((l) => {
  const m = l.trim().split(/\s+/); const [w, h] = (m[2] || "1920x1080").split("x").map(Number);
  return [m[0], {fps: Number(m[1]), w, h, frames: Number(m[3])}];
}));

// stems of this card, from the generated index (`@demos/<cat>/<slug>/<Stem>`)
const stems = [...idx.matchAll(/import \{ (\w+) as c\d+[^}]*\} from "@demos\/([\w-]+)\/([\w-]+)\/(\w+)"/g)]
  .filter((m) => m[3] === slug).map((m) => ({stem: m[1], cat: m[2], file: m[4]}));
if (!stems.length) { console.error(`no demos found for slug "${slug}"`); process.exit(3); }

const tmp = join(wb, ".tmp", slug);
await rm(tmp, {recursive: true, force: true});
await mkdir(tmp, {recursive: true});
await mkdir(outDir, {recursive: true});
// --duration N: inspect beyond a too-short registry duration (design length from the source prompt) without editing code
const durOverride = Number(arg("duration")) || 0;
const specs = stems.map((s) => {
  const base = {...s, id: `demo-${s.stem}`, ...(comps.get(`demo-${s.stem}`) || {fps: 30, w: 1920, h: 1080, frames: 150})};
  return durOverride ? {...base, frames: durOverride} : base;
});
const entry = `import React from "react";
import {registerRoot, Composition} from "remotion";
${specs.map((s, i) => `import {${s.stem} as C${i}} from "@demos/${s.cat}/${slug}/${s.file}";`).join("\n")}
const Root: React.FC = () => (<>
${specs.map((s, i) => `  <Composition id="${s.id}" component={C${i} as React.ComponentType<any>} durationInFrames={${s.frames}} fps={${s.fps}} width={${s.w}} height={${s.h}} />`).join("\n")}
</>);
registerRoot(Root);
`;
const entryFile = join(tmp, "index.tsx");
await writeFile(entryFile, entry, "utf8");

const run = (args, opts = {}) => spawnSync("npx", ["remotion", ...args], {cwd: wb, shell: true, encoding: "utf8", ...opts});
const bundleDir = join(outDir, "bundle");
const b = run(["bundle", entryFile, "--out-dir", bundleDir, "--log=error"]);
if (b.status !== 0) { console.log(JSON.stringify({slug, ok: false, stage: "bundle", error: (b.stdout + b.stderr).slice(-3000)}, null, 1)); process.exit(1); }

const frameArg = arg("frames");
const result = {slug, ok: true, comps: []};
for (const s of specs) {
  const frames = (typeof frameArg === "string" ? frameArg.split(",").map(Number)
    : [0.04, 0.25, 0.5, 0.75, 0.97].map((p) => Math.min(s.frames - 1, Math.round(s.frames * p)))).filter((f, i, a) => a.indexOf(f) === i);
  const item = {id: s.id, stem: s.stem, fps: s.fps, size: `${s.w}x${s.h}`, frames: s.frames, stills: [], errors: []};
  for (const f of frames) {
    const fa = join(outDir, `${s.stem}.fa.f${f}.png`);
    const r = run(["still", bundleDir, s.id, fa, `--frame=${f}`, "--log=error"]);
    if (r.status !== 0) { item.errors.push(`still f${f}: ${(r.stdout + r.stderr).slice(-600)}`); continue; }
    item.stills.push({frame: f, fa});
    if (wantOrig) {
      const orig = join(outDir, `${s.stem}.orig.f${f}.png`);
      const o = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve(`work/upstream/out/video/${s.id}.mp4`), "-vf", `select=eq(n\\,${f})`, "-vsync", "0", "-frames:v", "1", orig], {encoding: "utf8"});
      if (o.status === 0) item.stills[item.stills.length - 1].orig = orig;
    }
  }
  if (wantVideo) {
    const mp4 = join(outDir, `${s.stem}.fa.mp4`);
    const r = run(["render", bundleDir, s.id, mp4, "--concurrency=2", "--log=error"]);
    if (r.status === 0) item.video = mp4; else item.errors.push(`render: ${(r.stdout + r.stderr).slice(-600)}`);
  }
  result.comps.push(item);
}
await rm(bundleDir, {recursive: true, force: true});
await rm(tmp, {recursive: true, force: true});
result.ok = result.comps.every((c) => !c.errors.length);
console.log(JSON.stringify(result, null, 1));
process.exit(result.ok ? 0 : 1);
