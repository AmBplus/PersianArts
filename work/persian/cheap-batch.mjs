#!/usr/bin/env node
// Runs many cards through cheap-author.mjs with one sequential lane per (worker, model, effort) slot.
// Usage: node work/persian/cheap-batch.mjs [--cards a,b,c | --file work/persian/batch39.json] [--skip x,y] [--max N]
// Results are appended to work/persian/trial/batch-results.jsonl (one JSON object per finished card).
import {readFile, appendFile, mkdir} from "node:fs/promises";
import {existsSync} from "node:fs";
import {spawn} from "node:child_process";
import {resolve, join} from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const root = resolve(import.meta.dirname, "..", "..");
let cards = arg("cards") ? arg("cards").split(",") : JSON.parse(await readFile(join(root, arg("file", "work/persian/batch39.json")), "utf8"));
const skip = new Set((arg("skip", "") || "").split(",").filter(Boolean));
cards = cards.filter((c) => !skip.has(c) && !existsSync(join(root, "work/persian/out", c, "review.json")) && !existsSync(join(root, "work/persian/out", c, `${c}.done`)));
if (arg("max")) cards = cards.slice(0, Number(arg("max")));

const SLOTS = [
  {worker: "glm", model: "glm-5.3-flash", effort: "medium"},
  {worker: "codex-b", model: "gpt-6-luna", effort: "medium"},
  {worker: "codex-a", model: "gpt-5.6-luna", effort: "medium"},
  {worker: "codex-b", model: "gpt-6-sol", effort: "medium"},
  {worker: "codex-a", model: "gpt-5.6-terra", effort: "low"},
];
const queues = SLOTS.map(() => []);
cards.forEach((c, i) => queues[i % SLOTS.length].push(c));
const results = join(root, "work/persian/trial/batch-results.jsonl");
await mkdir(join(root, "work/persian/trial"), {recursive: true});

const runOne = (slug, s) => new Promise((res) => {
  const p = spawn(process.execPath, ["work/persian/cheap-author.mjs", "--slug", slug, "--worker", s.worker, "--model", s.model, "--effort", s.effort, "--timeout", "1800"], {cwd: root});
  let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
  p.on("close", async () => {
    let r; try { r = JSON.parse(out.trim().split("\n").pop()); } catch { r = {slug, status: "wrapper-error", raw: out.slice(-300)}; }
    await appendFile(results, JSON.stringify(r) + "\n");
    console.log(JSON.stringify(r)); res();
  });
});
console.log(`queues: ${queues.map((q, i) => `${SLOTS[i].model}@${SLOTS[i].worker}=${q.length}`).join(" ")}`);
await Promise.all(queues.map(async (q, i) => { for (const slug of q) await runOne(slug, SLOTS[i]); }));
console.log("batch done");
