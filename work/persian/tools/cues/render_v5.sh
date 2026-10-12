#!/bin/bash
# Render silent 9:16 Social film for both v5 versions (run from workbench).
R=/d/P/project/persianArts/media/film-versions/pencil-social
cd /d/P/project/persianArts/work/persian/src/workbench || exit 1
npx remotion render ../film/social/entry.tsx Social9x16 "$R/v5-lnplus-597024/silent_raw.mp4" --props='{"BPM":110,"T0_S":0.02722}' --log=error > "$R/v5-lnplus-597024/render.log" 2>&1
echo "lnplus exit $?" >> "$R/v5-cues/render_status.txt"
npx remotion render ../film/social/entry.tsx Social9x16 "$R/v5-dogo-jump-1267515/silent_raw.mp4" --props='{"BPM":119.595,"T0_S":0.174}' --log=error > "$R/v5-dogo-jump-1267515/render.log" 2>&1
echo "dogo exit $?" >> "$R/v5-cues/render_status.txt"
