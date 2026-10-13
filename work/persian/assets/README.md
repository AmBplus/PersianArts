# assets

Portable, committed assets that the Persian films need at render time.

- `fonts/` holds the TTF files that films load with `staticFile("fonts/...")` (Vazirmatn and Estedad), plus `fonts/OFL-NOTICES.md` for their licences.
- Nothing here is generated; these files are copied unmodified from `media/dana/src/live/public/fonts/`.
- The `pa` setup step copies this folder into `workbench/public` so the render can resolve `staticFile` paths.
- Do not edit the font files; add new fonts here only together with a line in `fonts/OFL-NOTICES.md`.
- The source copy in `media/dana` is read-only for this folder and is never modified by it.
