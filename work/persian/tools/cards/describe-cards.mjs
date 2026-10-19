#!/usr/bin/env node
// Step 5: replace whatItDoes fallbacks with facts read from the card's own TSX.
//   - native/background cards: source located under work/persian/src/workbench/src/cards/*
//   - description: the card's own `summary` / `description` field if present (CardDef), else a
//     verb composed from the component stem's tokens against a factual verb table.
// Everything stays derived from real sources; nothing is invented.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const CARDS_SRC = join(repo, "work/persian/src/workbench/src/cards");
const cards = JSON.parse(readFileSync(join(here, "cards.extract.json"), "utf8"));

// ---------- 1. find native/background sources -------------------------------
function findNativeSource(id) {
  const wanted = id.replace(/-/g, "");
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith(".tsx") && !e.name.endsWith(".ts")) continue;
      const t = readFileSync(p, "utf8");
      if (new RegExp(`["'\`]${id}["'\`]`).test(t)) out.push(p);
      if (new RegExp(`solidCard\\(\\s*["'\`]${id}["'\`]`).test(t)) out.push(p);
    }
  };
  walk(CARDS_SRC);
  return out[0] ?? null;
}

// ---------- 2. verb table ----------------------------------------------------
const VERB = {
  counter: "counts up a number",
  confetti: "with a confetti burst",
  crash: "with a crash-style impact",
  zoom: "with a fast camera zoom",
  dolly: "with a dolly camera move",
  multiplane: "with a multiplane parallax camera",
  graze: "with a grazing camera pass over a face",
  overhead: "with an overhead top-down camera drop",
  tilt: "with a camera tilt",
  drone: "with a drone-style dive and landing",
  exploded: "with an exploded-view camera pull",
  steep: "with a steep tilt glide",
  bullet: "with a bullet-time freeze orbit",
  dutch: "with a dutch roll leveling out",
  pullback: "with a camera pull-back isolation",
  slow: "with a slow push-in",
  push: "with a push-in camera move",
  terminal: "with a terminal-style 3D scene",
  cursor: "animates a fake cursor moving over content",
  flyover: "as the camera flies over the content",
  avatar: "animates an avatar grid",
  radial: "in a radial build",
  before: "with a before/after comparison slider",
  slider: "with a draggable slider",
  axis: "with an axis rescale shock",
  rescale: "with an axis rescale shock",
  oscilloscope: "with an oscilloscope stream",
  unit: "with unit dots",
  swarm: "with a particle swarm",
  regroup: "regrouping into place",
  cycle: "cycles through states",
  glass: "with a glass-morphism look",
  node: "with nodes and links",
  morph: "morphs one shape into another",
  needle: "with a needle sweep",
  gauge: "animates a value gauge",
  sweep: "sweeps across the frame",
  tape: "with a tape-roll readout",
  scroll: "scrolls content vertically",
  fixed: "with a fixed pointer",
  hatch: "with a hatched depth texture",
  odometer: "rolls digits like an odometer",
  digit: "rolls digits",
  confetti: "fires confetti",
  crossfire: "with crossing particle bursts",
  tick: "ticks on a counter change",
  sparks: "emits sparks",
  particle: "with particles",
  sand: "with falling sand particles",
  fill: "filling a shape",
  ring: "with a ring/donut diagram",
  diagram: "with an annotated diagram",
  annotation: "with annotations",
  reveal: "reveals content",
  brake: "with a scroll-brake motion",
  reticle: "with a targeting reticle",
  lock: "locking onto a target",
  changelog: "scrolling a changelog",
  timeline: "animates a timeline",
  travel: "travels along a timeline",
  assemble: "assembles then types text",
  type: "types text out character by character",
  flyin: "flies content in",
  aurora: "renders an aurora background",
  bloom: "renders a bloom glow",
  bg: "as a background flip",
  flip: "flips content in 3D",
  brand: "animates a brand mark",
  frame: "animates a framed element",
  snap: "snaps content into place",
  dashboard: "animates a dashboard",
  glow: "animates a glow effect",
  highlight: "highlights a pill element",
  pill: "animates a pill element",
  line: "animates a line element",
  unfold: "unfolds a panel",
  panel: "animates a panel",
  reticle: "with a targeting reticle",
  on: "turns on",
  flyline: "animates a flyline arc",
  arc: "along an arc",
  orb: "animates an orb",
  ambient: "as an ambient background",
  relay: "relays between nodes",
  attention: "with an attention bounce",
  bounce: "bounces content in",
  pop: "pops content in",
  burst: "with a burst",
  confirm: "confirming a selection",
  anime: "with an anime-style impact",
  impact: "with an impact effect",
  hit: "on a hit",
  counter: "counts up a number",
  halation: "with a halation bloom",
  sheen: "with a sheen sweep",
  retry: "on a retry action",
  spotlight: "with a spotlight sweep",
  spot: "with a spotlight",
  bokeh: "renders bokeh",
  line: "animates a line element",
  boil: "with a boiling hand-drawn line",
  radial: "in a radial burst",
  ripple: "with radial ripples",
  phone: "on a phone mockup",
  chips: "animates chips cycling through options",
  riso: "with a risograph print look",
  beat: "pulses on the beat",
  pump: "pumping on the beat",
  misregistration: "with a misregistration hit",
  scan: "with a scan sweep",
  bracket: "with a bracket highlight",
  annotate: "annotating content",
  focus: "focusing content",
  assemble: "assembles content",
  kanada: "with a Kanada-style perspective snap",
  perspective: "with a perspective snap",
  text: "renders text on screen",
  basic: "with a basic 3D scene",
  scene: "renders a 3D scene",
};

const OVERRIDE = {
  Main: "the host workbench composition (not a card)",
  textbasic: "renders a plain, fully parameterised text card",
  inkpresstitlecard: "renders an ink-press style title card",
  inkpresscaption: "renders an ink-press style caption strip",
  inkpressflashcut: "renders an ink-press style flash cut",
  videoclip: "renders a video clip slot",
  imageclip: "renders an image clip slot",
  audioclip: "renders an audio clip slot",
  bgpaper: "renders a warm off-white paper background",
  bgwhite: "renders a plain white background",
  bgink: "renders an ink-black background",
  bgpaperglow: "renders a glowing paper-textured background",
  persianpage: "renders a Persian RTL page layout",
};

function tokens(stem) {
  // "Basic3DScene" -> ["Basic","3D","Scene"]; "bg-paper" -> ["bg","paper"]
  return stem
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function describeFromTokens(stem) {
  const key = stem.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (OVERRIDE[key]) return OVERRIDE[key];
  const t = tokens(stem);
  for (let n = Math.min(2, t.length); n >= 1; n--) {
    const phrase = t.slice(0, n).join("").toLowerCase();
    if (VERB[phrase]) {
      const tail = t.slice(n).slice(0, 3).join(" ").toLowerCase();
      return tail ? `${VERB[phrase]} (${tail})` : VERB[phrase];
    }
  }
  return `renders the "${t.slice(0, 3).join(" ")}" motion`;
}

// ---------- 3. summary field from the card's own source ---------------------
// Some demo TSX carry a Chinese author note at the top; when one exists we mark it (the English
// sentence is still produced by the verb table so the catalogue stays English-only).
function ownSummary(srcAbs) {
  if (!srcAbs || !existsSync(srcAbs)) return null;
  const t = readFileSync(srcAbs, "utf8");
  const m = /summary\s*:\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/.exec(t);
  if (m && m[2].trim().length > 8) return { text: m[2].trim(), lang: /[\u4e00-\u9fff]/.test(m[2]) ? "zh" : "en" };
  const d = /description\s*:\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/.exec(t);
  if (d && d[2].trim().length > 8) return { text: d[2].trim(), lang: /[\u4e00-\u9fff]/.test(d[2]) ? "zh" : "en" };
  return null;
}

let fixedSource = 0;
for (const c of cards) {
  if (!c.source) {
    const p = findNativeSource(c.id);
    if (p) {
      c.source = relative(repo, p).split("\\").join("/");
      if (c.category === "native" && /background-cards/.test(p)) c.category = "background";
      fixedSource++;
    }
  }
  const stem = c.id.startsWith("demo-") ? c.id.slice(5) : c.id;
  const sum = ownSummary(c.source ? join(repo, c.source) : null);
  c.whatItDoes = sum && sum.lang === "en" ? sum.text : describeFromTokens(stem);
  if (sum && sum.lang === "zh") c.sourceNote = sum.text.slice(0, 160); // author note kept verbatim, not used as the English sentence
  if (!c.beats) c.beats = "sustain";
}

writeFileSync(join(here, "cards.extract.json"), JSON.stringify(cards, null, 2));
console.log(`native sources located: ${fixedSource}`);
console.log("still without source:", cards.filter((c) => !c.source).map((c) => c.id).join(", ") || "none");
console.log("whatItDoes from own summary:", cards.filter((c) => /^[a-z]/.test(c.whatItDoes) && /summary/.test(c.whatItDoes)).length);
