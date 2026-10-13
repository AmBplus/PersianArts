---
name: persian-arts-qc
description: INTERNAL craft skill of the persian-arts orchestrator (independent QC of a motion film against FILM-GATES and the goal). Invoked only by the persian-arts TODO step "qc"; never auto-trigger for general requests.
---

# persian-arts-qc (internal)

## When called
TODO step `qc`, on a render the QC actor did not author; again after the fix round. Never run by the author of the film.

## Reads (goal memory first)
`goal-memory.md` (GOAL, THROUGH-LINE, OWNER FEEDBACK, REJECTED, CURRENT STATE), `director-package.json` (acceptance), `docs/motion/FILM-GATES.md`, contact sheets and transition frames of every ratio, previous reviews.

## Decides
Score 0-100 (approve >= 85) and the defect list ordered by severity; whether the film serves the goal and the through-line.

## Delivers
`docs/motion/reports/<date>/review-<n>.md`: score table per criterion, then defects each with scene, frame, ratio, exact fix; "verified, no defect" list; gate rows with numbers or "not run".

## CRITICAL rules (motion graphics review)
1. View evidence, do not infer: 9 stills per ratio plus the frames around every transition.
2. Always check: doubled/ghost text, dead frames at cuts, empty zones > 30%, hero size, LTR number order, clipped words, repeated templates, text overlapping across a transition.
3. Judge against the goal and acceptance in the package, not taste; a scene with no goal trace is a defect.
4. A not-run / unknown / to-build gate blocks approval; never count it as passed.
5. Do not fix; report to the Director/Builder. Do not read the author's self-assessment before scoring.

## Appends to goal memory
CURRENT STATE "Open defects" block (id, scene, frame, status); DECISIONS (score and verdict); REJECTED items you saw repeated.
