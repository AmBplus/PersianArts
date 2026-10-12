# sound/library

In-repo audio library. Audio binaries (mp3, ogg, wav, flac, m4a, zip) are git-ignored; sidecars (`*.json`), indexes and docs are committed.

## Layout
- `bgm/` background music. `<slug>.mp3` (binary, ignored) + `<slug>.music.json` (sidecar, committed).
- `sfx/kenney/<category>/` Kenney CC0 sound effects, original filenames kept. `sfx/kenney/manifest.json` maps each file to pack, category, licence, author and source page. `sfx/kenney/licenses/` holds the pack licences.
- `sfx/<source>/<category>/` other sources (same categories as kenney).
- Categories: ui, pop, click, whoosh, impact, riser, stinger, ding, paper-pencil, ambience, misc (unsure -> misc).
- `sfx/INDEX.md` the sfx index. Zips and pack metadata stay in `media/sfx/`.

## Naming
- Slugs: lowercase, hyphens, no spaces (`cat-walk`, `house-vibez`). Sidecar = `<slug>.music.json`, or `<file>.source.json` for sfx sources.

## Sidecar fields (*.music.json)
- `file`, `md5_pcm`, `sample_rate`, `duration_s`, `bpm`, `t0`, `beat_s`, `beats_per_bar`, `n_bars`.
- `grid.verdict`: PASS or FAIL (beat-test from `sound/tools/music_map.py`), with `grid.match`, `grid.mean_abs_ms`, `grid.drift_ms`.
- Source page, licence, author and download date go in the sidecar when the track is ingested.

## How skills and examples reference tracks
- By path: `sound/library/bgm/<slug>.mp3`, with its timing read from `sound/library/bgm/<slug>.music.json`.
- A track is usable for beat-synced edits only when `grid.verdict` is PASS.

## Ingest rule for staged Pixabay tracks
1. Stage in `media/music-pixabay/` (filled by `sound/tools/fetch_pixabay_track.py`; never edit that folder by hand).
2. Run `python sound/tools/music_map.py <staged.mp3>`, which writes `<staged>.music.json`.
3. If `grid.verdict` is PASS: move the mp3 to `sound/library/bgm/<slug>.mp3` and the sidecar to `sound/library/bgm/<slug>.music.json`, adding source page, licence and author.
4. FAIL: keep the staged file out of the library, or re-run with `--hpss`.

## Fresh clone
Binaries are not in git. Re-fetch them with the tools: `sound/tools/fetch_pixabay_track.py` for Pixabay tracks, and the Kenney zips for sfx (listed in `media/sfx/kenney/<pack>/SOURCE.json`). Then re-run `music_map.py` if the sidecar is missing.

## sfx taxonomy and owner-pack (2026-10-13)

SFX categories and the mapping for every source are in `sfx/TAXONOMY.md`. The owner's imported SFX live in `sfx/owner-pack/`. The master catalog is `sfx/CATALOG.json` (human-readable: `sfx/CATALOG.md`).
