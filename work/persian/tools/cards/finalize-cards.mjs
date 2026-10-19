#!/usr/bin/env node
// Step 8: finalise work/persian/tools/cards/cards.json (one entry per real composition id).
// Fields and their provenance are documented in media/briefs-local/storylab-beauty/card-catalog-report.md.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const cards = JSON.parse(readFileSync(join(here, "cards.extract.json"), "utf8"));

const out = cards.map((c) => ({
  id: c.id,
  category: c.category,
  source: c.source,
  durationFrames: c.durationFrames,
  durationSec: c.durationSec,
  fps: c.fps,
  width: c.width,
  height: c.height,
  visualStyle: c.visualStyle,
  visualStyleMethod: c.visualStyleMethod,
  poster: c.poster ?? null,
  persianText: c.persianText,
  whatItDoes: c.whatItDoes,
  beats: c.beats,
  persianReady: c.persianReady,
  transitionOverlapFrames: 0,
}));

writeFileSync(join(here, "cards.json"), JSON.stringify(out, null, 2));
console.log(`cards.json: ${out.length} entries`);
console.log("category:", JSON.stringify(out.reduce((a, c) => ((a[c.category] = (a[c.category] || 0) + 1), a), {})));
console.log("style:", JSON.stringify(out.reduce((a, c) => ((a[c.visualStyle] = (a[c.visualStyle] || 0) + 1), a), {})));
console.log("beats:", JSON.stringify(out.reduce((a, c) => ((a[c.beats] = (a[c.beats] || 0) + 1), a), {})));
console.log("persianReady:", out.filter((c) => c.persianReady).length);
console.log("with persian text:", out.filter((c) => c.persianText.length).length);
console.log("with poster:", out.filter((c) => c.poster).length);
