# Viditor music audit (2026-10-13)

Scope: the 24 tracks in work/viditor-reference/music-standalone.json. Data: docs/motion/knowledge/music-audit-viditor.json.

## Counts
- Listed: 24. Audio present locally: 7 (5570, 5598, 5729, 5775, 5881, 7038, 5720). The other 17 have no file in work/viditor-reference/assets/audio (the listed path assets/music-standalone/ does not exist here). Rejected for that reason: 17.
- Usable (audio present): 7. Grid PASS: 1 (7038, 73 s, 100 BPM, match 1.0, drift 1.4 ms).
- Rejected on grid FAIL (match < 0.98 or drift > 5 ms): 6 (5570, 5598, 5729, 5775, 5881, 5720). Their beats are plausible but not tight enough for a locked film grid.
- Added to kit: 1 (tr-vd-7038-upbeat-slide).

## Method
- Decoded m4a to 44.1 kHz stereo WAV in media/music-staging/viditor/ (git-ignored), then sound/tools/music_map.py.
- Loudness and range come from the listing metadata (not re-measured). Vocal, bass, centroid and loop checks were NOT run (time box).

## Gap matrix (kit tracks by tempo band, before -> after)
- Before (7 tracks): 70-90: 0 | 90-110: 0 | 110-124: 6 | 124-140: 1
- After (8 tracks): 70-90: 0 | 90-110: 1 | 110-124: 6 | 124-140: 1
- Empty or weak: 70-90 (empty), 90-110 (one track), 124-140 (one track); no calm, emotional/piano, or ambient/minimal track in the kit.
- Script: work/persian/tools/audio/kit_matrix.py (counts by kit mood_tags x tempo band).

## Recommendation
- The listed set cannot fill the matrix on its own. Fetch the 17 missing audio files, or audit the 30 other staged tracks (5607, 5717, 5761, 5945, 5961, 6807, 6992, 6998, 7072, 7093 have grid PASS) under a separate order.
