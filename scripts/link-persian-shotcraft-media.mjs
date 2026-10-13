#!/usr/bin/env node
// Packages the Persian (RTL) shotcraft localizations into the library:
//   work/persian/out/<card>/<Stem>.fa.mp4  ->  library/media/shotcraft/<card>/fa/<style>/{preview.mp4,poster.webp,thumb.webp}
// using the project's web profile (libx264, yuv420p, CRF 22, slow, faststart, < 2 MB; CRF is raised only if over budget),
// and writes library/data/entry-media.json (id -> Persian variants + primary media). Review status comes from
// work/persian/progress.json (approved / fixed / localized). Reference renders of upstream code stay local-only
// (scripts/link-upstream-baseline-media.mjs -> library/data/entry-media.reference.json).
// Usage (repo root): node scripts/link-persian-shotcraft-media.mjs [--force]
import {readFile, writeFile, mkdir, stat, readdir} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve, join} from "node:path";

const force = process.argv.includes("--force");
const MAX = 2 * 1024 * 1024;
const outRoot = resolve(process.env.OUT_ROOT || "work/persian/out");
const dryRun = !!process.env.DRY_RUN; // DRY_RUN=1: write nothing into library/; outputs go to DRY_ROOT (default work/persian/dryrun), entry-media.json is skipped
const dryRoot = resolve(process.env.DRY_ROOT || "work/persian/dryrun");
const onlyCards = (process.env.CARDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const onlyStatus = (process.env.ONLY_STATUS || "").split(",").map((s) => s.trim()).filter(Boolean);
const keep = new Set((process.env.KEEP || "").split(",").map((s) => s.trim()).filter(Boolean));
const map = JSON.parse(await readFile(resolve("work/upstream/style-comp-map.json"), "utf8"));
const lib = JSON.parse(await readFile(resolve("work/upstream/src/gallery/api/library.json"), "utf8"));
const progress = JSON.parse(await readFile(resolve("work/persian/progress.json"), "utf8"));
const statusOf = Object.fromEntries(progress.cards.map((c) => [c.slug, c.status]));
const styleOfComp = {};
for (const m of Object.values(map)) styleOfComp[`${m.card}|${m.comp}`] = m.style;
const describe = (card, key) => lib.cards.find((c) => c.name === card)?.styles.find((s) => s.key === key)?.description || "";

const exists = (p) => stat(p).then(() => true, () => false);
const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {encoding: "utf8"});
const duration = (p) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], {encoding: "utf8"});
  return Math.round(parseFloat(r.stdout) * 100) / 100 || null;
};

const items = {};
const report = {cards: 0, variants: 0, encoded: 0, skipped: [], oversized: [], failed: []};
for (const card of (await readdir(outRoot)).sort()) {
  if (onlyCards.length && !onlyCards.includes(card)) continue;
  if (onlyStatus.length && !keep.has(card) && !onlyStatus.includes(statusOf[card] || "localized")) {
    report.skipped.push(card);
    continue;
  }
  const files = (await readdir(join(outRoot, card)).catch(() => [])).filter((f) => f.endsWith(".fa.mp4")).sort();
  if (!files.length) continue;
  const variants = [];
  for (const f of files) {
    const stem = f.replace(/\.fa\.mp4$/, "");
    // prefer the sound variant <Stem>.fa.sound.mp4 over the silent <Stem>.fa.mp4
    const source = (await exists(join(outRoot, card, `${stem}.fa.sound.mp4`))) ? `${stem}.fa.sound.mp4` : f;
    const comp = `demo-${stem}`;
    const key = styleOfComp[`${card}|${comp}`] || stem; // extra comps not in library.html keep their stem as key
    const dir = resolve(dryRun ? dryRoot : "library", "media/shotcraft", card, "fa", key);
    const rel = `media/shotcraft/${card}/fa/${key}`;
    await mkdir(dir, {recursive: true});
    const video = join(dir, "preview.mp4");
    if (force || !(await exists(video))) {
      let ok = false;
      for (const crf of [22, 26, 30]) {
        const r = ff(["-i", join(outRoot, card, source), "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-map_metadata", "-1", video]);
        if (r.status !== 0) { report.failed.push(`${card}/${stem}: ${r.stderr.slice(0, 160)}`); break; }
        if ((await stat(video)).size <= MAX) { ok = true; if (crf !== 22) report.oversized.push(`${card}/${stem}@crf${crf}`); break; }
      }
      if (!ok && !(await exists(video))) continue;
      report.encoded++;
      const t = ((duration(video) || 3) * 0.6).toFixed(2); // a settled, late frame reads best as a poster
      ff(["-ss", t, "-i", video, "-frames:v", "1", "-vf", "scale=960:-2", "-c:v", "libwebp", "-quality", "82", join(dir, "poster.webp")]);
      ff(["-ss", t, "-i", video, "-frames:v", "1", "-vf", "scale=480:-2", "-c:v", "libwebp", "-quality", "78", join(dir, "thumb.webp")]);
    }
    variants.push({
      key, label: key, comp, description: describe(card, key), duration: duration(video),
      video: `${rel}/preview.mp4`, poster: `${rel}/poster.webp`, thumbnail: `${rel}/thumb.webp`,
    });
  }
  if (!variants.length) continue;
  // library.html order first (style order of the card), extra comps after
  const order = (lib.cards.find((c) => c.name === card)?.styles || []).map((s) => s.key);
  variants.sort((a, b) => ((order.indexOf(a.key) + 1 || 999) - (order.indexOf(b.key) + 1 || 999)));
  const first = variants[0];
  items[`shotcraft/${card}`] = {
    renderKind: "persian-local",
    reviewStatus: statusOf[card] || "localized",
    video: first.video, poster: first.poster, thumbnail: first.thumbnail,
    variants,
  };
  report.cards++; report.variants += variants.length;
}
if (!dryRun) await writeFile(resolve("library/data/entry-media.json"), JSON.stringify({schema: "persianarts/entry-media/v3", generatedAt: new Date().toISOString(), items}, null, 1));
console.log(JSON.stringify(report, null, 1));
