#!/usr/bin/env node
// contact.mjs — build review sheets from a rendered film (the "look" loop).
//
// WHY: the reference motion projects all review their film as IMAGES, not as a description:
// a tiled contact sheet of the whole film, a 12-frame strip around a suspicious moment, and a
// 360px-wide phone view (real readability test). Scoring happens on those sheets.
// Sources: howseen-ai/claude-motion-design §8 (contact/strip/phone via ffmpeg),
//          Mort1d/motion-graphics-skills `capture.mjs review`, bang-motion `scripts/snap.mjs`.
//
// USAGE:
//   node tools/qc/contact.mjs <frames-dir|video.mp4> --out out/qc [--at 8.5] [--n 24]
//        [--cols 6] [--phone 360] [--fps 30]
//
// OUTPUT (in --out):
//   sheet.jpg    N frames spread over the whole film, tiled
//   strip.jpg    12 frames around --at (seconds)
//   phone.jpg    the same frames scaled to 360px wide (mobile readability)
//   review.json  the exact timestamp of every tile + the scoring rubric
//
// EXIT CODES: 0 = all three sheets written · 2 = usage/input error.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const IMG_RE = /\.(png|jpe?g|webp|bmp|tiff?)$/i;

const listFrames = (dir) => fs.readdirSync(dir)
  .filter((f) => IMG_RE.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,avg_frame_rate,r_frame_rate,nb_frames,duration', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffprobe failed: ${file}`);
  const st = JSON.parse(r.stdout).streams?.[0];
  if (!st) throw new Error(`no video stream in ${file}`);
  const fpsOf = (r0) => {
    if (!r0 || !String(r0).includes('/')) return null;
    const [a, b] = String(r0).split('/').map(Number);
    const v = a / b;
    return v > 1 && v < 240 ? v : null;
  };
  const fps = fpsOf(st.avg_frame_rate) || fpsOf(st.r_frame_rate) || 30;
  const duration = +st.duration || (st.nb_frames ? +st.nb_frames / fps : 0);
  return { w: +st.width, h: +st.height, fps, duration, frames: st.nb_frames ? +st.nb_frames : null };
}

// Build an ffmpeg input that works for both a video file and a frames directory.
function makeInput(target) {
  const isDir = fs.statSync(target).isDirectory();
  if (!isDir) return { args: ['-i', target], isDir, tmp: null };
  const files = listFrames(target);
  if (!files.length) throw new Error(`no image file in ${target}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-contact-'));
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, files.map((f) => `file '${path.resolve(target, f).replace(/\\/g, '/')}'\nduration 0.033333`).join('\n') + '\n');
  return { args: ['-f', 'concat', '-safe', '0', '-i', list], isDir, tmp };
}

function runFfmpeg(inputArgs, filter, outFile, frames = 1) {
  const args = ['-v', 'error', '-y', ...inputArgs, '-vf', filter, '-frames:v', String(frames), outFile];
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${outFile}: ${(r.stderr || '').split('\n').slice(-3).join(' | ')}`);
  return outFile;
}

export function buildSheets(target, { out, at = 8.5, n = 24, cols = 6, phone = 360, fps = 30 } = {}) {
  fs.mkdirSync(out, { recursive: true });
  const inp = makeInput(target);
  const info = inp.isDir ? { fps, duration: listFrames(target).length / fps } : probe(target);
  const rows = Math.max(1, Math.ceil(n / cols));
  const dur = Math.max(0.5, info.duration || 1);
  const step = dur / n;

  // contact sheet: pick every step-th frame
  const pickFilter = (scaleW) => `select='not(mod(n\\,${Math.max(1, Math.round(step * info.fps))}))',scale=${scaleW}:-2:flags=area,tile=${cols}x${rows}`;
  const sheetPath = path.join(out, 'sheet.jpg');
  runFfmpeg(inp.args, pickFilter(320), sheetPath);

  // strip: 12 frames around --at
  const atT = Math.min(Math.max(0, +at), Math.max(0, dur - 1));
  const stripFilter = `fps=12,scale=240:-2:flags=area,tile=12x1`;
  const stripPath = path.join(out, 'strip.jpg');
  runFfmpeg(['-ss', String(Math.max(0, atT - 0.5)), ...inp.args], stripFilter, stripPath);

  // phone view
  const phonePath = path.join(out, 'phone.jpg');
  runFfmpeg(inp.args, pickFilter(phone), phonePath);

  if (inp.tmp) fs.rmSync(inp.tmp, { recursive: true, force: true });

  const times = Array.from({ length: n }, (_, i) => +(i * step).toFixed(2));
  const rubric = [
    'hook: something interesting in the first 2 seconds',
    'readability at 360px: the message survives on a phone',
    'motion quality: no dead frames, no linear drift, every move has a job',
    'variety: something new every 2-4 seconds',
    'composition: one hero per frame, no page chrome',
    'accuracy: brand colours, real numbers, correct Persian',
    'sync: picture and sound land together',
  ];
  const review = {
    target: path.resolve(target),
    source: inp.isDir ? 'frames-dir' : path.basename(target),
    durationS: +dur.toFixed(2),
    fps: info.fps,
    tiles: { sheet: times, stripStart: +(atT - 0.5).toFixed(2), stripFrames: 12 },
    rubric,
    rule: 'score every rubric line 1-10; nothing ships below 8 on any line',
  };
  fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify(review, null, 1));
  return { sheet: sheetPath, strip: stripPath, phone: phonePath, review: path.join(out, 'review.json'), review_: review };
}

export function main(argv = process.argv.slice(2)) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { flags[a.slice(2)] = argv[i + 1]; i++; }
    else positional.push(a);
  }
  const target = positional[0];
  if (!target || !fs.existsSync(target)) {
    console.error('usage: contact.mjs <frames-dir|video.mp4> --out out/qc [--at 8.5] [--n 24] [--cols 6] [--phone 360] [--fps 30]');
    return 2;
  }
  try {
    const r = buildSheets(target, {
      out: flags.out || 'out/qc',
      at: flags.at !== undefined ? +flags.at : 8.5,
      n: flags.n !== undefined ? +flags.n : 24,
      cols: flags.cols !== undefined ? +flags.cols : 6,
      phone: flags.phone !== undefined ? +flags.phone : 360,
      fps: flags.fps !== undefined ? +flags.fps : 30,
    });
    console.log(`sheet : ${r.sheet}`);
    console.log(`strip : ${r.strip}`);
    console.log(`phone : ${r.phone}`);
    console.log(`review: ${r.review}`);
    return 0;
  } catch (e) {
    console.error(`contact: ${e.message || e}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  process.exit(main());
}
