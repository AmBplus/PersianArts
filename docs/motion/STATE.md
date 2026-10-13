# STATE: 2026-10-13

Snapshot for a cold start. Paths are relative to the repository root (the folder that holds `AGENTS.md`).

## 1. Finished work

### 1.1 Pencil film (label `pencil-social`), versions from `media/film-versions/pencil-social/*/VERSION.json`
- v1 (9:16 silent, 17 s): pencil story (ugly line, practice, closing loop), cuts on a 120 BPM grid. Report: `work/persian/film-v1/report.md` (per the handoff; not re-read here).
- v2 (`v2-silent`, `v2-beat124-music`, `v2-sfx-test`): BPM-driven cut grid (`CUT_BEATS`), countdown scene, variable-width pen stroke (Ribbon), larger labels and art. Renders 4 ratios. Music: bgm-tech-house at 124 BPM, T0_S 0.24283 (track inferred, not recorded at mix time). SFX-only test with cues. Source commit `32e7991`.
- v3 (three music tests, 9:16 only): `a-k-1974` (120.009 BPM, T0 1.016), `dogo-jump` (119.595, T0 0.174), `feeblom-electrhythm` (118.0, T0 0.004). Cue sheet v2-sfx-test, 43 cues.
- v4 (cue sheet `v4-cues/cues-9x16.json`): `dogo-jump` (119.595, T0 0.174), `lnplus-597024` (110.0, T0 0.02722), `miromax-513944` (118.0, T0 0.15541). Bed -18 LUFS, ducking -3 dB, final -14 LUFS.
- v5 (`v5-cues/cues-9x16.json`): payoff cue sheet (stamp-in, ring pulses, final bow with tail). Music shifted two beats so the downbeat lands on the settle. Versions `v5-dogo-jump-1267515`, `v5-lnplus-597024`.
- v5.1 (`v51-cues/cues-9x16-v51.json`): fix round. CTA copy B advanced so the downbeat equals the settle; 80 ms crossfade at about 16.4 s. Versions `v51-dogo-jump-1267515`, `v51-lnplus-597024`.
- Payoff work: A1 (Hook stamp-in, Count clock full at 48, pen spark at 34) and A2 (Daily ring pulses, day-7 accent, CTA ring-out, CUT_BEATS last 34 to 36, film now 540 frames, 18 s). Reports: `work/persian/report-payoff-A1.md`, `work/persian/report-payoff-A2.md`. Stills: `media/film-versions/pencil-social/_stills-payoff/`.

### 1.2 Sound library
- `sound/library/` holds `README.md`, `bgm/` (5 sidecars and 2 mp3 binaries) and `sfx/`.
- SFX catalogue `sound/library/sfx/CATALOG.json` (generated 2026-10-12): 1564 entries. Sources: freesound 743, kenney 611, owner-pack 202, anidoodle 8 (preview-only, synthesised).
- Structure: `sfx/<source>/<category>/`, categories in `sfx/TAXONOMY.md` (ui, click, typing, slide, whoosh, swoosh-transition, pop, bubble, paper-pencil, stamp-thud, impact, riser, downlifter, stinger, ding-chime, success, ...). Usable = duration 0.2 to 8 s and peak at or above -12 dBFS. Nothing was auditioned; LUFS was not computed.
- Beat test: `sound/tools/music_map.py` and `grid_accept.py`. PASS in `sound/library/bgm`: house-vibez (122.0 BPM, match 98.2%), bgm-tech-house (124.0, match 98.7%). FAIL: cat-walk 130.0, g-eazy-nba-type 86.7, tonight-hiphop 105.0.
- Staging: `media/music-staging/` (not in git). `BPM-REPORT.md` covers 109 tracks (7 PASS, 102 FAIL, from the Jamendo and archive.org staging). Owner-folder sidecars (about 50 tracks) carry their own verdicts.

### 1.3 Render pipeline
- `work/persian/render_all.ps1` (4 ratios in parallel, concurrency 2 each, bundle cache, silent cache, preview and stills modes, native or bt709 output). Test renders: `media/film-versions/pencil-social/_bench-4/render-report.json` and `_bench-5/render-report.json` (parallel 4, concurrency 2, bundle cache hit).
- Measured timings: `work/persian/render-speed-brief.md` and `work/persian/_bench/results.csv` (the `_bench` folder is git-ignored).
- Chosen defaults: bundle once, four ratios in parallel, native single encode, `--gl=angle`, concurrency 9 for a single render.

### 1.4 uni-admissions teaser (label only)
- P0 (setup, 24 s, 720 frames, 8 scenes, navy on cream): done. 9 stills in `media/film-versions/uni-admissions/_stills-P0/`. Report `work/persian/report-uni-P0.md`.
- P2 (all 8 scenes animated, emblem from gitignored `public/uni-local/`): done. 18 stills in `media/film-versions/uni-admissions/_stills-P2/`. Report `work/persian/report-uni-P2.md`. B5a (malformed rank) deliberately not rendered (HOLD).
- P1 and P3 and later: not started (no logo or QR, no music, no long cut, no cue sheet).
- Client material lives only in git-ignored `media/briefs-local/`.

### 1.5 rubric-v2 (draft)
- `evals/rubric-v2.md`: nine criteria (hierarchy, theme, anti-slideshow, rhythm, story or object, sound alone, sound under speech and sync, Persian typography, safe area and legibility), calibration table against the owner's 12 reference samples.
- Status: draft, not owner-approved. Weight 1.5 for criteria 5 to 7 and a cap of 6 for the slideshow score are proposals.
- Commit status of `evals/` was not checked by this document.

### 1.6 Prompt-design brief
- `work/persian/prompt-design-brief.md` (copy in `research/`): three concepts for the uni teaser; recommended concept c (24 s, 9:16, pencil and six proof beats). Gives the prompt template (section 3), copy condensing rules (section 4), the refiner recipe (section 5), acceptance checks (section 6) and the production plan P0 to P6 (section 7).

## 2. In progress
- Nothing is running that this document knows of. Check `qh orders` before starting.

## 3. Open owner decisions
1. rubric-v2: confirm weight 1.5 for criteria 5 to 7 and the slideshow cap of 6, or reject.
2. Repo remote: `origin` = `git@github.com:AmBplus/PersianArts.git` (SSH, set by owner 2026-10-13). Push works over SSH with BatchMode and no prompt.
3. `media/dana/` shows deletions and a modified mp4 in git status (fonts, music). Owner to decide whether these deletions are intended.
4. Sound listening feedback on v5.1 (both tracks) and on the SFX picks.
5. Track conflict: `dogo-jump-1267515` is FAIL in its sidecar and in BPM-REPORT (match 91.3%), yet it was used in v3 to v5.1. `feeblom-electrhythm` is also FAIL. The earlier brief listed both as PASS; the sidecars do not. Owner to confirm.
6. Uni teaser: owner confirmation of rank and superlative strings (prompt brief step 10) and whether the film may go public.
7. Pixabay tracks: owner to download by hand with `sound/tools/fetch_pixabay_track.py` (120 to 124 BPM, instrumental). Not automated.

## 4. Known defects
- v2 (from the handoff): the phrase "آرام بنویس" breaks into two lines at 9:16; daily-list text is busy and shaky; end loops overlap at 1:1; the pen covers the tick circles in scene 5 briefly; the large counter sits beside the small pen at 16:9.
- v5 payoff: case 2 (day-7 accent) not fully timed; A2 notes say the pen nib crosses the day-7 tick for about 2 frames at 1:1 (around local 64).
- Cue sheet v4 gain bug: cross-out cue at +11 dB (probably wrong); v5 recomputes but gains must be measured.
- Owner copy mismatch: the owner writes a Persian word for "ugly" on the hook; the screen shows the same word with a question mark. Keep screen text unless the owner says otherwise.
- Render gap: `npx remotion benchmark` and per-frame profiling were not run; the hot-frame list is not measured.
- Doc-level gaps: `work/persian/src/...` has no `package.json` in some listings; check before rendering on a fresh checkout (handoff section 5).
- BPM-REPORT verdicts and the PASS list in older briefs disagree (see open decision 5).

## 5. Next steps (in order)
1. Owner: decide open items 1 to 5 above.
2. Owner: listen to v5.1 with the checklist in `PLAYBOOK-BUILD-MOTION.md` step 10 and record scores in `calibration/owner-feedback.md`.
3. Worker order: re-run the beat test on any new track (`sound/tools/music_map.py`) before use.
4. Worker order: rubric-v2 review by an independent Sonnet reviewer on the reference samples; check the acceptance bands in `evals/rubric-v2.md`.
5. Worker order: payoff A3 (Pen and Slow scenes) if the owner wants it; then cue sheet v6 and mix.
6. Uni teaser: P1 (logo and QR) only after owner confirms the copy strings.
7. Render: profile the slow frames (`--log=verbose`) and test the shared-memory path on this machine (see `PLAYBOOK-RENDER.md`, open experiments).
