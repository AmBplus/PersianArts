#!/usr/bin/env node
// card-find — zero-dependency search over work/persian/tools/cards/cards.json
//
//   node work/persian/tools/cards/card-find.mjs <query>
//   node work/persian/tools/cards/card-find.mjs <query> --category typography --style dark --json
//
// Flags:
//   --category <c>      camera|data|effects|interaction|opening|outro|rhythm|transition|typography|ui-entrance|native|background
//   --style <s>         dark|light|gradient|neutral
//   --beats <b>         open|build|reveal|punch|sustain|close
//   --max-sec <n>       only cards whose durationSec <= n
//   --min-sec <n>       only cards whose durationSec >= n
//   --persian           only cards that already carry Persian text (or the _fa kit)
//   --json              print the ranked hits as JSON instead of a table
//   --limit <n>         max rows (default 25)
//   --help              this text
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CARDS = join(here, "cards.json");

const RENDER_HINT = [
  "HOW TO RENDER THIS",
  "  cd work/persian/src/workbench",
  '  npx remotion render src/remotion/index.ts <composition-id> "<out>.mp4" \\',
  '    --browser-executable="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
  "  (out path: use an absolute or repo-relative path; a relative --out with a separate workdir double-nests)",
];

function usage() {
  console.log(`card-find — search the Remotion card catalogue

  node work/persian/tools/cards/card-find.mjs <query> [flags]

  query: any word (English or Persian). Searches id, category, whatItDoes,
         persianText, beats, visualStyle. Case-insensitive substring + token match.

  --category <c>  --style <s>  --beats <b>  --max-sec <n>  --min-sec <n>
  --persian  --json  --limit <n>  --help
`);
}

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help") || argv.includes("-h")) { usage(); process.exit(0); }

const flags = {};
const queryParts = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--persian") flags.persian = true;
  else if (a === "--json") flags.json = true;
  else if (a.startsWith("--")) {
    const key = a.slice(2);
    flags[key] = argv[++i];
  } else queryParts.push(a);
}
const query = queryParts.join(" ").trim();

let cards;
try {
  cards = JSON.parse(readFileSync(CARDS, "utf8"));
} catch (e) {
  console.error(`card-find: cannot read ${CARDS} — run the extractor first.\n${e.message}`);
  process.exit(1);
}

// ---- filters ---------------------------------------------------------------
const norm = (s) => String(s ?? "").toLowerCase();
if (flags.category && !cards.some((c) => c.category === flags.category)) {
  console.error(`card-find: unknown --category "${flags.category}". Known: ${[...new Set(cards.map((c) => c.category))].join(", ")}`);
  process.exit(1);
}
if (flags.style && !["dark", "light", "gradient", "neutral"].includes(flags.style)) {
  console.error(`card-find: unknown --style "${flags.style}". Known: dark, light, gradient, neutral`);
  process.exit(1);
}
if (flags.beats && !["open", "build", "reveal", "punch", "sustain", "close"].includes(flags.beats)) {
  console.error(`card-find: unknown --beats "${flags.beats}". Known: open, build, reveal, punch, sustain, close`);
  process.exit(1);
}
let hits = cards.filter((c) => {
  if (flags.category && c.category !== flags.category) return false;
  if (flags.style && c.visualStyle !== flags.style) return false;
  if (flags.beats && c.beats !== flags.beats) return false;
  if (flags["max-sec"] !== undefined && c.durationSec > Number(flags["max-sec"])) return false;
  if (flags["min-sec"] !== undefined && c.durationSec < Number(flags["min-sec"])) return false;
  if (flags.persian && !c.persianReady) return false;
  return true;
});

// ---- rank ------------------------------------------------------------------
// Fields searched: id, category, whatItDoes, persianText, beats, visualStyle.
// Weights: exact id match 100, id prefix 60, id substring 40, category 20,
//          whatItDoes 15, persianText 12, beats 8, visualStyle 5.
function score(c, q) {
  const nq = norm(q);
  const toks = nq.split(/\s+/).filter(Boolean);
  let s = 0;
  const id = norm(c.id);
  if (id === nq) s += 100;
  else if (id.startsWith(nq)) s += 60;
  else if (id.includes(nq)) s += 40;
  for (const t of toks) {
    if (norm(c.category) === t) s += 20;
    if (norm(c.beats) === t) s += 8;
    if (norm(c.visualStyle) === t) s += 5;
    if (norm(c.whatItDoes).includes(t)) s += 15;
    if (c.persianText.some((p) => p.includes(q))) s += 12;
    if (norm(c.category).includes(t)) s += 6;
    if (norm(c.whatItDoes).split(/\s+/).includes(t)) s += 6;
    if (c.persianText.some((p) => norm(p).includes(t))) s += 1;
  }
  return s;
}
if (query) {
  hits = hits
    .map((c) => ({ c, s: score(c, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.durationSec - b.c.durationSec)
    .map((x) => x.c);
} else {
  hits = hits.slice().sort((a, b) => a.durationSec - b.durationSec);
}
const limit = flags.limit ? Number(flags.limit) : 25;
const shown = hits.slice(0, limit);

// ---- output ----------------------------------------------------------------
if (flags.json) {
  console.log(JSON.stringify({ query, total: hits.length, shown: shown.length, cards: shown }, null, 2));
  if (!flags.json || process.env.CARD_FIND_FOOTER !== "0") { /* footer suppressed in JSON mode */ }
  process.exit(0);
}

const rows = shown.map((c) => ({
  id: c.id,
  category: c.category,
  style: c.visualStyle,
  sec: c.durationSec.toFixed(2),
  beats: c.beats,
  what: c.whatItDoes.length > 58 ? c.whatItDoes.slice(0, 55) + "..." : c.whatItDoes,
  fa: c.persianText.length ? (c.persianText[0].length > 22 ? c.persianText[0].slice(0, 20) + "…" : c.persianText[0]) : "",
  faN: c.persianText.length,
}));

const pad = (s, n) => {
  s = String(s);
  // Persian text has wide glyphs; count its length roughly so columns stay readable
  return s.length >= n ? s : s + " ".repeat(n - s.length);
};
const w = { id: 34, cat: 12, style: 8, sec: 6, beats: 8 };

console.log(`card-find: query="${query}"  filters=${JSON.stringify(flags)}  hits=${hits.length}  showing=${shown.length}`);
console.log("");
console.log(`${pad("id", w.id)} ${pad("category", w.cat)} ${pad("style", w.style)} ${pad("sec", w.sec)} ${pad("beats", w.beats)}  what it does / Persian`);
console.log("-".repeat(120));
for (const r of rows) {
  const line = `${pad(r.id, w.id)} ${pad(r.category, w.cat)} ${pad(r.style, w.style)} ${pad(r.sec, w.sec)} ${pad(r.beats, w.beats)}  ${r.what}`;
  console.log(line);
  if (r.fa) console.log(`${" ".repeat(w.id + w.cat + w.style + w.sec + w.beats + 5)}  ↳ فارسی (${r.faN}): ${r.fa}`);
}
console.log("");
console.log(RENDER_HINT.join("\n"));
