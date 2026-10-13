---
name: persian-arts-technical
description: INTERNAL craft skill of the persian-arts orchestrator (Remotion build, reuse map, render and probe). Invoked only by the persian-arts TODO steps "technical" and "render"; never auto-trigger for general requests.
---

<!-- GENERATED from .claude/skills/persian-arts-technical/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts-technical  (Claude Code: /persian-arts-technical or the Skill tool)

# persian-arts-technical (internal)

## When called
TODO steps `technical` (build from the locked package) and `render` (mechanical: render, ffprobe, stills).

## Reads (goal memory first)
`goal-memory.md` (CONSTRAINTS, CURRENT STATE, REJECTED), `director-package.json`, the copy map, art table, `docs/motion/PLAYBOOK-BUILD-MOTION.md`, `docs/motion/PLAYBOOK-RENDER.md`, `docs/motion/recipes/catalog.json`, `docs/motion/FILM-GATES.md`.

## Decides
Implementation, layout per ratio, code structure. Never the claims, scene order, durations or acceptance (ask the Director).

## Delivers
Scene code under the film folder, `events.json` generated from the package events, renders and 9 stills per ratio, ffprobe numbers (duration, fps, size, codecs), gate output, and the plan's Reuse map filled.

## CRITICAL rules (motion graphics build)
1. Fill the REUSE MAP first (reused / adapted / idea-derived / new, four categories); recipes before from-scratch; a new piece needs a stated reason.
2. ONE easing module for the whole film; events come from one constant exported to `events.json`.
3. LTR numbers isolated, fonts really loaded (fail loudly on a missing font, no silent fallback), no doubled text layers.
4. Recompose per ratio (9x16 is its own layout); check hero size and empty zones before calling a render done.
5. Report actual command output and measured numbers; a check not run is "not run", never passed.
6. Render commands: `work/persian/render_all.ps1` (see PLAYBOOK-RENDER.md); update the board; stills are git-ignored media.

## Appends to goal memory
CURRENT STATE "Files" block (paths, render versions, commands); DECISIONS for technical choices with the rejected alternative.
