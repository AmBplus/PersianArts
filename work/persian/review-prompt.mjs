#!/usr/bin/env node
// Writes the independent-reviewer prompt for one card to work/persian/out/<slug>/review.prompt.md (same text the Sonnet workflow uses)
// and prints its path.  Usage: node work/persian/review-prompt.mjs --slug <slug> [--author "<who/what authored it>"]
import {readFile, writeFile, mkdir} from "node:fs/promises";
import {resolve, join} from "node:path";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const slug = arg("slug"), who = arg("author", "an automated author");
const root = resolve(import.meta.dirname, "..", "..");
const wf = await readFile(join(root, "work/persian/workflow/persian-rtl-localize.js"), "utf8");
const a = wf.indexOf("const COMMON = `") + "const COMMON = `".length;
const COMMON = new Function("ROOT", "return `" + wf.slice(a, wf.indexOf("\n`\n", a) + 1) + "`")(root);
const r0 = wf.indexOf("YOU ARE THE INDEPENDENT, ADVERSARIAL REVIEWER");
const body = wf.slice(r0, wf.indexOf("`\n\nconst fixPrompt", r0))
  .replaceAll("${slug}", slug)
  .replace("(summary of their report: ${JSON.stringify(author).slice(0, 6000)})", `(authored by ${who}; read work/persian/out/${slug}/report.json if it exists)`);
const out = join(root, "work/persian/out", slug, "review.prompt.md");
await mkdir(join(root, "work/persian/out", slug), {recursive: true});
await writeFile(out, `${COMMON}\n${body}\nWhen done, write work/persian/out/${slug}/review.json as {slug, verdict:"approve"|"fix", score:0-100 (overall craft score for a shippable Persian localization), issues:[{severity:"blocker"|"major"|"minor", where, problem, suggestedFix}], notes}. Your final message must repeat verdict, score and the issue list.\n`, "utf8");
console.log(out);
