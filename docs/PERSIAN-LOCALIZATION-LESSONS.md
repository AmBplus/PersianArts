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

## 2. Fonts

- **Every family a demo uses must be loaded.** `FaRoot` loads only the family it is given. A second family set inline
  (e.g. a serif wordmark) silently falls back to the default and looks like Vazirmatn (brand-ink-open: "Markazi" rendered as
  a monoline sans). Wrap with `<FaFonts families={["Markazi Text","Vazir Code"]}>` or use `FaRoot` per region.
- **Single-weight fonts have no bold.** Lalezar, Amiri, Gandom, Shabnam, Samim, Tanha, Parastoo, Nahid, Aref Ruqaa, Katibeh,
  Lateef, Gulzar, Scheherazade… are one weight: never ask for 600/800 (fake bold smears). Emphasize with size/colour or
  choose a variable family (Vazirmatn, Estedad, Sahel, Markazi Text, Noto Kufi/Naskh, Reem Kufi, Lemonada, Baloo Bhaijaan 2).
- Heavy Latin headlines (Georgia 600, Inter 800) read lighter in Persian at the same weight: go up a weight step or +5–10 % size.
- Lalezar at very large sizes has a tight word gap — add `wordSpacing` (~0.15em) so two words don't read as one.
- Vazir Code renders Persian looking stretched; use it only for code/terminal chrome, not for Persian prose.

## 3. Layout and direction

- Mirror what follows reading order (sidebars, rails, headers, list icons, reveals/wipes, stagger order, carousels, progress,
  arrows), keep what is physical (gravity, 3D physics, logos, code blocks, clocks, numerals inside a number).
- After mirroring, **re-check composition balance**: a title that sat next to a left sidebar can now straddle the mirrored
  sidebar edge and become illegible (page-turn-transitions). Move/resize so the mirrored layout looks designed, not flipped.
- Decorations positioned relative to text (underlines, glints, highlight bars) move when Persian line-height grows: recompute
  their offsets from the actual glyph box, don't keep the Latin numbers (brand-ink-open underline floated 40 px low).
- Charts: mirror category/time axes and series order (latest at the left end), put the value axis on the right, keep numeric
  logic; mirror the fill order inside bars too (chart-live-moves).

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
- An interrupted earlier attempt can leave a card half-edited: always diff the working copy against `work/upstream/src/demos/…`
  before starting, and finish/repair rather than redo blindly.
- Keep header comments truthful (they are the record): reviewers flag mismatches such as "130×170 cells" when the code says 144.
- No dead code or `void x;` keep-alive statements; delete unused variables.
- Write the full structured result to `work/persian/out/<slug>/report.json` — stubs are rejected.
