# Sound kit (tracked in git)

Curated base sound for any film, usable on a fresh clone with no downloads. Owner decision 2026-10-13: <= 60 MB, each file <= 2 MB.

## Layout
- `sfx/<category>/<id>.<ogg|mp3>`: categories follow `sound/library/sfx/TAXONOMY.md` (slide, typing, paper-pencil, whoosh, swoosh-transition, pop, bubble, click, tick-clock, ding-chime, success, fail, alarm-timer, boom-sub, stamp-thud, impact, riser, downlifter, stinger, sparkle-magic, glitch, camera-shutter, ambience, boing-cartoon, ui, misc).
- `music/<slug>.ogg` + `music/<slug>.music.json`: first 90 s of each track (source 0.0 s start, so the source beat grid and T0 stay valid). Sidecar = music_map output on the excerpt + `kit` block (source_grid, excerpt_grid, mood_tags, credit_line, licence, origin).
- `catalog.json`: one entry per sfx (id, category, path, duration_s, peak_dbfs, channels, source, tags, original_id, licence, doubt). `manifest.json`: original library path/id -> kit id/path and conversion (copy or ogg-q5).

## Ids
- `fs-<freesound id>` (fs-632472), `kn-<kenney name>` (kn-impactMetal_light_000), `op-<category>-<file>` (op-typing-click-01), `pr-<name>` (premix built for a film), `tr-<slug>` (music, tr-lnplus-597024).
- Music ids: tr-lnplus-597024 (110), tr-dogo-jump-1267515 (119.6, grid FAIL in source), tr-miromax-promo-513944 (118), tr-px-99s-d (118), tr-the-mountain-epic-610137 (110), tr-bgm-tech-house (124), tr-house-vibez (122).

## How a cue refers to a clip
- Cue sheets may keep the original `file` path. Resolve it to the kit with `manifest.json` (`original_path`), or cite the kit id and read `path` from `catalog.json`.
- Every clip used by the pencil cue sheets (media/film-versions/pencil-social v3 to v51, pencil-html v2) is in the kit.
- Entries with `doubt: true` were classified by folder name only; audition first. Synthesised anidoodle clips are preview-only and not in the kit.

## Rebuild the full library (untracked, about 1500 sfx + staged music)
- `pwsh -File sound/tools/restore_library.ps1` verifies the kit (default, no downloads).
- `pwsh -File sound/tools/restore_library.ps1 -Full` prints the plan; add `-Run` to execute: freesound_fetch / freesound_fill / freesound_payoff_fill (need `work/persian/.freesound.env` with your own FREESOUND_API_KEY), jamendo_fetch (needs `work/persian/.jamendo.env`), Internet Archive script, Kenney zips (CC0, pages in `sound/library/sfx/kenney/manifest.json`).
- Regenerate the kit: `sound/tools/kit/build.py` (sfx), `sound/tools/kit/music.py` (music, needs `sound/.venv` and the staged tracks).

## viditor additions (2026-10-13)
- Added tr-vd-7038-upbeat-slide (Viditor 7038, 100 BPM, grid PASS, 73 s, ogg 112 kbps, loudnorm -16 LUFS).
- Audit of the 24 listed tracks: 7 have local audio, 6 fail the grid, 17 files are missing. See docs/motion/knowledge/MUSIC-AUDIT.md.
- Variety matrix script: work/persian/tools/audio/kit_matrix.py (counts kit mood tags x tempo bands).
- Gaps still open: 70-90 BPM, calm/emotional, ambient/minimal (no track at all).
- Music index: sound/library/kit/music/INDEX.json (15 tracks); kit_matrix.py reads it. Bed-only tracks (grid FAIL, match >= 0.96) are flagged bed_only=true.
