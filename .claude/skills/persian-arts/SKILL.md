---
name: persian-arts
description: The ONLY skill to use in the PersianArts repo for any motion graphic, promo, teaser, reel, social cut or Persian/RTL animated video request, or when the user types /persian-arts. Thin TODO-driven orchestrator: intake, goal memory, then one internal craft skill per step (director, writer, copy-editor, art-director, motion-editor, technical, motion-designer, sound, qc). Do not use any other motion, video or Persian skill here.
---

# persian-arts (orchestrator)

## 0. Exclusivity and skill policy
State at the start: "persian-arts active; other motion skills not used". Do NOT use or imitate as workflow: persian-motion-director, commercial-motion, motion-reel, animation-studio, video-shotcraft, anidoodle, codesign:launch-video, codesign:animate, any "director" skill, or the old plugins/persianarts-motion kitchen skill. If one was loaded, say so, stop, restart here. Files under skills/anidoodle may be reused as source code only. The craft skills `persian-arts-*` are INTERNAL: only this orchestrator calls them.

## 1. Intake (docs/motion/INTAKE.md)
- PARSE FIRST: take every answer already in the message (GOAL first: objective, audience, desiredAction+CTA; then label, ratios, duration, genre, character, assets, ideas, copy, music, deadline). Never re-ask. A delegation phrase ("خودت تصمیم بگیر", "you decide") = zero questions.
- Ask only what is missing, in the user's language, ONE batch (Claude Code: one AskUserQuestion with at most 4 of Q0 GOAL, Q1 ratios, Q2 genre, Q4 assets; Codex: the INTAKE.md section 4 form). Batch 2 only if logo/images ticked. Hard cap 2 rounds; missing files = placeholders.
- Write media/briefs-local/<label>/brief.json (docs/motion/brief.schema.json), print the assumptions block (goal first), proceed. LABEL only in tracked files, never the client's real name. Drafted copy is "not reviewed by a native reader".

## 2. Goal memory and TODO (the spine)
- Right after the brief: create media/briefs-local/<label>/memory/goal-memory.md (docs/motion/GOAL-MEMORY.md, template goal-memory.template.md) and copy docs/motion/todo.template.json to media/briefs-local/<label>/todo.json (set label, time boxes, mode).
- MODE (todo field `mode`): `single-agent` is the DEFAULT: ONE named persistent STUDIO agent (Sonnet, continued with SendMessage) wears all craft hats by reading the craft skills in sequence; `cast` (Director / Builder / QC) only for large films. Around the studio agent: QC = independent fresh Sonnet; HAIKU for class M jobs (render, probe, copy, status, git via script), numbers only; an OPUS ADVISOR on call (docs/motion/ADVISOR.md; at most 3 consults per film; only at concept lock, after two failed fix rounds, or a brand/taste/claim-risk call; steps carry `advisor: optional|none`).
- CACHE ORDER, append-only: craft skills first, then goal memory, then the TODO, then the current step. Never rewrite earlier material; append.
- Class S (semantic) steps: the agent reads the memory first and appends its decisions after. Class M (mechanical): 5-line context header only, returns numbers, never writes the memory.

## 3. Run the TODO, one craft skill per step
Steps (30 s film): intake -> memory-init -> director -> writer -> copy-editor -> art-director (styleframes) -> animatic (motion-editor) -> g3-check (M) -> build (technical) -> motion-fixes (motion-designer) -> render (M) -> sound (S; deferred if the owner says) -> qc (independent) -> fix-round -> deliver (M).
- As each step starts: set the board, then call the craft skill by NAME (Claude Code: the Skill tool; Codex: $name). When delegating to a worker agent, the order says: "read .claude/skills/<craft>/SKILL.md first, then goal-memory.md, then do the step".
- Each step has inputs, outputs, a gate and a time box (todo.json). Gate failed = fix round, not a waiver. Short cut first: films run the 12 s cut with 9 stills per ratio and one fix round before the full cut.
- GOAL RULE: every plan, scene and review traces to goal.objective and goal.desiredAction; a scene serving neither is cut. The plan (docs/motion/plans/TEMPLATE.md, see plans/README.md) opens with the Goal and a Scene -> goal trace table.

## 4. Reuse map (four categories)
Fill before building: needed element -> existing component path -> exactly one of reused / adapted / idea-derived (names source path and idea; counts as reuse) / new (names files checked and a reason). Recipes (docs/motion/recipes/catalog.json) before from-scratch. Samples, the pencil film included, are inspiration only. Shared helpers (easing etc.) live in ONE module.

## 5. Events contract, sound, gates
- EVENTS constant (named events with times) written before the build, used by the animation AND exported to events.json.
- Sound: one recorded track on the beat grid; SFX from events.json; verified on the FINAL mix (PLAYBOOK-SOUND.md).
- Film gates (docs/motion/FILM-GATES.md): digits LTR, hero >= 12% of 9:16 height, empty zones <= 30%, beat error <= 15 ms, SFX within 1 frame, -14 LUFS / TP <= -1. Any not-run / unknown / to-build check blocks the claim.
- Read before planning: docs/motion/README.md, PLAYBOOK-BUILD-MOTION.md, last 30 lines of DECISIONS.jsonl, docs/PERSIAN-LOCALIZATION-LESSONS.md, docs/PERSIAN-RENDER-CONTRACT.md. Record findings in DECISIONS.jsonl and the plan log.

## 6. Roles (brain and hands, CLAUDE.md)
The lead orders, judges reports, talks to the owner; it never edits files, runs builds or reads sources, and never edits the goal memory (a Haiku scribe applies reports). Workers implement; an independent Sonnet QC judges (approve at 85+). Every order: goal, context paths (goal memory first), constraints, deliverables, report path, acceptance (cite FILM-GATES.md and the stage), time box, "no human is present, do not ask questions". Owner report: a short plain Persian summary; details in docs/motion/reports/<date>/.

## 7. Board, metering, resilience
- Board: `pwsh -File work/persian/tools/pa.ps1 status add-item <ID> -Goal <goal> -Title "..." -ExpectedMinutes N`, then `status set <ID> -State running|done|blocked -Percent N -Note "..."` at every step (named -State; verify the printed state). STATUS-PROTOCOL.md.
- Metering: expected minutes per step, actual recorded (METERING.md, METRICS.md). Reports say done / not done / measured time. No excuses.
- Resilience: if a path fails, try at least two other reasonable paths before a blocker; the report names the paths tried.
