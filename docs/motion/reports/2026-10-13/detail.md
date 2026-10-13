# Detail report 2026-10-13 (technical)

Scope: local day 2026-10-13 (Asia/Tehran). qh jobs are UTC; local = UTC+3:30. Orders 1-5 (jobs 250-254) belong to the 2026-10-12 local day and are in that detail.

## 1. Order table (qh)

Source: `node D:/P/tools/quota-hub/bin/qh.mjs orders` and `qh result <id>` (2026-10-13, ~03:4x local). SEC = durationS. Orders 6-12 finished on the 10-12 UTC evening but landed after 00:00 local 10-13 (or straddled it); their reports are listed under the 10-12 detail sources. Order 13 and everything below are 10-13 local work.

| ORDER | JOB | Worker | Title | State | SEC |
|---|---|---|---|---|---|
| 6 | 255 | glm | payoff-A1-stamp-clock | done / ok | 756.2 |
| 7 | 256 | glm | payoff-A2-daily-cta | done / ok | 530.6 |
| 8 | 258 | glm | uni-teaser-P0 | done / ok | 923.1 |
| 9 | 259 | codex-a | imagegen-test-arch | done / ok | 72 |
| 10 | 260 | glm | codex-queue-check | done / ok | 197.9 (order had been STALLED, cleared by hand) |
| 11 | 261 | glm | uni-teaser-P2 | done / timeout | 1500.2 (partial output: report-uni-P2.md exists) |
| 12 | 262 | glm | excalidraw-mcp-brief | done / ok | 192.6 |
| 13 | 263 | glm | uni-teaser-P3-fixes | done / timeout | 1201.9 (no final message) |
| 14 | - | glm | (no title yet) | running | - |

Result summaries (qh result finalMessage, condensed):
- Order 6 (A1): stamp-in helper (pre-hit lift, contact squash + overshoot at f15), screen shake cut 30→~10 px, ink splat overlay; Count ring full exactly at H=48, crown shake 8 f; bug fix: degenerate arc at ring=1 drew no ring, now full circle. 32/32 stills PASS in `_stills-payoff/A1/`, tsc clean. Files: `work/persian/src/film/social/scenes.tsx`, `motion.ts` (inCubic). Report: `work/persian/report-payoff-A1.md`.
- Order 7 (A2): `CUT_BEATS` last 34→36 → 540 f / 18 s; SceneDaily ringPulse rows, day-7 double coral ring + check scale at local 64; SceneCta ring-out (3 staggered rings), paper flash, pill beat damped to 0 by f98. 36/36 stills PASS in `_stills-payoff/A2/`, tsc clean. Known minor: pen nib occludes day-7 tick ~2 f at 1:1. Files: `scenes.tsx`, `motion.ts`, `entry.tsx`, `SocialFilm.tsx` (derived). Report: `work/persian/report-payoff-A2.md`.
- Order 8 (uni P0): new engine folder `work/persian/src/film/uni/` (8 files: theme, motion, layout, copy, fonts, scenes, UniFilm, entry); 24 s / 720 f, 4 compositions; navy on cream, contrast 10.2:1; Persian copy only in git-ignored `media/briefs-local/**`, tracked code uses tokens. 9/9 stills in `_stills-P0/`. Fixed: hero/sub overlap, headline overflow (auto fit), rule grazing descenders. Report: `work/persian/report-uni-P0.md`.
- Order 9 (imagegen arch test): Codex built-in raster image generator; arch-gateway-flat.png (1080×1440 RGBA, 68.5 % transparent) + notebook-paper-texture.png (1080×1920). Basis of `work/persian/imagegen-brief.md` / `docs/motion/research/imagegen-brief.md`.
- Order 10 (queue check): `work/persian/report-codex-check.md`; stale jobs 162/193 (codex-a) exceed the 6 h hold; order 10 STALLED because worker pid was dead; cleared by hand. Quota: codex-a 5 h 3 %, week 39 %; codex-b 5 h 0 %, week 54 %. No DB changes made.
- Order 11 (uni P2): timed out at 1500 s but delivered partial `work/persian/report-uni-P2.md`: all 8 scenes animated, emblem from git-ignored `public/uni-local/`, 18 stills in `_stills-P2/`, B5a (malformed rank) deliberately HOLD.
- Order 12 (excalidraw brief): `work/persian/excalidraw-mcp-brief.md` → MCP server has no file/SVG/PNG export, camera locked 4:3, dormant since 2026-03, no LICENSE file, Excalifont has no Arabic-script glyphs → SKIP the server; optional half-day pilot of the raw `.excalidraw` format; baseline stays direct rough.js. Copied to `docs/motion/research/excalidraw-mcp-brief.md`.
- Order 13 (uni P3 fixes): timed out (1201.9 s recorded) with no final message; git-adjacent side effects only in `media/dana/**`, `docs/DELEGATION-*`, `docs/motion/last-checkpoint.txt` (per qh changedFiles). Uni P3 status: not verified beyond this — treat P3 as not delivered.

## 2. Commits (git log --since='2026-10-13 00:00', local +0330)

| Hash | Time (+0330) | Subject | Stat |
|---|---|---|---|
| bcc180b | 00:20 | docs(evals): add rubric-v2 draft (9 criteria, story and sound) | (see git) |
| c7c6d5d | 03:27 | docs(motion): knowledge base, playbooks, decisions log and render tooling | ~40+ files incl. docs/motion/STATE.md, PLAYBOOK-*.md ×3, research briefs ×11, DECISIONS.jsonl, sound/library manifests/CATALOG, render_all.ps1/.md, mix scripts, cue tools |
| cc4dba3 | 03:39 | feat(motion): architecture ADR, contracts, scan, report store and wider autosync | contracts/ (schemas, validate.mjs, scan.mjs, allowlist, examples), docs/motion/adr/0001-architecture-option-c.md, ledger/ (3 files + ledger.jsonl), reports/README.md + 2026-10-12/detail.md + index.jsonl, prompt-design-brief, autosync widen; 30 files +1839 |
| 5efb45c | 03:43 | chore(motion): autopilot backlog and checkpoint script | AUTOPILOT.md, RESUME.md, tools/checkpoint.ps1; 4 files +255 |

## 3. Files created or changed (by area)

- Knowledge base: `docs/motion/` (README, STATE, DECISIONS.jsonl, PLAYBOOK-BUILD-MOTION / -RENDER / -SOUND, research/ 11 briefs, adr/0001, ledger/).
- Render tooling: `work/persian/render_all.ps1` + `render_all.md`, `work/persian/mix_film.ps1`, `mix_sfx.ps1`, `work/persian/tools/cues/build_v4.py`, `build_v5.py`, `work/persian/tools/render/prep_assets.py`, `crop_ssim.py`, `exp_frame_format.sh`, `work/persian/_bench/*` (git-ignored).
- Film: `work/persian/src/film/social/{scenes.tsx,motion.ts,entry.tsx,SocialFilm.tsx}` (payoff A1/A2, v5/v5.1 cue sheets `v5-cues/cues-9x16.json`, `v51-cues/cues-9x16-v51.json`); new `work/persian/src/film/uni/` (8 files). Versions: `media/film-versions/pencil-social/v5-*`, `v51-*`; stills `_stills-payoff/{A1,A2}/`, `media/film-versions/uni-admissions/_stills-P0/` (9), `_stills-P2/` (18).
- Contracts and reports: `contracts/` (4 schemas, validate.mjs, scan.mjs, scan-allowlist.json, 5 examples), `docs/motion/reports/` (README, 2026-10-12/detail.md, index.jsonl, this store).
- Autopilot: `docs/motion/AUTOPILOT.md`, `RESUME.md`, `work/persian/tools/checkpoint.ps1`, `work/persian/tools/reports/new_report.ps1`.

## 4. Key numbers

- Sound: v5 = max 3 simultaneous cues, music shifted two beats so the downbeat lands on the settle; v5.1 = CTA copy B so downbeat = settle, 80 ms crossfade at ~16.4 s. Mix: bed -18 LUFS, duck -3 dB, final -14 LUFS, final TP -1.5 dBTP.
- Film length: CUT_BEATS 36 beats → 540 frames / 18 s at 30 fps (A2).
- uni teaser: 24 s / 720 f / 8 scenes, P0 done, P2 done (partial via timeout), P3 not delivered (timeout, no message), B5a HOLD pending owner copy strings.

## 5. Benchmarks

Sources: `work/persian/_bench/results.csv`, `work/persian/_bench/run*.log`, `run4-wall.txt`, `run5-wall.txt`, `work/persian/render_all.md`, `work/persian/render-speed-brief.md`.

Single 9x16 film (17 s, 510 f):

| Scenario | Wall (s) |
|---|---|
| base (default settings) | 17.2 / 22.3 (two runs) |
| default 9x16, single render, final default | **19.07** |
| concurrency 9 | **12.02** (15.18 twice in the earlier csv run; 12.02 from the later run) |
| concurrency 1 | 43.4 / 47.4 |
| concurrency 10 | 16.2-17.2 (no gain over 9) |
| --gl angle | 19.27 (SSIM 0.99974) — chosen |
| --gl vulkan / angle-egl / swangle / swiftshader | 19.2-35.4 — rejected |
| --gl default | exit 1, invalid in Remotion 4.0.484 |

Four ratios:

| Scenario | Wall (s) |
|---|---|
| sequential 9x16→16x9 at concurrency 9, second run (clean) | **40.53** |
| sequential four ratios, first measurement under load | 58.6 (different run, machine under load; both recorded) |
| parallel render_all (-Parallel 4, concurrency 2 each) | **31.15** |
| render_all cached rerun (bundle + silent cache hits) | **1.21** |
| bundled single renders, concurrency 9 | 9x16 17.18 / 1x1 12.13 / 4x5 13.11 / 16x9 16.16 |

Encoders and quality:

| Item | Number | Verdict |
|---|---|---|
| double-encode (old second libx264 pass) removed | saves ~13 s per 9x16 render (38.7→25.4 s) | removed |
| native single encode SSIM vs ref1 / ref2 | 0.999876 / 0.999913 (ref-vs-ref noise 0.999876) | default |
| bt709 single encode SSIM | 0.997391 (~0.0025 cost) | only on request |
| JPEG frames q95 | 0.99917 < threshold 0.999576 | rejected |
| WebP frames | unsupported in Remotion 4.0.484 | rejected |
| NVENC | 1.9 s vs 1.6 s, size 7.7 vs 3.1 MB | rejected |
| x264 ultrafast / slow / crf 28 | no wall gain; 3.5× size; visible quality loss | rejected |
| preview frames 150-210 / stills | 6.07 s / 4.08 s | for tests |

## 6. Research briefs (docs/motion/research/, c7c6d5d)

- openmontage-brief: code reuse rejected (AGPL-3.0); ideas only.
- doory-brief: rejected as renderer (editor only, no headless path, Persian shaping undocumented).
- browser-alternatives-brief: stay on Chrome headless shell (Chrome for Testing 7.10 min vs 21.5 min, maintainer report); Revideo / Motion Canvas / Skottie / resvg / lunasvg rejected for Persian joining risk and port cost.
- excalidraw-mcp-brief: skip MCP server (no export, 4:3 lock, dormant, no LICENSE, no Arabic glyphs); optional raw-format pilot.
- render-scale-research-brief: shared browser with page cap 4-12 = OPEN experiment; 20-40 simultaneous renders rejected.
- render-speed-brief: basis of the concurrency 9 / angle / native single-encode defaults.
- imagegen-brief: Codex built-in raster generator + Pillow for exact sizes (proposed).
- audio-sources / pixabay-api / payoff / prompt-design / status-2026-10-12: knowledge base entries.
- Architecture: option C adopted (kernels, vertical film slices, thin pa command layer, JSON contracts, ADRs, decisions log) — `docs/motion/adr/0001-architecture-option-c.md`, owner-delegated approval, D-20261013-01.

## 7. Sound / payoff work

- v5 (`v5-cues/cues-9x16.json`): payoff cue sheet — stamp-in, ring pulses, final bow with tail; max 3 simultaneous cues; music shifted two beats so the downbeat lands on the settle. Versions `v5-dogo-jump-1267515`, `v5-lnplus-597024`.
- v5.1 (`v51-cues/cues-9x16-v51.json`): CTA copy B advanced so downbeat = settle; 80 ms crossfade at ~16.4 s. Versions `v51-dogo-jump-1267515`, `v51-lnplus-597024`. Current payoff reference (D-20261013, film area).
- v4 gain defect: cross-out cue +11 dB suspected wrong; v5 recomputes, gains still to be measured.

## 8. uni-admissions teaser status

- P0 done (setup, 24 s, 8 scenes, navy on cream; 9 stills; report-uni-P0.md).
- P2 done (all 8 scenes animated, emblem from git-ignored public/uni-local/; 18 stills; report-uni-P2.md from a timed-out job).
- P1 / P3+ not started or not delivered (P3 order 13 timed out with no final message — not verified beyond that).
- B5a (malformed rank) HOLD until owner confirms rank and superlative strings; film public/not-public is an owner decision.

## 9. Contracts, scan, report store

- `contracts/` shipped in cc4dba3: schemas (brief, cue-sheet, decision, film, version), validate.mjs, scan.mjs + scan-allowlist.json, examples. Confidentiality scan = `node contracts/scan.mjs`.
- Report store: `docs/motion/reports/README.md` (convention), 2026-10-12/detail.md, index.jsonl; `work/persian/tools/reports/new_report.ps1` appends `## HH:MM checkpoint` sections (never overwrites); cron via `work/persian/tools/checkpoint.ps1` (5efb45c). This file and today's summary/INDEX close the gap.

## 10. Defects and deviations

- Orders 11 and 13 hit the time limit; 13 has no final message, so uni P3 delivery is not verified.
- Order 14 running at report time (no title/job yet).
- First four-ratio sequential measurement (58.6 s) was taken under machine load; clean rerun 40.53 s — both recorded above, different runs.
- Preview `--scale 0.5` re-rasterises rather than downscales (render_all.md item 11); brief figure 0.987 did not reproduce.
- Track conflict (dogo-jump / feeblom FAIL vs used in v3-v5.1) still open for the owner.
- media/dana deletions and modified mp4 appear in git status from order 13's side effects; untouched, owner to decide.

## 11. Sources

- qh orders / qh result 6-14 (accessed 2026-10-13 local).
- git log --since='2026-10-13 00:00' --stat --oneline.
- work/persian/_bench/results.csv, run*.log, run4-wall.txt, run5-wall.txt; work/persian/render_all.md; work/persian/render-speed-brief.md.
- docs/motion/STATE.md, docs/motion/DECISIONS.jsonl, docs/motion/reports/2026-10-12/detail.md.
- work/persian/report-payoff-A1.md, report-payoff-A2.md, report-uni-P0.md, report-uni-P2.md, report-codex-check.md, excalidraw-mcp-brief.md.
