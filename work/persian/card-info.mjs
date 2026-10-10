#!/usr/bin/env node
// Prints everything an author needs for ONE card: its demo files (Persian working copy + untouched upstream copy),
// comp specs, the source prompt, library category/tags and the style descriptions.
// Usage: node work/persian/card-info.mjs --slug <slug>      |      node work/persian/card-info.mjs --list
import {readFile, readdir} from "node:fs/promises";
import {resolve, join} from "node:path";

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? undefined : process.argv[i + 1]; };
const idx = await readFile(resolve("work/persian/src/workbench/src/cards/demo-index.ts"), "utf8");
const entries = [...idx.matchAll(/import \{ (\w+) as c\d+[^}]*\} from "@demos\/([\w-]+)\/([\w-]+)\/(\w+)"/g)].map((m) => ({stem: m[1], cat: m[2], slug: m[3], file: m[4]}));
const slugs = [...new Set(entries.map((e) => e.slug))].sort();
if (process.argv.includes("--list")) { console.log(JSON.stringify(slugs)); process.exit(0); }
const slug = arg("slug");
const mine = entries.filter((e) => e.slug === slug);
if (!mine.length) { console.error("unknown slug"); process.exit(2); }

const comps = new Map((await readFile(resolve("work/upstream/comps.txt"), "utf8")).split(/\r?\n/).filter(Boolean).map((l) => {
  const m = l.trim().split(/\s+/); return [m[0], {fps: Number(m[1]), size: m[2], frames: Number(m[3])}];
}));
const lib = JSON.parse(await readFile(resolve("work/upstream/src/gallery/api/library.json"), "utf8"));
const card = lib.cards.find((c) => c.name === slug);
const dir = (root) => join(root, "demos", mine[0].cat, slug);
const files = (await readdir(dir(resolve("work/persian/src")))).sort();
const lines = async (f) => (await readFile(join(dir(resolve("work/persian/src")), f), "utf8")).split("\n").length;
console.log(JSON.stringify({
  slug,
  persianDir: dir(resolve("work/persian/src")),
  originalDir: dir(resolve("work/upstream/src")),
  files: await Promise.all(files.map(async (f) => ({name: f, lines: f.endsWith(".tsx") || f.endsWith(".ts") ? await lines(f) : undefined}))),
  comps: mine.map((e) => ({id: `demo-${e.stem}`, stem: e.stem, file: `${e.file}.tsx`, ...comps.get(`demo-${e.stem}`)})),
  sourcePrompt: resolve(`work/upstream/src/gallery/source/${slug}.md`),
  originalRenders: mine.map((e) => resolve(`work/upstream/out/video/demo-${e.stem}.mp4`)),
  library: card ? {category: card.category, tags: card.tags, summary: card.summary, styles: card.styles.map((s) => ({key: s.key, description: s.description}))} : null,
  outDir: resolve(`work/persian/out/${slug}`),
}, null, 1));
