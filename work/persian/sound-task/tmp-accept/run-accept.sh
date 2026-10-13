set -e
cd /d/P/project/persianArts
echo "=== RUN 1: ONLY_STATUS=approved (radial-wave approved -> packaged from .fa.sound.mp4; bezier fixed -> skipped)"
OUT_ROOT=work/persian/sound-task/tmp-accept/out DRY_RUN=1 DRY_ROOT=work/persian/sound-task/tmp-accept/dry CARDS=radial-wave,bezier-source-converge-merge ONLY_STATUS=approved node scripts/link-persian-shotcraft-media.mjs
echo "=== RUN 2: ONLY_STATUS=approved + KEEP=bezier-source-converge-merge (keep-listed -> also packaged)"
OUT_ROOT=work/persian/sound-task/tmp-accept/out DRY_RUN=1 DRY_ROOT=work/persian/sound-task/tmp-accept/dry CARDS=radial-wave,bezier-source-converge-merge ONLY_STATUS=approved KEEP=bezier-source-converge-merge node scripts/link-persian-shotcraft-media.mjs
echo "=== RUN 3: no sound variant (plain .fa.mp4 fallback), no ONLY_STATUS filter"
rm -f work/persian/sound-task/tmp-accept/out/radial-wave/RadialWave.fa.sound.mp4
rm -rf work/persian/sound-task/tmp-accept/dry/radial-wave
OUT_ROOT=work/persian/sound-task/tmp-accept/out DRY_RUN=1 DRY_ROOT=work/persian/sound-task/tmp-accept/dry CARDS=radial-wave node scripts/link-persian-shotcraft-media.mjs
echo "=== DRY OUTPUT TREE"
find work/persian/sound-task/tmp-accept/dry -type f
echo "=== STREAMS OF PACKAGED PREVIEW (expect h264 yuv420p + aac 96k)"
ffprobe -v error -show_entries stream=codec_name,pix_fmt,bit_rate -of csv=p=0 work/persian/sound-task/tmp-accept/dry/media/shotcraft/radial-wave/fa/demo-radial-wave/preview.mp4
