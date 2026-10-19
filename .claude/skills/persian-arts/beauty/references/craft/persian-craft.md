# craft: Persian / RTL (cannot be violated accidentally)

Source of every rule below: `docs/PERSIAN-LOCALIZATION-LESSONS.md` (cited per rule), the `_fa` kit at
`work/persian/src/demos/_fa/index.tsx`, and `data/beauty-rules.csv` domain FA (31 rows). If a rule here disagrees with
the CSV, the CSV wins — quote its id.

## 0. The kit you must use

`work/persian/src/demos/_fa/index.tsx` exports:

- `FONT_FILES` — **24 registered Persian families**: Vazirmatn, Estedad, Sahel, Shabnam, Samim, Gandom, Tanha,
  Parastoo, Nahid, Vazir Code, Lalezar, Amiri, Aref Ruqaa, Katibeh, Markazi Text, Lemonada, Noto Kufi Arabic,
  Noto Naskh Arabic, Baloo Bhaijaan 2, Reem Kufi, Scheherazade New, Lateef, Gulzar, Noto Nastaliq Urdu. It loads the
  family it is given; a second family must be registered too or it silently falls back
  (`PERSIAN-LOCALIZATION-LESSONS.md` §2).
- `FaRoot`, `FaFonts`, `FaFamily` — font loading wrapper.
- `faDigits(v)` — Latin digits → U+06F0–06F9.
- `joinedGroups(text)` — connected-letter groups (the only legal per-unit split for transforms).
- `typeOn(text, p)` — prefix slice typewriter (correct Persian shaping at every `p`).
- `dir()` — sign flipper for RTL mirroring of physical motion.

Every Persian string in a card goes through this kit. `lint-film.mjs` P04 flags remote assets; there is no lint for
"used the kit" — check it by hand (K01 counts kit usage density).

## 1. Letter-spacing: absolute zero

`letter-spacing: 0` on every Persian run, every role, always (`BTY-FA-001`). Any non-zero tracking separates the
joined letters. Treat a Persian break caused by letter-spacing as an **open engine bug, not a font choice**
(`BTY-FA-002`; Chromium issue 40618336). The Persian analogues of tracking:

1. **Kashida** — integer-count tatweel U+0640 at 1–2 legal joints, hide the integer steps under a fast easing or a
   short motion blur (`BTY-FA-023`; `PERSIAN-LOCALIZATION-LESSONS.md` §1).
2. **ZWJ U+200D** when only joining control is wanted, without changing the word's width (`BTY-FA-024`).
3. `wordSpacing` animation — weak: on a single word gap a 1→2.6px change is invisible (brace-expand), so raise the
   amplitude or use option 1 (`PERSIAN-LOCALIZATION-LESSONS.md` §1).
4. Whole-word `scaleX` + opacity, capped at 1.04 (`BTY-TYPE-023`).

`text-transform: uppercase` is meaningless for Persian (`BTY-TYPE-020`). Never justify Persian paragraphs
(`BTY-FA-025`).

## 2. Joined letters: what may be split

Ranked legal units, best first (`BTY-FA-006`): whole word → closed joining segment → growing prefix → line mask.

- **Never split per code point.** Every element becomes its own shaping context and renders in isolated form —
  «ز و د» instead of «زودتر» (`BTY-FA-003`).
- Per-character/word spans get **no** margin, padding or border (`BTY-FA-004`).
- No `inline-block` cells inside a Persian word: an atomic inline is an isolation boundary (`BTY-FA-005`). Fixed
  per-character cells (split-flap, odometer) show isolated forms and are acceptable for split-flap only; for headline
  cells prefer one cell per **word** (`PERSIAN-LOCALIZATION-LESSONS.md` §1).
- Colour-only per-character spans are the one legitimate per-character device — 0 transform, 0 margin, 0 inline-block
  (`BTY-FA-022`; Chromium shapes across spans, `PERSIAN-LOCALIZATION-LESSONS.md` §1c).
- Never split a base letter from its diacritic, and never transform a glyph that carries harakat U+064B–U+0652
  (`BTY-FA-008`).
- Transform the **ancestor**, never the individual glyph (`BTY-FA-009`).
- ZWNJ words stay unbreakable via a nowrap inline span, never inline-block; 0 orphans at a line end (`BTY-FA-010`).
- Ban `word-break: break-all`, `overflow-wrap: anywhere`, hyphenation (`BTY-FA-011`).
- Stagger over joined groups, not characters: delay `= original span / (units-1)` so the first and last beats keep
  their original frames (`PERSIAN-LOCALIZATION-LESSONS.md` §1c).
- Falling units split only after non-joiners, then sit in an rtl flex row with zero gap (`PERSIAN-LOCALIZATION-LESSONS.md` §1c).

## 3. Typewriter = prefix slice

Use `typeOn(text, p)` (`BTY-FA-007`): every frame is a correctly shaped prefix of the real string, so the last visible
letter re-flows from final to medial form exactly as it does in life. A "hidden remainder" typewriter (visible prefix
+ invisible rest for layout) forces the last visible letter into its medial form unless you insert ZWNJ U+200C between
visible prefix and hidden rest — one ZWNJ at the prefix boundary, every frame (`BTY-FA-007`;
`PERSIAN-LOCALIZATION-LESSONS.md` §1c). Letter-by-letter must stay letter-by-letter: prove it by viewing consecutive
mid-reveal frames; each step adds one letter, shaped correctly (`PERSIAN-LOCALIZATION-LESSONS.md` §1b).

## 4. Numerals

- Persian digits U+06F0–06F9 only in Persian layout; 0 Latin numeral runs (`BTY-TYPE-013`, `BTY-FA-013`).
- `faDigits` for UI and headlines; keep Latin digits inside code, URLs, version strings
  (`PERSIAN-LOCALIZATION-LESSONS.md` §4).
- Isolate **only** the numeral run: LRI U+2066 / PDI U+2069 around the digits (پخ + iso(۴۵) + درجه) — never a whole
  phrase (`BTY-FA-015`), and keep the unit inside the same isolate as the number (≥ 3 bidi classes: EN number, ET
  sign, L unit) (`BTY-FA-016`). `PERSIAN-LOCALIZATION-LESSONS.md` §1 requires `<bdi>` / `unicodeBidi: isolate` for
  mixed runs or punctuation jumps to the wrong side.
- In canvas: put U+2066/U+2069 inside the drawn string **and** set `ctx.direction = 'ltr'` at the same call site
  (`BTY-FA-017`), and name the helper `iso()` on the numeral's own line so `number-lint` sees `\biso\s*\(`
  (`BTY-FA-018`).
- Separators: thousands U+066C, decimal U+066B, percent U+066A (`BTY-FA-019`).
- Numeral face: same family as surrounding text, or a deliberate display face used throughout; weight 700–800
  (`BTY-TYPE-012`). Size cells from the measured Persian glyph or large digits get sliced by `overflow:hidden`
  (`BTY-FA-031`, `PERSIAN-LOCALIZATION-LESSONS.md` §3 odometer ۳ case).
- Never hand-drawn dot-matrix pixel Persian digits; rasterise the real font into the grid or drop the treatment
  (`BTY-FA-030`) — ۲ read as ٣, ۴ as a blob (`PERSIAN-LOCALIZATION-LESSONS.md` §4).

## 5. Kashida and nuqta

- **Kashida**: integer-count U+0640 at 1–2 legal joints between joinable letters; the native expansion device
  (`BTY-FA-023`). Never letter-spacing, never sub-pixel tatweel counts. Hide the integer steps with a fast easing or
  motion blur.
- **Nuqta (dots)**: dots are part of the letter and are drawn with it. A mask container must be ≥ 1.5em tall (≥ 1.9em
  Nastaliq) so a reveal never clips dots above or the yeh tail below (`BTY-FA-020`); never scale a Persian line below
  1.0 inside a tight mask (`BTY-FA-021`).
- A pen/ink effect travels **right-to-left along the real strokes of the real font**: body strokes first, then nuqta,
  kashida and small marks. Observed failures: pen moving left-to-right, jumping between letters, floating off the
  strokes, revealing dots before the body (`PERSIAN-LOCALIZATION-LESSONS.md` §1b). Stroke-draw wordmarks: one
  continuous path per joined group, gaps only between groups; keep س teeth short and sharp and the isolated ن bowl
  deep (`PERSIAN-LOCALIZATION-LESSONS.md` §1c).

## 6. Nastaliq

≤ 5 words at ≥ 100px, line-height ≥ 1.9, never for numbers, labels or captions (`BTY-FA-027`). Reveal along its own
baseline (per-couplet line reveals, a clip window travelling with the ink), never a left-to-right horizontal wipe
(`BTY-FA-028`). Nastaliq is a calligraphic register: pair it with generous line-height and a genuinely elegant face
(Aref Ruqaa, Noto Nastaliq Urdu, Amiri, Markazi Text, Katibeh) and verify it loaded
(`PERSIAN-LOCALIZATION-LESSONS.md` §1b, §2).

## 7. Outlined and masked Persian type

- Never `-webkit-text-stroke` as an outline on joined Persian: it strokes each overlapping glyph contour, so every
  join shows a seam (`BTY-TYPE-016`). Use 2× stroke + `paint-order: stroke fill` with an opaque fill, or an SVG
  `feMorphology` dilate−erode outline (`PERSIAN-LOCALIZATION-LESSONS.md` §1d).
- Never set Persian text inside a CSS `mask-image` SVG data-URI (0 uses): that document is isolated and has no page web
  fonts, so the text falls back to a system font (`BTY-FA-029`). Shape the word once with HarfBuzz (harfbuzzjs, temp
  dir outside the repo) and embed glyph outline paths in a generated `.ts` in the card dir
  (`PERSIAN-LOCALIZATION-LESSONS.md` §1d).
- Stroke-segment titles cannot be straight segments in Persian: typeset the real word and reveal disjoint clip-path
  rectangles. Reem Kufi and Lalezar fragment badly; Vazirmatn 900 stays legible
  (`PERSIAN-LOCALIZATION-LESSONS.md` §1c).

## 8. Mirroring with logical props

Mirror what follows reading order; keep what is physical (`PERSIAN-LOCALIZATION-LESSONS.md` §3):

| mirror | keep |
|---|---|
| sidebars, rails, headers, list icons, reveals/wipes, stagger order, carousels, progress, arrows | gravity, 3D physics, logos, code blocks, clocks, numerals inside a number |

Operationally:

- Use `dir()` for physical motion: diagonal sweeps θ → 360−θ with the band anchored on the opposite edge
  (`right: 0` + `translateX(dir(x))`); flip sine phase with `dir()` so the first pass goes toward the reading side
  (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Mirror the clipPath rect **and** the path separately (the clipPath lives in untransformed user space); mirrored
  clip-path karaoke is `inset(0 X% 0 0)` → `inset(0 0 0 X%)` (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Path-following text: mirror x → W−x and **negate** the tangent angle (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Re-check composition balance after mirroring: a title beside a left sidebar can straddle the mirrored edge
  (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Recompute decoration offsets from the real glyph box after mirroring; Persian line-height moved the box
  (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- RTL pinned pairs: start word pinned by its right edge, rotating word by its left edge, growing toward the centre
  (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Percent/units in RTL flex rows: DOM-first child sits right; to put «٪» left of the number, place it LAST in DOM and
  make the number a `direction: ltr` island (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- `flexShrink: 0` on icons in pills, and widen the container (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Charts: mirror category/time axes and series order (latest left), value axis on the right; mirror bar fill order
  (`x = N−1−i`) but keep per-index maths so seeds and beats are unchanged
  (`PERSIAN-LOCALIZATION-LESSONS.md` §3).
- RTL anchor is preserved in **both** ratios (`BTY-RATIO-003`, `BTY-COMP-005`); a left-anchored landscape cut is a
  defect (`CRAFT-AUDIT.md` D9).

## 9. Copy and assets

Idiomatic translation, not word-for-word ("Ship" → «عرضه کن», not «منتشر کن»; "60s ago" → «۶۰ ثانیه پیش»), and keep the
original timing beats when Persian length differs (`PERSIAN-LOCALIZATION-LESSONS.md` §5). Blur baked-in foreign text
≥ 16px, replace the plate, or regenerate; mirror an image only if it carries no text
(`PERSIAN-LOCALIZATION-LESSONS.md` §6). Write Persian JSON/text with `encoding="utf-8"` on Windows — the cp1256 default
can cut a phrase mid-glyph (`PERSIAN-LOCALIZATION-LESSONS.md` §7).

## 10. Failure modes that shipped anyway

Letter-spacing separations, per-code-point splits, isolated-form split-flap cells, per-character transforms, an
odometer sliced digit, a dot-matrix ۲ that read as ٣, a left-to-right pen, a mask that cut the dots, a landscape cut
that broke the RTL anchor — all in `docs/PERSIAN-LOCALIZATION-LESSONS.md`; all of them are covered by rules above.
