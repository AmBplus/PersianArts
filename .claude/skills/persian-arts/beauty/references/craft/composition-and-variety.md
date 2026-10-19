# craft: composition and variety

Composition decides whether the frame is about something. Variety decides whether the film is watched past scene two.
Ids are `data/beauty-rules.csv`.

## 1. Grid and envelope

12 columns in 9:16, 16 columns in 16:9, 24px gutters, margins from the text envelope (9:16: 72px sides, 140px top,
180px bottom; 16:9: 96px sides, 64px top/bottom) — `BTY-COMP-001`, `BTY-TYPE-025`. Text sits on one 8px baseline grid
shared by every scene (`BTY-TYPE-026`). Mechanism: a stated grid is what lets two scenes be built at different times
and still align; without it, alignment becomes a per-scene accident.

## 2. Negative space is a form

Every deliberately empty region must be a *named form* — a diagonal, a wedge, a deliberate pool — never the leftover
remainder (`BTY-DEPTH-008`). No frame > 60% undifferentiated empty field (`BTY-DEPTH-009`). Mechanism: the eye assigns
meaning to a shape; unshaped emptiness reads as unfinished. Measured failures: s11 two scenes at ~90% and ~95% blank
cream, s08 a 40–45% dead floor in every frame, s12 empty top third and bottom quarter every frame
(`CRAFT-AUDIT.md` D7).

## 3. Symmetry vs tension

- Symmetry is the end-card register: it reads as considered, finished, screenshot-able. The best frame in the batch
  (s10 landscape end card) is a centred lockup (`CRAFT-AUDIT.md` D10).
- Tension is the storytelling register: hero off the grid axis, an occluder crossing a frame edge, a horizon line at
  an unexpected height. Use it in scenes that must move the story.
- The switch between them is a *composition* decision and therefore counts toward the variety rule below.

## 4. Rule-of-thirds for type

Place the copy rail on a column edge (or between columns) rather than dead-centre for scene copy; keep the display
claim and the end card on the axis. Mechanism: type on a column edge leaves a live negative-space field on the other
side, which the eye reads as depth; dead-centre type flattens the frame into a slide. Two live text blocks per region
maximum (`BTY-TYPE-024`), and one HUD/label anchor per film held for every scene and both ratios (`BTY-COMP-005`,
`BTY-MOTION-009`).

## 5. Hero scale

Hero ≥ 25% of frame height in 9:16 and ≥ 22% in 16:9 at the hero moment, measured on the text or the subject, never on
the largest decorative element (`BTY-COMP-002`). Mechanism: scale is how a film declares what it is about; the audit
found an 8%-of-frame-area prop in a vast dark wall (s10) — "we had one asset" (`CRAFT-AUDIT.md` D7). The old
`hero ≥ 12%` figure is a watermark, not a hero; the estimator that reported 41% on a decorative ring is why the
measurement is taken on text (`SKILL.md` rule 17i, L-123).

## 6. Per-beat variety: the four axes

No two **consecutive** scenes may share any of:

1. framing (wide / medium / macro / top-down),
2. background family,
3. entrance direction,
4. hero scale band.

0 shared values on any axis, ≥ 3 framing families per film (`BTY-COMP-003`); ≥ 3 distinct background families per film
(`BTY-DEPTH-010`). Mechanism: the audience learns a template by scene two and then predicts every subsequent frame,
at which point the film stops being watched. Measured: seven s10 frames share pillars, ceiling lamps, wall, floor grid,
light shaft and title position with only the small object changed; s09 repeats "grid field + centred notebook card +
title above + title below"; s11 repeats "paper field + logo top-left + headline stack" for its whole run
(`CRAFT-AUDIT.md` D8).

## 7. Avoiding three same-family cards in a row

The workbench-card lane composes cards from `work/persian/src/demos/**`; the equivalent defect is three consecutive
cards of the same visual family (`_cmp`-style repetition). Operational guard, on top of the four axes:

- Record each card's `visualStyle` and `beats` from `node work/persian/tools/cards/card-find.mjs --style <family>
  --beats <beat>`; refuse a candidate whose family matches the two preceding cards unless the film's stated arc wants
  the repetition (SKILL.md rule 18a/18c).
- Alternate the *kind* of image on screen: full-bleed world → isolated object → pure type → data/number → human/logo
  lockup. Three consecutive cards whose dominant element is the same kind (e.g. three centred headline cards) is the
  card-lane form of the template defect.
- One dominant idea per frame, supporting elements ≤ 2 (`BTY-COMP-006`); if two cards in a row both need the eye to do
  the same job, one of them is redundant.
- Deliberate repetition is legal once, as a rhyme (e.g. opening and closing card share a frame), and must be named in
  the treatment. Accidental repetition is the defect.

## 8. End card as its own artefact

Own grid, own y ladder, own safe area, built after the rest of the film; 0 text on text; screenshot-clean at 100%
(`BTY-COMP-007`). Model it on the batch's best frame: stroked hexagon mark + headline + subtitle + one signal CTA +
legal row + product, in a 3-step hierarchy (`BTY-COMP-008`, `_frames/s10-16x9/s10_19.80s.png`). Keep decorative bands,
stripes and ribbons out of legal/ISO rows (0 overlaps, region-checked) — the hazard band crossing the ISO row is the
defect inside the best frame (`BTY-COMP-009`, `CRAFT-AUDIT.md` D10). End card stays in the film's page-hue family and
on the one white token (`BTY-COLOR-009`).

## 9. Per-ratio composition

One per-ratio layout table, never a crop (`BTY-RATIO-001`); ≥ 5 changes for a genuine re-composition — horizon/floor
line (9:16 640/1230 vs 16:9 400/700), copy rail anchor (W−72 vs W−96), headline/display/numeral sizes, hero placement
(centre vs stage-left), end-card grid (one column vs two) (`BTY-RATIO-004`, `BTY-CAMERA-004`). Review the landscape cut
as its own film — ≥ 9 landscape stills looked at, end card at 100% (`BTY-RATIO-002`). Mechanism: a crop is instantly
readable as an afterthought, and in RTL it is worse because flipping the anchor edge changes where the eye starts
(`CRAFT-AUDIT.md` D9: courier pictogram cut by the bottom edge, text stack anchored far left leaving two-thirds empty).

## 10. Checklist hooks

`BTY-COMP-002` hero floor · `BTY-COMP-003`/`BTY-DEPTH-010` variety · `BTY-DEPTH-009` blank share · `BTY-COMP-005`
anchor · `BTY-COMP-007` end card. Mechanical backers in `tools/lint-film.mjs`: `X01` (declared-rectangle overlap
proxy), `D01` (token layer). The rest are still eyeball checks — see `checklists/pre-delivery.md`.
