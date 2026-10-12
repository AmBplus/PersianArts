# Stage 6 — Review (the maker never approves its own film)

## 6a. Technical gate (blocking)

`pa validate`, `lint_fa.py` on film.json, brief.json, direction.md and scenes/ (0 ERROR), `pa fit-check` (0 overflow), contrast ≥ 4.5, ≤ 2 font families,
`pa check-sync` (≤ 3 f), loudness in range, duration within ±5 % of the brief.

## 6b. Critique loop (minimum 2 rounds, maximum 4)

Stop after round 2 or later as soon as the average is ≥ 8 and no criterion is < 7. After round 4, stop anyway
and list the remaining weaknesses honestly in the report. Quick piece: 1 round.

Render the contact sheet and a strip of frames around every transition. Score 1–10:

1. Hierarchy — one hero per frame, the eye knows where to go
2. Direction fidelity — every frame carries the design read and the theme
3. Scene distinctness — no consecutive scenes share primary subject or layout; no hero-device spine
4. Rhythm — energy curve, holds long enough to read, motion with meaning
5. Music fit — cuts and hits on the grid; sound supports, never patches
6. Persian quality — joins, dots, direction, digits, natural copy
7. Space and legibility — breathing room, safe areas, sizes readable on the target screen
8. Distinctness — could this film belong to any other topic after swapping the words? (yes ⇒ ≤ 4)

Each round: fix the three lowest, re-render the affected stills, re-score. Write `review/round-N.json`
(schema `schemas/review.schema.json`, `"reviewer": "self"`).

## 6c. Independent reviewer

Spawn a fresh subagent (a different model from the maker when possible) with only: `brief.json`,
`direction.md`, the contact sheet, transition strips, `film.json`, and `references/stages/reviewer-brief.md` (pass its text as the reviewer prompt). Not your reasoning.
It returns scores, frame-cited findings (critical / suggestion) and a verdict. Fix every critical finding; if
you disagree, write why in `review/independent.json`. Two independent rounds maximum.
