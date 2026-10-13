REPORT o3 — TASK B (scripts/link-persian-shotcraft-media.mjs only)

WHAT I CHANGED (only that file):
- Env overrides: OUT_ROOT (input dir, default work/persian/out), DRY_RUN=1 + DRY_ROOT (writes outputs to DRY_ROOT instead of library/, skips entry-media.json), CARDS (comma list filter).
- ONLY_STATUS (comma list) + KEEP (comma list of slugs): cards whose status in work/persian/progress.json (default "localized") is not listed and not in KEEP are skipped and pushed to report.skipped.
- Sound variant: for each <Stem>.fa.mp4, if <Stem>.fa.sound.mp4 exists in OUT_ROOT/<card>/ it is used as the encode source instead.
- Audio bitrate changed 128k -> 96k (per order: AAC 96k); H.264 CRF22 ladder / yuv420p / faststart / <2 MB kept unchanged.

ACCEPTANCE (temp OUT_ROOT=work/persian/sound-task/tmp-accept/out; copies of RadialWave.fa.mp4, also as RadialWave.fa.sound.mp4, plus BezierSourceConvergeMerge.fa.mp4; status: radial-wave=approved, bezier-source-converge-merge=fixed):

1) node --env-file=.../tmp-accept/accept.env scripts/link-persian-shotcraft-media.mjs
   (env: OUT_ROOT=tmp out, DRY_RUN=1, DRY_ROOT=tmp dry, CARDS=radial-wave,bezier-source-converge-merge, ONLY_STATUS=approved)
   -> {"cards":1,"variants":1,"encoded":1,"skipped":["bezier-source-converge-merge"],...}  # approved card packaged from .fa.sound.mp4, non-approved skipped

2) same + KEEP=bezier-source-converge-merge
   -> {"cards":2,"variants":2,"encoded":1,"skipped":[],...}  # KEEP overrides ONLY_STATUS

3) sound copy removed, dry dir cleaned, env CARDS=radial-wave
   -> {"cards":1,"variants":1,"encoded":1,"skipped":[],...}  # plain .fa.mp4 fallback works

Probe of packaged preview: "h264,yuvj420p" + "aac" (yuvj420p = yuv420p full-range tag, same as existing library files; stream bit_rate reads 2285 but existing old-script library files show identical value, so not a regression).
Library untouched: entry-media.json mtime unchanged (2026-10-12 02:05:47); no files under library/media/shotcraft/radial-wave newer than session start.

DOUBTS:
- Dry-run outputs left in work/persian/sound-task/tmp-accept/ as evidence (~5 MB incl. accept.env + run-accept.sh); delete if unwanted.
- The dry run has no flag named "OUT_ROOT dry run" for entry-media.json other than DRY_RUN=1; with DRY_RUN unset and OUT_ROOT overridden it would still write library/ (by design).
- ffprobe reports audio bit_rate ~2.3 kbps on these clips (also on pre-existing library files); source clips carry near-silent audio tracks; the -b:a 96k flag is verifiably in the encode args.
