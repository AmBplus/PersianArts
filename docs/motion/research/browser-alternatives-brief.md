# Decision brief: faster or lighter capture for Remotion films

Date: 2026-10-13. Scope: web research only (no installs, no renders, no git). Every claim carries a URL. Items marked **UNVERIFIED** were not confirmed in a primary source.

## Bottom line

Stay on Remotion's default Chrome Headless Shell. No other browser or engine is a drop-in option, because Remotion only drives Chrome. The realistic gains are: (1) confirm the 4.0.534+ shared-memory capture path is active, (2) cut the expensive CSS/SVG effects in the compositions, (3) tune JPEG frames and concurrency with measurements. Browser swaps (Chrome for Testing, Firefox, WebKit, Electron, CEF) and GPU/NVENC tweaks are not worth the port cost for this job.

## 1. Chrome build and mode

- Remotion's default is chrome-headless-shell, which it pins; it is "faster for CPU-bound video rendering, and requires less dependencies and setup." Chrome for Testing "emulates a display surface" and is aimed at GPU-bound work. Source: https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell
- Maintainer position (issue #4955, closed "not planned" 2025-10-26): Chrome for Testing is "for emulating user sessions, not for multithreaded rendering." On a Fly.io L40S box, concurrency 3 took 7.10 min with Headless Shell and 21.5 min with Chrome for Testing. Maintainer: "We already set the right default with Chrome Headless Shell." GPU in Headless Shell is available via `--gl=angle`. Source: https://github.com/remotion-dev/remotion/issues/4955
- Chrome's own docs: the old headless mode is a lightweight wrapper with far fewer dependencies, needs no X11/Wayland or D-Bus, and suits screenshotting; the new mode is the full browser for end-to-end testing. Source: https://developer.chrome.com/blog/chrome-headless-shell (cited from search snippet; page text not fetched).
- Secondary sources say Chrome 132 removed the old implementation from the main binary (versions conflict across sources). Source: search summary, unverified against release notes: https://developer.chrome.com/blog/headless-chrome
- Memory per page and startup time: **UNVERIFIED**, no source with numbers found.
- Remotion's docs warn that a full Chrome binary via `browserExecutable` may render differently and is less deterministic. Source: https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell

### Flags and capture mechanisms

- `--run-all-compositor-stages-before-draw` plus `--disable-frame-rate-limit`: one GitHub report measured per-frame capture falling from about 51 ms to about 4 ms, but Chrome kept using CPU on an idle page, and `optimizeForSpeed` showed no measurable PNG change. Source: https://github.com/daiki-beppu/nyaucast/issues/747 (search snippet; reproduce before trusting). Remotion does not document these flags, so applying them means a custom harness. **UNVERIFIED** for Remotion.
- `HeadlessExperimental.beginFrame` with `--enable-begin-frame-control`: listed as a normal (not deprecated) method; only `HeadlessExperimental.enable/disable` are deprecated. Requires the target created with BeginFrameControl. Chromium-discussion timings from one user: plain screenshot about 4.1 s, beginFrame with screenshot about 2.4 s (single, uncontrolled test). Fails on macOS per one report. Sources: https://chromedevtools.github.io/devtools-protocol/tot/HeadlessExperimental/ and https://groups.google.com/a/chromium.org/g/headless-dev/c/5rxhZntIYSM. Effort: high (own capture loop, bypasses Remotion). Not recommended.
- `Page.startScreencast` vs `captureScreenshot`: no benchmark found. Screencast frames are produced only when a beginFrame is sent, so the two do not combine well. Source: same Chromium thread.
- `Page.captureScreenshot` format parameter: `jpeg`, `png`, `webp`; quality 0-100 applies to jpeg only; `optimizeForSpeed` is experimental. Source: https://chromedevtools.github.io/devtools-protocol/tot/Page/ (search summary). No measured jpeg-vs-png speed comparison found.
- Flags `--disable-gpu-compositing`, `--disable-software-rasterizer`, `--enable-gpu-rasterization`, `--use-gl=angle --use-angle=d3d11|vulkan`, `--disable-features=...`, `--force-device-scale-factor`: **UNVERIFIED**, not checked against any source in this pass. Remotion's own flags page URL returned 404 when fetched; the search result pointed to https://www.remotion.dev/docs/chromium-flags (not fetched).
- Headless GPU: Chromium docs say headless disables GPU by default; `--enable-gpu` makes the old headless defer to driver detection, which on Linux needs an X display. Sources: https://developer.chrome.com/blog/supercharge-web-ai-testing and https://issues.chromium.org/issues/40540071 (search summaries).

## 2. Other browsers and engines

Remotion supports only Chrome (confirmed by its docs above: Chrome for Testing and Headless Shell are the only modes described). Every alternative below is therefore a port, not a setting.

| Option | GPU / determinism / text | Speed evidence | Remotion integration |
|---|---|---|---|
| Firefox headless (WebRender) | GPU reportedly on by default but used mainly under Xvfb on Linux; Windows behaviour not found. Screenshot diffs vs Chromium were noted. https://blog.promaton.com/testing-3d-applications-with-playwright-on-gpu-1e9cfc8b54a9 | None found for Windows. Playwright issue shows Firefox screenshots identical across headless/headful runs in one 2022 anecdote: https://github.com/microsoft/playwright/issues/12683 | None. Must rewrite the render pipeline. |
| WebKit (Playwright) | Reported no GPU acceleration in headless; must run headed for GPU (same source). Chromium and WebKit headless/headful screenshots differed (issue 12683). | Speed claims in blog posts are unsourced. | None. |
| Servo | Not evaluated for screenshot API maturity. **UNVERIFIED** | None. | None. |
| Electron offscreen, GPU shared texture | `webPreferences.offscreen.useSharedTexture` avoids a GPU-to-CPU copy, but needs a native addon to import the texture, and the paint handler must finish GPU work before returning. Source: https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering and https://github.com/electron/electron/pull/42001 | PR author: about 3 ms vs under 100 us per frame (author's own, unverified). | Heavy: a new app shell plus native code. |
| CEF OSR shared texture | `OnAcceleratedPaint` gated by `shared_texture_enabled`; upstream support Windows (D3D11) primarily. Open issues: null shared handle on CEF 143 Windows release builds (https://github.com/chromiumembedded/cef/issues/4057); macOS blank window with CEF 142 (search summary). | None. | Heavy. |
| Ladybird, Lightpanda | Lightpanda does not render (ruled out by the brief). Ladybird not evaluated. **UNVERIFIED** | None. | None. |

Persian/Arabic shaping: Chrome uses HarfBuzz; treat HarfBuzz as the reference shaper for any alternative. Source for HarfBuzz as a shaper: https://en.wikipedia.org/wiki/HarfBuzz (general).

## 3. Capture and processing without changing the browser

- **Shared-memory capture (Remotion 4.0.534+)**: Chrome and FFmpeg share memory, which "can skip per-frame JPEG/PNG compression when parallel encoding is available." It is available on Apple Silicon and Linux Headless Shell only; Chrome for Testing and others still use JPEG/PNG. Opt-out flag: `--disable-shared-memory-capture`. Source: https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell and release page https://github.com/remotion-dev/remotion/releases/tag/v4.0.534. **Important**: the brief's platform is Windows 11. The docs above say Apple Silicon and Linux, so on Windows this path may not apply. **UNVERIFIED for Windows**. Check our Remotion version and whether shared-memory is active during the first experiment.
- Remotion's own experimental faster path (issue #12051): mean screenshot capture from about 36.7 ms to 15.6 ms, total 5.24 s to 3.26 s, single run, but frame 0 was wrong in 1 of 100 checks; not a public option. Source: https://github.com/remotion-dev/remotion/issues/12051.
- **Frame format**: Remotion docs say PNG is slower than JPEG and is required only for transparent video. Source: https://www.remotion.dev/docs/performance. Quality risk: JPEG is lossy, so check text edges in Persian glyphs.
- **Resolution**: higher resolution renders more slowly; lower it or use `--scale`. Source: https://www.remotion.dev/docs/performance. Upscaling a lower render is a quality risk.
- **Concurrency**: too high and too low are both counterproductive; run `npx remotion benchmark`. Remotion's docs also note Chrome resource contention and OffthreadVideo frame extraction as bottlenecks. Source: https://www.remotion.dev/docs/performance and https://github.com/remotion-dev/remotion/issues/4949 (search summary; about 600 days old).
- **Verbose log**: `--log=verbose` lists the slowest frames; first frames in a thread may be slow from initialization. Source: https://www.remotion.dev/docs/performance.
- **Scene cost (the highest-value lever for SVG-heavy scenes)**: Remotion says box-shadow, text-shadow, gradients, `filter: blur()`, `filter: drop-shadow()`, WebGL and many 2D canvas ops are slow without a GPU, and recommends replacing them with precomputed images. Source: https://www.remotion.dev/docs/performance and https://www.remotion.dev/docs/gpu. Our SVG `filter`, `clip-path` animations and large paths are the likely hotspots; no source gave numbers for SVG filters. **UNVERIFIED** magnitude.
- Parallel `--frames` chunks, deterministic frame caching, pipe-to-ffmpeg without files: not checked in this pass (Remotion already pipes frames to FFmpeg).

## 4. GPU that actually helps

- Remotion: most renders do not get faster with GPU; GPU helps WebGL, video decoding, and the CSS effects above. Source: https://www.remotion.dev/docs/miscellaneous/cloud-gpu.
- Gl backends: `null` (4.0 local default, Chrome decides), `angle` (5.0 local default; uses GPU if present, else SwiftShader), `angle-egl` (cloud with GPU), `swangle` (Lambda/Cloud Run), `vulkan` (since 4.0.41, undescribed). Known memory-leak warning for `angle` on long renders. Source: https://www.remotion.dev/docs/gl-options.
- Maintainers: GPU in Headless Shell via `--gl=angle` for R3F renders. Source: issue #4955.
- Cloud GPU page: `--chrome-mode="chrome-for-testing" --gl=vulkan` is the documented route to GPU, recommended `g4dn.xlarge`, but the page gives **no speed numbers** ("should be significantly faster"). Source: https://www.remotion.dev/docs/miscellaneous/cloud-gpu.
- Readback: a third-party addon notes that GPU-to-CPU readback (`toBitmap()`) is a synchronous main-thread cost and runs async in an N-API worker in its design; this is Electron-specific. Source: https://github.com/meros-co/osr-capture. Generally, screenshots must copy pixels back to CPU, so a GPU does not remove that step (reasoning, **UNVERIFIED** as numbers).
- NVENC: encodes only; it cannot speed the Chrome page rendering that is the bottleneck. Consistent with our measurements (no gain). Source for the bottleneck is Remotion's performance page above.

## 5. Browser-free alternatives (short table)

| Option | Persian/Arabic shaping risk | Port cost | Evidence |
|---|---|---|---|
| Skia / Skottie | Text shaping via Skia; Lottie text layers are the risk. Skottie seek mutates state, so reset per frame. https://skottie.skia.org/ | High: re-author scenes as Lottie | Vendor claim of +63% FPS vs lottie-react-native on Android (react-native-skottie): unverified. |
| resvg | Uses rustybuzz; Arabic shaping gaps for unusual ligatures and some variable-font features (secondary sources, about 143 days old). Verify with Amiri font. | Medium | No speed data. |
| Rive / Lottie | Depends on player shaping; not checked. **UNVERIFIED** | High | None. |
| Canvas + WebGL | Canvas text shaping uses the browser's shaper; same Chrome dependency. | High | None. |
| Revideo / Motion Canvas | Still runs in headless Chromium plus FFmpeg, so no browser saving. https://rendercomp.com/blog/remotion-vs-revideo-comparison/ | High (rewrite) | Speed claims unsourced. |
| FFmpeg-only | Poor for SVG and Persian shaping; no native text layout. | Very high | n/a |

## 6. Ranked recommendation

1. **Audit scene cost, then remove or precompute expensive effects** (box-shadow, drop-shadow, blur, gradients, animated clip-path, large SVG paths). Expected speed-up: unknown until measured; Remotion says these are the main slow CSS on GPU-less machines. Quality risk: low to medium (visual change, must match design). Effort: medium (edits to `work/persian/src/film/social/scenes.tsx` and `motion.ts`, which already show local diffs). Sources: https://www.remotion.dev/docs/performance.
2. **Confirm shared-memory capture state and Remotion version**; keep parallel encoding on. Expected speed-up: not published for Windows (single-run 36.7 ms to 15.6 ms capture in #12051, Linux/mac). Risk: none if default. Effort: low. Sources: release v4.0.534 and https://github.com/remotion-dev/remotion/issues/12051.
3. **JPEG frames instead of PNG for non-transparent scenes**, with quality check on Persian glyph edges. Expected speed-up: unknown, documented as "PNG is slower." Risk: lossy text edges. Effort: low. Source: https://www.remotion.dev/docs/performance.
4. **Concurrency tuning with `npx remotion benchmark`**. Expected speed-up: unknown; can be large or negative. Risk: none. Effort: low. Source: Remotion performance page.
5. **`--gl=angle` on Headless Shell** only for compositions using WebGL or GPU CSS effects; measure before adopting (memory-leak warning). Expected speed-up: unknown; maintainer-endorsed for R3F. Risk: memory use on long renders. Effort: low. Sources: https://www.remotion.dev/docs/gl-options and issue #4955.

Not worth trying: Chrome for Testing for our CPU-bound SVG work (3x slower in #4955); BeginFrameControl or screencast custom harness (high effort, bypasses Remotion, macOS-only and single-user timings); Firefox, WebKit, Electron, CEF, Servo (port cost, no Remotion support, no proven Windows throughput); Lottie/Skottie or resvg ports (Persian shaping risk, rewrite cost); NVENC or any GPU encoder work (encode is not the bottleneck); `--disable-gpu-compositing`-style flags without a measured case.

## First three experiments (run later, not now)

Do not run these while the other benchmark is timing the machine.

1. Baseline and hotspots, one composition: `npx remotion render <comp> --log=verbose` then `npx remotion benchmark`. Record the slowest frame list and the concurrency table. Then repeat with `--disable-shared-memory-capture` to see whether the new path is active and helpful on Windows.
2. Format test: same composition, same frame range, `--image-format=png` vs `--image-format=jpeg` at two quality levels. Compare wall time and pixel diff on Persian text frames.
3. GL test: same composition with default `--gl` (null) vs `--gl=angle`, and `--chrome-mode=chrome-for-testing --gl=vulkan` as a control only if the scene uses WebGL. Keep the one that is faster and stable (watch memory on long renders).

Each experiment should be ordered as a worker task with a fixed frame range and time box, and reported as numbers only.

## Open items (not verified)

- Memory per page and startup time for Headless Shell.
- Exact flag set in `--disable-gpu-compositing` family and their effect in Remotion.
- Windows-specific status of shared-memory capture.
- Firefox WebRender throughput on Windows; Ladybird and Servo capture APIs.
- Per-effect cost numbers (box-shadow vs blur vs SVG filter) on Chrome.
