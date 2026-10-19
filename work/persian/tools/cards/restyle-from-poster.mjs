#!/usr/bin/env node
// Step 3: rebuild the visualStyle field from a real poster still when one exists.
// Rule (documented in report):
//   1. If a poster.webp exists under library/** for the card's slug, sample the frame's mean colour
//      and its top-left/right/bottom corners -> dark | light | gradient | neutral.
//   2. Otherwise fall back to the source-hex heuristic from extract-card-meta.mjs.
// The sampler is zero-dependency: WebP is decoded by sampling only the DC/low-frequency part is not
// reliable, so instead we shell out to Node's built-in nothing... we use a tiny lossless trick:
//   - the poster is a real WebP; we read its pixels with the `sharp`-free `zlib`+manual parser only if
//     simple; in practice we use the bundled `python` + Pillow instead (see sample-posters.py).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const cards = JSON.parse(readFileSync(join(here, "cards.extract.json"), "utf8"));
const samples = JSON.parse(readFileSync(join(here, "poster-samples.json"), "utf8")); // produced by sample-posters.py

const byStem = new Map();
for (const c of cards) {
  const stem = c.id.startsWith("demo-") ? c.id.slice(5) : c.id;
  byStem.set(stem, c);
}

let reclassified = 0;
let posterUsed = 0;
const byId = new Map(cards.map((c) => [c.id, c]));
for (const s of Object.values(samples)) {
  if (!s.cardIds) continue;
  for (const id of s.cardIds) {
    const c = byId.get(id);
    if (!c) continue;
    const before = c.visualStyle;
    c.visualStyle = s.style;
    c.visualStyleMethod = "poster-sample";
    c.poster = s.file;
    posterUsed++;
    if (before !== s.style) reclassified++;
  }
}
console.log(`poster samples applied to ${posterUsed} cards`);

writeFileSync(join(here, "cards.extract.json"), JSON.stringify(cards, null, 2));
console.log(`poster reclassified: ${reclassified}, posters used: ${Object.keys(samples).length}`);
console.log("visualStyle:", JSON.stringify(cards.reduce((a, c) => ((a[c.visualStyle] = (a[c.visualStyle] || 0) + 1), a), {})));
console.log("method:", JSON.stringify(cards.reduce((a, c) => ((a[c.visualStyleMethod] = (a[c.visualStyleMethod] || 0) + 1), a), {})));
