# SKILLS-CHANGELOG

## 2.16 (2026-10-16): batch S08-S12 capture and evidence integrity
- Rule 17 in SKILL.md: capture port isolation and the ~300 s segmentation rule (segmented joins are re-encoded, never stream-copied), keyframe interval <= 2 s, events.json derived from the renderer's real edit and verified against the delivered mp4, stills regenerated from the final mp4, `film-integrity.mjs --write-version` before deliver, no debug overlay on the capture path, silent-v1 TV-safe needs the inaudible AAC track, hero size measured on text, no gate delta across detector revisions.
- Tools (rounds 1-2): `pa.ps1` Invoke-Assets single-path splat (L-108); `compress.mjs` TV check read `'fail'` against `"FAIL"` and always passed (L-109); `deliver.mjs` re-checks TV-safe instead of printing the recorded claim (L-110); capture.mjs auto DevTools port, `Runtime.exceptionThrown` surface, `@font-face` file check (exit 4), cross-platform venv python probe (L-112..L-115).
- Tools (integrity round): new `work/persian/tools/verify/film-integrity.mjs` - I1 events-vs-render, I2 stale stills (pixel MAD), I3 frame-base sanity, `--write-version` VERSION.json writer; VERSION.json written for all five films (L-118..L-121).
- Gates hardened: number-lint lints real files and never PASSes an empty scan (L-122); hero-size replaced by a text-line metric with the old blob metric kept as a diagnostic (L-123); duplicate-template consumes events.json scene starts (L-124); logo-colour derives the film's own colours with no hardcoded palette (L-125, still OPEN through the default `--logo-files`); empty-band got a measured per-ratio baseline.
- New detectors written but NOT wired into run-gates.mjs: `overlay-hud.mjs` (burned-in debug overlay, found in the s09 v1 masters) and `black-bands.mjs` (black bands inside the raster, confirmed by cropdetect on s09 v1 16:9). Wiring is open item 1 (L-116, L-117).
- Flipped to `verified-in-next-run` by this batch: L-082, L-083, L-091, L-094, L-096, L-105 - the first lessons ever to reach that state.

## 2.15 (2026-10-14): story-lab fold (S01-S07)
- Rule 16 in SKILL.md: new story per film, per-ratio layout table (lib/pa-layout.js), camera moves not cuts (lib/pa-camera.js, no auto whoosh, --one-take/--scenery), payoff/beam events on the beat, no empty openings, canvas for many shapes, size rules.
- Tools: `pa compress` copies AAC audio up to 200 kbps (true peak untouched, fixes L-106); sync script writes skill_version into the .agents mirror; DECISIONS.jsonl duplicate ids renumbered (D-20261013-38/-39, D-20261014-08).
- Folds ledger L-087..L-107; T014 done.

## 2.12 (2026-10-14): Image FX phase 1
- pa-fx.js runner + 36 shaders + catalog + `pa fx find|list|check|demo`; capture.mjs SwiftShader flags; motion-designer/art-director/PLAYBOOK/FILM-GATES.
- Ledger L-098..L-100; decision D-20261014-06; T021 done, phase 2 added to the TODO.

## 2.9 (2026-10-14): self-installing skill
- Rule 15, step 0 env in SKILL.md, all craft skills and todo.template.json; START.md; docs/motion/ASSETS-IN-GIT.md.
- Tools: install.ps1, install.sh, `pa install-skill`, `pa assets-check`, `pa doctor --quiet`, bootstrap copies the tracked fonts into src/workbench/public/fonts (never into a film's own htmlfilm/<label>/fonts/) and creates .env from examples; capture.mjs browser resolver; fonts manifest.
- Ledger L-082..L-084; decision D-20261014-03.

## 2.8 (2026-10-14): loop mode, calibrated pacing, per-version metrics
- Rule 14 METRICS every version; version.schema optional `metrics`; sound/qc/technical skills, FILM-GATES rows, PLAYBOOK-SOUND loop section.
- Tools: `pa loop-check`, build_sound `--loop`, audio-check `--loop`, run-gates `--no-logo`, deliver `--gates`, pacing `--cuts/--track/--events` + calibration test, meter parser and `pa meter check`.
- Ledger L-078..L-081; decision D-20261014-02.

## 2.7 (2026-10-14): git-first and portable
- Rule 13 and checklist item; START.md; docs/motion/PORTABILITY.md (audit); tools in work/persian/tools/portable (doctor, bootstrap, sync, vault, todo, meter, metrics); requirements-pa.txt; .env.example files; deliver --track; todo.jsonl/TODO.md; ledger/tasks.jsonl (273 seeded lines).
- Fixed absolute paths in 4 live scripts; qh documented as external optional (not vendored).
- Ledger L-072..L-074; decision D-20261014-01.

## 2.6 (2026-10-13): measured pacing from 38 references
- Data: docs/motion/knowledge/ref-pacing.json, ref-pacing-summary.json, PACING-PROFILES.md (analyze_refs.py).
- Tools: `pa pacing` (advisory), `pa music-pick`, `pa arc` (optional menu docs/motion/recipes/arcs.json, inspiration only).
- Rules: STORY FIRST in 3b, director, writer; pacing defaults in director/writer/motion-designer/sound/qc; post-render checklist reads `pa pacing`; FILM-GATES row.
- Real test: docs/motion/ledger/pacing-*.md (4 films, top-5 findings); ledger L-067..L-071; decisions D-20261013-36/37.

## 2.2 (2026-10-13): html-film lane is the default
- Orchestrator: CRITICAL rule 9 and section 3b; TODO steps for the lane: intake -> memory-init -> treatment -> build -> capture -> sound -> qc -> fix-round -> deliver -> retro; time box 20 min per film.
- Nine craft skills: paragraph 'In the html-film lane' (header-comment planning, build/capture, sound contact times, QC applicability and pilot lessons).
- PLAYBOOK-BUILD-MOTION top section, todo.template.json `lane` field (old steps under lane remotion), FILM-GATES html-film applicability, pa.ps1 `render -Lane html`.
- Ledger L-044..L-048 (proposed); decisions D-20261013-26 (confirmed), D-20261013-27 (proposed).

## 2.0 (2026-10-13), retro of the uni-admissions run (ledger L-001..L-043)
- Identity sentence as first body line in all 10 skills (role owned / not / refuses) - L-015, L-016, L-013.
- Orchestrator: CRITICAL rules, pre-flight and post-render checklists, Retro as last step, skill_version, version cap 3 (L-041).
- Detectors work/persian/tools/gates/ (edge-touch, empty-band, dead-frames, duplicate-template, number-lint, logo-colour, hero-size estimate) wired into FILM-GATES.md and the QC skill (L-003, L-005, L-007, L-009, L-011, L-013, L-014, L-029).
- Craft skills: width+height rules together, U+2009/U+202F inside an LTR isolate, one-line commits without Co-Authored-By, sound deferred, claim table for QC verification.
- Recipes catalog: pitfalls from the ledger. todo.template.json: retro step, versions block.

## 1.0 (2026-10-13)
Orchestrator, 9 craft skills, goal memory, loop policy, studio single-agent mode.

## 2.3 (2026-10-13)
Time budget: persian-arts rule 10 (target 10, cap 20 min per film, scope freeze, ONE persistent studio worker, Haiku never for craft, no parallel side tasks); section 3b: one studio order, film-context.md pack, lighten before capture, png FINAL / --draft jpeg; `pa time start|mark|status|end|postmortem` (work/persian/tools/timing); craft skills director, writer, technical updated; todo.template.json timing fields; ledger L-049..L-055.

## 2.10 (2026-10-14)
S03 story build (key and maze): new generic html-film libs (camera/zoom track with follow lag, path-follow with tangent, persistent actor poses, squash and stretch hop, seeded maze + solver + dead-end branch, node self-test). Rules of thumb recorded in the skill: camera moves are not cuts for the mixer; flat end floods need light rays; derive sound events from the picture keyframes. Ledger L-087..L-091.

## 2.11 (2026-10-14)
S07 story build (kite and wind): `pa music-drop`, lib/pa-chain.js (follow-through chain + integrate), gates --scenery, pacing --one-take, audio-check --events, pa time phase env (all with tests in work/persian/tools/test_s07_fixes.py). Lessons: music-led drop placement via --t0 -N*bar_s, soft kit drops need added kick+sub, clear sky needs clouds for empty-band. Ledger L-092..L-097.

## 2.13 (2026-10-14)
S05 story build (notebook city): lib/pa-ink.js (wobble, draw-on, scale-aware stroke, log-space zoom), canvas pattern for 100+ shapes (0 DOM nodes), track id lookup fix in pacing/loop-check. Ledger L-101..L-104.

## 2.14 (2026-10-14)
S02 story build (lighthouse and ship, both ratios): lib/pa-layout.js per-ratio layout table (+ self-test), beam-as-clock pattern, audio built once for both ratios. Ledger L-105..L-107.
