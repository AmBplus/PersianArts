# Status brief 2026-10-12 (re-issued after ff to origin/main)

Local main fast-forwarded to origin/main 32e7991 (no merge conflicts, media/dana untouched). 19da66e, 7b33c18, 363ada8, f8bf69c are ancestors of main.

## a. Music (media/music-pixabay)
- Folder holds NO tracks and no txt sidecars. Only `_tools/` (FETCH-PIXABAY.md 1703 B, fetch_pixabay_track.py 8475 B).
- Instrumental tracks at 120-124 BPM in this folder: 0 (needs >=2, not met).
- Usable PASS tracks are in sound/library/bgm instead (see b).
- music_map.py usage: `python sound/tools/music_map.py track.mp3 [--out track.music.json] [--click click.wav] [--bars 4] [--hpss]`.
- fetch script: committed at sound/tools/fetch_pixabay_track.py (commit f8bf69c, CRLF). A different untracked copy sits at media/music-pixabay/_tools/ (LF; differs from line 1).

## b. PASS tracks in sound/library/bgm (verdict from sidecar JSON)
- bgm-tech-house: PASS, 124.0 BPM (98.7 % match, from handoff)
- house-vibez: PASS, 122.0 BPM (98.2 %, from handoff)
- FAIL: cat-walk 130.0; g-eazy-nba-type 86.7; tonight-hiphop 105.0.
- Instrumental status is not recorded in the sidecars; not verified.

## c. Film v2 (work/persian/src/film/social/motion.ts)
- Present: BPM (default 120, prop-overridable), T0_S (default 0), CUT_BEATS = [0,4,8,14,20,27,34], AUDIO_SRC (currently undefined).
- Film v2 renders (Social*.mp4): none found on disk. Only the entry (social/entry.tsx) and SocialFilm.tsx exist. Renders are not in git.
- Older work/persian/out/*.fa.mp4 files exist; some are tracked (e.g. word-relay-filmstrip).

## d. Rubric
- rubric-v2: does NOT exist (neither committed nor untracked).
- evals/rubric.md (tracked) has 8 criteria, not 9, and no 'character' criterion, so there is nothing to make optional yet:
  1. Hierarchy and one hero per frame
  2. Consistency with theme and art direction
  3. Scene differentiation, anti-slideshow
  4. Rhythm and energy curve
  5. Music and SFX sync (cuts within 3 frames of beat)
  6. Persian typography quality
  7. Whitespace, legibility, multi-aspect safe zone
  8. Specificity (could it be about any other topic?)
- evals/README.md still says "not committed yet"; that is stale (rubric.md is tracked).

## e. Git
- Status: 35 entries. Top 15:
  - M media/dana/Dana-v31.mp4
  - D media/dana/music/*.mp3 (7 files)
  - D media/dana/src/live/public/fonts/*.ttf (19 files; first 15 shown below)
  - ?? .mimosa/, .playwright-mcp/, media/_contact_sheets/, media/motions-sample-full/, media/motions_sample_short_video/, media/music-pixabay/, work/persian/commit-locate-brief.md, work/persian/status-brief-2026-10-12.md
- Last 3 commits: 32e7991 film v2: BPM-driven cut grid, pen scene job, ribbon strokes, bigger labels and art; f8bf69c feat(sound): helper to save hand-picked Pixabay tracks via your own browser; 363ada8 fix(film): centre the 16:9 list title slot.
- Remote: origin = https://github.com/AmBplus/persiandoodle.git (fetch and push). AGENTS.md specifies git@github.com:AmBplus/PersianArts.git over SSH. Mismatch; flag to owner.

## f. Commands and what is missing on this machine
- music_map on one track (from repo root): `python sound/tools/music_map.py "<path>/track.mp3" --out sound/library/bgm/<name>.music.json --click <name>-click.wav`
  - Missing: no venv (sound/.venv and .venv absent); pip install -r sound/requirements.txt not verified. System Python is 3.14.7.
- Render film with props (Windows, node in work/persian): `npx remotion render ../film/social/entry.tsx Social9x16 out.mp4 --props='{"BPM":124,"T0_S":0.25}'` (per motion.ts header; run from work/persian/src; composition ids Social9x16, Social1x1, Social4x5, Social16x9).
  - Missing: work/persian/package.json absent, no node_modules, so remotion is not installed; cannot render yet.
  - Missing: work/persian/public/fonts symlink (work/persian/public does not exist).
- ffmpeg audio mix: no mix tool exists (mix_sfx is listed as not yet built in the handoff). Proposed, untested: `ffmpeg -i film.mp4 -i track.mp3 -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -shortest -c:v copy -c:a aac -b:a 192k out.mp4`
  - ffmpeg is on PATH: 7.1-essentials (handoff says 8; mismatch).
- work/upstream/comps.txt exists (present).

Not verified: librosa and other sound requirements are installed; whether bgm tracks are instrumental.
