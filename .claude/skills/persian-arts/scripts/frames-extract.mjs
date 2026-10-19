#!/usr/bin/env node
/*
 * frames-extract.mjs — keyframe extraction for metrics evidence.
 * Usage: node frames-extract.mjs <video.mp4> --times 0.5,3.2,8 --out metrics/frames/clip-01
 * Saves one PNG per time (scene keyframes) for the metrics record.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const [, , video, ...rest] = process.argv;
if (!video) { console.error("usage: frames-extract.mjs <video.mp4> --times t1,t2,... --out <dir>"); process.exit(1); }
const arg = (name, dflt) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : dflt; };
const V = resolve(video);
const times = (arg("--times", "") || "").split(",").map(Number).filter(n => !Number.isNaN(n));
const outDir = resolve(arg("--out", "metrics/frames/clip-01"));
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

times.forEach((t, i) => {
  const file = join(outDir, `f${String(i + 1).padStart(2, "0")}-${t.toFixed(2)}s.png`);
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", V, "-frames:v", "1", "-y", file], { encoding: "utf8" });
    console.log(`[frames] ${file}`);
  } catch (e) {
    console.error(`[frames] FAIL at ${t}s: ${String(e).slice(0, 200)}`);
  }
});
