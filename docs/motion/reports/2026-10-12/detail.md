# Detail report 2026-10-12 (technical)

Scope: local day 2026-10-12 (Asia/Tehran). Jobs are UTC in qh; local = UTC+3:30. Items after 00:00 local on 10-13 are in the 10-13 detail.

## 1. Order table (qh)

Source: `qh orders` and `qh history`. SEC = seconds from the qh SEC column. ORDER is the qh order number, JOB the job id.

| ORDER | JOB | Worker | Model / effort | Title | State | SEC |
|---|---|---|---|---|---|---|
| 1 | 250 | glm | glm-5.3-flash / medium | s4-verify-batch (sound-order) | timeout | 1500.4 |
| 2 | 251 | glm | glm-5.3-flash / medium | o3-link-script | ok | 295.1 |
| 3 | 252 | glm | glm-5.3-flash / medium | p1-process-doc | ok | 640.4 |
| 4 | 253 | glm | glm-5.3-flash / medium | pixabay-queue-m1 | ok | 1245 |
| 5 | 254 | glm | glm-5.3-flash / medium | pixabay-queue-m2-autorun | ok | 278.5 |
| 6 | 255 | glm | glm-5.3-flash / medium | payoff-A1-stamp-clock | ok | 756.2 |
| 7 | 256 | glm | glm-5.3-flash / medium | payoff-A2-daily-cta | ok | 530.6 |
| 8 | 258 | glm | glm-5.3-flash / medium | uni-teaser-P0 | ok | 923.1 |
| (none) | 257 | codex-a | gpt-6.1-sol / low | imagegen-test-direct | ok | 128.8 |
| 9 | 259 | codex-a | gpt-6.1-sol / low | imagegen-test-arch | ok | 72 |
| 10 | 260 | glm | glm-5.3-flash / medium | codex-queue-check | ok | 197.9 |
| 11 | 261 | glm | glm-5.3-flash / medium | uni-teaser-P2 | timeout | 1500.2 |
| 12 | 262 | glm | glm-5.3-flash / medium | excalidraw-mcp-brief | ok | 192.6 |
| 13 | 263 | glm | glm-5.3-flash / medium | uni-teaser-P3-fixes | running (started 2026-10-12T23:53 UTC) | - |

Notes:
- Job 257 is in the history but not in the orders table (it was run directly on codex-a).
- Jobs 250 and 261 hit the 1500 s limit. Job 261 still left report-uni-P2.md, so its output was partial.
- Order 10 was reported STALLED in work/persian/report-codex-check.md; it was cleared by hand.
- Job 263 is the P3 fix round, which the 10-13 detail covers.

## 2. Commits (git log --since 2026-10-12, local times)

| Hash | Date (+0000 / +0330 as recorded) | Subject | Stat |
|---|---|---|---|
| f488708 | 10-12 09:43 +0330 | feat(persianarts-motion): v0.1 skill skeleton | 45 files, +3489 / -5 |
| 06234ad | 10-12 09:50 +0330 | docs(persianarts-motion): quality-ladder roadmap | 5 files, +165 / -45 |
| d2ad35d | 10-12 17:24 +0330 | docs: motion skill handoff note | 1 file, +38 |
| 3720c97 | 10-12 17:30 +0330 | docs: record owner decisions for motion skill | 1 file, +7 |
| d52b454 | 10-12 17:51 +0330 | docs: record vertical and social format requirement | 1 file, +6 |
| b2a16cb | 10-12 15:23 +0330 | feat(sound): music-first tooling and recorded-audio-only decision | 14 files, +1040 |
| 19da66e | 10-12 14:52 +0000 | docs(evals): draft pass-zero briefs and scorecard | 7 files, +280 |
| 7b33c18 | 10-12 19:32 +0000 | feat(film): portrait social test film (9:16) and probe | 10 files, +603 |
| 363ada8 | 10-12 19:36 +0000 | fix(film): centre the 16:9 list title slot | 1 file, +1 / -1 |
| f8bf69c | 10-12 19:59 +0000 | feat(sound): helper to save hand-picked Pixabay tracks | 4 files, +294 |
| 32e7991 | 10-12 20:05 +0000 | film v2: BPM-driven cut grid, pen scene job, ribbon strokes | 5 files, +129 / -41 |

Commit dates are as recorded by git. The 10-13 commits (bcc180b, c7c6d5d) are in the 10-13 detail.

## 3. Files created or changed (by area)

- Sound: sound/tools/fetch_pixabay_track.py (committed f8bf69c); work/persian/pixabay-queue-run.cmd; work/persian/pixabay-queue.ps1; work/persian/freesound_fetch.py; work/persian/freesound_fill.py; work/persian/jamendo_fetch.py.
- Music check: sound/library/bgm (7 files), sound/library/sfx (1580 files), total 1588 files in sound/library.
- Film v2 (social): work/persian/src/film/social/motion.ts (BPM 120 default, T0_S 0, CUT_BEATS [0,4,8,14,20,27,34]); work/persian/src/film/social/scenes.tsx; work/persian/src/film/social/entry.tsx; SocialFilm.tsx.
- Film versions (media/film-versions/pencil-social/): v2-beat124-music, v2-sfx-test, v2-silent, v3-a-k-1974-dolphins-in-my-bathroom-171146, v3-dogo-jump-1267515, v3-feeblom-electrhythm-1220424, v4-dogo-jump-1267515, v4-lnplus-597024, v4-miromax-513944 (names only; dates from file times on 10-13 local 00:35 to 01:02).
- Docs: docs/motion/ (skill handoff, decisions); docs/evals/ (pass-zero briefs, scorecard); evals rubric.md (8 criteria, tracked).

## 4. Key numbers

- Music: 0 instrumental tracks at 120-124 BPM in media/music-pixabay (needs 2). Library PASS tracks: bgm-tech-house 124.0 BPM (98.7 % match), house-vibez 122.0 BPM (98.2 %). FAIL: cat-walk 130.0, g-eazy-nba-type 86.7, tonight-hiphop 105.0.
- Film cut grid: CUT_BEATS [0,4,8,14,20,27,34] = 34 beats (17 s at 120 BPM).
- Sample films: none of the Social*.mp4 renders existed on disk at 23:41 local (work/persian/status-brief-2026-10-12.md).
- qh: codex-a 5h window 3 % used, week 39 %; codex-b 5h 0 %, week 54 % (work/persian/report-codex-check.md).

## 5. Scripts and commands used

- `node D:/P/tools/quota-hub/bin/qh.mjs orders` and `... history`.
- `pwsh -File work/persian/autosync.ps1` (commit + push every 5 minutes during batches).
- `node work/persian/progress.mjs` (regenerates work/persian/PROGRESS.md; 81 of 157 cards done at 23:41 local).
- `node sound/tools/music_map.py` (beat grid map; usage in status brief).

## 6. Defects and deviations

- Status brief at 23:41 local said rubric-v2 did not exist and that evals/README.md was stale. Commit bcc180b (10-13 00:20 local) added the draft.
- Film v2 renders were not on disk at the time of the status brief; renders are not in git.
- Untracked copy of the fetch script at media/music-pixabay/_tools/ differs from the committed one (line endings and first line).
- Jobs 250 and 261 timed out at 1500 s.
- Order 10 stalled (cleared by hand).
- Remote origin points at persiandoodle; AGENTS.md says PersianArts over SSH. Not changed.

## 7. Sources

- work/persian/status-brief-2026-10-12.md, work/persian/PROGRESS.md, work/persian/report-codex-check.md, work/persian/report-payoff-A1.md, report-payoff-A2.md, report-pixabay-queue-m1.md, report-pixabay-queue-m2.md.
- git log --since=2026-10-12 --shortstat.
- qh orders and qh history output.
- media/film-versions/**/VERSION.json (names and file times only).
