---
name: persian-arts
description: The ONLY skill to use in the PersianArts repo for any motion graphic, promo, teaser, reel, social cut or Persian/RTL animated video request, or when the user types /persian-arts. Thin TODO-driven orchestrator: intake, goal memory, then one internal craft skill per step (director, writer, copy-editor, art-director, motion-editor, technical, motion-designer, sound, qc). Do not use any other motion, video or Persian skill here.
skill_version: 2.0
---

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

## 1. Intake (docs/motion/INTAKE.md)
PARSE FIRST: take every answer in the message (GOAL first: objective, audience, desiredAction+CTA; label, ratios, duration, genre, assets, copy, music). Never re-ask; "you decide" = zero questions. Ask only what is missing, ONE batch (Claude Code: one AskUserQuestion, at most 4 of Q0 GOAL, Q1 ratios, Q2 genre, Q4 assets), hard cap 2 rounds. Write media/briefs-local/<label>/brief.json (brief.schema.json), print assumptions (goal first).

## 2. Goal memory and TODO
Create memory/goal-memory.md (GOAL-MEMORY.md) and copy docs/motion/todo.template.json to media/briefs-local/<label>/todo.json. MODE `single-agent` (default): ONE named persistent STUDIO agent (Sonnet, SendMessage) wears all craft hats; `cast` only for large films. Opus ADVISOR (ADVISOR.md) max 3 consults. Cache order append-only: craft skills, goal memory, TODO, current step. Class S: read memory first, append decisions; class M: 5-line header, numbers only.

## 3. Run the TODO, one craft skill per step
Steps: intake -> memory-init -> director -> writer -> copy-editor -> art-director -> animatic -> g3-check -> build -> motion-fixes -> render -> sound (deferred) -> qc -> fix-round -> deliver -> RETRO (last). Set the board, call the craft skill by NAME (Skill tool / $name); a worker order says "read .claude/skills/<craft>/SKILL.md, then goal-memory.md, then do the step". Short cut first (12 s, 9 stills per ratio).

## 4. Pre-flight checklist (studio ticks BEFORE building; write the ticks in the plan)
[ ] goal in brief and memory (objective, audience, CTA)  [ ] reuse map: reused/adapted/idea-derived/new per element, recipes catalog read (pitfalls included)  [ ] EVENTS contract written, exported to events.json  [ ] motif trace: each motif -> claim or brand asset  [ ] LTR numbers: Ltr isolate helper, U+2009/U+202F only inside it  [ ] width AND height rules for EVERY ratio together (hero >= 12% of 9:16, margin, slot 0.5-0.9)  [ ] logo colours from layers/emblem svg, transparent, no plate  [ ] sound deferred; commit line single-line; version number <= 3.

## 5. Post-render checklist (QC ticks, evidence pasted in review-<n>.md)
[ ] `node work/persian/tools/gates/run-gates.mjs <video> --src <film src>` for each ratio (edge-touch, empty-band, dead-frames, duplicate-template, number-lint, logo-colour, hero-size estimate)  [ ] 9 stills per ratio + transition frames viewed  [ ] claims verified against copy-map  [ ] no ghost/doubled text, no caption over a transition  [ ] reuse measured by the four categories  [ ] not-run gates listed as not run.

## 6. Reuse, events, gates
Reuse map before building; recipes (docs/motion/recipes/catalog.json) before from-scratch; samples are inspiration only. Gates: docs/motion/FILM-GATES.md (rows say `exists: <path>` or `to build`; to-build blocks a claim). Read before planning: docs/motion/README.md, PLAYBOOK-BUILD-MOTION.md, last 30 lines of DECISIONS.jsonl, docs/PERSIAN-LOCALIZATION-LESSONS.md, PERSIAN-RENDER-CONTRACT.md, LESSONS-LEDGER.md.

## 7. Board, metering, resilience
Board: `pwsh -File work/persian/tools/pa.ps1 status add-item <ID> -Goal <goal> -Title "..." -ExpectedMinutes N`, then `status set <ID> -State running|done|blocked -Percent N` at every step; verify the printed state. Metering: expected vs actual minutes (METERING.md). Owner report: short plain Persian summary; details in docs/motion/reports/<date>/.

## 8. Retro step (LAST todo step of every film, class S, advisor optional)
Classify defects -> add ledger lines (docs/motion/LESSONS-LEDGER.jsonl) -> fix at the source skill/recipe/gate -> bump `skill_version` and add a SKILLS-CHANGELOG.md entry -> run the detectors -> flip verified ledger rows to `verified-in-next-run`.

## CHANGELOG (full: docs/motion/SKILLS-CHANGELOG.md)
- 2.0 (2026-10-13): identity line per skill; CRITICAL rules, pre-flight and post-render checklists; version cap 3; retro step; lessons ledger (L-001..L-043); detectors work/persian/tools/gates/run-gates.mjs.
- 1.x: orchestrator + 9 craft skills, goal memory, loop policy, single-agent studio mode.
