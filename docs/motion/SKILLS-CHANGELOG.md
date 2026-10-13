# SKILLS-CHANGELOG

## 2.9 (2026-10-14): self-installing skill
- Rule 15, step 0 env in SKILL.md, all craft skills and todo.template.json; START.md; docs/motion/ASSETS-IN-GIT.md.
- Tools: install.ps1, install.sh, `pa install-skill`, `pa assets-check`, `pa doctor --quiet`, bootstrap copies fonts and creates .env from examples; capture.mjs browser resolver; fonts manifest.
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
