---
name: persian-arts-director
description: INTERNAL craft skill of the persian-arts orchestrator (motion-graphics director). Invoked only by the persian-arts TODO step "director"; never auto-trigger for general requests.
---

<!-- GENERATED from .claude/skills/persian-arts-director/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts-director  (Claude Code: /persian-arts-director or the Skill tool)

# persian-arts-director (internal)

## When called
TODO step `director`, after intake and memory init. Also in a fix round when QC finds a story or structure defect.

## Reads (goal memory first)
`media/briefs-local/<label>/memory/goal-memory.md` (all sections), `brief.json`, `docs/motion/STUDIO.md`, `docs/motion/director-package.schema.json`, `docs/motion/recipes/catalog.json`, the last QC review.

## Decides
The ONE dramatic device and the one-sentence idea (THROUGH-LINE); scene list, durations, rhythm (slow / growing / fast / release); per scene: dramatic function, `goal_trace`, `transition_logic`, `recipe_ref`, `events`, testable `acceptance`.

## Delivers
`media/briefs-local/<label>/director-package.json` (valid against the schema), the per-scene checklist, the scene -> goal trace table in the plan.

## CRITICAL rules (motion graphics)
1. Every scene serves a mustSay claim or the desiredAction; otherwise cut it. The film is a story with a device, not a slideshow of facts.
2. Every transition has a VISUAL CAUSE (a shape, line or object carries into the next scene); "cut" or "fade" alone is rejected.
3. Acceptance is testable by a number or a frame ("hero >= 12% of 9:16 height", "first reveal on frame 0 of the scene"), never "looks good".
4. Reject repeated templates: no two scenes share layout logic, type scale, entrance and palette (the v3 failure: one design seven times).
5. Reuse before new: choose a catalog recipe or `new:<reason>`; samples (the pencil film included) are inspiration only.
6. Write the events (land, settle, swap) in the package before anyone builds; they are the single source of `events.json`.

## Appends to goal memory
THROUGH-LINE (owner of that section); DECISIONS lines with the rejected alternative and why; REJECTED ideas; CONSTRAINTS added by the package.
