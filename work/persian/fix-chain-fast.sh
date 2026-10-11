#!/bin/sh
# Sequential fix-role runs for four cards through cheap-author.mjs (glm worker).
# Usage: sh work/persian/fix-chain.sh   (run from anywhere; paths are absolute)
ROOT=/d/P/project/persianArts
W=$ROOT/work/persian
LOG=$W/trial/fix-chain.log
cd "$ROOT" || exit 1
mkdir -p "$W/trial"

SLUGS="list-stack-press bezier-source-converge-merge integration-hub-map theme-switch-moves"

for S in $SLUGS; do
  OUTDIR=$W/out/$S
  # first unused round number
  N=1
  while [ -e "$OUTDIR/review.round$N.json" ]; do N=$((N + 1)); done
  cp "$OUTDIR/review.json" "$OUTDIR/review.round$N.json"

  attempt=0
  while :; do
    node "$W/cheap-author.mjs" --slug "$S" --worker glm --model glm-5.3-flash \
      --effort medium --role fix --review "$OUTDIR/review.json" --timeout 1200 \
      > "$W/trial/$S.fix.json" 2>&1
    rc=$?
    OUT=$(cat "$W/trial/$S.fix.json")
    STATUS=$(printf '%s\n' "$OUT" | tail -n 1 | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
    RETRY=0
    case "$OUT" in
      *"lock held"*|*"glm is limited"*|*"wrapper-error"*) RETRY=1 ;;
    esac
    [ "$STATUS" = "error" ] && RETRY=1
    [ -z "$STATUS" ] && RETRY=1
    if [ "$RETRY" -eq 1 ] && [ "$attempt" -lt 2000 ]; then
      attempt=$((attempt + 1))
      sleep 2
      continue
    fi
    break
  done

  if [ "$RETRY" -eq 1 ]; then
    echo "$S FAILED after $attempt retries (last status: ${STATUS:-none}, rc=$rc)" >> "$LOG"
  else
    echo "$S done $STATUS" >> "$LOG"
  fi
done

echo "chain finished $(date)" >> "$LOG"
