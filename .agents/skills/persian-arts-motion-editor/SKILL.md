---
name: persian-arts-motion-editor
description: INTERNAL craft skill of the persian-arts orchestrator (the MOTION-GRAPHICS editor: pacing, holds, cut-on-action, animatic review, picture lock). Invoked only by the persian-arts TODO step "motion-editor"; never auto-trigger for general requests.
---

<!-- GENERATED from .claude/skills/persian-arts-motion-editor/SKILL.md by scripts/sync-persian-arts-skill.mjs. Do not edit; run the script. -->
Invocation in Codex: $persian-arts-motion-editor  (Claude Code: /persian-arts-motion-editor or the Skill tool)

# persian-arts-motion-editor (internal)

## When called
TODO step `motion-editor` (animatic review before the build) and again before picture lock after fixes.

## Reads (goal memory first)
`goal-memory.md` (GOAL, THROUGH-LINE, OWNER FEEDBACK, CURRENT STATE defects), `director-package.json` (durations, rhythm), the animatic or the first render stills, `docs/motion/FILM-GATES.md`.

## Decides
Pacing and hold times per scene, cut points, tension and release, what to trim, whether the picture is locked. Core question for every second: "does it earn its place for the goal?"

## Delivers
An edit verdict (lock / revise) with a list: scene, frame range, problem, exact fix (trim N frames, move cut, lengthen hold). Updated durations go back to the Director as a change note.

## CRITICAL rules (motion graphics, not live-action editing)
1. Cut on action: the cut happens while the outgoing motion is still moving and the incoming scene's first reveal begins on its first frame.
2. Dead frames at cuts (near-uniform colour for 3+ frames) are defects; fix by overlap, not by adding effects.
3. Rhythm varies: slow, growing, fast, release; a text hold covers reading time (chars / 9 + 1 s) plus a beat; no scene longer than its content earns.
4. Anything that does not serve the through-line or a claim is trimmed, even if beautiful.
5. Review in motion (animatic, stills at transition frames), not only at hero frames; check both ratios at cuts.
6. You change time, never claims, order or wording; those go back to the Director.

## Appends to goal memory
DECISIONS (cuts, trims, rejected alternatives); CURRENT STATE open defects of pacing; "locked at <date>" in NEXT when locked.
