# craft: type and hierarchy

Hierarchy is a relationship, not a size ladder. Two lines differing only in scale read as one line that got smaller —
that is the exact defect of s10 (`CRAFT-AUDIT.md` D2: headline and sub-line same white, same weight, size-only
difference).

## 1. The eight roles

Declare per ratio (`BTY-TYPE-001`; numbers from `ART-DIRECTION-STANDARD.md` §2, 1080 short-axis reference):

| role | weight | size | tracking | colour | job |
|---|---|---|---|---|---|
| display | 800–900 | 96–132px | −0.02em | ink, or page on dark | one line per film, the claim |
| headline | 600–700 | 56–72px | −0.01em | ink | scene titles |
| deck | 300–400 | 34–40px | 0 | ink @70% | the line under a headline |
| body | 400 | 28–32px | 0 | ink @80% | running copy |
| label | 500–600 | 20–24px | +0.06em | signal | eyebrows, overlines, tags |
| legal | 300 | 16–18px | +0.02em | ink @55% | ISO, dates, certificates |
| numeral | 700–800 | 1.4× the element it counts | 0 | ink | Persian counters and stats |
| button | 600 | 30–34px | 0 | page on accent | CTA only |

Eyebrow → headline → deck is the workhorse stack: label above, headline, one deck line under. The eyebrow is always
the same size regardless of headline. `tracking` in this table is a **Latin-only** column: for Persian every row is 0
(`BTY-FA-001`, see §7).

## 2. Scale ratios

- Two-axis contrast: at least one *adjacent* pair differs ≥ 200 weight units **and** ≥ 1.5× size (`BTY-TYPE-002`).
  Mechanism: weight changes stroke density, size changes extent; the eye uses both to decide what leads. One axis
  alone is a resize.
- Weight gap inside a family ≥ 300 axis units; 300/400/500 is forbidden, 250/550/850 is a clean three-step system
  (`BTY-TYPE-003`). Mechanism: adjacent weights are inside the eye's "same" band.
- Sizes come from a modular ladder 20:24:40:72:120:168:260, max 2 steps apart inside one visual group
  (`BTY-TYPE-006`). Mechanism: steps > 2 break the grouping and the reader stops treating the block as one statement.
- Cap at three roles per frame, numeral counted (`BTY-TYPE-004`). Four live blocks is a layout failure, not richness.
- Persian runs get +5–10% size or one weight step over the Latin spec they came from (`BTY-TYPE-014`) — Persian
  x-height is smaller, so an equal spec reads lighter (`docs/PERSIAN-LOCALIZATION-LESSONS.md` §2).

## 3. Optical vs mathematical alignment

- Derive every offset from the measured ink box of the real string (`actualBoundingBoxAscent/Descent`), never a Latin
  cap/x-height grid (`BTY-TYPE-019`).
- Re-measure after `document.fonts.load()` (`BTY-FA-026`); a mount-time measure uses the fallback font
  (`PERSIAN-LOCALIZATION-LESSONS.md` §2).
- Underlines/overlines sit ≥ 1.35× the Latin offset below the baseline, ≥ 6px clearance from the measured descender
  (`BTY-TYPE-018`). Mechanism: a decoration placed with Latin metrics floats off a Persian line (brand-ink-open
  underline floated 40px low, `PERSIAN-LOCALIZATION-LESSONS.md` §3).
- Text blocks share one 8px baseline grid across all scenes (`BTY-TYPE-026`). Mechanism: a shared baseline is what
  makes separately-built scenes look composed.
- A label's rule is exactly the measured label width, 3–4px tall, right-aligned to the block (`BTY-TYPE-010`).
  Mathematical alignment to the column instead of the word is visible as a gap.

## 4. Weight contrast and variable axes

- Animate weight only: we hold no Persian face with `wdth` or `opsz` (wght 100..900 Vazirmatn/Estedad/NotoKufiArabic,
  400..900 Sahel, 300..700 Lemonada) — `BTY-TYPE-022`. Mechanism: asking for an axis that does not exist is a silent
  no-op that ships as "no effect".
- Never fake bold on a single-weight face: Lalezar, Aref Ruqaa, Amiri, Katibeh, Gulzar, Gandom, Shabnam, Samim,
  Parastoo, Nahid, Scheherazade New, Lateef, Vazirmatn-RD (`BTY-TYPE-015`). Mechanism: synthetic bold smears the
  letterforms. `WebkitTextStroke` matching the fill is the one safe fake
  (`PERSIAN-LOCALIZATION-LESSONS.md` §1d).
- When animating weight, reserve the box with a hidden ghost copy at the final weight and keep ≤ 1 animated text node
  per shot (`BTY-TYPE-021`). Mechanism: weight changes advance widths, so everything after it reflows mid-shot.
- `scaleX` stretch ≤ 1.04, never the primary width device (`BTY-TYPE-023`); prefer kashida (see `persian-craft.md`).

## 5. Tracking

Tracking is a Latin device. For a Latin kicker it buys presence at small sizes (`label` +0.06em, `legal` +0.02em).
For Persian it is forbidden, always, at every role (`BTY-FA-001`, `BTY-FA-002`); the Persian analogue is kashida
(`BTY-FA-023`) or word spacing (`PERSIAN-LOCALIZATION-LESSONS.md` §1). `text-transform: uppercase` is meaningless for
Persian and is banned with it (`BTY-TYPE-020`).

## 6. Line length, line height, envelope

- 9:16 body measure ~700px (~45–55 Persian characters); 16:9 two ~700px columns with a 120px gutter; display max
  940px tall / 1400px wide (`BTY-TYPE-007`). Mechanism: 45–55 characters is the readable measure; a 1500px line loses
  the return sweep.
- Break Persian lines from an explicit line array, never a live browser wrap (`BTY-FA-012`). Mechanism: determinism —
  the composition must be a function of `t`, not of font timing.
- Line-height: ≥ 1.4 display Naskh, ≥ 1.6 body, ≥ 1.9–2.2 Nastaliq; mask containers ≥ 1.5em (`BTY-TYPE-017`,
  `BTY-FA-020`). Mechanism: Persian dots and descenders need the taller box or a mask clips them.
- Envelope: 9:16 → 72px sides, 140px top, 180px bottom; 16:9 → 96px sides, 64px top/bottom; nothing clipped by the
  canvas edge (`BTY-TYPE-025`). Two live blocks per region maximum, separated ≥ 1.5× the larger cap height or by an
  explicit rule (`BTY-TYPE-024`).
- Text over scenery needs a knockout, a scrim at 55–75%, or ≥ 45% L* separation (`BTY-TYPE-009`). Mechanism: the
  pixels behind type change per frame, so the guarantee must be structural.

## 7. Type as hero

- One display line per film carries the claim, 1–3 words, 96–132px (`BTY-TYPE-011`). One claim is memorable; three are
  none.
- Hero size is measured on TEXT or the subject, never on the largest decorative element (`BTY-COMP-002`; the old
  estimator reported a 41% ring where the headline line was 8.1%, `SKILL.md` rule 17i / L-123).
- Type can be the whole art direction: `library/media/typography/*` is 39 Persian text techniques (assembly, kashida,
  nuqta, mask, typewriter, splitflap, glitch, inktrace, outlinefill, counter, scramble, …) and s11's paper/ruled-line
  world is the batch's best hierarchy (`CRAFT-AUDIT.md` credit note, `_frames/s11-9x16/s11_15.48s.png`).
- The linter backs the mechanical half: `T01` letter-spacing on Persian, `T02` text stroke, `T03` per-character split,
  `T04` unnested Persian numerals, `D03` roles must differ in weight (`tools/lint-film.mjs`).

## 8. Failure modes in this repo

- One family, one weight, size as the only variable — D2.
- No eyebrow, no rule doing work, no colour role for secondary copy — D2.
- Live text on live text (s09 end card headline printed across the certificate's own text) — D3, worst defect in the
  batch.
- HUD that migrates across the frame and a unit stranded ~700px from its numeral — D3 (s12).
- Two whites within a few % of each other in one film — D5 (s11).
