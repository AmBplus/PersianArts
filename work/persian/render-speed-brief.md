# Render speed brief: Remotion social film on this Windows machine

Date: 2026-10-13. Composition: `Social9x16` (1080x1920, 540 frames, 30 fps, 18 s), entry `work/persian/src/film/social/entry.tsx`, run from `work/persian/src/workbench`. Raw data: `work/persian/_bench/results.csv`; outputs and logs: `media/film-versions/_bench/`. Wall times are single runs unless noted; repeat-run noise is about 1 to 3 s.

## 1. Machine profile (measured)

| Item | Value |
|---|---|
| CPU | Intel Core i5-13400F, 10 cores / 16 threads, base 2.5 GHz |
| RAM | 31.8 GB |
| GPU | NVIDIA GeForce RTX 4070, 12 GB VRAM, driver 617.42 (nvidia-smi); WMI reports 32.0.16.1742 |
| Disk | Samsung 980 1 TB SSD (system), WDC WD10EZEX 1 TB HDD |
| Node | v24.19.0 |
| Remotion | 4.0.484 (CLI, renderer, `@remotion/*`) |
| ffmpeg encoders | h264_nvenc, hevc_nvenc, av1_nvenc, h264_qsv, hevc_qsv, h264_amf, libx264 all present |
| Chrome | Not checked (Remotion's bundled chrome-headless-shell version not recorded) |

## 2. Baseline

- Default config (`remotion.config.ts`: angle GL, concurrency 4, jpeg frames): **17.2 s and 22.3 s** (two runs), mean **19.7 s**, about 27 to 30 fps. Average total CPU about 30 percent.
- Output: H.264 yuvj420p, 1080x1920, 540 packets, 18.0 s, 3.75 MB, AAC audio.
- Still render (`remotion still --frame=270`): **4.1 s**.
- Repeat-run noise floor: base vs base2 SSIM 0.99976, PSNR 58.1 dB. Remotion output is not bit-identical across runs, so any variant at or above about 0.9997 SSIM is within noise.

## 3. Test results

**(a) Concurrency** (two runs each, default GL):

| Concurrency | Run 1 | Run 2 | Avg CPU | Notes |
|---|---|---|---|---|
| 1 | 43.4 s | 47.4 s | 21 to 32% | about 2.4x slower |
| 4 (default) | 17.2 to 22.3 s | | 30 to 60% | baseline |
| 5 | 17.2 s | 17.1 s | 48 to 55% | |
| 9 (cores-1) | 15.2 s | 15.2 s | 63 to 67% | best measured |
| 10 (cores) | 17.2 s | 16.2 s | 54 to 55% | no gain over 9 |

**(b) GL backend** (two runs each, concurrency 4):

| `--gl` | Run 1 | Run 2 | SSIM vs base | PSNR vs base | Verdict |
|---|---|---|---|---|---|
| angle (default) | 19.3 s | 19.3 s | 0.99974 | 57.7 | keep |
| vulkan | 19.2 s | 19.2 s | 0.99895 | 51.7 | same speed, small diff, no benefit |
| angle-egl | 21.3 s | 21.3 s | 0.99740 | 45.9 | slower, lower quality |
| swangle | 34.4 s | 35.4 s | 0.99813 | 47.5 | software, about 1.8x slower |
| swiftshader | 20.3 s | 20.3 s | 0.99740 | 45.9 | software, output identical to angle-egl |
| `default` | invalid | invalid | | | Remotion 4.0.484 rejects `--gl default`; use no flag |

Valid values: swangle, angle, egl, swiftshader, vulkan, angle-egl. `egl` was not tested. The GPU was pegged (90 to 98 percent utilisation, about 10.4 GB VRAM in use) during base2, which suggests the ANGLE path uses the GPU. This was a single sample, and the desktop apps were not isolated, so treat it as indicative only.

**(c) Bundle once, render from bundle dir:**
- `remotion bundle` takes **7.8 s**. Rendering from the bundle at concurrency 9: 9x16 17.2 s, 1x1 12.1 s, 4x5 13.1 s, 16x9 16.2 s. Sequential total 58.6 s, or 66.4 s including the bundle step.
- Bundling each time adds about 8 s per ratio, so the saving over four separate calls is roughly 25 s.

**(d) Parallel vs sequential, four ratios from one bundle:**
- Sequential at concurrency 9: 58.6 s.
- Four parallel processes at concurrency 2 each (8 threads total): **28.8 s**, about 2.0x faster. All exit codes 0. Quality: 9x16 SSIM 0.99972 vs base, within noise.
- Peak system-wide used RAM ran to 21 to 28 GB, which includes other applications, so it is not an isolated number. Four processes at concurrency 2 is comfortable on 31.8 GB; more than four parallel processes was not tested.

**(e) Previews** (served bundle, so no bundling time):
- `--frames=150-210` (60 frames): **6.1 s** (31 percent of baseline).
- `--every-nth-frame 6` (90 frames): **6.1 s**.
- `--frame=270` still: **4.1 s** (21 percent of baseline, the payoff-frame check).
- `--scale 0.5` full run at concurrency 4: 13.2 s. Only a small saving, because most time is the Chrome capture path, not pixel count.

**(f) Encoder settings** (single runs, default concurrency):

| Setting | Wall | Size | SSIM vs base | Verdict |
|---|---|---|---|---|
| default (medium) | 19.7 s mean | 3.75 MB | reference | keep |
| `--x264-preset ultrafast` | 19.2 s | 13.3 MB | 0.99879 | no real speed gain, much larger |
| `--x264-preset slow` | 21.2 s | 3.68 MB | 0.99904 | about 7 percent slower, no visible gain |
| `--crf 28` | 20.2 s | 1.60 MB | 0.99676 | smaller, visibly lower quality, no speed gain |

Encoding is not the bottleneck: the x264 preset changes wall time by less than 2 s.

Re-encode of the 540-frame base (ffmpeg, separate step):
- libx264 veryfast crf 18: 1.6 s, 3.1 MB.
- h264_nvenc p5 cq 19: 1.9 s, 7.7 MB, SSIM 0.99969.
- NVENC gives no speed-up on an 18 s clip (process start-up dominates), and at this cq the file is about twice the size. Not worth it for these clips.

**(g) Not needed**, as instructed.

**(h) Image sequence + ffmpeg encode vs direct mp4:** not tested. Remotion renders frames internally either way, so the expected gain is small.

**(i) Media cache / offthreadvideo:** not tested. The 9x16 film has no video assets in the scene list (only SVG, text, audio).

**(j) Audio:** the loudnorm analysis pass on the 18 s base takes **0.72 s**. `mix_sfx.ps1` was not timed. Silent render and cue or mix prep are independent and can overlap; audio time is negligible next to a 15 to 20 s render.

## 4. Structural cost (static, not profiled)

- Per-frame profiling was NOT run (`npx remotion benchmark` and verbose per-frame timing not executed). The top-5 slow-frame list is therefore not measured. This is a gap.
- Static read: `work/persian/src/film/social/scenes.tsx:27` and `:93` each render a full-canvas `<svg>` at 1080x1920 on every frame. `scenes.tsx` has 332 lines. `scenes.tsx:232-279` maps rows each frame (daily/log list). No `filter`, `blur`, `shadow`, or canvas usage was found in the social folder by grep.
- Likely cost: the two full-canvas SVG overlays and the per-frame row mapping. Confirming needs a profile run.

## 5. Summary table

| Option | Wall | vs baseline (19.7 s) | Quality | Risk | Enable |
|---|---|---|---|---|---|
| Concurrency 9 | 15.2 s | about -23% | identical | none | `--concurrency 9` |
| Concurrency 1 | 45 s | +130% | identical | none | (do not use) |
| `--gl vulkan` | 19.2 s | about 0% | SSIM 0.9990 | visible diff risk | `--gl vulkan` (no gain) |
| `--gl swangle/swiftshader/angle-egl` | 20 to 35 s | slower | SSIM 0.9974 to 0.9981 | quality loss | do not use |
| Bundle once + render from dir | 7.8 s saved per ratio | about -25 s per 4 ratios | identical | must rebuild on source change | `remotion bundle <entry> --out-dir <dir>` then render `<dir>` |
| 4 parallel ratios, concurrency 2 | 28.8 s (vs 58.6 s sequential) | 2.0x for 4 ratios | within noise | RAM | separate processes |
| Preview: frame range 60 frames | 6.1 s | 31% | draft | low | `--frames=150-210` on bundle |
| Preview: still | 4.1 s | 21% | exact frame | none | `remotion still <bundle> Social9x16 out.png --frame=270` |
| Preview: every-nth 6 | 6.1 s | 31% | draft | low | `--every-nth-frame 6` |
| Preview: scale 0.5 | 13.2 s | 67% | lower res | low | `--scale 0.5` |
| x264 ultrafast | 19.2 s | about 0% | SSIM 0.9988, 3.5x size | none | `--x264-preset ultrafast` |
| x264 slow | 21.2 s | +8% | SSIM 0.9990 | none | `--x264-preset slow` |
| crf 28 | 20.2 s | +3% | SSIM 0.9968 | visible loss | `--crf 28` |
| NVENC re-encode | 1.9 s vs 1.6 s | no gain | size +100% | none | `ffmpeg -c:v h264_nvenc -preset p5 -cq 19` |

## 6. Recommendations

**Fast preview (target under 20 percent of baseline, about 4 s).** Bundle once, then render either one payoff frame as a still (4.1 s) or a frame range of 30 or fewer frames (about 3 s). Use `--concurrency 9` for ranges. Do not use `--scale 0.5` as the main preview route; it saves little.

**Final.** `npx remotion render <bundle-dir> Social9x16 out.mp4 --concurrency 9 --gl angle`. Keep the default x264 preset and CRF. No NVENC re-encode.

**Parallel pipeline for four ratios plus mix.**
1. Bundle once per source change (about 8 s).
2. Launch four ratio renders in parallel, each `--concurrency 2` (28.8 s total).
3. Run the audio mix and loudnorm prep while the renders run (negligible in wall time).
4. Assemble and verify.

**Orchestration design.**
- Hash `work/persian/src/film/**` to decide whether to rebuild the bundle.
- Queue jobs as `(bundle, composition, frame range, concurrency)`.
- Cap total threads at about 8 to 9 (one per core, less one), so at most four concurrent renders at concurrency 2, or two at 4, or one at 9.
- Watch RAM: keep at least 6 GB free; abort new jobs above about 26 GB system used.
- Keep one GPU render at a time if a GPU encoder is added later.

**Cloud or other machine.** Not measured. Chrome frame capture scales with cores, so a machine with more cores would help large batches. For these 18 s clips the output transfer is trivial. A realistic gain only shows up for large batches, and it has not been tested here.

## 7. Limits and gaps (honest)

- Single runs for most encoder and preview options. Concurrency and GL runs were done twice.
- No per-frame profile; the slow-frame list is not measured.
- `--gl default` is invalid in this Remotion version; `egl` was not tested.
- GPU utilisation came from one 30-second sample, which may include other desktop activity.
- RAM figures are system-wide used memory, not per-process.
- Image-sequence path, media cache, `mix_sfx.ps1`, Chrome version, and `remotion benchmark` were not run.
- A background `npx remotion render --help` call hung and was left running; it does not affect results.
- Quality is measured as SSIM and PSNR only, not by visual review.
