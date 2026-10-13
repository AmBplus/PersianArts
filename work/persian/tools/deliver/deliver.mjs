// pa deliver: one output folder (output/) with hardlinks to the finals, LATEST and INDEX.
//   node deliver.mjs <film> <version> [--dry-run]   deliver one version (also rebuilds LATEST/INDEX)
//   node deliver.mjs --rebuild                      rebuild output/LATEST and output/INDEX.md only
//   node deliver.mjs --list                         print output/INDEX.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compressPaths } from './compress.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const FV = path.join(ROOT, 'media/film-versions');
const OUT = path.join(ROOT, 'output');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
if (args.includes('--track') || args[0] === 'track') { const r = (await import('node:child_process')).spawnSync('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), '../portable/pa-portable.mjs'), 'track'], { stdio: 'inherit' }); process.exit(r.status ?? 0); }
const pos = args.filter((a) => !a.startsWith('--'));
const die = (m) => { console.error('deliver: ' + m); process.exit(1); };
const dirs = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);
const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const mb = (b) => (b / 1048576).toFixed(1);

function probe(f) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  const v = j.streams.find((s) => s.codec_type === 'video') || {};
  const w = +v.width, h = +v.height;
  const near = (a, b) => Math.abs(a - b) < 0.02;
  const ratio = w > h ? (near(w / h, 16 / 9) ? '16x9' : 'other')
    : near(h / w, 16 / 9) ? '9x16' : near(h / w, 1) ? '1x1' : near(h / w, 1.25) ? '4x5' : 'other';
  return { ratio, dur: +j.format.duration, size: +j.format.size, sound: j.streams.some((s) => s.codec_type === 'audio'), file: f };
}

// finals of one version folder: one file per ratio (sound preferred; silent only where no sound file exists)
function finals(vdir, vj) {
  const names = fs.readdirSync(vdir).filter((n) => /\.mp4$/i.test(n) && !/\.pre-tp\.mp4$|\.bak|_bench|_tools|_raw|^old/i.test(n));
  const listed = (vj.outputs || []).filter((o) => o.kind !== 'silent' && o.kind !== 'still').map((o) => o.file);
  if (typeof vj.file === 'string') listed.push(vj.file);
  const soundPool = listed.length ? listed : names.filter((n) => /final.*\.mp4$/i.test(n) || /^social-.*-v.*\.mp4$/i.test(n));
  const silentPool = (vj.outputs || []).filter((o) => o.kind === 'silent').map((o) => o.file);
  if (!silentPool.length) silentPool.push(...names.filter((n) => /^silent[-.]/i.test(n)));
  const byRatio = new Map();
  for (const pool of [soundPool, silentPool]) {
    for (const n of pool) {
      const f = path.join(vdir, n);
      if (!fs.existsSync(f)) continue;
      const tv = f.replace(/\.mp4$/i, '.tv.mp4');
      const p = probe(fs.existsSync(tv) ? tv : f);
      if (byRatio.has(p.ratio) && (byRatio.get(p.ratio).sound || !p.sound)) continue;
      byRatio.set(p.ratio, p);
    }
  }
  return [...byRatio.values()];
}

function link(src, dst) {
  fs.rmSync(dst, { force: true });
  try { fs.linkSync(src, dst); return 'HARDLINK'; } catch { fs.copyFileSync(src, dst); return 'COPY(fallback)'; }
}

function outputMd(film, ver, vj, list) {
  const tv = vj.verify?.tv_check ? 'بله (' + vj.verify.tv_check + ')'
    : list.some((p) => /\.tv\.mp4$/.test(p.file) || /final-tv-safe/.test(JSON.stringify(vj.outputs || []))) ? 'بله' : 'ثبت نشده';
  const track = vj.track ? path.basename(typeof vj.track === 'string' ? vj.track : (vj.track.path || vj.track.slug || '')) : 'بدون موسیقی';
  const withSound = list.some((p) => p.sound);
  const dur = list.map((p) => p.dur.toFixed(1)).join(' / ');
  const lines = [
    `# ${film} - ${ver}`,
    `این پوشه خروجی نهایی نسخه ${ver} فیلم ${film} است. فایل‌ها هاردلینک هستند (همان فایل، بدون کپی اضافه).`,
    `نسبت‌های تصویر: ${list.map((p) => p.ratio).join('، ')}`,
    `مدت (ثانیه): ${dur}`,
    `صدا: ${withSound ? 'بله' : 'خیر (بی‌صدا)'}${withSound ? ' | موسیقی: ' + track : ''}`,
    `سازگار با تلویزیون (TV-safe): ${tv}`,
    `وضعیت ثبت‌شده: ${vj.status || 'ثبت نشده'}`,
  ];
  if (vj.budget || vj.time_minutes) lines.push(`زمان یا بودجه ثبت‌شده: ${vj.budget || vj.time_minutes}`);
  lines.push(`اول این را باز کنید: output/LATEST/${film}-${list[0].ratio}${list[0].sound ? '' : '-silent'}.mp4`);
  lines.push('فایل‌ها:');
  for (const p of list) lines.push(`- ${film}-${p.ratio}-${ver}${p.sound ? '' : '-silent'}.mp4 (${p.dur.toFixed(1)} ث، ${mb(p.size)} MB)`);
  return lines.slice(0, 15).join('\n') + '\n';
}

// scan everything under output/ (ffprobe is metadata only, no decoding)
function scan() {
  const rows = [];
  for (const film of dirs(OUT).filter((d) => d !== 'LATEST')) {
    for (const ver of dirs(path.join(OUT, film))) {
      const vdir = path.join(OUT, film, ver);
      for (const n of fs.readdirSync(vdir).filter((x) => /\.mp4$/i.test(x))) {
        const p = probe(path.join(vdir, n));
        rows.push({ film, ver, ...p, mtime: fs.statSync(p.file).mtimeMs });
      }
    }
  }
  return rows;
}

function rebuild(rows) {
  const latestDir = path.join(OUT, 'LATEST');
  if (!DRY) { fs.rmSync(latestDir, { recursive: true, force: true }); fs.mkdirSync(latestDir, { recursive: true }); }
  const best = new Map();
  for (const r of rows) {
    const key = r.film + '|' + r.ratio;
    const vn = +((/^v(\d+)/.exec(r.ver) || [])[1] || 0); // version number first (compress rewrites mtimes), mtime breaks ties
    const score = (r.sound ? 1e18 : 0) + vn * 1e14 + r.mtime;
    if (!best.has(key) || score > best.get(key).score) best.set(key, { ...r, score });
  }
  for (const r of best.values()) {
    const name = `${r.film}-${r.ratio}${r.sound ? '' : '-silent'}.mp4`;
    console.log(`LATEST ${name} <- ${r.ver}`);
    if (!DRY) link(r.file, path.join(latestDir, name));
  }
  const idx = [
    '# Output index', '', 'Open output/LATEST first.', '',
    '| فیلم | نسخه | نسبت‌ها | صدا | مدت (ثانیه) | حجم (MB) | تاریخ | راهنما |',
    '|---|---|---|---|---|---|---|---|',
  ];
  const groups = new Map();
  for (const r of rows) {
    const k = r.film + '/' + r.ver;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const newest = new Map();
  for (const g of groups.values()) {
    const top = g.reduce((a, b) => (b.mtime > a.mtime ? b : a));
    if (!newest.has(top.film) || top.mtime > newest.get(top.film).mtime) newest.set(top.film, top);
  }
  for (const [k, g] of [...groups].sort()) {
    const f = g[0].film, ver = g[0].ver;
    const top = newest.get(f);
    const isLatest = top.ver === ver;
    const date = new Date(Math.max(...g.map((r) => r.mtime))).toISOString().slice(0, 10);
    const ratios = g.map((r) => r.ratio + (r.sound ? '' : ' (بی‌صدا)')).join(', ');
    const sound = g.some((r) => r.sound) ? 'بله' : 'خیر';
    const dur = Math.max(...g.map((r) => r.dur)).toFixed(1);
    const size = mb(g.reduce((s, r) => s + r.size, 0));
    const md = fs.existsSync(path.join(OUT, k, 'OUTPUT.md')) ? `output/${k}/OUTPUT.md` : '-';
    idx.push(`| ${f}${isLatest ? ' (جدیدترین)' : ''} | ${ver} | ${ratios} | ${sound} | ${dur} | ${size} | ${date} | ${md} |`);
  }
  const text = idx.join('\n') + '\n';
  if (!DRY) fs.writeFileSync(path.join(OUT, 'INDEX.md'), text, 'utf8');
  return text;
}

if (args.includes('--list')) { process.stdout.write(fs.existsSync(path.join(OUT, 'INDEX.md')) ? fs.readFileSync(path.join(OUT, 'INDEX.md'), 'utf8') : 'no index yet\n'); process.exit(0); }
if (args.includes('--rebuild') && pos.length === 0) { process.stdout.write(rebuild(scan())); process.exit(0); }
if (pos.length !== 2) die('usage: pa deliver <film> <version> [--dry-run] | --rebuild | --list');

const [film, arg] = pos;
const fdir = path.join(FV, film);
if (!fs.existsSync(fdir)) die(`no film folder ${fdir}`);
const folders = dirs(fdir);
const hits = folders.filter((n) => n === arg || n.startsWith(arg + '-'));
const exact = folders.includes(arg) ? [arg] : hits;
if (exact.length !== 1) die(`version "${arg}" matches ${exact.length} folders in ${fdir}: ${exact.join(', ') || 'none'}`);
const vdir = path.join(fdir, exact[0]);
const vj = readJSON(path.join(vdir, 'VERSION.json'));
const list = finals(vdir, vj);
if (!list.length) die(`no finals found in ${vdir}`);
const dst = path.join(OUT, film, arg);
console.log(`${film} ${arg} <- ${exact[0]}: ${list.map((p) => p.ratio + (p.sound ? '' : '-silent')).join(', ')}`);
if (!DRY) fs.mkdirSync(dst, { recursive: true });
for (const p of list) {
  const name = `${film}-${p.ratio}-${arg}${p.sound ? '' : '-silent'}.mp4`;
  console.log(`  ${name}: ${DRY ? 'dry-run' : link(p.file, path.join(dst, name))}`);
}
const sheet = fs.readdirSync(vdir).find((n) => /^(sheet|contact).*\.jpg$/i.test(n));
if (sheet) console.log(`  ${film}-${arg}-stills.jpg: ${DRY ? 'dry-run' : link(path.join(vdir, sheet), path.join(dst, `${film}-${arg}-stills.jpg`))}`);
if (!DRY) fs.writeFileSync(path.join(dst, 'OUTPUT.md'), outputMd(film, arg, vj, list), 'utf8');
if (args.includes('--gates') && !DRY) { // gates on the delivered finals; --no-logo is passed automatically when VERSION.json says logo:false (no brand asset)
  const noLogo = vj.logo === false || vj.no_brand_asset === true;
  for (const p of list) { const f = path.join(dst, `${film}-${p.ratio}-${arg}${p.sound ? '' : '-silent'}.mp4`); const r = execFileSync('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), '../gates/run-gates.mjs'), f, ...(noLogo ? ['--no-logo'] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString(); console.log(r.split(String.fromCharCode(10)).slice(0, 12).join(String.fromCharCode(10))); }
}
if (!DRY && !args.includes('--no-compress')) await compressPaths([dst]); // default ON: SSIM-guarded CRF 20-23, TV-safe (see compress.mjs)
process.stdout.write(rebuild(scan()));
