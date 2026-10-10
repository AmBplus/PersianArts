#!/usr/bin/env node
// Imports the agents' structured results from workflow journal(s) into work/persian/out/<slug>/{report,review}.json.
// Agents sometimes skip writing the files (reviewers that approve, fixers that forget to rewrite report.json, stub reports);
// the journal is the authoritative record of what each agent returned.
// Order inside a journal per slug: author result -> review result (has "verdict") -> optional fix result.
// Usage (repo root): node work/persian/import-journal.mjs <journal.jsonl> [<journal.jsonl> ...]
import {readFile, writeFile, mkdir} from "node:fs/promises";
import {resolve, join} from "node:path";

const authors = {}, reviews = {}, fixes = {};
for (const file of process.argv.slice(2)) {
  for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
    if (!line.includes('"type":"result"')) continue;
    let r; try { r = JSON.parse(line).result; } catch { continue; }
    if (!r || typeof r !== "object" || !r.slug) continue;
    if (r.verdict) { reviews[r.slug] = r; delete fixes[r.slug]; }
    else if (reviews[r.slug] && authors[r.slug]) fixes[r.slug] = r;
    else { authors[r.slug] = r; delete reviews[r.slug]; delete fixes[r.slug]; }
  }
}
const isStub = (j) => !j || !Array.isArray(j.comps) || !j.comps.length;
const readJson = async (p) => { try { return JSON.parse(await readFile(p, "utf8")); } catch { return null; } };
let wrote = 0;
for (const slug of new Set([...Object.keys(authors), ...Object.keys(reviews)])) {
  const out = resolve("work/persian/out", slug);
  await mkdir(out, {recursive: true});
  const rp = join(out, "report.json"), vp = join(out, "review.json");
  if (reviews[slug] && !(await readJson(vp))) { await writeFile(vp, JSON.stringify(reviews[slug], null, 1)); wrote++; }
  if (fixes[slug]) { await writeFile(rp, JSON.stringify({...fixes[slug], fixedAfterReview: true}, null, 1)); wrote++; }
  else if (authors[slug] && isStub(await readJson(rp))) { await writeFile(rp, JSON.stringify(authors[slug], null, 1)); wrote++; }
}
console.log(JSON.stringify({authors: Object.keys(authors).length, reviews: Object.keys(reviews).length, fixes: Object.keys(fixes).length, filesWritten: wrote}));
