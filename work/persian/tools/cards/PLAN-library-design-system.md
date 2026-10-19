# PLAN — library visual-design-system measurement

Time box: 35 min. Repo D:\P\project\persianArts. Read-only over library/**.

## Steps
1. Enumerate typography (39) + reference/shotcraft (2-level) folders; read every meta.json -> table.
2. Write `work/persian/tools/cards/analyze-posters.py` (Pillow+numpy): median-cut 5-colour palette,
   mean luminance, luminance histogram spread, bg/fg contrast ratio, dominant-bg frame fraction,
   type-block height via row ink profile, device detection (dotgrid, accent, radius, glow, border).
3. Sample >= 120 typography + shotcraft posters (aim: all).
4. Aggregate: palette clustering, luminance bimodality, type ratio distribution, device percentages.
5. Cross-check vs beauty-rules.csv + palettes.csv (read-only).
6. Emit deliverables:
   - media/briefs-local/storylab-beauty/library-design-system.md
   - media/briefs-local/storylab-beauty/library-palettes.csv
   - media/briefs-local/storylab-beauty/library-type-scale.csv
   - media/briefs-local/storylab-beauty/library-devices.csv
   - media/briefs-local/storylab-beauty/library-design-system-report.md
   - media/film-versions/_cmp/sheet-typography.png, sheet-shotcraft.png (ffmpeg concat)
7. Send result to parent session.

## Constraints
- No writes/moves/deletes under library/**. No edits under .claude/skills/persian-arts/beauty/data/**. No git.

## Progress log
- 21:45 plan written; python = C:\Users\Amir\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe
