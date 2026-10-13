#!/usr/bin/env node
// Production timing ledger for motion films.
// Reads quota-hub job rows (read-only), maps each to a phase with phase-map.json,
// reads media/film-versions/<film>/<version> folders (file mtimes, VERSION.json, render-report.json),
// and writes docs/motion/ledger/ledger.jsonl plus ledger-pencil-social.md and ledger-uni-admissions.md.
// Usage: node work/persian/tools/ledger/build_ledger.mjs   (env QH_DB overrides the hub database path)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..', '..');
const qhHome = process.env.QH_HOME || path.resolve(repo, '..', '..', 'tools', 'quota-hub');
const dbPath = process.env.QH_DB || path.join(qhHome, 'data', 'hub.db');
const outDir = path.join(repo, 'docs', 'motion', 'ledger');
const map = JSON.parse(fs.readFileSync(path.join(here, 'phase-map.json'), 'utf8'));
const FIX_RE = /(-fix|fixes|^fix |-fixes)/i;

const iso = (s) => (s == null ? null : new Date(s * 1000).toISOString().replace('.000Z', 'Z'));
const fmtS = (s) => (s == null ? 'n/a' : s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(0)} s`);

// 1. qh jobs (the order source of truth: hub.db jobs table; queue table links order files)
const db = new DatabaseSync(dbPath, { readOnly: true });
const jobs = db.prepare(
  'select id, ts_start, ts_end, worker, model, effort, task_kind, title, status, duration_s, result_path from jobs order by ts_start'
).all();

function classify(job) {
  for (const r of map.rules) {
    const hit = r.match === 'title' ? new RegExp(r.regex, 'i').test(job.title || '') : job.task_kind === r.value;
    if (hit) return { phase: r.phase, film: r.film, version: r.version };
  }
  return { phase: 'unmapped', film: 'unmapped', version: '-' };
}

const orders = jobs.map((j) => {
  const c = classify(j);
  const seconds = j.duration_s ?? (j.ts_end && j.ts_start ? j.ts_end - j.ts_start : null);
  return {
    kind: 'order', id: `qh-${j.id}`, phase: c.phase, film: c.film, version: c.version,
    start: iso(j.ts_start), end: iso(j.ts_end), seconds: seconds == null ? null : Math.round(seconds * 10) / 10,
    worker: `${j.worker}/${j.model}/${j.effort}`, title: j.title, task_kind: j.task_kind,
    fix_round: FIX_RE.test(j.title || '') && c.film !== 'shotcraft-other', result: j.status,
    source: 'qh hub.db jobs'
  };
});

// 2. film version folders (media/film-versions/<film>/<version>): VERSION.json + file mtime span
const fvRoot = path.join(repo, 'media', 'film-versions');
const versions = [];
for (const film of fs.existsSync(fvRoot) ? fs.readdirSync(fvRoot) : []) {
  const fdir = path.join(fvRoot, film);
  if (!fs.statSync(fdir).isDirectory() || film.startsWith('_')) continue;
  for (const ver of fs.readdirSync(fdir)) {
    const vdir = path.join(fdir, ver);
    if (!fs.statSync(vdir).isDirectory() || ver.startsWith('_')) continue;
    let meta = {};
    const vj = path.join(vdir, 'VERSION.json');
    if (fs.existsSync(vj)) { try { meta = JSON.parse(fs.readFileSync(vj, 'utf8')); } catch { meta = {}; } }
    let min = Infinity, max = -Infinity, finalMp4 = null, finalMtime = -Infinity, rr = null;
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (!['_tools', 'tmp'].includes(e.name)) walk(p); continue; }
        const mt = fs.statSync(p).mtimeMs / 1000;
        min = Math.min(min, mt); max = Math.max(max, mt);
        if (/^social-.*\.mp4$/.test(e.name) && mt > finalMtime) { finalMtime = mt; finalMp4 = p; }
        if (e.name === 'render-report.json') rr = p;
      }
    };
    walk(vdir);
    if (min === Infinity) continue;
    let renderTimes = null;
    if (rr) {
      try {
        const r = JSON.parse(fs.readFileSync(rr, 'utf8'));
        renderTimes = { mode: r.mode, concurrency: r.concurrency, parallel: r.parallel, bundleWallSeconds: r.bundleWallSeconds,
          renders: (r.renders || []).map((x) => ({ ratio: x.ratio, wallSeconds: x.wallSeconds, cacheHit: !!x.cacheHit, exitCode: x.exitCode })) };
      } catch { renderTimes = null; }
    }
    versions.push({
      film, version: ver, date: meta.date || null, BPM: meta.BPM ?? null, track: meta.track || meta.track_slug || null,
      first_file_utc: iso(min), final_file_utc: iso(finalMtime > -Infinity ? finalMtime : max),
      final_file: finalMp4 ? path.relative(repo, finalMp4).replace(/\\/g, '/') : null,
      file_span_s: Math.round(((finalMtime > -Infinity ? finalMtime : max) - min) * 10) / 10,
      render_report: renderTimes, qh_orders_for_version: 0, source: 'file mtime (not qh-measured)'
    });
  }
}

// 3. attach qh orders to versions by film+version name; count per version
for (const v of versions) {
  const hits = orders.filter((o) => o.film === v.film && o.version === v.version.replace(/^v\d+(\.\d)?-?/, '').replace(/^/, ''));
  v.qh_orders_for_version = hits.length;
}

// 4. write ledger.jsonl (one line per order, plus one line per version folder)
fs.mkdirSync(outDir, { recursive: true });
const lines = [...orders, ...versions.map((v) => ({ kind: 'version', film: v.film, version: v.version, date: v.date,
  start: v.first_file_utc, end: v.final_file_utc, seconds: v.file_span_s, source: v.source, final_file: v.final_file,
  render_report: v.render_report }))];
fs.writeFileSync(path.join(outDir, 'ledger.jsonl'), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');

// 5. per-film tables
function filmTable(film, title) {
  const fo = orders.filter((o) => o.film === film);
  const out = [];
  out.push(`# ${title}`, '', `Generated by \`work/persian/tools/ledger/build_ledger.mjs\` from qh hub.db jobs and media/film-versions. Times are UTC unless marked local.`, '');
  out.push('## Orders (qh-measured)', '');
  if (fo.length === 0) {
    out.push('No qh order is mapped to this film. Versions in this film were not run through qh (see the version table).', '');
  } else {
    const first = fo.reduce((a, o) => (o.start < a ? o.start : a), fo[0].start);
    const lastEnd = fo.reduce((a, o) => (o.end > a ? o.end : a), fo[0].end);
    const worker = fo.reduce((a, o) => a + (o.seconds || 0), 0);
    out.push(`- qh orders: ${fo.length}; wall-clock first order to last order end: ${fmtS((Date.parse(lastEnd) - Date.parse(first)) / 1000)}; sum of worker seconds: ${fmtS(worker)}; fix rounds: ${fo.filter((o) => o.fix_round).length}`, '');
    out.push('| phase | orders | worker seconds | fix rounds |', '|---|---:|---:|---:|');
    for (const p of map.phases) {
      const po = fo.filter((o) => o.phase === p);
      if (!po.length) continue;
      out.push(`| ${p} | ${po.length} | ${po.reduce((a, o) => a + (o.seconds || 0), 0).toFixed(0)} | ${po.filter((o) => o.fix_round).length} |`);
    }
    out.push('', '| order | phase | version | start UTC | seconds | worker | result | title |', '|---|---|---|---|---:|---|---|---|');
    for (const o of fo) out.push(`| qh-${o.id.slice(3)} | ${o.phase} | ${o.version} | ${o.start} | ${o.seconds ?? 'running'} | ${o.worker} | ${o.result} | ${o.title} |`);
    out.push('');
  }
  out.push('## Film versions (file mtime spans, not qh-measured)', '');
  const fv = versions.filter((v) => v.film === film).sort((a, b) => (a.first_file_utc < b.first_file_utc ? -1 : 1));
  if (!fv.length) out.push('None.', '');
  else {
    out.push('| version | BPM | first file UTC | final file UTC | write span (lower bound) | step window (since previous final file) | final file | render-report |', '|---|---:|---|---|---:|---:|---|---|');
    let prevEnd = null;
    for (const v of fv) {
      const hasMp4 = !!v.final_file;
      const step = hasMp4 && prevEnd ? fmtS((Date.parse(v.final_file_utc) - Date.parse(prevEnd)) / 1000) : (hasMp4 ? 'n/a' : 'cue/asset folder');
      if (hasMp4) prevEnd = v.final_file_utc;
      const rr = v.render_report ? v.render_report.renders.map((r) => `${r.ratio} ${r.wallSeconds}s${r.cacheHit ? ' (cache)' : ''}`).join(', ') + ` (conc ${v.render_report.concurrency}, bundle ${v.render_report.bundleWallSeconds}s)` : 'none';
      out.push(`| ${v.version} | ${v.BPM ?? '-'} | ${v.first_file_utc} | ${v.final_file_utc} | ${fmtS(v.file_span_s)} | ${step} | ${v.final_file ?? '-'} | ${rr} |`);
    }
    out.push('');
  }
  return out;
}

const pencil = filmTable('pencil-social', 'Ledger: pencil-social (motion film)');
const pSpan = (() => {
  const a = orders.find((o) => o.film === 'pencil-social' && o.version === 'v5-payoff');
  const b = versions.find((v) => v.film === 'pencil-social' && v.version === 'v51-lnplus-597024');
  if (!a || !b) return 'not measured';
  return `${fmtS((Date.parse(b.final_file_utc) - Date.parse(a.start)) / 1000)} (from payoff-A1 order start ${a.start} to v51-lnplus final file ${b.final_file_utc}; mixed sources: qh start, file mtime end)`;
})();
pencil.push('## Time from payoff request to v51 final', '', `- ${pSpan}`, '- Lead decision time between steps: not measured. Owner listening and review time: not measured.', '');
const shared = orders.filter((o) => o.film === 'shared-sound-tool' || o.film === 'shared-tooling');
pencil.push('## Shared tooling used before v3 (qh-measured, attribution by title rule)', '');
pencil.push('| order | phase | start UTC | seconds | result | title |', '|---|---|---|---:|---|---|');
for (const o of shared) pencil.push(`| qh-${o.id.slice(3)} | ${o.phase} | ${o.start} | ${o.seconds ?? 'running'} | ${o.result} | ${o.title} |`);
pencil.push('');
pencil.push('## Before vs after (render and cache, measured only)', '', '| item | before | after | evidence | status |', '|---|---|---|---|---|', '| four ratios, sequential vs parallel | 58.6 s sequential (conc 9) | 28.8 s parallel conc 2; _bench-4 total 30.8 s incl. bundle 2.3 s | render-speed-brief 3c/3d; media/film-versions/pencil-social/_bench-4/render-report.json | measured. Owner figures 40.53 s and 31.15 s not found in evidence |', '| single 9:16 render | 19.7 s mean at conc 4 (base 17.2 / 22.3) | 15.2 s at conc 9 | render-speed-brief 3a | measured. Owner figures 19.07 s and 12.02 s not found in evidence |', '| audio-only change, silent cache | cold miss 36.6 s / 38.2 s (quality-check/cold1, cold2) | cache hit 0.5 s / 0.82 s (_render-all-test, _bench-5) | render-report.json files | measured. Owner figure 40.5 s to 1.2 s not matched exactly |', '| second encode removed | 38.7 s per 9:16 film | 25.4 s | work/persian/render_all.md item 19 | measured (about 13 s) |', '| audio build rounds v3 / v4 / v5 / v51 | not measured in qh (no qh job for these builds) | file-write times only (above) | VERSION.json, file mtimes | NOT measured as worker seconds |', '', '**Not measured:** lead decision time, owner listening and review time, cloud-era v1/v2 build time, per-phase seconds for v3 to v51 (no qh orders), render times for the v3 to v51 folders (no render-report.json there).', '');
fs.writeFileSync(path.join(outDir, 'ledger-pencil-social.md'), pencil.join('\n') + '\n');

const uni = filmTable('uni-admissions', 'Ledger: uni-admissions (teaser)');
fs.writeFileSync(path.join(outDir, 'ledger-uni-admissions.md'), uni.join('\n') + '\n');

console.log(JSON.stringify({ orders: orders.length, versions: versions.length, unmapped: orders.filter((o) => o.phase === 'unmapped').length,
  outputs: ['ledger.jsonl', 'ledger-pencil-social.md', 'ledger-uni-admissions.md'] }));
