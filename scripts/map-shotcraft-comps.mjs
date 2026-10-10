#!/usr/bin/env node
// Maps every library.html style sample (214) to its Remotion composition id, using the "参考实现" line of each prompt
// (demos/<cat>/<card>/<File>.tsx -> comp "demo-<File>") and the rendered files in work/upstream/out/video.
// Usage: node scripts/map-shotcraft-comps.mjs   -> writes work/upstream/style-comp-map.json and prints a coverage report.
import {readFile, writeFile, readdir} from "node:fs/promises";
import {resolve, join} from "node:path";

const up = resolve("work/upstream");
const lib = JSON.parse(await readFile(join(up, "src/gallery/api/library.json"), "utf8"));
const rendered = new Set((await readdir(join(up, "out/video"))).map((f) => f.replace(/\.mp4$/, "")));
const comps = new Set((await readFile(join(up, "comps.txt"), "utf8")).split(/\r?\n/).map((l) => l.split(/\s+/)[0]).filter((x) => x.startsWith("demo-")));

// Manual matches, decided from the style descriptions in library.json vs the free comps' names.
// flash-cut has no demo comp of its own (it is a lib effect, assets/lib/FlashCut.tsx) -> stays unmapped.
const OVERRIDE = {
  "crash-zoom-punch/crash-zoom-punch": "demo-CrashZoomReal",
  "ui-to-brand-morph/input-morph-assemble": "demo-InputMorphsIntoLogo",
  "shot-transitions/shot-transitions-4": "demo-DarkTunnelTransition", // B 穿暗场直航
  "shot-transitions/shot-transitions-5": "demo-FocusHandoffTransition", // C 虚焦接力
  "shot-transitions/shot-transitions-6": "demo-BlackCardTransition", // D 黑场字卡
};
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const map = {};
const report = {cards: lib.cards.length, styles: 0, mapped: 0, unmapped: [], noRender: []};

for (const card of lib.cards) {
  const md = await readFile(join(up, "src/gallery/source", `${card.name}.md`), "utf8").catch(() => "");
  const ref = md.split("## 参考实现")[1] || "";
  const dir = (ref.match(/demos\/([\w-]+\/[\w-]+)\//) || [])[1];
  const files = [...ref.matchAll(/([A-Za-z0-9_]+)\.tsx/g)].map((m) => m[1]);
  const candidates = files.map((f) => `demo-${f}`).filter((c) => comps.has(c));
  for (const style of card.styles) {
    report.styles++;
    const key = style.key;
    // 1) exact: comp named after the file whose normalized name matches the style key
    let comp = candidates.find((c) => norm(c.slice(5)) === norm(key));
    // 2) card has exactly one candidate comp and one style
    if (!comp && candidates.length === 1 && card.styles.length === 1) comp = candidates[0];
    // 3) style key contained in / containing a candidate
    if (!comp) comp = candidates.find((c) => norm(key).includes(norm(c.slice(5))) || norm(c.slice(5)).includes(norm(key)));
    if (!comp && OVERRIDE[`${card.name}/${key}`]) comp = OVERRIDE[`${card.name}/${key}`];
    if (!comp) { report.unmapped.push({card: card.name, style: key, candidates, dir}); continue; }
    report.mapped++;
    if (!rendered.has(comp)) report.noRender.push({card: card.name, style: key, comp});
    map[`${card.name}/${key}`] = {card: card.name, style: key, comp, category: card.category, tags: card.tags, dir};
  }
}
await writeFile(join(up, "style-comp-map.json"), JSON.stringify(map, null, 1));
console.log(JSON.stringify({...report, unmapped: report.unmapped.length, noRender: report.noRender.length}, null, 1));
if (report.unmapped.length) console.log("UNMAPPED:\n" + report.unmapped.map((u) => `${u.card}/${u.style}  cands=[${u.candidates}] dir=${u.dir}`).join("\n"));
if (report.noRender.length) console.log("NO RENDER:", report.noRender.map((u) => u.comp).join(", "));
