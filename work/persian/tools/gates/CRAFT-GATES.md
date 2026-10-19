# CRAFT-GATES — craft / aesthetic gates for persian-arts films

Companion to `docs/motion/FILM-GATES.md`. This file defines the **craft/aesthetic** gates and the exact
command, file or measurement that decides each one, plus a pass/fail threshold.
Every gate is grounded in the 167-row rule table `.claude/skills/persian-arts/beauty/data/beauty-rules.csv`
(cited as `BTY-<DOMAIN>-<n>`) and in the existing tools — **existing checks are referenced, never re-implemented.**

Lane order: **`workbench-card` first** (manifest / card composition, section 2), then `html-film` (section 3).
Default lane is `workbench-card` per `.claude/skills/persian-arts/SKILL.md` rule 9 (`skill_version: 2.17`).

Row contract (same as `work/persian/tools/gates/run-gates.mjs`): `PASS | FAIL | WARN | N/A | INFO`, one row per
gate, exit code **1 if any row is FAIL**, and **a gate that inspected zero evidence prints N/A with a reason,
never PASS**. `--only <ids>` selects a subset. Static gates need `--src <film source dir>`.

---

## 1. Checks that already exist — reference these, do not duplicate

| Id | Gate | Where it already lives | Rules it already discharges |
|---|---|---|---|
| C1 `kit` | kit-usage | `work/persian/tools/gates/kit-usage.mjs` | `BTY-PROC-009`, reuse vocabulary |
| C2 `token` | token-check | `work/persian/tools/gates/token-check.mjs` | `BTY-COLOR`, token layer (audit D3) |
| C3 `collision` | text-collision | `work/persian/tools/gates/text-collision.mjs` | `BTY-FA`, `BTY-TYPE` legibility |
| C4 `envelope` | text-envelope | `work/persian/tools/gates/text-envelope.mjs` | `BTY-COMP-001` safe area |
| C5 `variety` | scene-variety | `work/persian/tools/gates/scene-variety.mjs` | `BTY-COMP-003`, `BTY-RATIO-004` (pixel side) |
| C6 `material` | material-flatness | `work/persian/tools/gates/material-flatness.mjs` | `BTY-MATERIAL`, `BTY-TEXTURE` (audit D6) |
| C7 `light` | light-model | `work/persian/tools/gates/light-model.mjs` | `BTY-LIGHT-001`, `BTY-DEPTH` |
| C8 `hud` | hud-anchor | `work/persian/tools/gates/hud-anchor.mjs` | `BTY-COMP-005`, `BTY-MOTION-009` |
| O1 `overlay` | overlay-hud ("orphan") | `work/persian/tools/gates/overlay-hud.mjs` | frozen overlay rectangle |
| O2 `bands` | black-bands ("orphan") | `work/persian/tools/gates/black-bands.mjs` | letterbox / border band |
| — | purity, type, design, kit, overlap | `.claude/skills/persian-arts/beauty/tools/lint-film.mjs` (P01–P05, T01–T04, D01–D03, K01–K03, X01) | `BTY-PROC-001..006`, `BTY-FA`, `BTY-TYPE`, token/key-light/type-roles |
| — | edge, empty, dead, dup, num, logo, hero | `run-gates.mjs` base set (same dir) | `FILM-GATES.md` base rows |

`run-gates.mjs` usage line, unchanged:
```
node work/persian/tools/gates/run-gates.mjs <video|stills-folder|still.png> [--craft] [--src <film src dir>] \
     [--events events.json] [--only a,b] [--step N] [--json out]
```
Only **new** gates are defined below. Ids C9+ are reserved for them; a gate whose row says `to build` has **no
executable check yet** and **must not be claimed as passed**.

---

## 2. workbench-card lane — manifest / card composition (C9–C16)

| Id | Gate | Decided by (exact file / pattern / measurement) | Threshold | Rules | Status |
|---|---|---|---|---|---|
| C9 | manifest-present | `<film-src>/workbench.ts` matches `export const WORKBENCH` and the value is not the `null` stub. Negative fixture that proves the check works: `work/persian/src/workbench/proj-stub/workbench.ts` (3 lines, `WORKBENCH = null`). | exactly 1 non-null `WORKBENCH` export | `BTY-PROC-010` | to build |
| C10 | manifest-time-integrity | Parse the `WorkbenchManifest` shape from `work/persian/src/workbench/src/cards/manifest.ts:44-75`: `total`, `shots[].from`, `shots[].duration`, `sfx[]`, `bgm[]`. | 0 units with `from < 0`, `duration <= 0` or `from + duration > total`; 0 audio rows outside `[0, total]` | `BTY-PROC-001`, `BTY-MOTION-013` | to build |
| C11 | manifest-schema-completeness | Required keys `name, fps, width, height, total, shots`; every unit has `id, from, duration, component` (`manifest.ts:9-32`). | 0 missing required keys | `BTY-PROC-010` | to build |
| C12 | manifest-card-id-collision | Capture the render console; `groupUnits()` warns `[workbench] 清单卡 id 撞名` on collision (`manifest.ts:106-115`). | 0 collision warnings in the render log | `BTY-PROC-010` | to build (log scrape) |
| C13 | card-reference-exists | Every `shots[].cardId` / `cardName` must exist in `work/persian/tools/cards/cards.json` (search: `node work/persian/tools/cards/card-find.mjs <query>`). | 0 unknown card ids | rule 18a/b, `BTY-PROC-009` | to build |
| C14 | one-world (style family) | Distinct `visualStyle` families across the referenced cards in `cards.json`, per film. | ≤ 1 family, **or** ≥ 2 with a declared dark→light arc in the film header | rule 18c, `BTY-COMP-006` | to build |
| C15 | card-variety | Longest run of the same `cardId` in the `shots` track; distinct `cardId` count per 15 s (`fps * 15` frames). Manifest-side counterpart of C5. | max run ≤ 2; ≥ 3 distinct cards per 15 s | `BTY-COMP-003`, `BTY-MOTION-011` | to build |
| C16 | persian-text-in-manifest | Run the **existing** `lint-film.mjs` regexes T01 (letter-spacing on Persian), T03 (per-character split), T04 (Persian numerals without LTR isolate) over a dump of the manifest `props`. Reuse that tool, do not re-implement: `node .claude/skills/persian-arts/beauty/tools/lint-film.mjs <props-dump> --only T01,T03,T04`. | 0 findings | `BTY-FA-*`, `BTY-TYPE-*`, PERSIAN-LOCALIZATION-LESSONS | to build (harness only) |

Manifest + card facts come from `pa craft`: `pa craft find "<effect>"`, `pa craft list --kind rules`,
`pa craft show <id>`, `pa craft check`.

---

## 3. html-film lane — gaps not covered by section 1 (C17–C19)

| Id | Gate | Decided by | Threshold | Rules | Status |
|---|---|---|---|---|---|
| C17 | hero-size-true | Extends the existing `hero-size.mjs` measurement (same detector, real threshold instead of the loose estimate). | 9:16 hero ≥ **25%** of frame height; 16:9 hero ≥ **22%** | `BTY-COMP-002` | to build (widen existing detector) |
| C18 | frame-budget | Declared per-frame cost from `.claude/skills/persian-arts/beauty/data/frame-budget.csv` (`cost_ms_per_frame_1080p`, `verdict`) for every technique the film uses; actual timing needs a render pass. | every technique used is declared in the table and sits inside **82–350 ms/frame** at 1080x1920 | `BTY-PROC-007`, `BTY-PROC-012`, `BTY-PROC-013` | half: declared table exists (`pa craft list --kind budget`); measured timing to build |
| C19 | webgl-transition-cost | Transition rows in `events.json` vs the rendered length of the transition layer. | a WebGL transition straddles exactly **one** cut and lasts **≤ 14 frames** | `BTY-PROC-008` | to build (needs events.json) |

Ratios are re-composed, not cropped (`BTY-RATIO-001..004`); C5/C4 carry the pixel half, and the
"genuine re-composition" declaration is prose (see section 4).

---

## 4. Honest limits — craft rules that are NOT mechanically checkable today

These stay reviewer/QC judgement. Never report them as passed by a script.

| Rule(s) | Why it cannot be decided mechanically yet |
|---|---|
| `BTY-COMP-006` dominant idea per frame; `BTY-COMP-008` end card lockup quality | taste: needs an independent reviewer score ≥ 85 (`FILM-GATES.md` visual review) |
| `BTY-COMP-007`, `BTY-COMP-009` end-card artefact; decorative band out of legal/ISO row | needs the printed/legal row geometry, not present in the render |
| `BTY-MOTION-001..006`, `-010..-012` named easings, anticipation, secondary action, stagger, holds, beat-locked light | easing names live in source intent; a pixel detector cannot tell a deliberate hold from a stall |
| `BTY-CAMERA-001..003` shake ≤ 0.4°, log-space zoom | needs the camera transform, not the composited frame |
| `BTY-RATIO-001/002` per-ratio layout table; "review landscape as its own film" | a declaration plus a human look |
| `BTY-PROC-009` five premium techniques mapped to named scenes | header declaration; only "present vs blank" is checkable |
| `BTY-PROC-011` lessons become checks | this document is the mechanism; success is judged by ledger hit/miss history |
| C13's "which technique each shot borrows" (rule 18b reuse map) | prose per shot; only card-id existence is mechanical |

## 5. Adding a gate without breaking the runner

`run-gates.mjs` already carries `--craft`, the two orphan gates and the `--only` id list. Adding a gate means
adding its module next to it and one `if (only.includes('<id>'))` row — keep every existing row, exit code and
N/A rule intact, and re-run the base invocation before and after to prove nothing changed. Current behaviour is
recorded in `media/briefs-local/storylab-craft/gates-craft-report.md`.

---

## G-MOTION / G-LOOK — measured motion + the review loop (added 2026-10-19)

Two gates from the reference motion projects (`Mort1d/motion-graphics-skills`, `bangtutorial/bang-motion`,
`Tejashmakwana/motionmaxxing`, `howseen-ai/claude-motion-design`). Numbers calibrated on this repo, see
`docs/motion/MOTION-METRICS-2026-10-19.md`.

| id | what it measures | command | status |
|---|---|---|---|
| `G-MOTION` | motion energy of the delivered frames: moving %, longest static run, hits/min, per-second timeline | `node tools/gates/motion-energy.mjs <frames-dir\|video.mp4> --out metrics/motion/<film>.json --max-dim 320` | DIAGNOSTIC — thresholds are OFF by default; pass `--min-moving/--max-static/--hits-min/--hits-max` only when the project has its own measured band |
| `G-LOOK` | the review sheets a human/model scores | `node tools/qc/contact.mjs <frames-dir\|video.mp4> --out out/qc --at <t> --n 24` | REQUIRED before delivery: `sheet.jpg`, `strip.jpg`, `phone.jpg`, `review.json` |

Corpus bands (motion-graphics subset, 5 films, `--max-dim 320`):
moving % 39.7 / 63.0 / 82.1 · static run 14 / 37 / 66 frames · hits/min 276 / 358 / 605.

The numbers quoted by the reference projects (>=75 % moving, <=3 static frames, 55-90 hits/min) FAIL on
professional reference films under this metric — they are calibrated against a different definition of a "hit".
Do not paste them into a gate without measuring a local corpus first.

`G-LOOK` scoring rule (also written into `review.json`): 7 axes — hook in the first 2 s, readability at 360 px,
motion quality (no dead frames, every move has a job), variety (something new every 2-4 s), composition (one hero
per frame, no page chrome), accuracy (brand/numbers/Persian), sync. Nothing ships below 8 on any axis.

Reference material to judge against: `work/persian/reference-motion/index.html` (71 artefacts, 52 MB) and
`work/persian/reference-motion/MANIFEST.md`.