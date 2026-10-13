#!/usr/bin/env bash
# Experiment 2: Remotion frame capture format (png vs jpeg q80/90/95) on Social9x16.
# Usage (repo root): bash work/persian/tools/render/exp_frame_format.sh <passLabel>
set -u
ROOT=/d/P/project/persianArts
WB=$ROOT/work/persian/src/workbench
OUT=$ROOT/media/film-versions/_bench/exp2
PASS=${1:-pass}
CLI=$WB/node_modules/@remotion/cli/remotion-cli.js
NODE="/c/Program Files/nodejs/node.exe"
mkdir -p "$OUT/$PASS"
cd "$WB" || exit 1
echo '{}' > "$OUT/props.json"
ms() { echo $(( $(date +%s%N) / 1000000 )); }
if [ ! -f "$OUT/bundle/.done" ]; then
  s=$(ms)
  "$NODE" "$CLI" bundle ../film/social/entry.tsx --out-dir "$OUT/bundle" --log=error > "$OUT/bundle.log" 2>&1 && touch "$OUT/bundle/.done"
  echo "bundle exit=$? ms=$(( $(ms) - s ))" >> "$OUT/$PASS/times.txt"
fi
run() { # name, extra flags...
  local name=$1; shift
  local s=$(ms)
  "$NODE" "$CLI" render "$OUT/bundle" Social9x16 "$OUT/$PASS/$name.mp4" --props="$OUT/props.json" \
    --concurrency 2 --gl=angle --pixel-format=yuv420p --overwrite --log=error "$@" > "$OUT/$PASS/$name.log" 2>&1
  local rc=$?
  echo "$name exit=$rc ms=$(( $(ms) - s ))" >> "$OUT/$PASS/times.txt"
}
run png --image-format=png
run jpg80 --image-format=jpeg --jpeg-quality=80
run jpg90 --image-format=jpeg --jpeg-quality=90
run jpg95 --image-format=jpeg --jpeg-quality=95
echo DONE >> "$OUT/$PASS/times.txt"
