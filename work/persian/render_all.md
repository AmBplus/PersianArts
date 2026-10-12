# render_all.ps1: fast Remotion renders for the Persian films

Run from the repo root or anywhere (PowerShell 7). Outputs go under `media/film-versions/<film>/<version>/` (git-ignored).

1. Bundle once: `work/persian/src/workbench` is bundled into `media/film-versions/_bundle-cache/<sha1>`. The key covers the film source, `demos/_fa`, the workbench `public/**` tree (relative path + size + mtime, including the git-ignored `public/uni-local/`), the remotion version and the config. Reused while the key matches; a lock file guards concurrent runs.
   - Key test (fix round): adding `public/uni-local/_keytest.txt` changed the key and forced a rebuild; deleting it restored the old key and a cache hit.
2. Final: `pwsh -File work/persian/render_all.ps1 -Film social -Bpm 124 -T0 0.24283 -OutDir media/film-versions/pencil-social/v-new`
   - Four ratios in parallel (`-Parallel 4`), each `--concurrency 2 --gl=angle --pixel-format=yuv420p`.
   - Silent cache: same bundle + comp + props + mode is copied instantly from `media/film-versions/_silent-cache/`.
3. Preview (scale 0.5): add `-Mode preview -Frames 150-210` (ranges, comma separated).
4. Stills (PNG, up to 8 at once): add `-Mode stills -Frames 15,48,64,98`.
5. Other flags: `-Ratios 9x16,16x9`, `-PropsJson '{"X":1}'` (merged), `-Concurrency 2`, `-NoCache` (ignore bundle and silent cache).
6. Output: `silent-<ratio>.mp4` (or previews/stills) plus `render-report.json` (props, wall times, cache hits, pix_fmt, color_range, sizes). Non-zero exit on any failure.
7. OutDir must be `media/film-versions/<film-name>/<version>`; anything else is refused.
8. Uni film: `-Film uni` uses `Uni9x16`, `Uni1x1`, `Uni4x5`, `Uni16x9`.
10. Output range (`-Output native|bt709`, default `native`). Verified with ffprobe on real outputs (social 9x16, BPM 110, T0 0.02722):
   - `native` (default): Remotion's single encode, unchanged. `--pixel-format=yuv420p` does NOT force tv range: the file is `yuv420p`-family `yuvj420p`, `color_range=pc`, `color_space=bt470bg`. No second encode. SSIM vs ref1 0.999876 and vs ref2 0.999913 (ref1 vs ref2 noise 0.999876), so it is inside the 0.0003 limit.
   - `bt709`: Remotion's own single encode with `--color-space=bt709`. The stitcher adds `-color_range tv`, bt709 tags and `zscale=matrix=709:matrixin=709:range=limited`, giving `yuv420p`, `tv`, `bt709`. SSIM vs ref1 0.997391 (Y 0.997315, PSNR 35.0 dB), vs ref2 0.997392. The gap is about 0.0025, so it costs quality. Use it only when a player needs limited range.
   - The old fix (a second ffmpeg encode, libx264 crf 16 with `scale=out_range=tv`) measured 0.999363 vs both refs. That is below the noise floor and was removed. It also cost about 13 s per 9x16 film (38.7 s vs 25.4 s wall, same machine).
   - Cache key includes the output mode (`v2`), so old re-encoded cache entries are not reused.
11. Preview at scale 0.5: frame 14 is the best match to reference frame 14 (SSIM 0.966 vs bicubic-downscaled ref, against 0.877 for frame 13 and 0.873 for frame 15). The 0.987 figure from the brief did not reproduce. `--scale 0.5` re-rasterises the scene at half size instead of downscaling the final frame, so it is not comparable to a downscaled full render at pixel level.
9. Preflight: every run first prints `preflight: freeRAM=..GB otherNodeProcs=N otherChromeProcs=N` and warns when more than 4 chrome.exe processes are running (they slow renders). `-Preflight` alone prints that line and exits 0 without rendering (Film and OutDir not needed).
