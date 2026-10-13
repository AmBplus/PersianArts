// pa time postmortem <film>: where did the minutes go. Inputs: timing.jsonl + mtimes under media/film-versions/<film>/ (read-only) + optional qh (--qh).
import {readdirSync, statSync, writeFileSync, existsSync} from "node:fs";
import {join, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const walk = (d) => existsSync(d) ? readdirSync(d, {withFileTypes: true}).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]) : [];
const FIX = {
  "wait-lead": ["lead idle between rounds (no mark, no file activity)", "decision loop has no clock: the lead waits instead of ordering", "`pa time status` after every worker report; order the next step within 2 min or ship (SKILL rule 10)"],
  "wait-owner": ["waiting for the owner", "approval round-trip outside the film budget", "ask the owner once up front for every choice; ship with notes instead of waiting"],
  "worker-ramp-up": ["new worker re-reads the context", "a new agent per round re-reads 10-15 files", "ONE persistent studio worker (SendMessage) + film-context.md read first"],
  "render-capture": ["capture/encode wall time", "slow capture (PNG encode) or repeated captures", "lighten before capture; capture once per version; `--draft` for previews"],
  "rework": ["fix round / repeated phase", "v1 did not meet the bar or a weaker worker left partial results", "one studio pass with the right worker; no Haiku for craft; freeze scope"],
  "scope-change": ["scope added after the order started", "new owner feedback taken into the running round", "scope freeze: new feedback = next version"],
};
export function classify(prev, next, dt, wantMp) {
  if (next.kind === "mark" && next.phase === "scope-change") return "scope-change";
  if (prev.phase === "wait-owner") return "wait-owner";
  if (prev.phase === "fix") return "rework";
  if (["intake", "treatment", "build", "qc"].includes(prev.phase)) return "work"; // worker busy, not a delay
  if (next.kind === "mark" && prev.actor && next.actor && prev.actor !== next.actor && dt <= 6) return "worker-ramp-up";
  if (["capture", "sound"].includes(prev.phase) || (next.kind === "file" && /\.(mp4|png|wav)$/i.test(next.name))) return "render-capture";
  return "wait-lead";
}
export function run(film, file, rest, {readMarks, phaseMinutes, min}) {
  const i = rest.indexOf("--date"), date = i >= 0 ? rest[i + 1] : new Date().toISOString().slice(0, 10);
  const marks = readMarks(file);
  if (marks.length < 2) { console.error("need a timeline: " + file); process.exit(1); }
  const files = walk(join(ROOT, "media/film-versions", film)).filter((f) => !/[\/](tmp|_orig)[\/]/.test(f)).map((f) => ({kind: "file", t: statSync(f).mtimeMs / 1000, name: f.split(/[\/]/).pop()}));
  const t0 = marks[0].t_epoch, t1 = marks[marks.length - 1].t_epoch;
  const ev = [...marks.map((m) => ({kind: "mark", t: m.t_epoch, phase: m.phase, actor: m.actor, note: m.note})), ...files.filter((f) => f.t >= t0 && f.t <= t1)].sort((a, b) => a.t - b.t);
  let cur = marks[0];
  const gaps = [], by = {};
  for (let k = 0; k < ev.length - 1; k++) {
    if (ev[k].kind === "mark") cur = ev[k];
    const dt = (ev[k + 1].t - ev[k].t) / 60;
    if (dt > 2) { const c = classify(cur, ev[k + 1], dt); gaps.push({from: ev[k].t, to: ev[k + 1].t, min: min(dt * 60), cls: c, after: cur.phase}); by[c] = (by[c] || 0) + dt; }
  }
  const hhmm = (s) => new Date(s * 1000).toTimeString().slice(0, 5);
  const top = Object.entries(by).filter(([c]) => c !== "work").sort((a, b) => b[1] - a[1]).slice(0, 3);
  let qh = "";
  if (rest.includes("--qh")) { const r = spawnSync("qh", ["orders"], {encoding: "utf8"}); qh = r.status === 0 ? r.stdout.split("\n").slice(0, 20).join("\n") : "qh not available (read-only lookup skipped)"; }
  const L = [`# Post-mortem ${film} (${date})`, "", `Total ${min(t1 - t0)} min (system clock, marks + file mtimes; labels ignored). Marks: ${marks.length}, files seen: ${files.length}.`, "", "## Minutes per phase", "| phase | min |", "|---|---|", ...Object.entries(phaseMinutes(marks)).map(([p, m]) => `| ${p} | ${m} |`), "", "## Idle gaps > 2 min", "| from | to | min | class | after phase |", "|---|---|---|---|---|", ...gaps.map((g) => `| ${hhmm(g.from)} | ${hhmm(g.to)} | ${g.min} | ${g.cls} | ${g.after} |`), "", "## Top 3 delays", ...top.map(([c, m], n) => `${n + 1}. ${c}: ${Math.round(m * 10) / 10} min (${FIX[c]?.[0] || c})`), "", "## Draft LESSONS-LEDGER lines (status proposed; assign real L-ids when merging)", ...top.map(([c, m]) => "`" + JSON.stringify({date, defect: `${c}: ${Math.round(m)} min lost in film ${film}`, evidence: `docs/motion/ledger/postmortem-${film}-${date}.md`, class: c === "render-capture" ? "accidental" : "systematic", root_cause: FIX[c]?.[1], layer_fixed: "skill", file_changed: "persian-arts/SKILL.md", check_added: FIX[c]?.[2], status: "proposed"}) + "`"), qh ? `\n## qh orders (read-only)\n${qh}` : ""];
  const out = join(ROOT, "docs/motion/ledger", `postmortem-${film}-${date}.md`);
  writeFileSync(out, L.join("\n") + "\n");
  console.log(L.slice(0, 40).join("\n") + "\nwritten " + out);
}
