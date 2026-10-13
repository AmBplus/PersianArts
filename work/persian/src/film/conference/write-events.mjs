// Writes media/film-versions/conference-ifrc/v1/events.json from EVENTS in events.ts. Usage: node write-events.mjs
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "events.ts"), "utf8");
const body = src.slice(src.indexOf("export const EVENTS = {"), src.indexOf("} as const satisfies"));
const re = /(\w+):\s*\{frame:\s*(\d+),\s*type:\s*"(\w+)",\s*label:\s*"([^"]*)"\}/g;
const list = [...body.matchAll(re)].map((m) => ({frame: +m[2], type: m[3], label: m[4], id: m[1]})).sort((a, b) => a.frame - b.frame);
const out = resolve(here, "../../../../../media/film-versions/conference-ifrc/v1/events.json");
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({fps: 30, frames: 900, source: "work/persian/src/film/conference/events.ts", events: list}, null, 2));
console.log(`wrote ${list.length} events to ${out}`);
