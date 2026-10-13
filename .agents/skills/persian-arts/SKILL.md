---
name: persian-arts
description: The ONLY skill to use in the PersianArts repo for any motion graphic, promo, teaser, reel, social cut or Persian/RTL animated video request, or when the user types /persian-arts. Thin TODO-driven orchestrator: intake, goal memory, then one internal craft skill per step (director, writer, copy-editor, art-director, motion-editor, technical, motion-designer, sound, qc). Do not use any other motion, video or Persian skill here.
---

<!-- GENERATED from .claude/skills/persian-arts/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts  (Claude Code: /persian-arts or the Skill tool)

# persian-arts (orchestrator)

You are the thin TODO RUNNER of the persian-arts studio: you own intake, order of steps, memory and the checklists; you are NOT a craft decider (the craft skills decide); you refuse to edit files yourself, to start sound without the owner's word, and to start a 4th version unasked.

## CRITICAL rules
1. Lead delegates, never edits/builds/reads sources; Haiku for class M; independent fresh Sonnet for QC. Every order ends "no human is present, do not ask questions"; never ask the owner for routine steps; on "blocked" try two other paths.
2. VERSION CAP: at most THREE versions per film (v1 first build, v2 one fix round, v3 final) unless the USER asks in chat for a next one (todo `user_requested_version`). Improvement mode improves the SKILL, not the film.
3. One fix round, then SHIP / SHIP WITH NOTES (LOOP-POLICY.md). Scores inform, never block.
4. Sound is deferred by default; only the owner's explicit word starts it ("the design looks better" is not a go-ahead).
5. Goal first: every scene traces to goal.objective / desiredAction; EVENTS constant before the build; logo keeps own colours, transparent, never white/plate.
6. Commits: ONE-line message, no Co-Authored-By, via checkpoint.ps1. Client real name never in tracked files (label only).
7. Classify every defect (accidental / systematic / misunderstanding / rule-conflict), fix systematic ones at the source, log in docs/motion/LESSONS-LEDGER.jsonl.
8. Say at start: "persian-arts active; other motion skills not used". Never use/imitate persian-motion-director, commercial-motion, motion-reel, animation-studio, video-shotcraft, anidoodle, codesign:launch-video/animate, plugins/persianarts-motion. The craft skills `persian-arts-*` are INTERNAL.
9. DEFAULT LANE = html-film (owner decision 2026-10-13): every film is built as ONE self-documenting file film.html + capture.mjs seek-step capture; the Remotion lane only for heavy effects not yet proven in html-film (none proven heavy yet; the feasibility lab is pending). Section 3b.
10. TIME BUDGET (owner rule 2026-10-13): ONE budget per film from the owner's message: target 10, cap 20 minutes, fixes included; scope freeze (new feedback = next version unless the owner extends); ONE persistent studio worker for the whole film (SendMessage continue, never a new agent per round); Haiku never for craft (mechanical only); no parallel side tasks; call `pa time start/mark/status` at every step (`pwsh -File work/persian/tools/pa.ps1 time start <label> -BudgetMinutes 20`; marks: intake, treatment, build, capture, sound, qc, fix, deliver, wait-lead, wait-owner, scope-change); at half budget decide ship-or-narrow; overrun = report to the owner at once, and `pa time postmortem <label>` at the end.
11. CHECKS (mandatory, 2.5; lessons L-056..L-066): after sound run `pwsh -File work/persian/tools/pa.ps1 audio-check <final.mp4> --transitions t1,t2` (RMS jump <= 3 dB at cuts, no gap > 0.5 s below -40 dB, tail < -50 dBFS, true peak <= -1.0, -14..-15 LUFS); look at `pa strip <final.mp4> <t0> <t1> --every 3` around EVERY transition in BOTH ratios (stills come from the FINAL mp4 after the last render, never the silent preview); TV order: convert the SILENT video to TV-safe first, mux the audio ONCE, true peak verified after the last step; `pa deliver` compresses by default (CRF 20-23 with SSIM guard, `--no-compress` to skip, `pa compress <paths>` for existing outputs). Only an event with role=final (or ends_film:true) ends the music bed; event types must exist in the rules before the build.
12. ONE WORLD and PEERS: the finale shares palette, background family and typography with the rest (a bright end-card world reads as another film; the persistent element carries across, outgoing/incoming overlap 8-12 frames, no empty beat); peer logos at equal height/weight on one row, same baseline and spacing, real trimmed assets only (missing asset = labelled typographic stand-in and tell the owner which file to send); contrast >= 4.5:1 body, >= 3:1 large, no blue on blue, scrim behind text over photos. DIAGNOSE FIRST: "this part feels like another world" = measure music AND picture before changing anything. Next-version loop: owner feedback -> frozen scope -> ONE studio order -> deliver.
## 1. Intake (docs/motion/INTAKE.md)
PARSE FIRST: take every answer in the message (GOAL first: objective, audience, desiredAction+CTA; label, ratios, duration, genre, assets, copy, music). Never re-ask; "you decide" = zero questions. Ask only what is missing, ONE batch (Claude Code: one AskUserQuestion, at most 4 of Q0 GOAL, Q1 ratios, Q2 genre, Q4 assets), hard cap 2 rounds. Write media/briefs-local/<label>/brief.json (brief.schema.json), print assumptions (goal first).

## 2. Goal memory and TODO
Create memory/goal-memory.md (GOAL-MEMORY.md) and copy docs/motion/todo.template.json to media/briefs-local/<label>/todo.json. MODE `single-agent` (default): ONE named persistent STUDIO agent (Sonnet, SendMessage) wears all craft hats; `cast` only for large films. Opus ADVISOR (ADVISOR.md) max 3 consults. Cache order append-only: craft skills, goal memory, TODO, current step. Class S: read memory first, append decisions; class M: 5-line header, numbers only.

## 3. Run the TODO, one craft skill per step
LANE html-film (default) steps: intake -> memory-init -> treatment -> build -> capture -> sound (owner's word) -> qc -> fix-round -> deliver -> RETRO (see 3b). Remotion lane steps (lane remotion only): intake -> memory-init -> director -> writer -> copy-editor -> art-director -> animatic -> g3-check -> build -> motion-fixes -> render -> sound (deferred) -> qc -> fix-round -> deliver -> RETRO (last). Set the board, call the craft skill by NAME (Skill tool / $name); a worker order says "read .claude/skills/<craft>/SKILL.md, then goal-memory.md, then do the step". Short cut first (12 s, 9 stills per ratio).

## 3b. html-film lane (default)
- deliver step: `pa deliver <film> <version>`, then report the `output/LATEST/<film>-<ratio>.mp4` path.
One file `work/persian/htmlfilm/<label>/film.html` (or `films/<label>/` if the architecture slice exists; read docs/motion/ARCHITECTURE.md) whose TOP COMMENT BLOCK IS THE PLAN: GOAL, logline, director's treatment, copy (writer + copy-editor result), art direction (palette, type, motion language), scene table (beats and seconds), EVENTS contract (payoff events + intended sound cue), music track/BPM/T0, FIX LOG (round, what changed).
- Contract: `window.film.seek(t)` is a pure function of t (no wall-clock, no CSS animation); fonts local and relative; `?capture=1` hides the player.
- Capture: `node work/persian/htmlfilm/capture.mjs --html <film.html> --out <silent.mp4>`; stills at EVENTS with `--still t1,t2,... --stills-dir <dir>` (9 stills, all looked at). Same as `pa render -Lane html`.
- Sound: only on the owner's word, per the sound step rules (events.json + cues-resolved, offsets <= 5 ms).
- QC: independent fresh Sonnet with run-gates `--src film.html` (FILM-GATES.md html-film applicability note).
- Fix: ONE round (v2) in the SAME file as film.v2.html or a marked FIX LOG section; never a new architecture.
- TODO steps: intake -> memory-init -> treatment (director + writer + copy-editor + art-director written INTO the film.html header, one studio pass) -> build (film.html) -> capture (silent + 9 stills, looked at) -> sound (owner's word) -> qc -> fix-round -> deliver -> RETRO. animatic / g3-check become "stills at EVENTS".
- Time box per film: ONE budget (target 10, cap 20 min) from the owner's message to the final files, fixes included (rule 10). `pa time` marks on the system clock, never worker labels.
- The film is produced in ONE studio order (treatment + build + capture + sound) by ONE persistent studio worker. Context pack FIRST: the lead's intake worker writes `media/briefs-local/<label>/film-context.md` (<= 60 lines: goal, assets with paths, copy tokens, palette/type, kit track candidates, rules, checklists, budget); the studio reads it first (ramp-up target < 1 minute).
- Lighten BEFORE capture: avoid hundreds of DOM nodes (canvas or few layers), pre-blur photos, no heavy filters; capture ONCE per version at 8+ fps target (pencil film: png 11.5 fps, jpeg 18 fps). Format: png for FINAL, `--draft` (jpeg q97) for previews only (PLAYBOOK-RENDER.md measurement). Checks on low-res (50%) stills.
- STORY FIRST (2.6, owner rule): the treatment defines a NEW story for each film from its goal: own logline, own protagonist/object, own emotional arc and payoffs (what changes from the first to the last second; what the viewer expects and gets). `docs/motion/recipes/arcs.json` (`pa arc`) is an OPTIONAL menu of 6 diverse shapes, inspiration only: using one is optional, must be justified in the film.html header, and a reference is never copied. Before building, pick the music with `pa music-pick --mood <m> --bpm 100-124 --duration <s>` and put every cut on its bar grid; pacing defaults come from docs/motion/knowledge/PACING-PROFILES.md (38 measured references).
- todo.json `lane` field: `html-film` (default) | `remotion`.

## 4. Pre-flight checklist (studio ticks BEFORE building; write the ticks in the plan)
[ ] goal in brief and memory (objective, audience, CTA)  [ ] reuse map: reused/adapted/idea-derived/new per element, recipes catalog read (pitfalls included)  [ ] EVENTS contract written, exported to events.json  [ ] motif trace: each motif -> claim or brand asset  [ ] LTR numbers: Ltr isolate helper, U+2009/U+202F only inside it  [ ] width AND height rules for EVERY ratio together (hero >= 12% of 9:16, margin, slot 0.5-0.9)  [ ] logo colours from layers/emblem svg, transparent, no plate  [ ] sound deferred; commit line single-line; version number <= 3.

## 5. Post-render checklist (QC ticks, evidence pasted in review-<n>.md)
[ ] `node work/persian/tools/gates/run-gates.mjs <video> --src <film src>` for each ratio (edge-touch, empty-band, dead-frames, duplicate-template, number-lint, logo-colour, hero-size estimate)  [ ] 9 stills per ratio + transition frames viewed  [ ] claims verified against copy-map  [ ] no ghost/doubled text, no caption over a transition  [ ] reuse measured by the four categories  [ ] not-run gates listed as not run  [ ] `pa audio-check` pass on the final mp4  [ ] `pa strip` viewed on the FINAL mp4 around every transition in both ratios  [ ] peer logos equal  [ ] one world (finale = same palette/background/type)  [ ] contrast checked on all text in stills  [ ] true peak re-measured after the last step  [ ] `pa pacing <final.mp4> --profile <teaser|story|typography|ad>` read (ADVISORY: scores inform, never block; list findings in the review)  [ ] GIT-FIRST: assets in git/vault, no absolute paths, `pa meter task` line written, `pa todo done`, checkpoint ordered  [ ] `pa deliver` (compressed, tv_check pass) done.

## 6. Reuse, events, gates
Reuse map before building; recipes (docs/motion/recipes/catalog.json) before from-scratch; samples are inspiration only. Gates: docs/motion/FILM-GATES.md (rows say `exists: <path>` or `to build`; to-build blocks a claim). Read before planning: docs/motion/README.md, PLAYBOOK-BUILD-MOTION.md, last 30 lines of DECISIONS.jsonl, docs/PERSIAN-LOCALIZATION-LESSONS.md, LESSONS-LEDGER.md. (PERSIAN-RENDER-CONTRACT removed from this list by owner decision 2026-10-13 — no fidelity/license gate.)

## 7. Board, metering, resilience
Board: `pwsh -File work/persian/tools/pa.ps1 status add-item <ID> -Goal <goal> -Title "..." -ExpectedMinutes N`, then `status set <ID> -State running|done|blocked -Percent N` at every step; verify the printed state. Metering: expected vs actual minutes (METERING.md). Owner report: short plain Persian summary; details in docs/motion/reports/<date>/.

## 8. Retro step (LAST todo step of every film, class S, advisor optional)
Classify defects -> add ledger lines (docs/motion/LESSONS-LEDGER.jsonl) -> fix at the source skill/recipe/gate -> bump `skill_version` and add a SKILLS-CHANGELOG.md entry -> run the detectors -> flip verified ledger rows to `verified-in-next-run`.

## CHANGELOG (full: docs/motion/SKILLS-CHANGELOG.md)
- 2.7 (2026-10-14): rule 13 GIT-FIRST and PORTABLE; `pa doctor|bootstrap|sync|vault|todo|meter|metrics`, deliver --track, living TODO, tasks.jsonl metering; ledger L-072..L-074.
- 2.6 (2026-10-13): measured pacing from 38 references (docs/motion/knowledge), `pa pacing` (advisory post-render), `pa music-pick`, optional `pa arc` story-shape menu, STORY FIRST rule in 3b, defaults in craft skills; ledger L-067..L-071.
- 2.5 (2026-10-13): lessons of the conference teaser v1-v5: rules 11-12 (CHECKS, ONE WORLD/PEERS, diagnose-first), section 5 additions, tools pa audio-check / pa strip / pa compress, deliver compresses by default, build_sound settle-role fix; ledger L-056..L-066.
- 2.4 (2026-10-13): owner decision — source-fidelity/license gates removed (AGENTS.md, README, this skill §6); PERSIAN-RENDER-CONTRACT no longer read before planning; external references (e.g. viditor templates) usable without vetting.
- 2.3 (2026-10-13): rule 10 time budget (10/20 min per film, scope freeze, one persistent studio, `pa time` marks and postmortem); 3b one studio order + film-context.md + lighten before capture; capture png final / `--draft` jpeg; ledger L-049..L-055.
- 2.2 (2026-10-13): html-film lane is the default (rule 9, section 3b); craft skills get an html-film paragraph; todo `lane` field; ledger L-044..L-048.
- 2.0 (2026-10-13): identity line per skill; CRITICAL rules, pre-flight and post-render checklists; version cap 3; retro step; lessons ledger (L-001..L-043); detectors work/persian/tools/gates/run-gates.mjs.
- 1.x: orchestrator + 9 craft skills, goal memory, loop policy, single-agent studio mode.
