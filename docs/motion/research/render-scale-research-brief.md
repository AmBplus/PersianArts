# Decision brief: fast batch rendering of Remotion films

Date: 2026-10-13. Scope: web research only (no installs, no edits). Time box 35 min.
Verification key: [V] = read on an official or primary page; [S] = third-party or secondary source; [U] = unverified / inference.

## 1. Question

How do others render many Remotion/browser motion films fast without hurting quality, and should we run 20-40 renders at once for test batches on a ~10-core Windows box with one NVIDIA GPU?

## 2. Key evidence

**Remotion official guidance**
- Concurrency: the renderMedia doc says the default is "half of the CPU threads available" [V] https://www.remotion.dev/docs/renderer/render-media . The config doc tip says to try `os.cpus().length` for faster rendering, and that it may slow other parts of the system [V] https://www.remotion.dev/docs/config . The two pages do not fully agree; treat the default as unverified for our version.
- Performance doc: the only tuning levers it names are `--concurrency` (can "increase or decrease" speed), `npx remotion benchmark` to find the best value, `png` being slower than `jpeg` (png needed for transparency), `--scale`, `--log=verbose` for slowest frames, and replacing GPU-heavy CSS (box-shadow, filter blur, WebGL, canvas) with precomputed images on cloud machines [V] https://www.remotion.dev/docs/performance . It does not mention chrome mode, gl, offthreadvideo cache or memory [V].
- Image format: `jpeg` is the default and is "fastest"; `jpegQuality` default 80; both are ignored when shared-memory capture is active [V] https://www.remotion.dev/docs/renderer/render-media .
- Benchmark CLI: `npx remotion benchmark` takes `--runs` and `--concurrencies` and inherits render flags; output format not stated [V] https://www.remotion.dev/docs/cli/benchmark .
- Chrome mode: `--chrome-mode` exists (`setChromeMode()` since v4.0.248); the only value documented on the config page is `chrome-for-testing` [V] https://www.remotion.dev/docs/config . The dedicated chrome-mode page returned 404 at fetch time, so the accepted values beyond that are unverified. `--gl` is documented as an option [V] same page.
- Maintainer statement on Chrome for Testing vs headless shell: issue #4955 (Feb 2025) reported 7.10 min with chrome-headless-shell vs 21.5 min with Chrome for Testing at concurrency 3 (16-core, L40S GPU). Maintainer JonnyBurger (Oct 2025): Chrome for Testing is built for emulating user sessions, not multithreaded rendering; headless shell is already the default and can use the GPU via `--gl=angle`; issue closed "not planned" [V] https://github.com/remotion-dev/remotion/issues/4955 .
- Our 9-concurrency vs GPU/NVENC no-gain result matches this: the bottleneck is the Chrome page, not the GPU.

**Concurrency vs cores (community data, not official)**
- Issue #4300: on a 48-core VPS, higher concurrency made renders slower with most cores idle; same code was fast on an 8-core laptop (Remotion 4.0.211, may be outdated) [V] https://github.com/remotion-dev/remotion/issues/4300 .
- Issue #4949: on 224-core machines, extra Chrome tabs do not add resource use linearly; heavy `OffthreadVideo` compositions slow down at high concurrency. Its own table on a 16-vCPU box shows concurrency 4 and 8 giving similar times [V] https://github.com/remotion-dev/remotion/issues/4949 .
- Memory: one project found concurrency 2 the only stable setting on a memory-constrained machine [S] https://github.com/cogNNitive/cogNNitive-web/issues/11 . Docker Desktop limited to 4 CPUs with concurrency 100% thrashed; explicit container CPU/memory limits fixed it [S] https://crepal.ai/blog/aivideo/blog-how-to-run-remotion-in-docker/ .
- Issue #11721 / PR #11734: `slowestFrames` misses slow frames when concurrency > 1 (fixed in PR) [V] https://github.com/remotion-dev/remotion/issues/11721 . Relevant only if we use it for diagnosis.
- Issue #11578 (4.0.527, Linux): sustained renders reported stale frames at default concurrency, correct at concurrency 1 [V] https://github.com/remotion-dev/remotion/issues/11578 . Our batch QA must check for duplicate frames.

**Browser reuse**
- `openBrowser()` + `puppeteerInstance` in `renderMedia()`/`renderStill()`/`getCompositions()` is documented to speed up batch renders. Chromium flags must go into `openBrowser()`, not the render call; `puppeteerInstance` overrides `browserExecutable`; caller must close the browser [V] https://www.remotion.dev/docs/renderer/open-browser , https://www.remotion.dev/docs/renderer/render-media .
- Size of the gain: a third-party estimate of 1-3 s per render saved [S] https://rendercomp.com/blog/remotion-performance-optimization-guide/ (unverified). For 15-s-class renders this is small; it matters for many short stills.

**Distributed / serverless**
- Remotion says Lambda is the fastest option because it splits a render into chunks rendered in parallel; it is also the most expensive per unit of compute; Cloud Run is cheaper and bills nothing idle; only Lambda parallelizes across machines [V] https://www.remotion.dev/docs/compare-ssr . Chunk size is set by `framesPerLambda` [S] per a third-party guide, https://www.negabaro.com/en/blog/remotion/remotion-lambda (not checked against the official Lambda docs).
- Remotion's homepage claims about 80 s video in ~15 s with up to 200x concurrency; marketing figure, not benchmarked by us [V-marketing] https://www.remotion.dev/lambda .
- Self-hosted fan-out: the docs say to split frames into equal chunks (last one shorter), use `--frames=a-b` per machine, and keep codec/crf/fps/dimensions/audio identical; equal chunk length matters for AAC; a `--for-seamless-aac-concatenation` flag exists [V] https://www.remotion.dev/docs/distributed-rendering , https://www.remotion.dev/docs/cli/render . Joining with the ffmpeg concat demuxer and stream copy is standard ffmpeg practice [U].
- `@remotion/web-renderer` (stable from 4.0.491) renders in the browser via WebCodecs/Mediabunny, with no bundling step, but is "limited to a subset of tags and CSS properties"; no speed claims; font, SVG and video support not confirmed [V] https://www.remotion.dev/docs/web-renderer . Not recommended for our SVG-heavy scenes without a test.

**Alternatives and Persian shaping**
- Revideo / Motion Canvas: canvas-based; cannot use arbitrary HTML/CSS; speed claims are anecdotal and conflicting; no head-to-head benchmark found [S] https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026 , https://snapcn.dev/remotion-vs-motion-canvas . Persian text would need re-implementing shaping; high risk to our scene code.
- Skottie (Skia/Lottie): default text shaping is "primitive"; HarfBuzz requires `setTextShapingFactory(SkShapers::BestAvailable())` with HarfBuzz compiled in; bidi reordering is a separate step [V] https://github.com/google/skia/blob/main/modules/skottie/include/Skottie.h , Skia release notes. Lottie-web has open Arabic/RTL issues (#3097) [V]. Not a drop-in for our Persian text.
- resvg / rustybuzz: rustybuzz lacks Arabic fallback shaping (issue #63; current status unverified) and has reported Arabic glyph-ID differences (harfbuzz/rustybuzz issues) [S] https://github.com/harfbuzz/rustybuzz/issues/63 . Whether resvg uses rustybuzz with the text feature is [U], not confirmed. lunasvg shows the failure mode: Arabic drawn codepoint-by-codepoint (issue #279) [V] https://github.com/sammycage/lunasvg/issues/279 .
- Conclusion: none of the alternatives is safe for Persian joining without a large port. Remotion's DOM/browser path is the only one that already renders our text correctly.

**Skills and prior art**
- Official: `remotion-dev/skills` (install via `npx skills add remotion-dev/skills`), with `remotion-best-practices` covering animation, timing, audio, captions, 3D [S] https://claudeskills.info/official/remotion-dev/ , https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code . These are authoring guidance, not render-speed tools. Skill names disagree across sites; check the GitHub repo before installing (we do not install in this task).
- Scene-level incremental render: StudyTube PR #52 hashes each scene (content + frame range), diffs against a base manifest, renders changed runs with Remotion `frameRange`, cuts unchanged runs from the base MP4 with ffmpeg, concatenates; falls back to full render when fps/TTS/engine differ [S] https://github.com/remco59/StudyTube/pull/52 . Good template for our caching.
- Per-scene render + concat: cogNNitive issue #11 proposes per-scene renders with concat instead of single-pass [S] https://github.com/cogNNitive/cogNNitive-web/issues/11 .
- Cache-key lesson: key on exact ffmpeg command plus extra inputs such as fonts and sprite images, so a redrawn file under the same name misses [S] https://github.com/mandakan/splitsmith/pull/1284 .
- Remotion spike: bundle output is byte-deterministic and changes on edits, so bundle hash can serve as a cache key [S] https://github.com/ThomasPraun/frameshell/issues/136 .
- No built-in Remotion scene cache exists [V-absence on docs searched]; audio-only invalidation is an inference [U].

## 3. Options (ranked by expected value for us)

| # | Option | Expected gain | Effort | Quality risk |
|---|---|---|---|---|
| 1 | Test samples as stills or frame subsets (`--frames`, `renderStill`) plus `--scale 0.5` for previews; full render only for finals | Large: a test sample costs a few seconds instead of a 540-frame render (proportional to frames) [U on exact numbers] | Low | Low for review; previews are not finals |
| 2 | Batch queue with a global cap on active Chrome pages (about the physical core count, 6-10), one shared `openBrowser()`, one bundle per batch | Likely the biggest throughput win; our 4x2 run (29 s) beat 1x9 (15 s) per film by about 2x (7 s/film), so overlap helps but over-subscription hurts [U beyond our own data] | Low-medium | None (same output) |
| 3 | Scene-hash cache + ffmpeg concat/mux; audio-only changes reuse the silent video (`-c:v copy`) | High for audio iterations (video render skipped); medium for visual changes | Medium | Medium: seams, AAC chunk length, fps/codec mismatch (see StudyTube fallback) |
| 4 | Frame-range chunk fan-out across machines (`--frames`, ffmpeg concat) or Remotion Lambda/Cloud Run for bulk | Only helps when more machines exist; on one box it does not beat option 2 [U] | Medium-high | Medium (chunk boundaries, identical settings) |
| 5 | Image knobs: `jpeg` (default) and `jpegQuality` for intermediates; keep png only where transparency needed | Small to medium (speed per frame) [V for direction, magnitude U] | Low | Low at quality 80+; measure with frame diffs |

Not recommended now: switching chrome mode (headless shell is already the default, and Chrome for Testing was 3x slower in #4955); GPU flags (already measured no gain); `@remotion/web-renderer`, Revideo/Motion Canvas, Skottie or resvg (Persian shaping risk, large port cost).

## 4. Parallelism ceiling on ~10 cores for 20-40 renders

- Running 20-40 renders at once is counter-productive. Each render spawns its own Chrome renderers; the evidence (#4300, #4949, RAM-limited reports) shows throughput rises until active Chrome page renderers roughly match physical cores, then flattens or falls as memory thrashes and timeouts appear [V/S, box-specific numbers unverified].
- Expected curve on our box [U, to be measured]: films per minute rises from 1 to about 6-8 active pages, flat to about 10, then drops with timeouts and stale frames. Total active pages is the knob, not the number of renders.
- Our own data supports this: one render at concurrency 9 takes 15 s; four at concurrency 2 (8 pages total) finish in 29 s, i.e. about 7 s per film. A queue that keeps about 8 pages busy is the realistic target.
- Recommendation: a single queue with a global page cap; submit films as jobs; keep memory headroom (container or Windows job limits) and watch for stale-frame duplicates.

## 5. Recommended plan and first 3 experiments

Plan: stills and subset frames for test batches (option 1); queue with global cap and shared browser (option 2); scene-hash cache with audio-only mux (option 3) once option 2 is measured. Keep GPU flags and chrome mode at defaults.

Experiment 1 (throughput curve): N=8 films (same composition, 540 frames, one aspect ratio), one shared `openBrowser()`, global page cap in {4, 6, 8, 10, 12}. Record wall time, films/min, peak committed RAM (PowerShell `Get-Counter` or `Get-Process`), timeouts, and duplicate-frame count (frame hash check). Acceptance: pick the cap with the best films/min and zero timeouts or duplicates. Also run `npx remotion benchmark --concurrencies=...` for comparison.

Experiment 2 (quality/speed knobs for samples): one scene, three settings: `imageFormat=jpeg` at quality 80 vs 90 vs `png`; `--scale` 1.0 vs 0.5. Record time per frame and per-frame PSNR/SSIM against the reference png at scale 1.0. Acceptance: jpeg 80+ with SSIM above an agreed threshold (set threshold before running).

Experiment 3 (audio-only reuse): render the silent video once; for an audio change, mux new audio with `ffmpeg -c:v copy`. Measure time vs full re-render; check duration, sync and AAC seams. Also test reusing the bundle (`serveUrl`) across renders in the same batch.

Each experiment is one worker order with exact input/output paths; no experiment changes production code.

## 6. Unverified items (list)

- Default concurrency (conflicting official pages).
- Exact chrome-mode values beyond chrome-for-testing (chrome-mode page 404).
- Throughput curve and memory per Chrome page on our box.
- Per-render startup saving from browser reuse (1-3 s is third-party).
- Remotion Lambda cost figures (marketing and third-party).
- resvg Arabic shaping behaviour.
- Scene-hash caching gain numbers (no benchmarks found).
