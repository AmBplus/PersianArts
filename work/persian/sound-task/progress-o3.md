PLAN:
1. Read order2.md TASK B and scripts/link-persian-shotcraft-media.mjs.
2. Implement TASK B edits in the script.
3. Run acceptance (dry run radial-wave to temp OUT_ROOT, ONLY_STATUS=approved check) and write report-o3.md.

DONE: step 1 read order2.md TASK B + script; radial-wave status=approved, has RadialWave.fa.mp4, no sound variant yet.
DONE: step 2 edits applied: OUT_ROOT/DRY_RUN(DRY_ROOT)/CARDS/ONLY_STATUS/KEEP env support, sound-variant preference, AAC 96k, report.skipped, entry-media.json skipped in dry run.
DONE: step 3 acceptance: RUN1 ONLY_STATUS=approved -> radial-wave encoded, bezier(fixed) skipped; RUN2 +KEEP -> bezier also packaged; RUN3 plain .fa.mp4 fallback encoded; probes h264+aac; library/ untouched (entry-media.json mtime unchanged, no files newer in library/media/shotcraft/radial-wave).
