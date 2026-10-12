# Persian in motion — the binding rules

Read this before any Persian reaches a frame. Deeper detail: `typography-reference.md` (how and why, with
measurements) and `lessons.md` (every problem PersianArts already hit, symptom → cause → fix). When you hit a
new problem and solve it, append it to the project's `notes.md` (create it) so it can be merged into `lessons.md`.

## The twelve rules

1. **Never letter-space Persian.** `letterSpacing` must be 0 on every Persian run, including small kickers and
   labels that used tracking for style. Widen with kashida (ـ, after a forward-joining letter, max one per word)
   or `wordSpacing`, or scale the whole word.
2. **Never put Persian letters in their own boxes.** `inline-block`, flex children and per-letter transforms
   show each letter isolated. Remotion's `<AbsoluteFill>` is a flex box: wrap each Persian line in one plain
   element. Per-unit motion uses `joinedGroups()` (connected groups) or `words()` from the kit; per-letter or
   per-dot motion uses shaped outlines (`$SKILL/tools/shape_persian.py`) or ZWJ splitting (`$SKILL/tools/split_fa.js`).
3. **Typewriters slice prefixes.** Use `typeOn(text, p)`: every frame is a correctly shaped prefix. If an
   invisible remainder follows the visible prefix, insert ZWNJ between them so the last letter is not medial.
4. **Fade words, not letters.** Per-letter opacity, rgba text colour or text-stroke leaves seams at the joins.
   Hollow/outline text: use `paint-order: stroke fill` with a 2× stroke, or an SVG morphology outline filter.
5. **Masks need slack.** Clip boxes at least as tall as the line box; pad ≈0.5em top and bottom. Line height
   ≥ 1.6 (Naskh/sans and display), ≥ 2.4 for Nastaliq.
6. **Direction.** `dir="rtl" lang="fa"` (or `<FaRoot>`) on every Persian block. Latin words, numbers with units
   and URLs go in `<bdi>`/`unicode-bidi: isolate` — never isolate part of a Persian word. Reveals, staggers,
   wipes and "next" motion start on the right and travel left. Never mirror logos, clocks, play icons, code or
   the digit order inside a number.
7. **Characters.** Persian ی and ک (never ي ك), Persian digits ۰–۹ via `faDigits()` (Latin digits only in code,
   URLs, versions), thousands «٬» decimal «٫», ZWNJ in می‌/نمی‌ and before ‑ها/‑های/‑تر/‑ترین, punctuation ، ؛ ؟ « ».
8. **No uppercase, no italic.** Recover hierarchy with size, weight and colour; emphasis with colour or weight.
9. **Load every family you use.** Wrap regions with `<FaFonts families={[…]}>`; a second family set inline
   silently falls back. Measure text only after the font is loaded (`document.fonts.load`) inside `delayRender`.
10. **Only use weights that exist as files.** In the PersianArts set these ship as a single Regular file: Amiri,
    Aref Ruqaa, Gandom, Gulzar, Katibeh, Lalezar, Lateef, Nahid, Parastoo, Samim, Scheherazade New, Shabnam, Tanha,
    Vazir Code (some have more weights upstream — add the files before using them). Never request 600/800 from a
    single file: the browser smears a fake bold. Variable families (Vazirmatn, Estedad, Sahel, Noto Kufi/Naskh/
    Nastaliq, Reem Kufi, Lemonada, Markazi Text, Baloo Bhaijaan 2) can move weight.
11. **Pens and handwriting move right-to-left along the real strokes of the real glyphs**: bodies first, then
    dots and small marks. A calligraphic moment needs a genuinely elegant face (Aref Ruqaa, Noto Nastaliq,
    Amiri, Katibeh) — check in a still that it actually loaded.
12. **Copy is Persian, not translated English.** One register, natural idiom, no orphan single letter at a line
    end. Read `copy.md`. A native reader (the owner) signs off on the copy at the storyboard gate.

## Check before every still or render

- `python3 $SKILL/tools/lint_fa.py film.json brief.json direction.md scenes/` → zero ERROR.
- Look at a still at full size where the text is *mid-animation*: joins intact, dots not clipped, reveal moving
  from the right, digits Persian, nothing overflowing its box.
