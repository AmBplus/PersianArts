#!/usr/bin/env bash
# Sequential runner: one GLM sound-order job at a time, in the order given.
cd /d/P/project/persianArts || exit 1

ORDERS="work/persian/sound-task/orders"
ALLOWED='Bash(node:*)|Bash(npm:*)|Bash(python:*)|Bash(ffmpeg:*)|Bash(ffprobe:*)|Bash(ls:*)|Bash(cat:*)|Bash(cp:*)|Bash(mkdir:*)|Bash(grep:*)|Read|Edit|Write|Glob|Grep'

for name in o1-doctrine o2-qh-order s1-analysis s2-synth s3-mix-cli s4-verify-batch o3-link-script; do
  echo "$(date -u +%H:%M:%S) START $name"
  QH_GLM_ALLOWED="$ALLOWED" node D:/P/tools/quota-hub/bin/qh.mjs run \
    --worker glm --model glm-5.3-flash --effort medium \
    --cwd D:/P/project/persianArts \
    --task-file "$ORDERS/$name.md" \
    --kind sound-order --title "$name" --timeout 1500 --json \
    > "$ORDERS/$name.run.json" 2>&1
  rc=$?
  echo "$(date -u +%H:%M:%S) END $name exit=$rc"
  sleep 5
done

echo "$(date -u +%H:%M:%S) CHAIN DONE"
