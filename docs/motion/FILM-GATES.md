# FILM-GATES: automated checks every film must pass

Loop rule: gate failures get one fix round, then the film ships with notes; see LOOP-POLICY.md.

Every film order's acceptance must cite this file and name its target stage. "Exists" means source is present, not that an end-to-end check is implemented. "To build" means no executable gate exists and blocks claiming the affected check passed.

`work/persian/tools/film-process-gates.mjs` validates production-record integrity in three separate stages. `structural` can PASS a valid draft record only. `preflight` additionally checks source/director hashes, decision references, constraints, reuse ledgers, action log, sampled-frame declarations, and evidence paths. `delivery` adds required-evidence declarations for requirements, Persian reading, bidi, fonts, and preserved positive traits. These stages check declarations and file paths; they do not perform domain measurements or judge subjective quality. Run each stage against current files; a later stage does not inherit an earlier PASS.

Any applicable required check recorded as `not-run`, `unknown`, stale, failed, or `to build` blocks the claimed preflight/delivery stage. Never count an item as passed because it was listed as not run. A gate PASS does not authorize publication; owner acceptance follows review of the required evidence.

| Rule | Required check/evidence | Who runs it | Threshold | Implementation status |
|---|---|---|---|---|
| Music beat grid | Onset analysis of the selected bed (`music_map.py`, `grid_accept.py`) | Worker | Grid error <= 15 ms | Scripts exist; threshold gate to build |
| SFX on picture events | Compare every SFX row in `events.json` with its film event, measured on the final mix | Worker | Within 1 frame (33 ms at 30 fps) | Cue sheet support exists in `mix_sfx.ps1`; final-mix event comparison to build |
| Loudness | Two-pass loudnorm analyzer evidence and true-peak check | Worker | I = -14 LUFS, TP <= -1 dBTP | Mix script exists; analyzer result required per delivery |
| Digits LTR | Scan rendered text: every number token has direction ltr or isolate; stills show left-to-right group order | Worker, then one reviewer look | 100% of number tokens; order matches source | to build |
| Hero size | Hero digits height vs frame height in 9:16 | Worker | >= 12% of frame height | to build |
| Hero width | Measured width of hero text vs its slot | Worker | 0.5 to 0.9 of slot width | claimed heroFit() in fix-round-report.md; code not verified; to build if absent |
| Empty zone | Bottom/top band of each still without motion | Worker | No zone > 30% of frame height without motion | claimed YMIN check in fix-round-report.md; to build if absent |
| Edge touch | No text-sized blob touches the outer margin of any sampled frame | Worker | 0 blobs | exists: work/persian/tools/gates/edge-touch.mjs (also flags decorative shapes cut by the edge) |
| Dead frames | No near-uniform run of 3+ frames at a scene start | Worker | 0 runs | exists: work/persian/tools/gates/dead-frames.mjs |
| Repeated template | No two scene midpoints share layout/pHash | Worker | pHash < 0.85, IoU < 0.70 | exists: work/persian/tools/gates/duplicate-template.mjs |
| Logo colour | Brand colours present in the finale, no near-white plate | Worker | pass | exists: work/persian/tools/gates/logo-colour.mjs |
| Contrast | Text vs background contrast on sampled stills | Worker | WCAG AA (4.5:1 body, 3:1 large) | to build |
| Visual review | 9 meaningful stills per required ratio/contact sheet, reviewed with evidence | Independent reviewer | Score >= 85 | Review process exists; sheet/evidence integration to build |
| Persian reading and bidi | Contextual Persian reading; RTL text and LTR number runs with source/still evidence | Reviewer | Every applicable check evidenced and pass | Per-film review; not automated; unknown/not-run blocks delivery |
| Actual font roles | Loaded font face and weight for every intended role, with rendered sample evidence | Worker/reviewer | Every applicable role evidenced and pass | Per-film inspection; not automated |
| Preserved positive traits | Evidence each approved character/story, dynamic-motion, and brief-specific trait survived | Reviewer | Every applicable trait evidenced and pass | Per-film review; not automated |
| Process integrity and reuse | Fresh hashes, decisions/constraints, action log, and distinct eligible/observed ledgers for idea, code, process | Worker | Complete, existing evidence; no empty reuse denominator | Record checker exists; validates declarations/paths, not film quality |

Film order acceptance line (copy into every film order): “Acceptance cites `docs/motion/FILM-GATES.md`, names the target stage, reports actual command output, and identifies every required not-run/unknown/to-build/stale/failed check as blocking. Structural PASS is draft-record integrity only.”

Runner: `node work/persian/tools/gates/run-gates.mjs <video|stills-folder> --src <film src dir>` prints a PASS/FAIL table with frame numbers (exit 1 on FAIL). Detectors are leads for QC to verify in frames, not verdicts; see docs/motion/LESSONS-LEDGER.md for hit/miss history.
