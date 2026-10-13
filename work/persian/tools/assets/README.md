# Asset compressor (optimize_assets.py, tv_check.py)

Policy: every raster asset becomes WebP (alpha always kept); every video is TV-playable; the optimizer runs before assets are used.
Python: tools/assets/.venv (pillow numpy fonttools brotli resvg-py; svgo via npm in this folder) or system python with the same packages.

    python -P optimize_assets.py <dir|file>... [--dry-run] [--report out.json] [--rewrite-refs]
        [--keep-originals|--delete-originals] [--svg] [--fonts] [--audio] [--no-tv] [--no-images] [--no-tv-silent-track]
    python -P tv_check.py <mp4...>        check only, exit 1 on any fail
    pa assets optimize|tv-check|report <paths...>

- Images (png/jpg/bmp/tiff/static gif): graphics (<=4096 colours or soft alpha) lossless; photos lossy at the highest q of 95/90/85/80
  with SSIM>=0.985, mean err<=2.5, p99.9 err<=40, else lossless; method 6; metadata stripped; downscale only above 4096 px;
  kept as source when webp is not <90% of it. Note: WebP lossy is NOT used for frame capture (docs/motion/PLAYBOOK-RENDER.md).
- SVG (--svg): svgo multipass, ids/viewBox/title/desc/pathLength kept, ids+pathLength compared, raster SSIM>=0.999 when resvg-py exists.
- Audio (--audio): files >600 KB -> ogg vorbis (q5..q8) with duration within 20 ms and loudness within 0.3 LU; sound/library/kit never touched.
- Fonts (--fonts): ttf/otf -> woff2, cmap and variable axes compared; @font-face format() rewritten with --rewrite-refs.
- Video TV rules: mp4 faststart; H.264 High L4.1; <=1920x1080 / 1080x1920, even; yuv420p; tv range; bt709 tags; constant 25/30/50/60 fps;
  GOP<=2 s, closed, bframes 2; crf 18 maxrate 12M; AAC-LC stereo 48k 192k (silent track added to silent films); one video + one audio
  stream; no title. Compliant files are not touched (mode compliant-untouched); tag-only faults use stream copy.
- Originals: git-ignored dirs -> moved to sibling _orig/ (ignored); tracked dirs -> source left in place (webp added), videos written as
  <name>.tv.mp4 unless --keep/--delete-originals. assets.map.json (old->new, bytes, mode, ssim), assets.lock.json (hash/size/mtime cache),
  tv-report.json (per video before/after checks) are written into the root dir.
- --rewrite-refs: html/css/js/jsx/ts/tsx/json/md references to converted names are rewritten; a .bak is made unless the file is git-ignored.
- Never run on media/briefs-local/conference-event, sound/library/kit, sound/tools/mixer (skipped unless a file is named explicitly).
- Runs automatically: htmlfilm/capture.mjs (before Chrome; --no-optimize skips, --rewrite-refs for tracked folders, --tv-fix repairs mp4;
  tv_check always runs on the result), render_all.ps1 -TvCheck (check only).
