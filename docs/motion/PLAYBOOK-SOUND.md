# PLAYBOOK-SOUND: sound library, music selection, cues, mix

## Sound kit (tracked)
- Where: `sound/library/kit/` (README there). Tracked in git, curated, at most 60 MB total and 2 MB per file (owner decision 2026-10-13, D-20261013-28). Currently about 17.6 MB.
- Content: 304 sfx in `sfx/<category>/` (every clip used by the pencil cue sheets plus 8-15 candidates per taxonomy category) and 7 music excerpts (first 90 s) in `music/` with beat grid sidecars.
- Ids: `fs-<freesound id>`, `kn-<kenney name>`, `op-<category>-<file>`, `pr-<premix>`, `tr-<music slug>`. `kit/catalog.json` lists them with path, duration, peak, source; `kit/manifest.json` maps original library paths to kit ids.
- Rebuild the full untracked library: `pwsh -File sound/tools/restore_library.ps1 -Full [-Run]` (needs your own `work/persian/.freesound.env` / `.jamendo.env`; default mode only verifies the kit).
- Budget and git: `work/persian/tools/checkpoint.ps1` commits kit audio up to 2 MB; the rest of `sound/library/**` audio stays ignored.

## 1. Library structure
- `sound/library/README.md`: layout, sidecar fields, ingest rule for staged Pixabay tracks, fresh-clone notes.
- `sound/library/sfx/TAXONOMY.md`: one category vocabulary for every source (ui, click, typing, slide, whoosh, swoosh-transition, pop, bubble, paper-pencil, stamp-thud, impact, riser, downlifter, stinger, ding-chime, success, ambience, misc).
- `sound/library/sfx/CATALOG.json` (1564 entries, machine readable) and `CATALOG.md` (human readable, per category and source). `INDEX.md` for the Kenney index.
- Layout: `sound/library/sfx/<source>/<category>/<file>`. Music: `sound/library/bgm/<slug>.mp3` plus `<slug>.music.json`.
- Binaries (mp3, wav, ogg, flac, m4a, zip) are git-ignored. Manifests, catalogues and docs are tracked.

## 2. Sources and what was fetched (counts from CATALOG.json)

| Source | Entries | Licence and notes |
|---|---|---|
| Kenney | 611 | CC0 packs, no attribution. Manifest `sfx/kenney/manifest.json`. |
| Freesound | 743 | Per-sound licence; the fetch scripts take CC0 only. Manifest `sfx/freesound/manifest.json`. |
| Owner pack | 202 | Owner's own recordings (`sfx/owner-pack/`). |
| anidoodle | 8 | Preview-only, synthesised. Do not treat as final. |
| Music (library) | 2 PASS mp3s, 5 sidecars | house-vibez (122 BPM), bgm-tech-house (124 BPM); cat-walk, g-eazy-nba-type, tonight-hiphop are FAIL. |
| Music (staging, git-ignored) | about 109 Jamendo and archive.org tracks plus owner-folder tracks | `media/music-staging/BPM-REPORT.md`; sidecars per track. |

Sources: fetch-script usage is in section 7.

## 3. Music selection rules
1. Beat test on every candidate: `python sound/tools/music_map.py <track.mp3> --out <track>.music.json [--click <name>-click.wav] [--bars 4] [--hpss]`. Add `grid_accept.py` for the verdict if needed.
2. PASS means `grid.verdict` is PASS in the sidecar. Only PASS tracks are used in a film. FAIL tracks stay out of the library.
3. Target range: 110 to 128 BPM (120 to 124 best). Instrumental only.
4. PASS examples: bgm-tech-house 124.0 (match 98.7%), house-vibez 122.0 (98.2%). Sidecars in the owner folder show PASS for lnplus 597024 (110.0, match 99.6%), miromax 513944 (118.0, match 100%), and several others (nastelbom 602518 at 110, px-99s-d at 118, the-mountain 610137 at 110).
5. Conflicts to resolve with the owner: dogo-jump 1267515 (119.59) and feeblom 1220424 (118.0) are FAIL in their sidecars and in BPM-REPORT, yet v3 to v5.1 used them. Do not add new films on FAIL tracks without an owner decision.
6. A PASS track is moved to `sound/library/bgm/` with its sidecar (source page, licence, author, download date). Staging copies stay in `media/music-staging/`.

## 4. Cue-sheet rules (from `work/persian/payoff-brief.md`)
1. Every build-up gets a payoff. A squash, riser, digit roll, ring fill or pen hop ends in a hit with a sound on the hit frame, or in a deliberate decay.
2. Every ending gets a resolution: a stinger or chime on the final knot and a ring-out tail of 1 to 1.5 s. The last picture frame stays on screen.
3. Sound lands on the visual contact frame. Visual may anticipate by 1 to 2 frames. Sound is never earlier than contact and never later than one frame after it.
4. Silence only as a deliberate pre-hit beat (4 frames or fewer, about 130 ms) or after a ring-out tail. Silence over 0.5 s before a cut is a bug.
5. One accent per scene, bigger on the final occurrence (+30 to 50% visual scale, +4 to 8 dB sound weight).

Cue times: t = T0 + beat * 60 / BPM (for example BPM 120 gives 0.5 s per beat). Build cues from frames, not from old numbers.

## 5. Payoff recipes (layers with millisecond offsets vs contact H)
- **stamp-in**: pre-hit lift (scale 1.9 to 1.0 over 8 frames), contact at H with squash (scaleY 0.9, 4 frames) and overshoot 1.04. Sound: transient tap at 0 ms, sub boom at 0 ms, ink splat at +60 ms.
- **ring-pulse**: ring expands from 0.3 to 0.9 of the row height with outExpo over 14 frames, opacity 0.5 to 0. Sound: soft ding at 0 ms at -18 dB, tap on the tick. Accent: two rings, +30% size, bell ding.
- **shake-ring (bell)**: small bell or crown shakes 10 px over 8 frames at H. Sound: bell ding at 0 ms, transient tick at 0 ms, ring-out tail 1.2 s.
- **final-bow**: bow settles at H (outBack), straight pen, stinger 0 ms plus chime 0 ms, sparkle +150 ms, paper flash 0.25 over 3 frames, fade over the tail.
- Swoosh that accompanies a wipe starts at cut minus 5 frames (about -167 ms at 30 fps) and peaks at the cut.

## 6. Mix recipe
- Music bed at -18 LUFS (integrated).
- Duck the bed by -3 dB over 150 ms under impact, stamp, stinger, ding and success cues.
- Final mix at -14 LUFS integrated, true peak at or below -1 dBTP (v4 and v5 used -1.5 dBTP, which meets this).
- Exponential tail below -50 dBFS at the end of the film.
- The music must end on a downbeat (bar boundary).
- Measure before signing off: `ffmpeg ... loudnorm` print for integrated loudness and true peak.
- Scripts: `work/persian/mix_sfx.ps1` (cue sheet onto the film, ffmpeg only, video copy, AAC 192k 48 kHz) and `work/persian/mix_film.ps1` (music bed from the track sidecar `t0`, two-pass loudnorm).
- Example: `pwsh -File work/persian/mix_film.ps1 -Film <silent.mp4> -Track sound/library/bgm/<slug>.mp3 -T0 <T0> -Out <out.mp4>`.
- Example: `pwsh -File work/persian/mix_sfx.ps1 -Film <silent.mp4> -Cues <cues.json> -BPM <bpm> -T0 <T0> -Out <out.mp4>`.

## 7. Fetch scripts (names, paths and env files only; no secrets here)
- `work/persian/freesound_fetch.py`: CC0 SFX previews from the Freesound API v2 into library staging. Run from repo root: `python work/persian/freesound_fetch.py [--per-category 25] [--categories paper-pencil,whoosh] [--minutes 18]`. Resumable. Credentials: `work/persian/.freesound.env` (git-ignored, key name `FREESOUND_API_KEY`).
- `work/persian/freesound_fill.py`: fills category gaps. `python -I work/persian/freesound_fill.py [--per-category 20] [--categories a,b] [--minutes 22]`.
- `work/persian/freesound_payoff_fill.py`: pencil and payoff strokes. `python -I work/persian/freesound_payoff_fill.py [--minutes 18]`.
- `work/persian/jamendo_fetch.py`: CC BY and CC BY-SA instrumental tracks from the Jamendo API v3. `python -I work/persian/jamendo_fetch.py --limit 100 --out media/music-staging/jamendo`. Credentials: `work/persian/.jamendo.env` (git-ignored, variable name `JAMENDO_CLIENT_ID`).
- `sound/tools/fetch_pixabay_track.py`: manual Pixabay download in the owner's visible Chrome. The owner solves any check by hand. Max 5 URLs per run, only `pixabay.com/music/...` URLs. Not automated; see `sound/tools/FETCH-PIXABAY.md`.
- Do not automate Pixabay scraping: its terms forbid robots and bulk extraction. The unattended queue runner `work/persian/pixabay-queue.ps1` exists but is not checked against those terms; prefer manual.

## 8. Codex imagegen how-to (summary of the memory note, not verbatim)
- Image generation uses the built-in Codex `$imagegen` skill (gpt-image-2) on the owner's ChatGPT accounts (codex-a, codex-b). No API key and no image MCP server are needed.
- Output is raster only (PNG). No SVG, and no size or quality flags on the built-in path.
- Call: ask a worker to run `codex exec` with the account's `CODEX_HOME`, and name `$imagegen` in the prompt, with exact output files and sizes. Originals land in the account's `generated_images` folder.
- After generation: Pillow to resize to exact sizes, and check mode and alpha. Transparency is only requested in the prompt; check the alpha fraction and clean halo specks with a mask.
- Prompt wording that worked: "no gradients, no texture, solid fills, max 5 colours", plus a hex palette. Without that, output came out ornate.
- SVG: hand-write icons and shapes, or vectorise a raster with vtracer or potrace in a venv outside the repo. For animation, split into `<g id>` layers and use `pathLength="1000"` outlines for draw-on.
- Test once on a small order before relying on it (the brief lists one test as the next step).
- Client logos or posters go only into git-ignored `media/briefs-local/`.
- Model routing: the lead does not pick models by hand; follow the quota-hub routing rules.

## 9. Portability: audio does not travel via git (known gap, OPEN)
- Symptom: a fresh clone has no sfx or bgm binaries, no `hit-stamp-sub.wav`, and no `media/film-versions/**` outputs; `pa.ps1` skips the sfx/bgm links because `work/persian/assets/audio/{sfx,bgm}` do not exist.
- Cause: audio binaries are gitignored (`.gitignore:53-58` for `sound/library/sfx`, `:97-99` for `media/film-versions/**`). `make_cues_v51.py` needs `hit-stamp-sub.wav`, which is only on the machine where it was made.
- What is in git: `work/persian/sound-task/samples` (26 WAV and 3 sample MP4, commits 1546763, 658d2c5, 76fa483), `media/dana/music/*.mp3` (10 tracks), and the sfx catalogs and manifests.
- Unverified: the original binaries presumably still exist on the machine where they were made.
- Consequence: the v51 mix cannot be reproduced on a fresh machine until a transfer path is chosen (options: a `PA_PRIVATE_DIR` audio subfolder, a shared folder, or small allowlisted audio under `work/persian/assets/audio` with a size cap).
- Status: OPEN, decision pending owner/lead. Record: `docs/motion/reports/2026-10-13/audio-gap-record.md`; DECISIONS `D-20261013-12`.

## How to make the sound (the pencil method) with the builder

Runs only on the owner's word (owner gate): no sound work starts, and `pa sound` is not run, until the owner says so in chat for this film.

1. Get the silent render and its events: contact frames of every visual hit, the cut frames, bpm and t0 of the cut grid (`contracts/schemas/events.schema.json`; example `sound/tools/mixer/examples/pencil-v2.events.json`). Mark the final settle `role:"final"`.
2. Type every event (`stamp hit thud ring tick bell count-tick whoosh transition settle riser reveal ambient pop slide typing success fail glitch`); use `variant` for special cases and `dur_s` for strokes and risers. Payoff rule: every build-up gets a hit on the contact frame.
3. Pick the bed: a kit music id (`sound/library/kit/music/*.music.json`, e.g. `tr-lnplus-597024`). Rules: `sound/tools/mixer/rules.default.json` (copy and edit for a new film; never edit the kit).
4. Build: `pwsh -File work/persian/tools/pa.ps1 sound -Film <silent.mp4> -Events <events.json> -Track <id> -OutDir <dir>` (or `sound/.venv/Scripts/python.exe -I sound/tools/mixer/build_sound.py ...`, add `--bpm/--t0` when the film grid differs from the track map).
5. Read `<dir>/verify.json`: about -14 LUFS, true peak <= -1.0 dBTP, last 0.25 s < -50 dBFS, audible simultaneous <= 3, no clip used more than 3 times, audio length within one frame, payoff offsets 0 ms, downbeat on the settle, cut-to-beat errors listed; `events_without_rule` must be empty.
6. Listen and review the cue table (`cues-resolved.json`); fix rules or events, rebuild. For a regression check against an older mix use `sound/tools/mixer/compare_sound.py` (LUFS/TP/tail, cue deltas, envelope correlation, band energy).
7. Copy the result into `media/film-versions/<film>/<version>/` with VERSION.json; record any systematic finding in LESSONS-LEDGER/DECISIONS. Proof of method: html v2 rebuilt from events with the default rules: LUFS -14.1 vs -14.1, TP -2.1 vs -2.4, tail -inf both, payoff cues within 0.3 ms, 0.25-s-framed RMS envelope correlation 0.999 (not identical: beat-locked pen/pop cues moved to contact frames, one subtitle-bubble cue omitted, kit ogg instead of original mp3/wav).


## Lessons 2.5 (conference teaser v1-v5)
- build_sound: only `role: "final"` / `ends_film: true` ends the bed (schema events.schema.json); self-check fails on a silent bed > 1.5 s; regression: `python sound/tools/mixer/test_build_sound.py`.
- Continuity gate: `pa audio-check <final.mp4> --transitions t1,t2,...` (RMS jump <= 3 dB at cuts, no gap > 0.5 s < -40 dB, tail < -50 dBFS, TP <= -1.0, -14..-15 LUFS).
- TV order: silent video to TV-safe first, mux audio once; trim = volume + `alimiter level=disabled`; re-measure true peak after the last step.
