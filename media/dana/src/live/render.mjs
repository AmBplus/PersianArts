#!/usr/bin/env node
// Render harness for the Dana film (isolated Remotion project under work/dana).
// Bundles src/index.ts ONCE per run, then renders PNG stills and/or an H.264 MP4 from that bundle.
//
// Usage (from repo root or work/dana):
//   node work/dana/render.mjs --list
//   node work/dana/render.mjs --comp S0 [--frames 0,30,60] [--video] [--seconds 2] [--scale 0.5]
//                             [--audio file] [--out work/dana/out/<comp>]
// Output: JSON on stdout {comp, ok, stills[], video, timings{}, errors[]}. Exit 1 when any step failed.
import {spawnSync} from "node:child_process";
import {mkdir, readFile, rm} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const dir = dirname(fileURLToPath(import.meta.url)); // work/dana
const cli = join(dir, "node_modules", "@remotion", "cli", "remotion-cli.js");
const entry = join(dir, "src", "index.ts");
const publicDir = join(dir, "src", "public");

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  if (i < 0) return d;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};
const has = (n) => argv.includes(`--${n}`);

const timings = {};
const errors = [];
const timed = async (key, fn) => {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    timings[key] = Number(((performance.now() - t0) / 1000).toFixed(2));
  }
};

const runCli = (args) => {
  const r = spawnSync(process.execPath, [cli, ...args], {cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  return {ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\x1b\[[0-9;]*m/g, "")};
};

const bundleInto = async (bundleDir) => {
  await rm(bundleDir, {recursive: true, force: true});
  const r = await timed("bundle", async () =>
    runCli(["bundle", entry, "--out-dir", bundleDir, "--public-dir", publicDir, "--log=error"]),
  );
  return r;
};

// Remove bundle + esbuild scratch dirs even on failure.
const cleanup = async (bundleDir) => {
  await rm(bundleDir, {recursive: true, force: true});
};

const main = async () => {
  const tmpRoot = join(dir, ".tmp");
  await mkdir(tmpRoot, {recursive: true});
  const bundleDir = join(tmpRoot, `bundle-${process.pid}-${Date.now()}`);

  try {
    if (has("list")) {
      const b = await bundleInto(bundleDir);
      if (!b.ok) return {ok: false, stage: "bundle", error: b.out.slice(-3000), timings};
      // Remotion's own compositions printer, so the list matches what the renderer sees.
      const c = await timed("list", async () => runCli(["compositions", bundleDir]));
      if (!c.ok) return {ok: false, stage: "compositions", error: c.out.slice(-3000), timings};
      return {ok: true, compositions: c.out.trim().split(/\r?\n/).filter(Boolean), timings};
    }

    const comp = arg("comp");
    if (!comp || comp === true) {
      return {ok: false, error: "usage: --comp <Dana|S0..S8> [--frames a,b] [--video] [--seconds N] [--scale x] [--audio file] [--out dir] | --list"};
    }
    const scale = Number(arg("scale", 1)) || 1;
    const outDir = resolve(String(arg("out", join(dir, "out", comp))));
    await mkdir(outDir, {recursive: true});

    const b = await bundleInto(bundleDir);
    if (!b.ok) return {comp, ok: false, stage: "bundle", error: b.out.slice(-3000), timings};

    const framesArg = arg("frames");
    const frames =
      typeof framesArg === "string"
        ? framesArg.split(",").map((x) => Number(x.trim())).filter((x) => Number.isInteger(x) && x >= 0)
        : has("video") ? [] : [0];
    const suffix = scale !== 1 ? `.s${scale}` : "";

    const stills = [];
    for (const f of frames) {
      const out = join(outDir, `${comp}.f${f}${suffix}.png`);
      const r = await timed(`still_f${f}`, async () =>
        runCli(["still", bundleDir, comp, out, `--frame=${f}`, `--scale=${scale}`, "--log=error", "--overwrite"]),
      );
      if (r.ok) stills.push({frame: f, path: out});
      else errors.push({stage: "still", frame: f, error: r.out.slice(-1500)});
    }

    let video = null;
    if (has("video")) {
      const mp4 = join(outDir, `${comp}${suffix}.mp4`);
      const secs = arg("seconds");
      const {fps, frames: total} = await readTiming(comp);
      const last = secs !== true && secs !== undefined ? Math.min(total, Math.round(Number(secs) * fps)) : total;
      const frameRange = last < total ? `--frames=0-${last - 1}` : "";
      const args = ["render", bundleDir, comp, mp4, "--codec=h264", "--crf=18", `--scale=${scale}`, "--log=error", "--overwrite"];
      if (frameRange) args.push(frameRange);
      const r = await timed("video", async () => runCli(args));
      if (!r.ok) {
        errors.push({stage: "render", error: r.out.slice(-1500)});
      } else {
        video = mp4;
        const audio = arg("audio");
        if (typeof audio === "string") {
          const muxed = join(outDir, `${comp}${suffix}.audio.mp4`);
          const m = await timed("audio_mux", async () => ffmpegMux(mp4, resolve(audio), muxed));
          if (m.ok) video = muxed;
          else errors.push({stage: "audio_mux", error: m.out.slice(-1500)});
        }
      }
    }

    return {
      comp,
      ok: errors.length === 0,
      scale,
      outDir,
      stills,
      video,
      timings,
      errors,
    };
  } finally {
    await cleanup(bundleDir);
  }
};

// Frame count and fps per composition, derived from script/v2/cue-sheet-v2.json (same rule as src/timing.ts).
const readTiming = async (comp) => {
  if (comp === "DanaV3" || comp === "DanaV31") {
    const file = comp === "DanaV31" ? "cue-sheet-v31.json" : "cue-sheet-v3.json";
    const cue3 = JSON.parse(await readFile(join(dir, "script", "v3", file), "utf8"));
    return {fps: cue3.fps, frames: cue3.durationFrames};
  }
  const cue = JSON.parse(await readFile(join(dir, "script", "v2", "cue-sheet-v2.json"), "utf8"));
  const fps = cue.fps;
  if (comp === "Dana") return {fps, frames: cue.durationFrames};
  const i = Number(/^S(\d+)$/.exec(comp)?.[1]);
  const s = cue.scenes[i];
  if (!s) throw new Error(`unknown composition ${comp}`);
  return {fps, frames: Math.round(s.end * fps) - Math.round(s.start * fps)};
};

const ffmpegMux = (video, audio, out) => {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out],
    {encoding: "utf8"},
  );
  return {ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`};
};

const result = await main().catch((e) => ({ok: false, error: String(e?.stack ?? e)}));
console.log(JSON.stringify(result, null, 1));
process.exit(result.ok ? 0 : 1);
