# PLAN (progress) — library design system
# see PLAN-library-design-system.md
# 21:45 plan written; python path resolved
# 21:47 enumeration: 39 typography dirs, 212 shotcraft techniques under 156 top-level categories; posters are 1920x1080 (not 960x540)
# 21:50 analyze-posters.py written (median-cut 5 palette, luminance, ink/type band, 5 devices)
# 21:52 fixed median_cut (array equality), type band selection = tallest band, line pitch by autocorrelation
# 21:54 calibrated devices on real posters (read assembly/chipcycle): house navy #0D1D2C plate + grid + inset frame
# 21:55 fixed dotgrid -> texture_periodicity (autocorr), radius -> largest smooth component + diagonal walk
# 21:56 full run: 251 posters in 36 s -> work/persian/tools/cards/out/posters.json
# 21:59 fixed border detector (x/y axes swapped) -> has_border 31.5% overall, 89.7% typography
# 22:00 summarize.py: palettes (18 families), type-scale, devices CSVs + stats.json
# 22:02 contact sheets rebuilt via concat lists (list-typography.txt 39, list-shotcraft.txt 212)
# 22:05 deliverables written: library-design-system.md, library-design-system-report.md, 3 CSVs
# DONE
