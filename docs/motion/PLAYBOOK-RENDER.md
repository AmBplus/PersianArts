# PLAYBOOK-RENDER: confirmed render methods

Machine: Intel i5-13400F (10 cores), RTX 4070, 31.8 GB RAM, Windows 11, Node 24.19, Remotion 4.0.484. Test composition `Social9x16` (1080x1920, 540 frames, 30 fps, 18 s).
Evidence: `work/persian/render-speed-brief.md` (sections 2 to 5) and raw data `work/persian/_bench/results.csv` (git-ignored folder). Outputs `media/film-versions/_bench/`.

## 1. Confirmed methods

| Method | Evidence | Command |
|---|---|---|
| Bundle once, render from the bundle dir | bundle 7.8 s; bundled 9x16 at concurrency 9 = 17.2 s, same as entry source; saves about 8 s per ratio (`render-speed-brief` 3c) | `npx remotion bundle ../film/social/entry.tsx --out-dir <dir>` then `npx remotion render <dir> Social9x16 out.mp4` |
| Four ratios in parallel, concurrency 2 each | sequential 58.6 s; four parallel at concurrency 2 = 28.8 s, all exit 0, 9x16 SSIM 0.99972 vs base (noise floor 0.99976) (3d) | `pwsh -File work/persian/render_all.ps1 -Film social -Bpm <bpm> -T0 <t0> -OutDir media/film-versions/<film>/<version>` |
| Native single encode (yuvj420p, pc range) | `native` SSIM 0.999876 and 0.999913 vs references, inside the 0.0003 limit (`work/persian/render_all.md` item 10) | default `-Output native` |
| bt709 output only when a player needs limited range | bt709 gives SSIM 0.997391, a cost of about 0.0025 vs native (`render_all.md` item 10) | `-Output bt709` |
| Silent cache | same bundle, comp, props and mode are copied from `media/film-versions/_silent-cache/` (`render_all.md` item 2) | automatic; `-NoCache` to bypass |
| Previews from frame ranges | 60 frames in 6.1 s (31% of baseline) (3e) | `-Mode preview -Frames 150-210` |
| Payoff-frame check as a still | still at frame 270 in 4.1 s (21% of baseline) (3e) | `-Mode stills -Frames 15,48,64,98` or `npx remotion still <bundle> Social9x16 out.png --frame=270` |
| `--gl=angle` only | angle 19.3 s, SSIM 0.99974 (keep). Other values slower or lower quality (3b) | `--gl=angle` |
| Concurrency 9 for a single render | 15.2 s (two runs), best measured; concurrency 1 = 43 to 47 s; 10 gives no gain (3a) | `--concurrency 9` |
| Preflight before a batch | render_all prints free RAM and counts chrome.exe; warns above 4 (`render_all.md` item 9) | `pwsh -File work/persian/render_all.ps1 -Preflight` |

Output-format notes: `--pixel-format=yuv420p` does not force tv range (`render_all.md`). Remotion's output is not bit-identical across runs; treat SSIM at or above 0.9997 as noise.

| Silent cache for audio-only change (ledger batch 2026-10-13) | render-report cache hit 0.5 s and 0.82 s total vs cold miss 36.6 s and 38.2 s (`media/film-versions/pencil-social/_render-all-test`, `_bench-5`, `quality-check/cold1`, `cold2`) | default (automatic) |
| Bundle once, four ratios in parallel (ledger batch 2026-10-13) | `_bench-4` four ratios concurrency 2: 30.8 s total incl. bundle 2.3 s; sequential brief 58.6 s | `-Concurrency 2` |
| Single render at concurrency 9 (ledger batch 2026-10-13) | brief: 19.7 s mean baseline (conc 4) to 15.2 s at conc 9 | `--concurrency 9` |

## 2. Measured useless or rejected items

| Item | Result | Evidence |
|---|---|---|
| NVENC (`h264_nvenc`) | re-encode 1.9 s vs libx264 1.6 s; file twice as large; no speed gain | `render-speed-brief` 3f |
| Vulkan GL | 19.2 s, same speed as angle, SSIM 0.99895 | 3b |
| angle-egl, swiftshader | 21 s and 20 s, SSIM 0.9974 | 3b |
| swangle | 34 to 35 s, about 1.8x slower | 3b |
| `--gl default` | invalid in Remotion 4.0.484 (exit code 1) | `results.csv` row gl-default |
| x264 ultrafast | no speed gain, file 3.5x larger | 3f |
| x264 slow | 21.2 s, no visible gain | 3f |
| crf 28 | smaller but visibly lower quality, no speed gain | 3f |
| Chrome for Testing (instead of headless shell) | about 3x slower in a maintainer's report (7.1 vs 21.5 min at concurrency 3). Not measured on this machine. | `browser-alternatives-brief.md` section 1; issue remotion-dev/remotion#4955 |
| 20 to 40 parallel renders | counter-productive; Chrome page renderers are the bottleneck. Not measured here. | `render-scale-research-brief.md` section 4 |
| Other engines (Revideo, Motion Canvas, Skottie, resvg, Doory, OpenMontage, lunasvg) | none can shape Persian as the browser does; Doory has no render path | `browser-alternatives-brief.md`, `doory-brief.md`, `openmontage-brief.md`, `render-scale-research-brief.md` section 5 |

| WebP assets (ledger batch 2026-10-13) | not useful for current films (no raster in use); lossy SSIM 0.948-0.985 fails; lossless 0.70-0.76 of PNG size at SSIM 1.0, only if rasters appear | `media/film-versions/_bench/exp1/webp` |
| JPEG frame format (ledger batch 2026-10-13) | about 20 percent faster but q95 SSIM 0.99917 vs threshold 0.999576 (fails); keep PNG | `media/film-versions/_bench/exp2` |
| WebP frame format (ledger batch 2026-10-13) | not a Remotion 4.0.484 frame format (jpeg, png, none); keep PNG | Remotion 4.0.484 options |

## 3. Timings table (measured, Social9x16 unless stated)

| Run | Wall (s) | Source (`results.csv` label) |
|---|---|---|
| Baseline (default, concurrency 4, angle) | 17.2 / 22.3 (mean 19.7) | base, base2 |
| Concurrency 1 | 43.4 / 47.4 | conc1-r1, conc1-r2 |
| Concurrency 5 | 17.2 / 17.1 | conc5-r1, conc5-r2 |
| Concurrency 9 | 15.2 / 15.2 | conc9-r1, conc9-r2 |
| Concurrency 10 | 17.2 / 16.2 | conc10-r1, conc10-r2 |
| Bundled 9x16, concurrency 9 | 17.2 | bundled-Social9x16 |
| Bundled 1x1, concurrency 9 | 12.1 | bundled-Social1x1 |
| Bundled 4x5, concurrency 9 | 13.1 | bundled-Social4x5 |
| Bundled 16x9, concurrency 9 | 16.2 | bundled-Social16x9 |
| Four ratios sequential, concurrency 9 | 58.6 (66.4 with bundle) | render-speed-brief 3c |
| Four ratios parallel, concurrency 2 each | 28.8 | render-speed-brief 3d |
| Bundle step | 7.8 (bundle-cache run: 2.4) | render-speed-brief 3c; `run1-summary.txt` |
| Preview, 60 frames | 6.1 | render-speed-brief 3e |
| Still, one frame | 4.1 | render-speed-brief 3e |
| Scale 0.5 full run | 13.2 | preview-scale05 |
| loudnorm analysis, 18 s clip | 0.72 | render-speed-brief 3j |

Use these as planning numbers: one 18 s film at 9:16 is about 15 to 20 s; four ratios in parallel are about 30 s; a preview is about 6 s; a still is about 4 s.

## 4. Confirmed commands (repo root)
- Full batch: `pwsh -File work/persian/render_all.ps1 -Film social -Bpm 124 -T0 0.24283 -OutDir media/film-versions/pencil-social/v-new`
- Uni teaser: `-Film uni` (compositions `Uni9x16`, `Uni1x1`, `Uni4x5`, `Uni16x9`), outdir `media/film-versions/uni-admissions/<version>`.
- Preview: add `-Mode preview -Frames 150-210`.
- Stills: add `-Mode stills -Frames 15,48,64,98`.
- Ratios subset: `-Ratios 9x16,16x9`. Props: `-PropsJson '{"X":1}'`. Concurrency: `-Concurrency 2`. Bypass caches: `-NoCache`.
- OutDir must be `media/film-versions/<film>/<version>`; anything else is refused.

## 5. Not yet confirmed
- Per-frame profile: `npx remotion benchmark` and `--log=verbose` slow-frame list were not run; the hot spots are a static guess (full-canvas SVG overlays in `work/persian/src/film/social/scenes.tsx` lines 27 and 93, and the row map at 232 to 279).
- Chrome-for-Testing slowdown on this machine (only a maintainer report).
- Throughput curve for 8 active Chrome pages versus other counts (proposed experiment 1 in `render-scale-research-brief.md`).
- Shared-memory capture (Remotion 4.0.534 and later): not checked on this machine; the docs say Linux and Apple Silicon only.
- Image-sequence plus ffmpeg encode, and the media cache for video assets: not tested.
- Browser reuse across renders (openBrowser with puppeteerInstance): the 1 to 3 s saving is third-party and not measured.
- Visual review of scores for JPEG frames versus PNG: not done.
- Repeat-run noise on other machines: not measured.

## 6. Open experiments (one worker order each, exact paths)
1. Throughput curve: 8 films, one shared browser, page cap in {4, 6, 8, 10, 12}; record films per minute, peak RAM, timeouts and duplicate frames.
2. Speed and quality knobs: jpeg 80 vs 90 vs png, scale 1.0 vs 0.5, measured SSIM against a png reference at scale 1.0.
3. Audio-only reuse: render silent once, then `ffmpeg -c:v copy` for audio changes; check duration and sync.

## 6b. Open items added 2026-10-13 (ledger batch)
- First-frame warm-up: measure first-frame cost against warm render; no data yet.
- Scene-cost audit: per-scene render cost; no data yet.
- Shared browser plus page-cap queue: see item 1 above; no data yet.
