#!/usr/bin/env node
// film-integrity.mjs — the integrity checks the normal gates do NOT catch.
//
//   node work/persian/tools/verify/film-integrity.mjs <versionFolder> [options]
//   node work/persian/tools/verify/film-integrity.mjs --write-version <versionFolder> [--force]
//
// Checks
//   I1  events.json cut_frames vs the REAL edit detected in the delivered mp4
//   I2  stale stills (_stills/ PNGs that no longer match the delivered mp4)
//   I3  frame-base sanity (declared duration_frames vs the real frame count, cut range,
//       and the frames-per-beat the numbers actually imply)
//   I4  VERSION.json presence for `pa deliver`  (--write-version generates one from real files)
//
// Exit code: 0 = no FAIL, 1 = at least one FAIL, 2 = usage / fatal.
//
// Tolerance choices (documented, not magic):
//   --tol  0.50 s   a declared cut "corresponds" to a detected change within this distance.
//                   One frame at 30 fps = 0.033 s, so 0.5 s = 15 frames. Anything larger
//                   would start excusing a whole beat at 120 BPM.
//   still match     mean absolute difference <= 4 / 255 against the same frame of the
//                   delivered mp4. A debug HUD or a regenerated overlay pushes MAD into the
//                   tens; an encode-generation difference stays under ~2.
//   scene floor     max(0.020, 0.15 * film_max_score) — adaptive, because these films cut
//                   between visually similar shots (s10's strongest change scores 0.16,
//                   while a 0.2 absolute threshold sees nothing at all).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const FV = path.join(ROOT, 'media/film-versions');
const HTMLFILM = path.join(ROOT, 'work/persian/htmlfilm');

const REL = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const rd = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const cmd = (bin, args, opts = {}) => spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opts });

function ffprobe(file) {
  const r = cmd('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]);
  const j = rd0(r.stdout);
  if (!j) return null;
  const v = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  const fr = (v.r_frame_rate || '0/1').split('/');
  return {
    file,
    width: +v.width, height: +v.height,
    nb_frames: v.nb_frames ? +v.nb_frames : null,
    fps: fr[1] ? +fr[0] / +fr[1] : null,
    duration: +j.format.duration,
    size: +j.format.size,
    sound: (j.streams || []).some((s) => s.codec_type === 'audio'),
  };
}
const rd0 = (s) => { try { return JSON.parse(s); } catch { return null; } };

function ratioOf(p) {
  const near = (a, b) => Math.abs(a - b) < 0.02;
  if (p.width > p.height) return near(p.width / p.height, 16 / 9) ? '16x9' : 'other';
  return near(p.height / p.width, 16 / 9) ? '9x16' : 'other';
}

function sha256(file) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 22);
  let n;
  while ((n = fs.readSync(fd, buf, 0, buf.length)) > 0) h.update(buf.subarray(0, n));
  fs.closeSync(fd);
  return h.digest('hex');
}

// ---------------------------------------------------------------- scene detection
// Returns { scores: [{n,t,s}], peaks: [{t,s}], floor, max } from the delivered mp4.
function sceneScores(mp4) {
  const r = cmd('ffmpeg', ['-hide_banner', '-nostats', '-i', mp4,
    '-vf', "select='gte(scene,0)',metadata=print", '-f', 'null', '-']);
  const scores = [];
  let cur = null;
  for (const line of (r.stderr || '').split(/\r?\n/)) {
    const mf = /frame:(\d+)\s+pts:\d+\s+pts_time:([0-9.]+)/.exec(line);
    if (mf) { cur = { n: +mf[1], t: +mf[2] }; continue; }
    const ms = /lavfi\.scene_score=([0-9.]+)/.exec(line);
    if (ms && cur) { scores.push({ n: cur.n, t: cur.t, s: +ms[1] }); cur = null; }
  }
  if (!scores.length) return { scores, peaks: [], floor: null, max: 0 };
  const max = Math.max(...scores.map((x) => x.s));
  const floor = Math.max(0.02, 0.15 * max);
  const raw = [];
  for (let i = 0; i < scores.length; i++) {
    if (scores[i].s < floor) continue;
    let local = true;
    for (let k = Math.max(0, i - 3); k <= Math.min(scores.length - 1, i + 3); k++) {
      if (scores[k].s > scores[i].s) { local = false; break; }
    }
    if (local) raw.push(scores[i]);
  }
  // merge peaks closer than 0.10 s, keeping the strongest
  const peaks = [];
  for (const p of raw.sort((a, b) => a.t - b.t)) {
    const last = peaks[peaks.length - 1];
    if (last && p.t - last.t < 0.1) { if (p.s > last.s) peaks[peaks.length - 1] = p; continue; }
    peaks.push(p);
  }
  return { scores, peaks, floor, max };
}

// ---------------------------------------------------------------- film.html truth
function parseSource(film) {
  const file = path.join(HTMLFILM, film, 'film.html');
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const num = {};
  for (const k of ['FPS', 'DURATION', 'BPM', 'T0']) {
    const m = new RegExp('\\b' + k + '\\s*=\\s*(-?[0-9.]+)').exec(src);
    if (m) num[k] = +m[1];
  }
  let fpb = null, fpbExpr = null;
  for (const m of src.matchAll(/\bFPB\s*=\s*([^;,\n]+)/g)) {
    // a header comment can also say "FPB = 30*60/120 = 15"; cut the expression at any further "="
    const expr = m[1].split('=')[0].trim();
    if (!/^[0-9A-Za-z_+\-*/(). ]+$/.test(expr)) continue;
    let v = null;
    try { v = Function('FPS', 'BPM', 'DURATION', 'return (' + expr + ')')(num.FPS, num.BPM, num.DURATION); } catch { continue; }
    if (Number.isFinite(v)) { fpb = v; fpbExpr = expr; break; }
  }
  let cuts = null, how = null;
  const mc = /\bCUTS\s*=\s*(\[[^\]]*\])/.exec(src);
  if (mc) { try { cuts = JSON.parse(mc[1].replace(/\s+/g, '')); how = 'const CUTS = [...]'; } catch { /* ignore */ } }
  if (!cuts) {
    const mb = /\bCUT_BEATS\s*=\s*(\[[^\]]*\])/.exec(src);
    if (mb && Number.isFinite(fpb)) {
      try { cuts = JSON.parse(mb[1].replace(/\s+/g, '')).map((b) => Math.round(b * fpb)); how = `CUT_BEATS x FPB(${fpb})`; } catch { /* ignore */ }
    }
  }
  return { file: REL(file), mtimeMs: fs.statSync(file).mtimeMs, ...num, fpb, fpbExpr, cuts, how };
}

// ---------------------------------------------------------------- helpers
const gcd2 = (a, b) => (b ? gcd2(b, a % b) : Math.abs(a));
const gcdAll = (a) => a.reduce((x, y) => gcd2(x, y), 0);
const fmt = (v, n = 2) => (Number.isFinite(v) ? v.toFixed(n) : String(v));
const near = (decl, peaks, tol) => {
  let best = null;
  for (const p of peaks) { const d = Math.abs(p.t - decl); if (best === null || d < best.d) best = { d, ...p }; }
  return best;
};

function extractFrames(mp4, frames, tmp, key) {
  if (!frames.length) return {};
  const sub = path.join(tmp, key);
  fs.mkdirSync(sub, { recursive: true });
  const expr = frames.map((f) => `eq(n,${f})`).join('+');
  const out = path.join(sub, 'f_%d.png');
  cmd('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mp4,
    '-vf', `select='${expr}'`, '-vsync', '0', '-frame_pts', '1', out]);
  const m = {};
  for (const f of frames) {
    const p = path.join(sub, `f_${f}.png`);
    if (fs.existsSync(p)) m[f] = p;
  }
  return m;
}

function compare(a, b) {
  const r = cmd('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-filter_complex',
    '[0:v]split[a1][a2];[1:v]split[b1][b2];[a1][b1]ssim;[a2][b2]blend=all_mode=difference,format=gray,signalstats,metadata=print',
    '-f', 'null', '-']);
  const txt = r.stderr || '';
  const ms = /SSIM[^\n]*All:([0-9.]+)/.exec(txt);
  const mm = /signalstats\.YAVG=([0-9.]+)/.exec(txt);
  return { ssim: ms ? +ms[1] : null, mad: mm ? +mm[1] : null };
}

// ---------------------------------------------------------------- I1
function checkI1(ctx, res) {
  const { events, ref } = ctx;
  const out = { name: 'I1  events-vs-render agreement', status: 'N-A', notes: [], declared: [], detected: [], unpairedDeclared: [], undeclaredReal: [], beyond: [] };
  if (!events) { out.notes.push('no events.json (pass --events <path> or place it at work/persian/htmlfilm/<film>/events.json)'); return out; }
  if (!ref) { out.notes.push('no delivered mp4 to detect the real edit from'); return out; }
  const fps = +events.fps || 30;
  const tol = ctx.tol;
  const sc = sceneScores(ref.file);
  const peaks = sc.peaks;
  out.floor = sc.floor; out.max = sc.max;
  out.notes.push(`scene detection: ffmpeg select='gte(scene,0)' over every frame, local maximum in a +/-3 frame window, floor = max(0.020, 0.15 x ${fmt(sc.max, 4)}) = ${fmt(sc.floor, 4)}, peaks closer than 0.10 s merged`);
  out.notes.push(`peak criterion per declared cut: |t_declared - t_detected| <= ${tol} s`);
  out.detected = peaks.map((p) => ({ t: p.t, s: p.s }));
  if (ctx.src && ctx.src.cuts && ctx.src.mtimeMs > fs.statSync(ref.file).mtimeMs) {
    out.notes.push(`CAVEAT: ${ctx.src.file} was modified AFTER the delivered mp4 (source ${new Date(ctx.src.mtimeMs).toISOString()} vs mp4 ${new Date(fs.statSync(ref.file).mtimeMs).toISOString()}) — the film.html row below may describe a newer render than the file being checked`);
  }

  const cuts = Array.isArray(events.cut_frames) ? events.cut_frames : [];
  const dur = ref.duration;
  const declared = [];
  for (const f of cuts) {
    const t = f / fps;
    const e = { frame: f, t, beyond: f >= (ref.nb_frames || Math.round(dur * fps)), nearest: null, delta: null, ok: false };
    if (!e.beyond && f !== 0) {
      const n = near(t, peaks, tol);
      e.nearest = n ? n.t : null; e.delta = n ? n.d : null;
      e.ok = !!n && n.d <= tol;
    } else if (f === 0) {
      e.note = 'frame 0 = the opening shot; a first frame has no predecessor to change from';
      e.ok = true;
    }
    declared.push(e);
  }
  out.declared = declared;
  const oneTake = events.one_take === true && cuts.filter((f) => f !== 0).length === 0;
  out.beyond = declared.filter((e) => e.beyond).map((e) => e.t);
  if (oneTake) { out.status = 'PASS'; out.notes.push('events.json declares one_take / a single cut at frame 0: there is no cut to verify, only the opening frame (b/c N/A)'); }
  else {
    if (out.beyond.length) out.notes.push('(a) declared cuts beyond the delivered file duration -> ' + out.beyond.map((t) => fmt(t) + 's').join(', '));
    out.unpairedDeclared = declared.filter((e) => !e.ok && !e.beyond).map((e) => e.t);
    const declaredTs = declared.map((e) => e.t);
    out.undeclaredReal = peaks.filter((p) => { const n = near(p.t, declaredTs.map((t) => ({ t })), tol); return !n || n.d > tol; }).map((p) => p.t);
    const bad = out.beyond.length + out.unpairedDeclared.length + out.undeclaredReal.length;
    out.status = bad ? 'FAIL' : 'PASS';
    if (out.unpairedDeclared.length) out.notes.push('(b) declared cut with no real change within ' + tol + ' s -> ' + out.unpairedDeclared.map((t) => fmt(t) + 's').join(', '));
    if (out.undeclaredReal.length) out.notes.push('(c) real change with no declared cut -> ' + out.undeclaredReal.map((t) => fmt(t) + 's').join(', '));
  }
  return out;
}

// ---------------------------------------------------------------- I2
function checkI2(ctx, res, tmp) {
  const out = { name: 'I2  stale stills', status: 'N-A', notes: [], rows: [], staleByMtime: [], fail: 0 };
  const dirs = fs.existsSync(ctx.vdir)
    ? fs.readdirSync(ctx.vdir, { withFileTypes: true }).filter((e) => e.isDirectory() && /^_stills/.test(e.name)).map((e) => e.name)
    : [];
  if (!dirs.length) { out.notes.push('no _stills*/ folder in this version folder'); return out; }
  const mp4s = fs.existsSync(ctx.vdir)
    ? fs.readdirSync(ctx.vdir).filter((n) => /\.mp4$/i.test(n) && !/^_|\.bak$|\.pre-tp\.mp4$/i.test(n)).map((n) => path.join(ctx.vdir, n))
    : [];
  if (!mp4s.length) { out.notes.push('no delivered mp4 to compare the stills against'); return out; }
  const byRatio = {};
  for (const f of mp4s) { const p = ffprobe(f); if (p) (byRatio[ratioOf(p)] ||= []).push(p); }

  const jobs = [];
  for (const d of dirs) {
    for (const n of fs.readdirSync(path.join(ctx.vdir, d)).filter((x) => /\.png$/i.test(x)).sort()) {
      const file = path.join(ctx.vdir, d, n);
      const m = /^t(\d+)(?:_(\d+))?s_f(\d+)\.png$/i.exec(n);
      const st = fs.statSync(file);
      jobs.push({ dir: d, name: n, file, mtime: st.mtimeMs, t: m ? +m[1] + (m[2] ? +('0.' + m[2]) : 0) : null, frame: m ? +m[3] : null });
    }
  }
  out.notes.push(`still name pattern t<sec>[_<centi>]s_f<NNN>.png, e.g. t0_50s_f015.png = 0.50 s / frame 15`);
  out.notes.push('match criterion: mean absolute difference (MAD) between the still and the SAME FRAME of the delivered mp4 of the same ratio must be <= 4.0 / 255 (1.6 % mean); SSIM is printed as supporting evidence');
  out.notes.push('folders compared: ' + dirs.join(', '));

  const need = {}; // mp4 -> frames
  for (const j of jobs) {
    if (j.frame === null) continue;
    const p = ffprobe(j.file);
    if (!p) { j.error = 'unreadable PNG'; continue; }
    j.ratio = ratioOf(p); j.w = p.width; j.h = p.height;
    const pool = byRatio[j.ratio];
    if (!pool || !pool.length) { j.error = `no delivered mp4 with ratio ${j.ratio}`; continue; }
    const ref = pool.find((x) => x.nb_frames && j.frame < x.nb_frames) || pool[0];
    j.mp4 = ref;
    (need[ref.file] ||= []).push(j.frame);
  }
  const fmap = {}; // mp4 file -> { frame -> png }
  for (const [mp4, frames] of Object.entries(need)) fmap[mp4] = extractFrames(mp4, [...new Set(frames)], tmp, crypto.createHash('sha1').update(mp4).digest('hex').slice(0, 10));

  for (const j of jobs) {
    const row = { still: REL(j.file), t: j.t, frame: j.frame, ratio: j.ratio || null };
    const ref = j.mp4;
    if (j.error) { row.verdict = 'FAIL'; row.why = j.error; out.fail++; out.rows.push(row); continue; }
    if (!ref.nb_frames || j.frame >= ref.nb_frames) { row.verdict = 'FAIL'; row.why = `frame ${j.frame} >= delivered frame count ${ref.nb_frames}`; out.fail++; out.rows.push(row); continue; }
    if (j.t !== null && ref.fps && Math.abs(j.t * ref.fps - j.frame) > 0.51) { row.why = `name says ${fmt(j.t)} s but frame ${j.frame} (${fmt(j.t * ref.fps, 1)} at ${fmt(ref.fps, 3)} fps)`; }
    const ex = (fmap[ref.file] || {})[j.frame];
    if (!ex) { row.verdict = 'FAIL'; row.why = (row.why ? row.why + '; ' : '') + 'mp4 frame could not be extracted'; out.fail++; out.rows.push(row); continue; }
    const c = compare(j.file, ex);
    row.ssim = c.ssim; row.mad = c.mad;
    row.mp4 = path.basename(ref.file);
    const ok = c.mad !== null && c.mad <= 4.0;
    row.verdict = ok ? 'match' : 'FAIL';
    if (!ok) { row.why = (row.why ? row.why + '; ' : '') + (c.mad === null ? 'comparison failed' : `MAD ${fmt(c.mad, 2)} > 4.0`) + (c.ssim !== null ? ` (SSIM ${fmt(c.ssim, 3)})` : ''); out.fail++; }
    if (j.mtime < fs.statSync(ref.file).mtimeMs) { row.mtime_stale = true; out.staleByMtime.push(row.still); }
    out.rows.push(row);
  }
  out.status = out.fail ? 'FAIL' : 'PASS';
  out.notes.push(`mtime younger-than-the-mp4 is reported separately: ${out.staleByMtime.length}/${out.rows.length} stills were written before the delivered mp4`);
  return out;
}

// ---------------------------------------------------------------- I3
function checkI3(ctx, res) {
  const { events, ref } = ctx;
  const out = { name: 'I3  frame-base sanity', status: 'N-A', notes: [], problems: [] };
  if (!events) { out.notes.push('no events.json'); return out; }
  if (!ref) { out.notes.push('no delivered mp4'); return out; }
  const realFrames = ref.nb_frames || Math.round(ref.duration * (ref.fps || 30));
  out.real_frames = realFrames;
  out.duration_frames = events.duration_frames ?? null;
  if (out.duration_frames == null) out.problems.push('events.json has no duration_frames');
  else if (out.duration_frames !== realFrames) out.problems.push(`duration_frames ${out.duration_frames} != real ${realFrames} (mp4 ${fmt(ref.duration, 3)} s x ${fmt(ref.fps, 3)} fps)`);
  const cuts = Array.isArray(events.cut_frames) ? events.cut_frames : [];
  if (!cuts.length) out.problems.push('events.json has no cut_frames');
  const over = cuts.filter((f) => f >= realFrames);
  if (over.length) out.problems.push(`cut_frames outside the film: ${over.join(', ')} (>= ${realFrames}) -> ${over.map((f) => fmt(f / (+events.fps || 30)) + 's').join(', ')}`);

  const fps = +events.fps || +ref.fps || 30;
  const bpm = +events.bpm || null;
  out.expected_fpb = bpm ? (fps * 60) / bpm : null;
  out.source = res.src || null;
  const nz = cuts.filter((f) => f !== 0);
  if (nz.length) {
    const g = gcdAll(nz);
    const deltas = nz.map((v, i) => (i ? v - nz[i - 1] : v)).filter((d) => d > 0);
    const gd = gcdAll(deltas);
    const cand = [];
    for (let d = 2; d <= 60; d++) if (nz.every((f) => f % d === 0)) cand.push(d);
    out.cut_gcd = g; out.delta_gcd = gd; out.fpb_candidates = cand;
    if (out.expected_fpb) {
      const bad = nz.filter((f) => Math.abs(f / out.expected_fpb - Math.round(f / out.expected_fpb)) * out.expected_fpb > 0.501);
      if (bad.length) {
        out.problems.push(`cut_frames are not on the ${fmt(out.expected_fpb, 2)} frames-per-beat grid implied by fps ${fps} / bpm ${bpm} (checked to half a frame): ${bad.slice(0, 6).join(', ')} (e.g. ${bad[0]}/${fmt(out.expected_fpb, 2)} = ${fmt(bad[0] / out.expected_fpb, 2)} beats)`);
        if (g > 1) out.problems.push(`the same numbers ARE consistent with a frame grid whose step divides ${g}: every cut_frames value is a multiple of ${g}`);
      }
    }
  }
  if (res.src && Number.isFinite(res.src.fpb) && Number.isFinite(out.expected_fpb) && Math.abs(res.src.fpb - out.expected_fpb) > 1e-9) {
    out.problems.push(`film.html declares FPB = ${res.src.fpbExpr} = ${fmt(res.src.fpb, 3)} but events.json (fps ${fps}, bpm ${bpm}) implies ${fmt(out.expected_fpb, 3)}`);
  }
  out.status = out.problems.length ? 'FAIL' : 'PASS';
  return out;
}

// ---------------------------------------------------------------- I4
function gateSummary(vdir) {
  const files = fs.existsSync(vdir) ? fs.readdirSync(vdir).filter((n) => /^gates-.*\.json$/i.test(n)).sort() : [];
  if (!files.length) return null;
  const per = {}; let tv = null;
  for (const f of files) {
    const j = rd(path.join(vdir, f), null);
    if (!j || !Array.isArray(j.rows)) continue;
    const key = f.replace(/^gates-|\.json$/gi, '');
    const counts = { PASS: 0, FAIL: 0, 'N/A': 0, WARN: 0, INFO: 0 };
    const rows = {};
    for (const r of j.rows) {
      const [name, verdict, note] = r;
      rows[name] = { verdict, note };
      if (counts[verdict] !== undefined) counts[verdict]++; else counts[verdict] = (counts[verdict] || 0) + 1;
      if (/tv[-_ ]?safe/i.test(name)) tv = verdict;
    }
    per[key] = { from: f, rows, counts };
  }
  return Object.keys(per).length ? { per, tv } : null;
}

function checkI4(ctx, res) {
  const out = { name: 'I4  VERSION.json for `pa deliver`', status: 'N-A', notes: [] };
  const f = path.join(ctx.vdir, 'VERSION.json');
  if (!fs.existsSync(f)) {
    out.status = 'FAIL';
    out.notes.push('VERSION.json missing -> `pa deliver` runs with an empty record: no sha256, no size, no gate verdict, no scenery/logo declaration is checkable');
    out.notes.push(`generate it with: node ${REL(fileURLToPath(import.meta.url))} --write-version ${REL(ctx.vdir)}`);
    return out;
  }
  const j = rd(f, null);
  if (!j) { out.status = 'FAIL'; out.notes.push('VERSION.json is not valid JSON'); return out; }
  const o = j.outputs;
  if (!Array.isArray(o) || !o.length) out.notes.push('outputs[] is empty: deliver.mjs will fall back to filename matching for the finals');
  else out.notes.push(`outputs[]: ${o.map((x) => `${x.file}${x.kind ? ' [' + x.kind + ']' : ''}${x.sha256 ? ' sha256=' + x.sha256.slice(0, 12) : ' (no sha256)'}`).join(', ')}`);
  const missing = [];
  for (const x of (o || [])) {
    if (!x.file) { missing.push('an outputs[] entry without .file'); continue; }
    const p = path.join(ctx.vdir, x.file);
    if (!fs.existsSync(p)) { missing.push(`${x.file} does not exist`); continue; }
    const real = fs.statSync(p).size;
    if (x.size_bytes && x.size_bytes !== real) missing.push(`${x.file} size_bytes ${x.size_bytes} != real ${real}`);
    if (!x.sha256) missing.push(`${x.file} has no sha256`);
    else if (sha256(p) !== x.sha256) missing.push(`${x.file} sha256 does not match the file`);
  }
  for (const m of missing) out.notes.push(m);
  out.status = missing.length ? 'FAIL' : 'PASS';
  return out;
}

// ---------------------------------------------------------------- --write-version
function writeVersion(vdir, force) {
  const rel = path.relative(FV, vdir).split(path.sep);
  const film = rel[0], version = rel[1];
  if (!film || !version) { console.error(`--write-version: ${REL(vdir)} is not media/film-versions/<film>/<version>`); process.exit(2); }
  const out = path.join(vdir, 'VERSION.json');
  if (fs.existsSync(out) && !force) { console.error(`--write-version: ${REL(out)} already exists (use --force to overwrite)`); process.exit(2); }
  const vj = { film, version, date: new Date().toISOString().slice(0, 10) };
  const src = path.join(HTMLFILM, film, 'film.html');
  if (fs.existsSync(src)) vj.source = REL(src);
  const ev = path.join(HTMLFILM, film, 'events.json');
  if (fs.existsSync(ev)) vj.cues_file = REL(ev);
  const evj = fs.existsSync(ev) ? rd(ev, null) : null;
  if (evj) {
    if (evj.bpm != null) vj.bpm = evj.bpm;
    if (evj.t0_s != null) vj.t0_s = evj.t0_s;
  }
  const names = fs.readdirSync(vdir).filter((n) => /\.mp4$/i.test(n) && !/^_|\.bak$|\.pre-tp\.mp4$/i.test(n)).sort();
  const outputs = [];
  for (const n of names) {
    const p = path.join(vdir, n);
    const pr = ffprobe(p);
    if (!pr) continue;
    // kind= for deliver.mjs finals(): "silent" keeps the file in the silent pool.
    const kind = /^silent[-.]/i.test(n) || !pr.sound ? 'silent' : 'final';
    const e = { kind, file: n, ratio: ratioOf(pr), size_bytes: pr.size, sha256: sha256(p), frame_count: pr.nb_frames, duration_s: pr.duration };
    outputs.push(e);
  }
  if (outputs.length) vj.outputs = outputs;
  // top-level "file" is what deliver.mjs treats as a SOUND final; only set it when a real
  // audio-bearing final exists, otherwise the delivered name would lose its "-silent" suffix.
  const soundFinal = outputs.find((o) => o.kind !== 'silent');
  if (soundFinal) vj.file = soundFinal.file;
  const gs = gateSummary(vdir);
  if (gs) {
    vj.gates = gs.per;
    const parts = Object.entries(gs.per).map(([k, v]) => `${k}: ${Object.entries(v.counts).filter(([, n]) => n).map(([a, n]) => `${n} ${a}`).join(', ')}`);
    vj.status = 'gates measured from ' + Object.values(gs.per).map((v) => v.from).join(' + ') + ' — ' + parts.join('; ');
    if (gs.tv) vj.verify = { tv_check: gs.tv };
  }
  // never invented: scenery / logo / track / budget stay out unless a real file says so
  const unknown = ['scenery', 'logo', 'track', 'budget', 'time_minutes', 'verify.tv_check'];
  const have = [];
  if (vj.scenery !== undefined) have.push('scenery=' + vj.scenery);
  if (vj.verify?.tv_check) have.push('verify.tv_check=' + vj.verify.tv_check);
  if (vj.gates) have.push('gates (from ' + Object.values(vj.gates).map((v) => v.from).join(' + ') + ')');
  if (vj.status) have.push('status (measured, not asserted)');
  fs.writeFileSync(out, JSON.stringify(vj, null, 1) + '\n', 'utf8');
  console.log(`wrote ${REL(out)}`);
  console.log(`  outputs: ${outputs.map((o) => `${o.file} ${o.size_bytes}B ${String(o.sha256).slice(0, 12)} ${o.frame_count ?? '?'}f ${fmt(o.duration_s, 3)}s`).join(' | ') || '(none)'}`);
  console.log(`  declared from real files: ${have.join(', ') || 'none'}`);
  console.log(`  omitted (unknown, never invented): ${unknown.filter((k) => !have.some((h) => h.startsWith(k.split('.')[0]))).join(', ')}`);
}

// ---------------------------------------------------------------- main
function usage() {
  console.log(`usage:
  node ${REL(fileURLToPath(import.meta.url))} <versionFolder> [--events <events.json>] [--tol <s>] [--json <out.json>]
  node ${REL(fileURLToPath(import.meta.url))} --write-version <versionFolder> [--force]`);
}

const argv = process.argv.slice(2);
if (!argv.length || argv.includes('-h') || argv.includes('--help')) { usage(); process.exit(argv.length ? 0 : 2); }
const flag = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };

if (argv.includes('--write-version')) {
  const vdir = path.resolve(flag('--write-version'));
  if (!fs.existsSync(vdir)) { console.error(`--write-version: no such folder ${vdir}`); process.exit(2); }
  writeVersion(vdir, argv.includes('--force'));
  process.exit(0);
}

const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
if (!pos.length) { usage(); process.exit(2); }
const vdir = path.resolve(pos[0]);
if (!fs.existsSync(vdir) || !fs.statSync(vdir).isDirectory()) { console.error(`not a folder: ${vdir}`); process.exit(2); }
const rel = path.relative(FV, vdir).split(path.sep);
const film = rel[0];
const tol = +flag('--tol', '0.5');

const mp4s = fs.readdirSync(vdir).filter((n) => /\.mp4$/i.test(n) && !/^_|\.bak$|\.pre-tp\.mp4$/i.test(n)).map((n) => path.join(vdir, n)).sort();
let ref = null;
for (const n of ['silent-16x9.mp4', 'silent-9x16.mp4']) { const p = path.join(vdir, n); if (fs.existsSync(p)) { ref = ffprobe(p); if (ref) break; } }
if (!ref) for (const p of mp4s) { const q = ffprobe(p); if (q) { ref = q; break; } }
const evPath = path.resolve(flag('--events', path.join(HTMLFILM, film, 'events.json')));
const events = fs.existsSync(evPath) ? rd(evPath, null) : null;
const src = parseSource(film);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-integrity-'));

console.log(`film-integrity  ${rel.join('/')}`);
console.log(`reference mp4   ${ref ? `${REL(ref.file)}  ${ref.width}x${ref.height}  ${ref.nb_frames ?? '?'} frames  ${fmt(ref.duration, 3)} s  ${fmt(ref.fps, 3)} fps  ${ref.sound ? 'sound' : 'silent'}` : '(none found)'}`);
console.log(`events.json     ${events ? REL(evPath) : '(none)'}`);
console.log(`film source     ${src ? `${src.file}${src.fpb ? `  FPB = ${src.fpbExpr} = ${fmt(src.fpb, 3)}` : ''}` : '(none)'}\n`);

const ctx = { vdir, film, ref, events, tol, src };
const r1 = checkI1(ctx);
const r2 = checkI2(ctx, { src }, tmp);
const r3 = checkI3(ctx, { src });
const r4 = checkI4(ctx, {});

const table = (rows, cols) => {
  const w = cols.map((c) => Math.max(c[0].length, ...rows.map((r) => String(c[1](r)).length)));
  console.log('  ' + cols.map((c, i) => c[0].padEnd(w[i])).join('  '));
  for (const r of rows) console.log('  ' + cols.map((c, i) => String(c[1](r)).padEnd(w[i])).join('  '));
};

// I1
console.log(`${r1.status.padEnd(4)}  I1  events-vs-render agreement`);
for (const n of r1.notes) console.log(`      - ${n}`);
if (r1.declared.length) {
  console.log(`      declared (events.json, fps ${events.fps || 30}) vs detected (ffmpeg scene peaks):`);
  table(r1.declared, [
    ['frame', (r) => r.frame], ['declared_s', (r) => fmt(r.t)], ['beyond', (r) => (r.beyond ? 'yes' : '')],
    ['nearest_detected_s', (r) => (r.nearest === null ? '-' : fmt(r.nearest))],
    ['delta_s', (r) => (r.delta === null ? '-' : fmt(r.delta, 3))], ['verdict', (r) => (r.ok ? 'ok' : 'NO MATCH')],
  ]);
  console.log(`      detected changes only (t, scene score): ${r1.detected.map((d) => `${fmt(d.t)}s(${fmt(d.s, 3)})`).join(' ') || 'none'}`);
  if (src && src.cuts) console.log(`      render truth from film.html (${src.how}): ${src.cuts.map((f) => `${f}f/${fmt(f / (src.FPS || 30))}s`).join(' ')}`);
}
// I2
console.log(`\n${r2.status.padEnd(4)}  I2  stale stills`);
for (const n of r2.notes) console.log(`      - ${n}`);
if (r2.rows.length) {
  table(r2.rows, [
    ['still', (r) => r.still], ['t_s', (r) => (r.t === null ? '-' : fmt(r.t))], ['frame', (r) => r.frame],
    ['vs', (r) => r.mp4 || '-'], ['SSIM', (r) => (r.ssim === null || r.ssim === undefined ? '-' : fmt(r.ssim, 3))],
    ['MAD', (r) => (r.mad === null || r.mad === undefined ? '-' : fmt(r.mad, 2))],
    ['verdict', (r) => r.verdict + (r.mtime_stale ? ' (older than mp4)' : '') + (r.why ? ' :: ' + r.why : '')],
  ]);
}
// I3
console.log(`\n${r3.status.padEnd(4)}  I3  frame-base sanity`);
if (r3.real_frames !== undefined) {
  console.log(`      real ${r3.real_frames} frames vs declared duration_frames ${r3.duration_frames}; expected frames-per-beat ${r3.expected_fpb ? fmt(r3.expected_fpb, 3) : '?'}`);
  if (r3.cut_gcd) console.log(`      cut_frames gcd ${r3.cut_gcd}, adjacent-delta gcd ${r3.delta_gcd}, frames-per-beat that fit every cut: [${r3.fpb_candidates.join(', ')}]`);
  if (r3.source) console.log(`      film.html: FPB = ${r3.source.fpbExpr ?? '?'} = ${Number.isFinite(r3.source.fpb) ? fmt(r3.source.fpb, 3) : '?'}`);
}
for (const p of r3.problems) console.log(`      ! ${p}`);
for (const n of r3.notes) console.log(`      - ${n}`);
// I4
console.log(`\n${r4.status.padEnd(4)}  I4  VERSION.json for \`pa deliver\``);
for (const n of r4.notes) console.log(`      - ${n}`);

const statuses = [r1.status, r2.status, r3.status, r4.status];
console.log(`\nsummary  I1=${r1.status}  I2=${r2.status}  I3=${r3.status}  I4=${r4.status}`);
const jf = flag('--json');
if (jf) fs.writeFileSync(path.resolve(jf), JSON.stringify({ film, version: rel[1], reference: ref ? REL(ref.file) : null, I1: r1, I2: r2, I3: r3, I4: r4 }, null, 1), 'utf8');
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(statuses.includes('FAIL') ? 1 : 0);
