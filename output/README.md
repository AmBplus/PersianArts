# output/ : finished films, one place

Finals go here, and only here. Work area and archive: `media/film-versions/` (never hand-place finals elsewhere).
- `output/<film>/<version>/`: hardlinks of the final files, named `<film>-<ratio>-<version>.mp4` (`-silent` if no sound), `<film>-<version>-stills.jpg` if a contact sheet exists, and `OUTPUT.md` (plain-language summary).
- `output/LATEST/`: `<film>-<ratio>.mp4` = newest version with sound for that film and ratio. Open this first.
- `output/INDEX.md`: generated table of all films and versions.
- Deliver: `pa deliver <film> <version>` (add `--dry-run` to preview). It is the last step of every film.
- Rebuild LATEST and INDEX: `pa deliver --rebuild`. List the index: `pa deliver --list` (or read INDEX.md).
- Everything under output/ is git-ignored except this README (rule in .gitignore).
- Tool: `work/persian/tools/deliver/deliver.mjs`.
