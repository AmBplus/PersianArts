#!/bin/sh
# format benchmark: png vs jpeg q97/q95, frames 0-239 of a film (read-only on sources; outputs in bench/)
F=${1:-work/persian/htmlfilm/pencil/film.v2.html}; B=work/persian/tools/timing/bench
for v in png:97 jpeg:97 jpeg:95; do f=${v%%:*}; q=${v##*:}; n=$f$q
  [ $f = png ] && CAP_FORMAT=png node work/persian/htmlfilm/capture.mjs --html $F --frames 0-239 --no-optimize --out $B/$n.mp4 > $B/$n.log 2>&1 || CAP_FORMAT=jpeg CAP_QUALITY=$q node work/persian/htmlfilm/capture.mjs --html $F --frames 0-239 --no-optimize --out $B/$n.mp4 > $B/$n.log 2>&1
done; echo done > $B/DONE
