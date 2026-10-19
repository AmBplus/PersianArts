// pa compress <files|dirs> [--min-ssim 0.985] [--worst-ssim 0.97] [--dry-run] [--jobs 4]
// Re-encodes delivered mp4 into a smaller TV-safe file. Writes a NEW file and renames it over the output entry,
// so hardlinked originals (media/film-versions) are never modified. CRF ladder 23,22,21,20 (largest CRF that passes
// SSIM: mean >= 0.985 and worst frame >= 0.97, measured vs the source on 12 sampled frames). TV rules: tv_check from
// work/persian/tools/assets/optimize_assets.py (not duplicated). Report: output/_compress-report.json
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
const ex = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const OUT = path.join(ROOT, 'output');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes('--dry-run');
const MIN = +opt('--min-ssim', 0.985), WORST = +opt('--worst-ssim', 0.97), JOBS = +opt('--jobs', 4);
const skipVal = new Set(['--min-ssim', '--worst-ssim', '--jobs']);
const targets = argv.filter((a, i) => !a.startsWith('--') && !skipVal.has(argv[i - 1]));
const mbs = (b) => +(b / 1048576).toFixed(2);

function collect(p) {
  const st = fs.statSync(p);
  if (st.isFile()) return /\.mp4$/i.test(p) ? [p] : [];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((e) => (e.name === 'LATEST' || e.name.startsWith('.tmp-') ? [] : collect(path.join(p, e.name))));
}
const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const fr = (s) => { const [a, b] = String(s).split('/').map(Number); return b ? a / b : a; };
async function lufs(f) {
  const r = await ex('ffmpeg', ['-nostats', '-i', f, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 28 }).catch((e) => e);
  const t = (r.stderr || '') + (r.stdout || '');
  const I = [...t.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop(), P = [...t.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop();
  return { I: I ? +I[1] : null, TP: P ? +P[1] : null };
}
async function ssim(ref, enc, dur, fps) {
  // 12 sampled frames, both streams decimated identically
  const step = Math.max(1, Math.floor((dur * fps) / 12));
  const sel = `select='not(mod(n,${step}))',setpts=N/FRAME_RATE/TB`;
  const lfn = `ssim-${process.pid}-${Math.random().toString(36).slice(2)}.log`; const lf = path.join(os.tmpdir(), lfn);
  await ex('ffmpeg', ['-v', 'error', '-i', enc, '-i', ref, '-filter_complex', `[0:v]${sel}[a];[1:v]${sel}[b];[a][b]ssim=stats_file=${lfn}`, '-f', 'null', '-'], { maxBuffer: 1 << 26, cwd: os.tmpdir() });
  const vals = fs.readFileSync(lf, 'utf8').split('\n').map((l) => /All:([\d.]+)/.exec(l)).filter(Boolean).map((m) => +m[1]);
  fs.rmSync(lf, { force: true });
  return { mean: vals.reduce((a, b) => a + b, 0) / vals.length, worst: Math.min(...vals), n: vals.length };
}
async function encode(src, dst, crf, info) {
  const v = info.streams.find((s) => s.codec_type === 'video'), a = info.streams.find((s) => s.codec_type === 'audio');
  const fps = fr(v.r_frame_rate), g = Math.round(fps * 2);
  const args = ['-y', '-v', 'error', '-i', src, '-map', '0:v:0', '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
    '-maxrate', '6M', '-bufsize', '12M', '-profile:v', 'high', '-level', '4.1', '-g', String(g), '-keyint_min', String(g), '-sc_threshold', '0',
    '-x264-params', 'open-gop=0:bframes=2', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
  if (a) {
    const br = +a.bit_rate || 0, copy = a.codec_name === 'aac' && br && br <= 200000 && a.channels === 2 && +a.sample_rate === 48000;
    args.push('-map', '0:a:0', ...(copy ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '128k', '-ar', '48000', '-ac', '2']));
  }
  args.push('-movflags', '+faststart', '-f', 'mp4', dst);
  await ex('ffmpeg', args, { maxBuffer: 1 << 26 });
}
// TV check of one mp4. optimize_assets.tv_check emits "pass" / "FAIL" per key (assets/optimize_assets.py:270),
// so the comparison is case-insensitive and any token that is not "pass" counts as a failure.
// A python that exits non-zero or throws is caught here and reported as a failure-shaped value
// (checker-error(...)) instead of propagating: a checker that cannot run must never look like a pass.
const ASSETS = path.join(ROOT, 'work/persian/tools/assets');
export function tvCheckResult(f) {
  const code = `import sys,json;sys.path.insert(0,r'${ASSETS.replace(/\\/g, '/')}');import optimize_assets as o,pathlib;r=o.tv_check(pathlib.Path(sys.argv[1]));print(json.dumps({"checks":r["checks"],"pass":bool(r["pass"])}))`;
  let out;
  try { out = execFileSync('python', ['-c', code, f], { encoding: 'utf8', maxBuffer: 1 << 24 }); }
  catch (e) { const why = String((e.stderr || e.message || e)).trim().split('\n').filter(Boolean).pop() || 'unknown error'; return { ok: false, checked: false, detail: 'checker-error(' + why.slice(0, 160) + ')' }; }
  let r; try { r = JSON.parse(out); } catch { return { ok: false, checked: false, detail: 'checker-error(output is not JSON)' }; }
  const bad = Object.entries(r.checks || {}).filter(([, v]) => String(v).trim().toLowerCase() !== 'pass').map(([k]) => k);
  if (bad.length || r.pass === false) return { ok: false, checked: true, detail: 'FAIL:' + (bad.join(',') || 'checker reported pass=false') };
  return { ok: true, checked: true, detail: 'pass' };
}
const tvCheck = (f) => tvCheckResult(f).detail; // report token: "pass", "FAIL:<keys>" or "checker-error(...)"

// One OUTPUT.md line for the TV-safe claim. A string recorded in VERSION.json is a CLAIM: it is only ever
// printed next to what was actually re-checked, and if the checker cannot run the line says so.
export function tvSafeVerdict(claimed, files) {
  const claim = String(claimed || '').trim();
  const rs = files.map((f) => ({ file: path.basename(f), ...tvCheckResult(f) }));
  if (!rs.length || rs.some((r) => !r.checked)) {
    const why = (rs.find((r) => !r.checked) || {}).detail || 'no final file to check';
    return `تأیید نشده - claimed, not verified (ادعا: ${claim || 'ثبت نشده'}؛ بازبینی مجدد اجرا نشد: ${why})`;
  }
  const bad = rs.filter((r) => !r.ok);
  return bad.length
    ? `خیر (بازبینی شد در زمان تحویل: ${bad.map((r) => r.file + ' ' + r.detail).join(' | ')})`
    : `بله (بازبینی شد در زمان تحویل: tv_check PASS${claim && claim.toLowerCase() !== 'pass' ? '؛ ادعای VERSION.json: ' + claim : ''})`;
}

async function one(f) {
  const info = probe(f), v = info.streams.find((s) => s.codec_type === 'video');
  const before = fs.statSync(f).size, dur = +info.format.duration, fps = fr(v.r_frame_rate);
  const rec = { file: path.relative(ROOT, f).replace(/\\/g, '/'), before_mb: mbs(before) };
  const L0 = await lufs(f);
  let best = null;
  const tmp = path.join(path.dirname(f), `.tmp-cmp-${path.basename(f)}`);
  for (const crf of [23, 22, 21, 20]) {
    await encode(f, tmp, crf, info);
    const s = await ssim(f, tmp, dur, fps);
    if (s.mean >= MIN && s.worst >= WORST) { best = { crf, s, size: fs.statSync(tmp).size }; break; }
    rec.tried = (rec.tried || []).concat(`crf${crf}: ${s.mean.toFixed(4)}/${s.worst.toFixed(4)}`);
  }
  if (!best) { fs.rmSync(tmp, { force: true }); return { ...rec, status: 'keep (no CRF 20-23 passes SSIM)', after_mb: rec.before_mb, saved_pct: 0 }; }
  if (best.size >= before) { fs.rmSync(tmp, { force: true }); return { ...rec, status: 'keep (compressed not smaller)', crf: best.crf, ssim_mean: +best.s.mean.toFixed(4), ssim_worst: +best.s.worst.toFixed(4), after_mb: rec.before_mb, saved_pct: 0 }; }
  const L1 = await lufs(tmp);
  const dI = L0.I != null && L1.I != null ? +(L1.I - L0.I).toFixed(2) : 0;
  if (Math.abs(dI) > 0.2 || (L1.TP != null && L1.TP > -1.0 && !(L0.TP > -1.0))) { fs.rmSync(tmp, { force: true }); return { ...rec, status: `keep (audio drift ${dI} LU, TP ${L1.TP})`, after_mb: rec.before_mb, saved_pct: 0 }; }
  const tvr = tvCheckResult(tmp);
  if (!tvr.checked) { fs.rmSync(tmp, { force: true }); return { ...rec, status: `keep (tv check could not run: ${tvr.detail})`, after_mb: rec.before_mb, saved_pct: 0 }; }
  const tv = tvr.detail;
  if (!DRY) fs.renameSync(tmp, f); else fs.rmSync(tmp, { force: true }); // rename replaces the directory entry only: shared inode untouched
  return { ...rec, status: DRY ? 'dry-run' : 'compressed', crf: best.crf, ssim_mean: +best.s.mean.toFixed(4), ssim_worst: +best.s.worst.toFixed(4),
    after_mb: mbs(best.size), saved_pct: +(100 * (1 - best.size / before)).toFixed(1), lufs_before: L0.I, lufs_after: L1.I, tp_before: L0.TP, tp_after: L1.TP, tv_check: tv };
}

// writes the measured settings into OUTPUT.md next to the files (idempotent block)
function annotate(res) {
  if (DRY) return;
  const byDir = new Map();
  for (const r of res) { if (!r.crf && r.status !== 'compressed') continue; const d = path.dirname(path.resolve(ROOT, r.file)); (byDir.get(d) || byDir.set(d, []).get(d)).push(r); }
  for (const [d, rs] of byDir) {
    const md = path.join(d, 'OUTPUT.md'); if (!fs.existsSync(md)) continue;
    const txt = fs.readFileSync(md, 'utf8').replace(/\n?<!-- compress -->[\s\S]*<!-- \/compress -->\n?/, '\n');
    const lines = rs.map((r) => `- ${path.basename(r.file)}: ${r.before_mb} -> ${r.after_mb} MB (${r.saved_pct}%), CRF ${r.crf}, SSIM ${r.ssim_mean}/${r.ssim_worst} (mean/worst), ${r.status}, tv_check ${r.tv_check ?? 'n/a'}`);
    fs.writeFileSync(md, txt.trimEnd() + '\n<!-- compress -->\nCompression (H.264 High 4.1, slow, maxrate 6M, AAC 128k):\n' + lines.join('\n') + '\n<!-- /compress -->\n', 'utf8');
  }
}
export async function compressPaths(paths) {
  const files = paths.flatMap(collect);
  const res = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(JOBS, files.length) }, async () => {
    while (i < files.length) {
      const f = files[i++];
      try { const r = await one(f); res.push(r); console.log(`${r.file}: ${r.before_mb} -> ${r.after_mb} MB (${r.saved_pct}%) crf ${r.crf ?? '-'} ssim ${r.ssim_mean ?? '-'}/${r.ssim_worst ?? '-'} ${r.status} ${r.tv_check ?? ''}`); }
      catch (e) { res.push({ file: f, status: 'error: ' + e.message.slice(0, 200) }); console.error('ERR', f, (e.stderr||e.message).slice(-400)); }
    }
  }));
  annotate(res);
  return res.sort((a, b) => a.file.localeCompare(b.file));
}
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (!targets.length) { console.error('usage: pa compress <files|dirs> [--dry-run]'); process.exit(1); }
  const res = await compressPaths(targets.map((t) => path.resolve(t)));
  fs.writeFileSync(path.join(OUT, '_compress-report.json'), JSON.stringify(res, null, 1));
  const b = res.reduce((s, r) => s + (r.before_mb || 0), 0), a = res.reduce((s, r) => s + (r.after_mb || 0), 0);
  console.log(`TOTAL ${b.toFixed(1)} MB -> ${a.toFixed(1)} MB`);
}
