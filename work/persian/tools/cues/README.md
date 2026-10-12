# Cue builders (copies)

Copies of the cue-sheet builders from `media/film-versions/pencil-social/`. The originals stay where they were; these copies are the tracked versions.

| File | Origin | Role |
|---|---|---|
| build_v4.py | v4-cues/_tools | Builds the v4 cue sheet (hook at absolute seconds, beat grid elsewhere) |
| make_cues_v5.py | v5-cues/_tools | Generates the v5 payoff event list from frames |
| build_v5.py | v5-cues/_tools | Builds `cues-9x16.json` for v5 |
| render_v5.sh | v5-cues/_tools | Shell helper used for the v5 renders (run under bash) |
| make_cues_v51.py | v51-cues/_tools | Generates the v5.1 event list (CTA copy B advanced) |
| build_v51.py | v51-cues/_tools | Builds `cues-9x16-v51.json` |

Notes
- These scripts were written for the pencil film. Before reuse, check the input and output paths they use (they point at the media folders, which are not in git).
- Run with `python -I` for Python files so that no local module shadows a standard library module.
- Output cue sheets go into a version folder under `media/film-versions/<film>/<version>-cues/`.
- See `docs/motion/PLAYBOOK-SOUND.md` sections 4 and 5 for the rules that the cues implement.
