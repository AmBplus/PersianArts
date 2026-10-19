# craft: motion and easing

Motion is the second thing the eye judges after value structure, and the first thing it judges as *cheap*. Cheap motion
= one easing, one duration, everything at once, nothing settling. Ids are `data/beauty-rules.csv`; recipes with real
code and timings are `BTY-REC-001` … `BTY-REC-060` in `data/recipes.csv`.

## 1. Easing vocabulary (name the job, not the curve)

| job | easing | band | mechanism |
|---|---|---|---|
| enter | `outCubic` | 0.35–0.55s | fast in, decelerating; reads as an object arriving under its own momentum |
| reveal / wipe / mask | `outExpo` | 0.5–0.9s | long tail; the eye finishes reading while the last 10% settles |
| settle | `outBack` | 0.3–0.45s | small overshoot past the target then back; reads as contact with a surface |
| impact / mass | `spring(t,k,d)` | 0.6–1.2s, d 0.35–0.6 | damped oscillation; the only curve that reads as weight |
| ambient drift / camera idle | `inOutSine` | 2–6s | symmetric, no accel at either end; reads as air, not as an event |
| constant-rate scrub | linear | — | legal ONLY for a scrub (route draw), never an entrance |

`BTY-MOTION-001` (≥ 2 named easings per film, each with a named job), `BTY-MOTION-002` (0 linear entrances).
Measured reality in the audit: s09 called `ease.` 7 times in 475 lines, s12 3 times in 261 lines, `spring` **zero**
times in s09 (`CRAFT-AUDIT.md` root-cause table). That is not a motion language.

## 2. Why linear reads cheap

Linear has no acceleration, so it carries no information about mass, friction or intent — the eye reads it as a
machine move, i.e. as a slideshow transition. Every real arrival decelerates; every real departure accelerates. The
runtime already ships `outCubic`, `inCubic`, `inOutSine`, `outBack`, `outExpo` and a damped spring
(`work/persian/htmlfilm/lib/pa-motion.js:8-13`, quoted in `CRAFT-AUDIT.md`).

## 3. Springs and mass

- Settle heavy props with the closed-form spring, never integration: `ease.spring(t,k,d)`, k≈95, d≈0.42 ≈ 89% arrived
  at 0.2s, v clamped to [0,1.25] (`BTY-MOTION-006`). Mechanism: a closed form is pure in `t`, so capture and QA stills
  stay reproducible.
- Never animate a spring arrival by scaling the prop from zero, and never let the settle make it invisible:
  `sy = 1 - 0.10*(1-v)`, roll a few degrees, 6–10px anti offset (`BTY-MOTION-007`). Mechanism: scaling from 0 pops the
  object into existence and destroys mass; the "breathe" band keeps it visible.
- Heavy props land **after** the light and atmosphere settle; light props lead with `outExpo` (`BTY-MOTION-010`).
  Mechanism: ordering by mass is what makes a scene read as physical.

## 4. Anticipation, overshoot, settle, secondary action

- Anticipation before every fast move: 3–8px **against** the direction for 80–150ms (`BTY-MOTION-003`). Mechanism:
  it tells the viewer which way the mass is about to go before it goes.
- Secondary action is mandatory on anything that moves: follow-through (a trailing element lags 60–120ms), overlap,
  and a settle after the stop (`BTY-MOTION-004`). Mechanism: a rigid object with nothing following it is unfished;
  the audit lists secondary action as one of the five mandatory premium techniques
  (`ART-DIRECTION-STANDARD.md` §6.4).
- For a lagging chain use `lib/pa-chain.js` (integrate wind to a phase) — named in `SKILL.md` 2.11 as the
  follow-through lib.
- Symmetric guards: scaleX stretch ≤ 4% (`BTY-TYPE-023`); settle bands around 1.0, never 0.

## 5. Stagger

Grouped elements enter 60–90ms apart, never simultaneously; per line 55ms; per word 40–70ms for Persian
(`BTY-MOTION-005`). Mechanism: simultaneity destroys the reading order the group implies — the eye cannot tell which
item leads. For Persian, scale per-unit stagger by `(original span)/(units-1)` because joined groups are fewer than
Latin characters, so the first and last beats keep their original frames (`PERSIAN-LOCALIZATION-LESSONS.md` §1c).
Scene entry: first copy block at cut + 0–2 frames, complete within 12 frames; later blocks may lag
(`BTY-MOTION-008`) — the first beat after a cut is what tells the viewer the scene has begun.

## 6. Hold beats

1–2 holds of 0.4–1.0s per 15–20s film, with ambient drift continuing during the hold (`BTY-MOTION-011`). Mechanism:
holds are where the viewer finishes reading the claim; a film with no hold is noise. The HUD never moves
(`BTY-MOTION-009`): a counter that migrates across the frame is a defect (`CRAFT-AUDIT.md` D3, s12). Beat-to-treatment
rows include explicit `hold`, `ambient-hold` and `silent-beat` beats (`data/beat-to-treatment.csv`,
`BTY-BEAT-033`…`BTY-BEAT-045`) — pick them on purpose.

## 7. Rhythmic and camera motion

- Rhythmic light/beam angles lock to a beat-derived zero crossing: `angle = offset * sin(pi*(beat-hit0)/period)`; 0 free
  rotation (`BTY-MOTION-012`). Mechanism: free rotation drifts off the musical grid and the piece stops feeling cut.
- Camera keys live in scene-local time; reset the transform before the type pass (`setTransform(1,0,0,1,0,0)`)
  (`BTY-MOTION-013`).
- Differentiated camera vocabulary: macro push 1.00→1.14 over ~2s `outCubic`, pull-back 1.06→0.90 `inOutSine`, 14px
  vertical over 26 frames per cut (`BTY-MOTION-014`). Mechanism: one repeated move is a template; a differentiated set
  is a language.
- Prefer camera moves over cuts where the world is continuous (`BTY-MOTION-015`, `lib/pa-camera.js` keys/follow/
  pathFollow). Camera moves are **not** cuts, so a sound build must not auto-whoosh them and pacing gates run with
  `--one-take` (`SKILL.md` rules 16c, L-089/L-090).
- Shake ≤ 0.4° and ≤ 0.3% scale from `noise(t)`, never `Math.random` (`BTY-CAMERA-001`); whip pan 1–3 frames with
  directional blur, one cut only (`BTY-CAMERA-002`); zoom in log space (`BTY-CAMERA-003`).

## 8. Frame budgets

The whole-pipeline budget is the constraint: **82–350ms/frame at 1080×1920** (`BTY-PROC-007`,
`data/frame-budget.csv` row 1; png throughput measured elsewhere 1.8–11.0 fps). A plain canvas2d scene with a type
layer measured **~3ms/frame** (`ART-DIRECTION-STANDARD-ADDENDUM-A1.md#A1.13`, the s10 v3 seek number) — that is the
baseline every other row is expressed against.

Rules that keep a shot inside budget:

- A WebGL transition is an accent: ≤ 14 frames, ~1ms/frame extra; 12-frame window measured on s10 v3
  (`BTY-PROC-008`).
- Ban frame-integrated effects — feedback buffers, temporal accumulation, per-frame particle physics, GPGPU ping-pong;
  a bounded 2–3 ghost motion blur from rendering t−1 and t−2 is legal because it is stateless (`BTY-PROC-005`).
- Pre-bake integration into a table (`integrate(f, dt=1/30, tmax=60)`); seek only interpolates (`BTY-PROC-006`).
- Prove a new technique with one measurement at 540×960 minimum before committing a shot to it (`BTY-PROC-013`), and
  never quote an estimate as a measurement — 1080p is 4× the pixels of 540×960 (`BTY-PROC-012`).
- Consult `data/frame-budget.csv` per technique (33 rows, `verdict` column: USE / USE-AS-ACCENT / MEASURE-FIRST /
  BANNED); `craft.mjs find "<technique>"` reaches it. Measured, quotable rows: fade transition ~28.6ms; circle-reveal
  ~30.3ms; Pixelize ~30.8ms; rgb-glitch ~33.1ms; noise-displace ~48.4ms; StereoViewer ~88ms; LinearBlur ~238ms and
  CrossZoom ~248.4ms (both USE-AS-ACCENT, i.e. transition windows only); ACES tonemap 2–4ms; vignette+letterbox ~1ms;
  grain tile swap 1–3ms; canvas2D 12-slice reveal a few ms; bokeh ≤ 30 sprites cheap; dust motes free. BANNED:
  full-resolution bloom with 5 mips and kernel [6,10,14,18,22]; live animated `feTurbulence` over a large area;
  temporal-accumulation motion blur; GPGPU ping-pong. Scaling any 540×960 measurement to 1080×1920 = ×4.

## 9. Recipe book (60 entries, with code)

`data/recipes.csv`: `id`, `trigger`, `duration_ms`, `easing`, `code`, `do`, `dont`, `purity`, `cost`, `reference`.
Example — `BTY-REC-001` "reveal a Persian line of text": 350–550ms, `outCubic`/`outExpo`, mask = the full Persian line
box (≥ 1.5em) so dots above and the yeh tail below are never cut; per line add `i*0.055` offset; the `dont` is
"fading the line in, or scaling it down into a tight mask, which slices the dots and descenders". Always start from a
recipe before writing new motion (`craft.mjs find "<trigger>"`), then adapt.
