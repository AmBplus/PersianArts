# Persian (RTL) localization — shared lessons

Living knowledge base for converting foreign-language motion demos (Chinese/English shotcraft demos, and anything else) into
Persian. **Every agent that localizes a card must read this file first**, and report new lessons in its `lessons` output
field; the orchestrator merges them here after each batch, so nobody has to rediscover a known problem.

Each entry: the symptom, why it happens, and the fix that worked. Entries are grouped by topic, newest knowledge wins.

## 1. Script shaping (Persian letters join)

- **Letter-spacing destroys joining.** Any `letterSpacing` ≠ 0 on Persian text separates the letters. Set it to 0 everywhere,
  including labels that used tracking for style (`.12em` uppercase kickers).
- **"Tracking breath" / letterspace animations have no direct equivalent.** Options that worked, best first:
  1. *Kashida (tatweel ـ)* elongation between joinable letters — the native Persian analogue of tracking; animate the number
     of tatweels (integer steps) or the scaleX of the word.
  2. `wordSpacing` animation — only visible when the line has several word gaps; on a single gap a 1→2.6 px change is
     invisible (brace-expand), so scale the amplitude up or pick option 1.
  3. Whole-word `scaleX` + opacity.
- **Never split Persian into single code points for per-unit motion.** Use `joinedGroups()` (connected letter groups) or
  `words()` from the kit; typewriters use `typeOn()` prefix slicing (shaping re-flows the last letter: correct Persian typing).
- **Fixed per-character cells (split-flap, odometer-like boards):** a cell per joined group shows isolated/initial forms
  («ز و د تر ا ر سا ل کن»). It is readable and acceptable for split-flap; for headline cells prefer one cell per **word**
  when the design allows it.
- `textTransform: uppercase` is meaningless for Persian — remove it and recover hierarchy with size/weight/colour.
- Mixed runs (Latin tokens, numbers with units) need bidi isolation (`<bdi>` or `unicodeBidi: isolate`) or punctuation
  jumps to the wrong side.

### 1b. Craft details that silently ruin the result (owner's explicit warnings)

- **Letter-by-letter must stay letter-by-letter.** When the source reveals per character (typing, write-on, per-letter fade or
  drop), a common failure is degrading it to per-word steps, or the opposite: animating single code points as separate boxes
  so the joins break. Correct: `typeOn()` prefix slicing (every frame is a correctly shaped prefix) or per `joinedGroups()`
  unit. Prove it by viewing consecutive mid-reveal frames: each step adds one letter, shaped correctly.
- **Pens and handwriting.** A pen/brush/ink effect must move **right-to-left along the real strokes of the real font**:
  derive the path from the rendered glyph outline or a stroke mask of the actual string, body strokes first, then dots
  (nuqta), kashida and small marks — as Persian is really written. Failures seen: pen moving left-to-right, jumping between
  letters, floating off the strokes, revealing dots before the body. Inspect frames where the pen is mid-word.
- **A beautiful pen needs a beautiful face.** Calligraphic, ink, poetic or luxury contexts need a genuinely elegant Persian
  face (Aref Ruqaa, Noto Nastaliq Urdu, Amiri, Markazi Text, Katibeh) with generous line-height. A strange-looking glyph shape
  is a defect even if the words are right — and check the face actually loaded (no fallback).
- **Persian typography basics.** ZWNJ (نیم‌فاصله) in words like «می‌شود»، «یادداشت‌ها»؛ Persian «ی/ک» never Arabic «ي/ك»؛
  Persian punctuation and digits; no single orphan letter at a line end.

### 1c. Per-unit effects: proven recipes (typography batch, 2026-10-11)

- **Scramble / decode / glitch:** keep the LOCKED part as one text run (prefix, shaping intact); only the hopping noise is
  rendered as fixed-width `inline-block` cells (atomic, so noise letters cannot fuse into a fake connected word); keep a hidden
  ghost copy of the final word for a stable box width and clip noise to it. Noise pool: narrow glyphs scaled ~0.8×, no Persian
  zero (renders as a dot/diamond). For per-group corruption keep density with hit probability `1-(1-g)^len`.
- **Inline per-character spans are safe for colour/text-shadow** (Chromium shapes across spans) but NOT for transforms or
  inline-block; use spans in logical order so a "lock sweep" runs right-to-left automatically.
- **Staggers over joined groups have fewer units than Latin characters:** scale the per-unit delay by
  `(original span)/(units-1)` so the first and last beats keep their original frames — or pick a Persian string with the same
  code-point count when timing is per index.
- **Falling/dropping units:** split only after non-joiners; adjacent groups in an rtl flex row with zero gap read as one word.
- **Hidden-remainder typewriters** (visible prefix + invisible rest for layout): the invisible next letter forces the last
  visible letter into its medial form; insert U+200C (ZWNJ) between the visible prefix and the hidden rest.
- **Letter-by-letter stroke-draw wordmarks:** draw each joined group as ONE continuous path, gaps only between groups. In
  skeleton letterforms keep س teeth short and sharp and the isolated ن bowl deep, or they read as blobs/smiles.
- **Stroke-segment titles** cannot be redrawn as straight segments in Persian: typeset the real word and reveal disjoint
  clip-path rectangles of it. Test-cut the font: Reem Kufi and Lalezar fragment badly, Vazirmatn 900 stays legible.
- **Tracking-expand:** animate an integer tatweel count per joint on the original easing (hide steps under the blur) plus a
  translateX of words.
- **Mask-and-rise:** the clipping box must be as tall as the Persian line box (lineHeight ~1.5) so the cut sits under descenders.
- **Weight pump:** needs a variable family (Estedad/Vazirmatn).

### 1d. Outlined / masked Persian text

- **Hollow/outline text shows seams at every join** (`-webkit-text-stroke` strokes each overlapping glyph contour) in every
  font tried. Fixes that worked: (a) 2× stroke width with `paint-order: stroke fill` and an opaque background-coloured fill on
  top; (b) for neon outlines, fill the text and build the outline with an SVG filter (feMorphology dilate − erode of
  SourceAlpha, composite out, flood colour; `filterUnits="userSpaceOnUse"` with a large region so overflowing copies aren't clipped).
- **Text inside a CSS `mask-image` SVG data-URI falls back to a system font** (isolated document, no page web fonts — FaFonts
  can't help). Shape the word once with HarfBuzz (harfbuzzjs, in a temp dir outside the repo) and embed the glyph outline paths
  in a generated `.ts` file in the card dir. Re-derive any scale origin inside a solid stroke (the alef bar works).
- `WebkitTextStroke` on a fill is fine for faking extra weight on single-weight fonts (no seams when fill and stroke match).

## 2. Fonts

- **Every family a demo uses must be loaded.** `FaRoot` loads only the family it is given. A second family set inline
  (e.g. a serif wordmark) silently falls back to the default and looks like Vazirmatn (brand-ink-open: "Markazi" rendered as
  a monoline sans). Wrap with `<FaFonts families={["Markazi Text","Vazir Code"]}>` or use `FaRoot` per region.
- **Single-weight fonts have no bold.** Lalezar, Amiri, Gandom, Shabnam, Samim, Tanha, Parastoo, Nahid, Aref Ruqaa, Katibeh,
  Lateef, Gulzar, Scheherazade… are one weight: never ask for 600/800 (fake bold smears). Emphasize with size/colour or
  choose a variable family (Vazirmatn, Estedad, Sahel, Markazi Text, Noto Kufi/Naskh, Reem Kufi, Lemonada, Baloo Bhaijaan 2).
- Heavy Latin headlines (Georgia 600, Inter 800) read lighter in Persian at the same weight: go up a weight step or +5–10 % size.
- Lalezar at very large sizes has a tight word gap — add `wordSpacing` (~0.15em) so two words don't read as one.
- Vazir Code renders Persian looking stretched and unjoined/spaced; use it only for code/terminal chrome — switch Persian runs
  inside code (comments, strings) to Vazirmatn.
- **Markazi Text renders Persian sans-like** (its serif look is Latin-only). For an editorial Persian serif use **Amiri**
  (single weight: rebuild heavy weights with a matching `WebkitTextStroke`). Markazi Text 700 is still a good weight match for
  a Helvetica-800 original when a sans is acceptable. Noto Naskh Arabic 700 reads too light at display sizes.
- **Persian has no italic.** Replace an italic accent word with colour and/or a heavier stroke, never a skew.
- **Measurements taken at mount use the fallback font.** FaRoot's delayRender does not delay child `useLayoutEffect`
  measurement: re-measure after `document.fonts.load(font, sample)` inside the component's own `delayRender`
  (or poll `document.fonts` for the loaded FontFace). Never hard-code Latin `CHAR_W` grids or "+N px slack": measure the real
  Persian row (emoji + gap + word) in a hidden probe and position from it.

## 3. Layout and direction

- Mirror what follows reading order (sidebars, rails, headers, list icons, reveals/wipes, stagger order, carousels, progress,
  arrows), keep what is physical (gravity, 3D physics, logos, code blocks, clocks, numerals inside a number).
- After mirroring, **re-check composition balance**: a title that sat next to a left sidebar can now straddle the mirrored
  sidebar edge and become illegible (page-turn-transitions). Move/resize so the mirrored layout looks designed, not flipped.
- Decorations positioned relative to text (underlines, glints, highlight bars) move when Persian line-height grows: recompute
  their offsets from the actual glyph box, don't keep the Latin numbers (brand-ink-open underline floated 40 px low).
- Charts: mirror category/time axes and series order (latest at the left end), put the value axis on the right, keep numeric
  logic; mirror the fill order inside bars too (chart-live-moves). Spectrum/frequency bar rows are category axes: mirror only
  the slot order (`x = N-1-i`) and keep the per-index maths so seeds and beats stay identical.
- **Diagonal sweeps:** mirror the gradient angle (θ → 360−θ) and anchor the band on the opposite edge
  (`right: 0` + `translateX(dir(x))`). **Sine swings:** flip the phase with `dir()` so the first pass goes toward the reading side.
- **SVG clip reveals:** apply the mirror transform to the clipPath rect and to the path separately (the clipPath lives in the
  untransformed user space of the referencing element). Mirrored clip-path karaoke: `inset(0 X% 0 0)` → `inset(0 0 0 X%)`.
- **Path-following text:** mirror x (`W−x`) and NEGATE the tangent angle (RTL text reads leftwards; `rotate(+θ)` flips pieces).
- **RTL pinned pairs:** the start word is pinned by its right edge, the rotating word by its left edge so it grows toward the centre.
- **Start-anchored sentences** get wider in Persian: shrink the anchor margin or the longest slot item overflows the far edge.
- **Percent / units in RTL flex rows:** DOM-first child sits at the right; to show «٪» left of the number put it LAST in DOM and
  make the number a `direction: ltr` island.
- **Icons in pills disappear** when a wider Persian word overflows the flex row and the SVG shrinks to 0: `flexShrink: 0` on
  icons and widen the container. Fixed-width mask windows / marquee slots sized for Latin words must be re-measured.
- **Mock documents with fixed block geometry:** Persian wraps differently; fit-check every block against its original line
  count and shorten copy rather than letting a wrapped line overlap the next block. Shrink a headline's maxWidth so the wrap
  lands on a phrase boundary; raise column gaps so an accent word doesn't merge with a neighbouring non-joiner like «در».
- **Check what the original actually renders before mirroring geometry** (an SVG `rotate(-90)` with a cx offset can turn a
  "horizontal" chain vertical): mirror the rendered result, not the intent you assume from the code.
- Digits wider than their cell: Persian digit glyphs at large sizes can exceed an `overflow:hidden` cell sized for Latin
  digits (odometer ۳ sliced) — size cells from the measured Persian glyph width.

## 4. Numbers

- Use Persian digits (`faDigits`) in UI and headlines; keep Latin digits inside code, URLs, version strings.
- **Dot-matrix / pixel digits:** hand-drawn 5×7 Persian digit bitmaps are illegible (۲ looked like ٣, ۴ a blob). Rasterize the
  real font into the grid (canvas sampling of a Persian font glyph) or keep the design's large-type fallback; verify legibility
  of the payoff frame specifically.
- Persian thousands separator is «٬», decimal «٫».

## 5. Copy / translation

- Translate idiomatically for the demo's world, not word-for-word: "Ship" → «عرضه کن» (not «منتشر کن» / «زودتر ارسال کن»),
  "60s ago" → «۶۰ ثانیه پیش» (no «ث» abbreviation).
- Persian strings are usually shorter or longer than the source: **keep the original timing beats**. Adjust per-character
  speed or stagger so a phase still ends on its original frame instead of letting the whole timeline shift.

## 6. Raster assets

- Backplate images/textures often contain baked-in English UI text ("Ask Linear…"). They cannot be translated: blur strongly
  (≥16 px), replace with a text-free plate, or regenerate. Mirror an image only if it has no text.

## 7. Tooling and process

- **Registry durations can be shorter than the design** (30 f cards whose design is 144 f, a "40f" misparse of 140 f).
  Inspect later beats with `node work/persian/render-card.mjs --slug X --duration <designFrames> --frames …` instead of
  editing frame offsets in the source (never leave temporary offsets in code). Take the design length from the source prompt.
- Run the harness **from the repo root** (from `work/` it doubles the path: ENOENT on `work\work\…`). For short-registry cards
  the original MP4 is truncated too (12–40 f), so late beats can only be checked against the source prompt, not original stills.
- Never leave temporary `FRAME_OFFSET` / `useCurrentFrame() + N` peeks in source; when repairing an interrupted card, grep for them.
- Demos at `demos/<category>/<slug>/` import the kit as `'../../_fa'` (a wrong depth fails at bundle time).
- An interrupted earlier attempt can leave a card half-edited: always diff the working copy against `work/upstream/src/demos/…`
  before starting, and finish/repair rather than redo blindly.
- Keep header comments truthful (they are the record): reviewers flag mismatches such as "130×170 cells" when the code says 144.
- No dead code or `void x;` keep-alive statements; delete unused variables.
- Write the full structured result to `work/persian/out/<slug>/report.json` — stubs are rejected.
