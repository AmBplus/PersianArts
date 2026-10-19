#!/usr/bin/env node
/*
 * qc-check.mjs — automated technical QC for rendered clips.
 * Usage: node qc-check.mjs <video.mp4> [--stills-dir <dir>] [--transitions t1,t2]
 * Measures (evidence for the TECH/AUDIO/MOTION scores):
 *   - duration, resolution, fps, bitrate, container
 *   - LUFS + true peak (ffmpeg ebur128 + astats)
 *   - still count / still dimensions (if --stills-dir given)
 *   - frame-level: black frames, freeze frames (via ffprobe signalstats)
 * Writes JSON to <video>.qc.json and prints a one-page summary.
 * Exit 0 always (report-only); parse the JSON for gates.
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";

const [, , video, ...rest] = process.argv;
if (!video) { console.error("usage: qc-check.mjs <video.mp4> [--stills-dir dir] [--transitions t1,t2]"); process.exit(1); }
const arg = (name, dflt) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : dflt; };
const V = resolve(video);
const stillsDir = arg("--stills-dir", null);
const transitions = (arg("--transitions", "") || "").split(",").filter(Boolean);

const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const fp = (args) => execFileSync("ffprobe", ["-v", "error", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const report = { video: V, measured_at: new Date().toISOString() };

// ---- container facts
try {
  const out = fp(["-show_entries", "format=duration,bit_rate,format_name", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels", "-of", "json", V]);
  report.container = JSON.parse(out);
} catch (e) { report.container = { error: String(e).slice(0, 300) }; }

// ---- loudness (two-pass measurement, report-only)
try {
  const err = ff(["-i", V, "-map", "a:0?", "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const m = err.match(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS[\s\S]*?Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/);
  const loud = err.match(/Integrated loudness:\s*I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/);
  const tp = err.match(/True peak:\s*Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/);
  report.loudness = {
    lufs: loud ? Number(loud[1]) : (m ? Number(m[1]) : null),
    true_peak_dbfs: tp ? Number(tp[1]) : (m ? Number(m[2]) : null),
  };
} catch (e) { report.loudness = { error: String(e).slice(0, 300) }; }

// ---- black / freeze detection (signalstats + freezedetect)
try {
  const err = ff(["-i", V, "-vf", "blackdetect=d=0.1:pix_th=0.05,freezedetect=n=-60dB:d=0.5", "-an", "-f", "null", "-"]);
  report.black_frames = [...err.matchAll(/black_start:([\d.]+)\s*black_end:([\d.]+)/g)].map(m => ({ start: +m[1], end: +m[2] }));
  report.freeze_frames = [...err.matchAll(/freeze_start:([\d.]+)\s*freeze_end:([\d.]+)/g)].map(m => ({ start: +m[1], end: +m[2] }));
} catch (e) { report.black_frames = { error: String(e).slice(0, 300) }; }

// ---- stills (visual evidence for VISUAL/MOTION evaluation)
if (stillsDir && existsSync(stillsDir)) {
  const files = readdirSync(stillsDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
  report.stills = { dir: stillsDir, count: files.length, files: files.slice(0, 50) };
} else if (stillsDir) {
  report.stills = { dir: stillsDir, error: "missing" };
}

// ---- transition spot-check hints (RMS jump around cuts)
if (transitions.length) {
  report.transition_checks = transitions.map(t => ({ at: t, note: "run pa.ps1 audio-check for measured RMS jump" }));
}

const outPath = V + ".qc.json";
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`[qc] wrote ${outPath}`);
console.log(JSON.stringify(report, null, 2));
