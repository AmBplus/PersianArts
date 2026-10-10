#!/usr/bin/env node
// Publishes the upstream-code baseline renders (work/upstream/out/video) into the library as media:
//   library/media/shotcraft/<card>/<style>/{preview.mp4,poster.webp,thumb.webp}
// and writes library/data/entry-media.json (id -> primary media + all style variants).
// Baseline renders are the ORIGINAL Remotion code (English/Chinese text, silent): they are labelled renderKind "upstream-baseline"
// and never replace a verified Persian render (those keep priority in data.js).
// Usage: node scripts/link-upstream-baseline-media.mjs [--force]
import {readFile, writeFile, mkdir, stat, copyFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve, join} from "node:path";

const force = process.argv.includes("--force");
const up = resolve("work/upstream");
const mediaRoot = resolve("library/media/shotcraft");
const map = JSON.parse(await readFile(join(up, "style-comp-map.json"), "utf8"));
const lib = JSON.parse(await readFile(join(up, "src/gallery/api/library.json"), "utf8"));
const persian = JSON.parse(await readFile(resolve("library/data/persian-renders.json"), "utf8")).renders;
const MAX_BYTES = 2 * 1024 * 1024;

const exists = (p) => stat(p).then(() => true, () => false);
const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {encoding: "utf8"});
const duration = (p) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], {encoding: "utf8"});
  return Math.round(parseFloat(r.stdout) * 100) / 100 || null;
};

const cardInfo = Object.fromEntries(lib.cards.map((c) => [c.name, c]));
const items = {};
let done = 0, skipped = 0, failed = [];

for (const [id, m] of Object.entries(map)) {
  const src = join(up, "out/video", `${m.comp}.mp4`);
  if (!(await exists(src))) { skipped++; continue; }
  const rel = `media/shotcraft/${m.card}/${m.style}`;
  const dir = join(mediaRoot, m.card, m.style);
  await mkdir(dir, {recursive: true});
  const out = {video: join(dir, "preview.mp4"), poster: join(dir, "poster.webp"), thumb: join(dir, "thumb.webp")};
  if (force || !(await exists(out.video))) {
    const size = (await stat(src)).size;
    if (size <= MAX_BYTES) await copyFile(src, out.video);
    else {
      const r = ff(["-i", src, "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "96k", out.video]);
      if (r.status !== 0) { failed.push({id, why: r.stderr.slice(0, 200)}); continue; }
    }
  }
  const dur = duration(out.video);
  if (force || !(await exists(out.poster))) {
    const t = ((dur || 3) * 0.55).toFixed(2); // a settled mid-late frame reads better than the first frame
    ff(["-ss", t, "-i", out.video, "-frames:v", "1", "-vf", "scale=960:-2", "-c:v", "libwebp", "-quality", "80", out.poster]);
    ff(["-ss", t, "-i", out.video, "-frames:v", "1", "-vf", "scale=480:-2", "-c:v", "libwebp", "-quality", "75", out.thumb]);
  }
  const style = (cardInfo[m.card]?.styles || []).find((s) => s.key === m.style);
  const entryId = `shotcraft/${m.card}`;
  (items[entryId] ||= {renderKind: "upstream-baseline", variants: []}).variants.push({
    key: m.style,
    label: m.style,
    description: style?.description || "",
    comp: m.comp,
    duration: dur,
    short: dur != null && dur < 1.5, // upstream comp is only the motion core (a few frames), not a full showcase clip
    video: `${rel}/preview.mp4`,
    poster: `${rel}/poster.webp`,
    thumbnail: `${rel}/thumb.webp`,
  });
  done++;
  if (done % 25 === 0) console.log(`${done} processed…`);
}

// primary media = first variant, unless a verified Persian render already owns this entry
for (const [entryId, it] of Object.entries(items)) {
  const first = it.variants[0];
  const hasPersian = !!persian[entryId]?.variants?.some((v) => v && v.video);
  if (!hasPersian) Object.assign(it, {video: first.video, poster: first.poster, thumbnail: first.thumbnail});
  it.persianOwned = hasPersian;
}

await writeFile(
  resolve("library/data/entry-media.json"),
  JSON.stringify({schema: "persianarts/entry-media/v2", generatedAt: new Date().toISOString(), items}, null, 1),
);
console.log(JSON.stringify({entries: Object.keys(items).length, variants: done, skippedNoRender: skipped, failed}, null, 1));
