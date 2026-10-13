// pa time: per-film timing marks on the SYSTEM CLOCK (owner rule: 10 min target, 20 min cap per film).
// node time.mjs start <film> [--budget N] | mark <film> <phase> [--note ..] [--actor ..] | status <film> | end <film> | postmortem <film> [--file f] [--qh]
import {existsSync, mkdirSync, appendFileSync, readFileSync} from "node:fs";
import {join, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
export const PHASES = ["env", "intake", "treatment", "build", "capture", "sound", "qc", "fix", "deliver", "wait-lead", "wait-owner", "scope-change"];
const [cmd, film, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
export const tfile = (f, over) => over || join(ROOT, "media/briefs-local", f, "timing.jsonl");
export const readMarks = (file) => existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : [];
const put = (file, o) => { mkdirSync(dirname(file), {recursive: true}); appendFileSync(file, JSON.stringify(o) + "\n"); };
const stamp = (extra) => { const d = new Date(); return {t_iso: d.toISOString(), t_epoch: Math.round(d.getTime() / 1000), ...extra}; };
export const min = (s) => Math.round((s / 60) * 10) / 10;
// per-phase minutes: a mark starts its phase, which lasts until the next mark (or 'end')
export function phaseMinutes(marks) {
  const out = {};
  for (let i = 0; i < marks.length - 1; i++) { const p = marks[i].phase; if (p === "start" || p === "end") continue; out[p] = (out[p] || 0) + (marks[i + 1].t_epoch - marks[i].t_epoch) / 60; }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Math.round(v * 10) / 10]));
}
if (process.argv[1]?.endsWith("time.mjs")) {
  if (!cmd || !film) { console.log("usage: pa time start|mark|status|end|postmortem <film> ..."); process.exit(2); }
  const file = tfile(film, opt("--file"));
  const marks = readMarks(file);
  const budget = Number((marks.find((m) => m.phase === "start") || {}).budget_minutes || opt("--budget", 20));
  const elapsed = () => (Date.now() / 1000 - marks[0].t_epoch) / 60;
  if (cmd === "start") {
    if (marks.length) { console.error("already started: " + file); process.exit(1); }
    put(file, stamp({phase: "start", note: opt("--note", ""), actor: opt("--actor", "lead"), budget_minutes: Number(opt("--budget", 20))}));
    console.log(`TIMER START ${film} budget ${opt("--budget", 20)} min (half ${Number(opt("--budget", 20)) / 2}, full ${opt("--budget", 20)})`);
  } else if (cmd === "mark") {
    const phase = rest[0];
    if (!marks.length) { console.error("no timer: run start first"); process.exit(1); }
    if (![...PHASES, "end"].includes(phase)) { console.error("phase must be one of " + PHASES.join(", ")); process.exit(1); }
    put(file, stamp({phase, note: opt("--note", ""), actor: opt("--actor", "studio")}));
    console.log(`MARK ${phase} at ${min(elapsed() * 60)} min`);
  } else if (cmd === "status") {
    if (!marks.length) { console.error("no timer"); process.exit(1); }
    const e = elapsed(), last = marks[marks.length - 1], half = budget / 2;
    console.log(`${film}: elapsed ${e.toFixed(1)} min = ${Math.round((e / budget) * 100)}% of ${budget} min; last phase ${last.phase} (${Math.max(0, (Date.now() / 1000 - last.t_epoch) / 60).toFixed(1)} min ago)`);
    console.log(e > budget ? "OVERRUN: report to the owner now" : e > half ? `HALF-BUDGET passed: decide ship-or-narrow now; next alarm FULL at ${budget} min (${(budget - e).toFixed(1)} min left)` : `next alarm HALF-BUDGET at ${half} min (${(half - e).toFixed(1)} min left)`);
    process.exit(e > budget ? 3 : 0);
  } else if (cmd === "end") {
    if (!marks.length) { console.error("no timer"); process.exit(1); }
    put(file, stamp({phase: "end", note: opt("--note", ""), actor: opt("--actor", "lead")}));
    const all = readMarks(file), total = min(all[all.length - 1].t_epoch - all[0].t_epoch), ph = phaseMinutes(all);
    const line = {date: new Date().toISOString().slice(0, 10), order: `film timing ${film}`, total_minutes: total, budget_minutes: budget, held: total <= budget, phase_minutes: ph};
    appendFileSync(join(ROOT, "docs/motion/ledger/manual-orders.jsonl"), JSON.stringify(line) + "\n");
    console.log(`END ${film}: ${total} min of ${budget} (${total <= budget ? "budget held" : "OVERRUN"}); phases ${JSON.stringify(ph)}`);
  } else if (cmd === "postmortem") { (await import("./postmortem.mjs")).run(film, file, rest, {readMarks, phaseMinutes, min}); }
  else { console.error("unknown command " + cmd); process.exit(2); }
}
