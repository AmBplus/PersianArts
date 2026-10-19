# Independent QC Review — s09-university-sun

Reviewer: independent QC (did not build this film). No git, no board writes, no edits to `film.html` or `work/persian/htmlfilm/lib/`. Silent v1, 750 frames @ 30 fps = 25.000 s, ratios 9:16 and 16:9. Time box 12 min.

Method note: I ran both gate commands myself, extracted frames **from the delivered mp4s** (not only from the builder's `_stills/`), and read film.html only to explain what the pictures show.

---

## Verdict (SHIP / SHIP WITH NOTES / FIX)

**FIX.**

Two delivery blockers that no reader can miss and no gate caught:

1. **A debug HUD is burned into every frame of both delivered mp4s.** White monospace box, top-left, reading `f729 4444…{"i":3,"t":…,"wName":993,…}` (verified by extracting frames from `silent-9x16.mp4` and `silent-16x9.mp4` with ffmpeg). Cause: `film.html:48` appends `"&debug=2"` to `location.search` unconditionally, and `film.html:391` then inserts a fixed white `<pre id="dbg">` every frame. This is also the whole of the 16:9 `edge-touch` failure (`f630-633 top bbox 1180,0,1412,32`).
2. **The film's call to action never appears, and the deadline date is missing in the primary 9:16 ratio.** `film.html:360` gates the CTA on `prog(t, 9.0, 0.6)` where the answer scene starts at beat 35 = 21.0 s, so the CTA needs t ≥ 9 s → ≥ 30.0 s in a 25.000 s film. The declared events `deadline stamp` (beat 43 = 25.8 s), `CTA pulse` (beat 48 = 28.8 s) and `pad out` (beat 45 = 27.0 s) are all past the end of the film. In 9:16 the printed deadline `۱۵ مهر` is clipped off the right edge (only `مهلت ثبتنام:` is on screen at f729).

Three further hard defects (see Defects table): 3 of the 4 panel numbers are broken, `events.json` describes an edit that does not exist in the mp4, and the 16:9 frame has black letterbox bands.

---

## Score (0-100) + breakdown (story, Persian typography, per-ratio layout, motion craft, goal delivery)

**59 / 100 — FIX**

| Axis | Score | Evidence |
|---|---|---|
| Story | 15/20 | Real arc: question → 4 faculties → campus → diploma; the payoff line exists and is the *same* question answered. Loses points because the payoff is drawn at ~3% of frame height in 9:16 (illegible) and the deadline/CTA beat of the story is unreachable. |
| Persian typography | 14/20 | Vazirmatn Variable woff2 present, Persian digits throughout (`۸۴`, `۱۴٬۲۰۰`, `۵۲`, `۴`, `۱۵ مهر`), mixed Latin `F0۴` correctly isolated (`U+2066…U+2069`, `ctx.direction="ltr"`), joins intact (no letter-spacing on Persian runs). Loses points on the campus panel: `۸۴` is drawn *on top of* the label `هیئت` and `۴` / `۵۲` never appear (zoom evidence in stills section), and on `block()` writing the two deadline segments in the wrong order. |
| Per-ratio layout | 10/20 | 16:9 is a genuinely separate composition (`LAYOUT["16x9"]`, paper on the left, copy column right) — not a crop, good. But 16:9 has ~40 px black bands inside the frame on right+bottom, and 9:16 clips the deadline date off-frame. Hero text measured 5.7% (9:16) and 8.9% (16:9) of frame height vs the ≥12% rule; three of five 9:16 scenes have hero digits at 2-3%. |
| Motion craft | 14/20 | 7 visibly distinct states, camera move per ratio, deterministic grain, cut-based edit, `.woff2`-gated boot. Loses points for `duplicate-template FAIL` (the four faculty scenes are one composition) and for cuts that do not fall where the film's own header and `events.json` say they do. |
| Goal delivery | 6/20 | The goal's desiredAction (register) is not on screen at any frame; the one clear deadline is unreadable in 9:16 and segment-reversed in 16:9; the "register" event is declared at 28.8 s in a 25 s film. |

---

## Gates (raw output both ratios + your reading)

Command (unchanged from the order, `--no-logo`, no `--one-take`):

```
node work/persian/tools/gates/run-gates.mjs media/film-versions/s09-university-sun/v1/silent-9x16.mp4 --src work/persian/htmlfilm/s09-university-sun --events work/persian/htmlfilm/s09-university-sun/events.json --no-logo
```

9:16 raw output:

```
logo-colour gate skipped (no brand asset)
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=750  sampled=308  scenes=7
edge-touch           | FAIL | 24/308 sampled frames; frames 93-99, 690-695, 700-702, 708-735, 741-744; e.g. f93 left bbox 0,1080,12,1580
empty-band           | PASS | worst f207 4%
dead-frames          | PASS | 7 scene starts checked (window start-2..start+10)
duplicate-template   | FAIL | 7 scene midpoints; S4~S5 pHash 0.84 IoU 0.79
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | WARN | 9:16 target >= 12%; below: S5,S6; S1 44%@f9 S2 45%@f201 S3 45%@f255 S4 31%@f414 S5 2%@f485 S6 3%@f687 S7 46%@f729
[exit=1]
```

16:9 raw output:

```
logo-colour gate skipped (no brand asset)
# run-gates silent-16x9.mp4  1920x1080  frames=750  sampled=308  scenes=7
edge-touch           | FAIL | 2/308 sampled frames; frames 630-633; e.g. f630 top bbox 1180,0,1412,32
empty-band           | PASS | worst f234 3%
dead-frames          | PASS | 7 scene starts checked (window start-2..start+10)
duplicate-template   | FAIL | 7 scene midpoints; S4~S5 pHash 0.81 IoU 0.79; S6~S7 pHash 0.94 IoU 0.88
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | target 12% applies to 9:16 only; S1 60%@f27 S2 54%@f207 S3 54%@f351 S4 54%@f405 S5 3%@f522 S6 29%@f630 S7 9%@f738
[exit=1]
```

My reading, FAIL by FAIL:

- **9:16 edge-touch FAIL (24/308) — confirmed, two different causes.** (a) `f93-99 left bbox 0,1080,12,1580`: I see the thin gold/dark decorative sliver of the exam-hall sheet crossing the left frame edge in `t3_20s_f096.png`; that is a decorative shape cut by the edge, exactly the class this gate reports. (b) `f690-744`: I cannot defend this as decoration — the same window contains the answer scene, where the deadline plate (`roundR(-420, …)` at `film.html:356`, later rotated and re-scaled) sits within ~2% of the bottom edge in 9:16 (`mp4_f729.png`). Text-sized/decorative blobs on the outer margin, counted as FAIL.
- **16:9 edge-touch FAIL (2/308) — confirmed, and it is the debug HUD**, not art: `f630 top bbox 1180,0,1412,32` matches the white `<pre>` box in the extracted mp4 frame `mp4_f630.png` (box at y 0-32, x ≈ 1180-1412 in that frame's layout). Fix the HUD and this FAIL disappears — a gate PASS bought by fixing a defect, not by hiding a false positive.
- **duplicate-template FAIL both ratios — confirmed by eye.** The four faculty scenes (teal / amber / plum / navy) are the same composition: centered sheet, `دانشگاه آفتاب` + `F0x` top, two-line faculty name at the bottom, plates/panel bottom. `pHash 0.81-0.84, IoU 0.79` is exactly the anti-slideshow property this film most needed and did not achieve. `S6~S7 0.94/0.88` in 16:9 additionally says campus and answer are largely one picture (same indigo + gold sunburst + centered sheet).
- **hero-size WARN 9:16 — confirmed and worse than the gate says.** S5 2%, S6 3% are real (engineering and campus scenes carry their hero as prose, not as large digits). My own measurement of the two hero lines that *are* the film's message: the payoff `آفتاب، جوابِ همان سؤال بود.` renders ~60 px cap height in 9:16 (3.1% of 1920) because `maxW: 960` shrinks the 150 px font (`film.html:352`), while the identical line in 16:9 is ~140 px (13.0% of 1080). The film's key sentence is 3-4× smaller in the primary ratio.
- **number-lint PASS — I do not accept this as evidence.** It reports `0 files`. The source contains many number tokens (`۸۴`, `۱۴٬۲۰۰`, `۵۲`, `۴`, `۴٫۵`, `۱۵ مهر`, `F0۴`). Either it scanned nothing (a no-op PASS) or "0 files" means "0 files with violations" — the output does not distinguish these. Treated as unverified, not as a pass.
- **empty-band / dead-frames PASS — consistent with what I see**: no flat flood, no uniform opening; campus and answer both carry texture and rays.
- **logo-colour N/A** by `--no-logo` (correct: no brand asset in this invented-university film).

---

## Stills reviewed (one line per image + path)

Read at least five per ratio. "mp4 frames" were extracted by me from the delivered mp4 (`ffmpeg -vf select=eq(n,…)`), because the builder's `_stills/` turned out to disagree with the mp4 (see below).

9:16 (1080x1920):

1. `media/film-versions/s09-university-sun/v1/_stills/t1_00s_f030.png` — dark indigo exam hall, blank lined sheet centered, pen entering left, gold sliver at left edge; the opening question is NOT on screen at f30; no debug box.
2. `…/_stills/t3_20s_f096.png` — teal chalk grid, `دانشگاه آفتاب` + `F01` top (Persian ۱), sheet with starburst `۴۴`-looking mark, large `علوم پایه` hero, ghosted second copy of the name below the sheet; the gold sliver touches the left edge (matches edge-touch f93-99).
3. `…/_stills/t4_40s_f132.png` — amber/brown lab, sheet with hexagons + gold check, three beakers with light glows, tiny captions `دانشگاه علوم آزمایشگاهی` and `علوم آزمایشگاهی`; captions are ~12-14 px tall on 1080 — not legible.
4. `…/_stills/t6_80s_f204.png` — same amber lab composition as #3 with fuller beakers; proves the faculty scenes repeat a template.
5. `…/_stills/t7_90s_f237.png` — same amber lab composition again (hexagons + check + beakers); third near-identical state.
6. `…/_stills/t10_60s_f318.png` — plum/violet letters scene, sheet with a navy calligraphy stroke and a gold underline, two tiny captions (`دانشگاه ادبیات و علوم انسانی`, `ادبیات و علوم انسانی`); top band has no `F0x` plate in this frame; the reading copy is decorative, not informative.
7. `…/_stills/t19_20s_f576.png` — golden-hour campus, `دانشگاه آفتاب`+`F04` top, `پردیس آفتاب` over three buildings, 4 faculty plates (3 across + 1 below), bottom info panel; panel reads `دانشکده` / `عضو هیئت علمی` / `۱۴٬۲۰۰ دانشجو` / `سال تاریخ` — the numbers `۴`, `۸۴`, `۵۲` are not where they should be.
8. `…/_stills/t15_20s_f456.png` — campus variant (larger sheet, sunburst, same panel); same missing numbers.
9. `…/_stills/t23_60s_f708.png` — answer scene: diploma sheet, `دانشگاه آفتاب` + `گواهی پایان دوره`, tiny payoff line at top (~30 px), large `مهلت ثبتنام:` at the bottom with NO date beside it.
10. `…/_qc_stills_9x16/mp4_f729.png` (extracted from the mp4) — final frame: debug HUD `f729 4444…` top-left, 3% payoff line, diploma, `مهلت ثبتنام:` bottom, date absent.
11. `media/film-versions/s09-university-sun/v1/zoom-code-f576.png` — builder's zoom: `F0۴` rendered LTR with Persian ۴, correct isolate and glyph order; Vazirmatn's Persian ک/گ forms visible in `دانشگاه`.
12. `media/film-versions/s09-university-sun/v1/zoom-panel-f576.png` — builder's zoom of the campus panel: `دانشکده` (no `۴`), `عضو ه۸۴یئت علمی` (**`۸۴` drawn on top of the label**), `۱۴٬۲۰۰ دانشجو`, `سال تاریخ` (no `۵۲`). 3 of 4 numbers are wrong.
13. `media/film-versions/s09-university-sun/v1/check-debug-9x16.png` — builder's own capture of the top strip: `f30 undefined` white HUD box. The builder had this artifact in hand.

16:9 (1920x1080):

14. `…/_stills-16x9/t23_60s_f708.png` — answer scene, wide layout: payoff line large and legible (~140 px), diploma on the right half, `مهلت ثبتنام:` left-of-centre and `۱۵ مهر` far right; debug HUD top-left; black band right+bottom.
15. `…/_stills-16x9/t19_20s_f576.png` — campus wide: paper cluster left, `پردیس آفتاب` right, plates in one row, panel bottom; HUD strip; black band right+bottom; panel shows the same broken numbers.
16. `…/_stills-16x9/t1_00s_f030.png`, `t4_40s_f132.png`, `t10_60s_f318.png`, `t15_20s_f456.png` — same wide per-scene compositions as the 9:16 counterparts but re-laid-out (not a crop): left paper cluster, right copy column, bottom-left strip.
17. `…/_qc_stills_16x9/mp4_f630.png` (from the mp4) — proof the HUD is inside the delivered wide file: `f630 4444…` box at top-left; also the top-edge shape the 16:9 edge-touch gate flagged.
18. `…/_qc_stills_16x9/mp4_f729.png` (from the mp4) — final wide frame: payoff line, diploma, deadline label + `۱۵ مهر`, HUD still present.

16:9 judgement: **DESIGNED, not a crop** — the 16:9 uses its own `LAYOUT` entry (paper left of centre, copy column on the right, single row of plates, bottom strip), and frames 14-16 could not be produced by cropping the 9:16. It is, however, under-filled and mis-framed: ~40 px black bands on the right and bottom inside the 1920x1080 raster.

---

## Claim legibility table (claim | still | legible yes/no)

| Claim in the film | Still where it is legible | Legible? |
|---|---|---|
| `دانشگاه آفتاب` (word mark) | all faculty/campus/answer frames, e.g. `_stills/t3_20s_f096.png` top, `mp4_f729.png` on the diploma | **yes** |
| `دانشکدهٔ علوم پایه` (faculty 1) | `_stills/t3_20s_f096.png` large white hero (yes); plate in `t19_20s_f576.png` (no, ~46 px) | **yes** (hero form only) |
| `دانشکدهٔ علوم آزمایشگاهی` (faculty 2) | `_stills/t4_40s_f132.png` caption only, ~13 px tall | **no** |
| `دانشکدهٔ ادبیات و علوم انسانی` (faculty 3) | `_stills/t10_60s_f318.png` caption ~12 px | **no** |
| `دانشکدهٔ فنی و مهندسی` (faculty 4) | `_stills/t15_20s_f456.png` / `t19_20s_f576.png` plate ~46 px | **borderline** |
| Four-faculty list (`دانشکده`) as a *plate row* | `t19_20s_f576.png` plates 3+1 | **borderline** (46 px) |
| `۴` دانشکده (faculty count) | campus panel, `zoom-panel-f576.png`, `t19_20s_f576.png` | **no** — number not drawn/visible |
| `۸۴` عضو هیئت علمی | `zoom-panel-f576.png` | **no** — `۸۴` overlaps the word `هیئت`; unreadable |
| `۱۴٬۲۰۰` دانشجو | `zoom-panel-f576.png` — clean | **yes** |
| `۵۲` سال (years) | campus panel | **no** — number absent; the label itself reads `سال تاریخ` (wrong phrase: should be `سال تأسیس`) |
| `مهلت ثبتنام:` (deadline label) | `mp4_f729.png` (9:16) and `mp4_f729.png` (16:9) | **yes** |
| `۱۵ مهر` (the actual deadline date) | 9:16: nowhere — clipped off-frame at f729 / f708 | **no** |
| `۱۵ مهر` in 16:9 | `mp4_f729.png` (16:9) far right, but adjacent to the label in reversed segment order (date appears before the label in RTL reading) | **yes (order wrong)** |
| `آفتاب، جوابِ همان سؤال بود.` (payoff) | 16:9 `mp4_f729.png` (~140 px, yes); 9:16 `mp4_f729.png` (~60 px, marginal) | **16:9 yes / 9:16 marginal** |
| Opening question `سؤالِ من چه میشود؟` | not legible in any still I read; scene 1 stills (f30) show the blank sheet with no question drawn | **no** |
| CTA `ثبتنام در دانشگاه آفتاب` | **no still, no frame — never rendered** (`prog(t,9.0,0.6)` needs ≥30.0 s) | **no** |
| `پردیس آفتاب` | `t19_20s_f576.png`, `mp4_f630.png` | **yes** |
| `گواهی پایان دوره` | `mp4_f729.png` (both ratios) | **yes** |
| `F01…F04` faculty codes | faculty frames, e.g. `zoom-code-f576.png` (`F0۴`) | **yes** (but unreadable-as-meaning: Latin F + Persian digit) |

Asserted-but-not-legible count: question line, `۴`, `۸۴`, `۵۲`, `۱۵ مهر` (9:16), CTA, and faculty names 2/3 as captions. For a film whose stated genre is *information-dense institutional introduction*, the loss of the question, three of four counts, the deadline in the primary ratio and the entire CTA is the core failure.

---

## Persian typography and numbers

- **Digits:** Persian-Indic throughout in the rendered text I inspected: `۸۴`, `۱۴٬۲۰۰` (Persian thousands separator `٬`), `۵۲`, `۴`, `۱۵ مهر`, and `F0۴`. No ASCII digits appear in Persian copy. `events.json`/`film.html` keep them as string constants (`film.html:82`), so no runtime numeric formatting can leak Latin digits.
- **Isolate:** `film.html:101-102` defines `U+2066`/`U+2069` and `wrapIsolate`; the mixed Latin code is drawn as `wrapIsolate(code)` with `direction:"ltr"` and left alignment measured by `measure(wrapIsolate(code))` (`film.html:273-277`). `zoom-code-f576.png` confirms the result: `F0۴` reads left-to-right with the Persian ۴ as the last glyph — correct, not mirrored.
- **Isolates elsewhere:** faculty names and the campus cards pass through `"\u2066" … "\u2069"` (`film.html:279-281`) with `direction:"rtl"`, which is the safe combination. No reversed word order appears in any still.
- **Joins:** no `letterSpacing` is applied to Persian runs anywhere in the inspected code (the `space:` values at `film.html:332/358` are inter-segment gaps in `block()`, not letter tracking). Glyph shapes in `zoom-panel-f576.png` and `zoom-code-f576.png` show intact joining forms (`دانشکده` with the correct final ه, the Persian ک/گ bowl-and-stroke forms), i.e. no broken joins and no per-character split artifacts.
- **Deadline segment order — defect.** `block([{s:"مهلت ثبتنام:"},{s:DEADLINE}], {align:"right", x: …})` (`film.html:358`) places the second segment to the **right** of the anchor instead of continuing leftwards in RTL. Visible result: 16:9 shows `۱۵ مهر` rightmost and the label to its left (`mp4_f729.png` 16:9); 9:16 pushes `۱۵ مهر` past `x=1080` and it disappears entirely.
- **Panel numbers — defect (worst typography failure).** `film.html:329-332` renders `block([{s: n},{s: lab}], {align:"right", …})` per row. In `zoom-panel-f576.png`: row 2 draws `۸۴` overlapping `هیئت`; rows 1 and 4 show only the labels (`دانشکده`, `سال تاریخ`) with no `۴` / `۵۲`; only row 3 (`۱۴٬۲۰۰ دانشجو`) reads correctly. Also `سال تاریخ` is not idiomatic Persian for "founding year" (`سال تأسیس` intended) — the copy in the film is wrong, not just the layout.
- **Font actually rendered:** `fonts/Vazirmatn-Variable.woff2` exists in the film dir (111,128 bytes); `film.html:34` declares `@font-face{font-family:"PAHead"; src:url("fonts/Vazirmatn-Variable.woff2")}` with a relative path only, and `film.html:401-402` awaits `document.fonts.load("900 40px PAHead")` + `document.fonts.ready` before the first `render(0)`, so the first frame is drawn after the face is available. Glyph shapes in the two builder zooms match Vazirmatn's Persian forms (not a generic system fallback: the ک/گ and ۴ shapes and the yeh/keheh terminals are Vazirmatn's). **Limitation stated plainly:** I could not run a headless `document.fonts.check("900 40px PAHead")` query in this session, so my font evidence is "local woff2 present + load awaited + glyph-shape match", not a runtime family readback. I am not claiming the runtime check.

---

## Story and goal

From the `film.html` top comment block (that block is the film's plan):

- **LOGLINE:** `«از یک سؤالِ ساده تا یک مدرک» — one student's question travels through the whole university and comes back as a diploma.`
- **GOAL (implied by the plan's SCENES/COPY lines):** introduce the invented `دانشگاه آفتاب` and its four faculties, then convert with a deadline + register CTA.
- **desiredAction:** `مهلت ثبتنام: ۱۵ مهر` + `ثبتنام در دانشگاه آفتاب` (`film.html:358-362`, "register CTA pulse" event at beat 48).
- **Promise in the brief:** a question asked at the start is answered at the end.

Delivery judgement:

- The **question → answer spine exists in the code and is correctly written**: scene 1 draws `سؤالِ من چه میشود؟` (f0-3.0 s) and scene 7 draws `آفتاب، جوابِ همان سؤال بود.` — the same question answered. In 16:9 the payoff is big, legible, and lands well.
- It **fails as delivered** for three reasons. (a) The opening question is not legible in any still I read: at f30 the sheet is blank and the question text is either not yet drawn or drawn below legibility — I could not find a single 9:16 or 16:9 still where `سؤالِ من چه میشود؟` reads. If the audience never reads the question, the final answer has nothing to resolve. (b) In the primary 9:16 the payoff is ~3% of frame height, so the resolution is technically present but not readable on a phone. (c) The **desiredAction is unreachable**: no CTA frame exists in 750 frames, and the deadline date is off-frame in 9:16. The film therefore ends on an assertion ("here is a diploma") with no next step — exactly the part an institutional introduction must deliver.
- Secondary: the "one object, one journey" protagonist promise (blank exam sheet → student card → lab note → notebook page → thesis cover → diploma) is only partly visible; in the stills the sheet's state changes (blank / starburst / hexagons+check / calligraphy / blueprint / campus strip / diploma) read as *the same sheet redrawn*, which is good craft, but the intermediate identities (student card, thesis cover) never read as such.

---

## One-world finale

**Yes — rule 12 holds.** The finale (`scAnswer`, `film.html:338-362`) keeps the film's world:

- Palette: `#0b1233` / `#1b2450` deep indigo base with the gold `#e8b64c` sunburst and warm white `#f6f1e4` text — the same family as scenes 1, 4, 5 and the same gold as the campus. The red `#b3343a` of the diploma seal is the same red used for the engineering stamp.
- Background family: the radial gold ray burst of the answer scene is the continuation of the campus sunburst (which is itself why the gates flag `S6~S7 pHash 0.94` — one world, arguably too much one world).
- Typography: same `PAHead`/Vazirmatn, same weight roles (900 word mark, 800 label, gold accent), same relative scale logic.
- Motif: the sheet is still the protagonist's object, now a diploma; the word mark `دانشگاه آفتاب` appears on the diploma itself, which closes the loop honestly.

No palette break, no new typeface, no stranger's background. The one-world check passes; the duplicate-template FAIL is the price of that consistency.

---

## Distinct visual states (count + names)

**7 visibly distinct states**, matching the header's 7 scenes, and the camera/grain/sheet state change between them:

1. **Exam hall** (f0-90, 0-3.0 s) — near-black indigo, vertical gold sliver at left edge, blank lined sheet, pen entering.
2. **Basic Sciences** (f90-180, 3.0-6.0 s) — teal/`#0d2b2a` chalk grid, starburst formula mark on the sheet, large white `علوم پایه`.
3. **Laboratory Sciences** (f180-288, 6.0-9.6 s) — amber/brown, hexagon pattern, three glass beakers with glow, gold check on the sheet.
4. **Literature and Humanities** (f288-342, 9.6-11.4 s) — plum/violet, navy calligraphy arc + gold underline, ghosted calligraphic strokes in the background.
5. **Engineering** (f342-414, 11.4-13.8 s) — navy blueprint grid, gears, red stamp pad on the sheet.
6. **Campus** (f414-630, 13.8-21.0 s) — golden-hour gradient, big sun, three buildings, cypress trees, four time-lapse paper cards, plate row, info panel.
7. **Answer / diploma** (f630-750, 21.0-25.0 s) — deep indigo, gold ray burst, diploma sheet with seal and ribbon, deadline plate.

So this is **not** a slideshow of identical frames — 7 real states with distinct palettes and motifs. But states 2-5 are the *same* composition (centered sheet, `دانشگاه آفتاب`+`F0x` top, faculty name bottom, plates bottom), which is precisely the `duplicate-template FAIL` at pHash 0.81-0.84 / IoU 0.79. Two causes of that redundancy are visible to the eye: the ghosted second copy of the faculty name drawn below the sheet (e.g. `t3_20s_f096.png`, `t4_40s_f132.png`) and the repeated bottom-of-frame furniture. Cutting those would raise perceived state diversity without touching the story.

---

## Layout measurements (hero %, margins) per ratio

Measured by eye from the stills at native size (px estimates on the 1080x1920 and 1920x1080 rasters); the gate's own hero-size estimate is quoted alongside. The ≥12% rule in FILM-GATES is stated for 9:16.

9:16 (1080x1920):

| Element | Measured px | % of 1920 | Rule |
|---|---|---|---|
| Payoff `آفتاب، جوابِ همان سؤال بود.` (f708/f729) | ~60 | **3.1%** | below 12% |
| `مهلت ثبتنام:` (f708/f729) | ~110 | 5.7% | below 12% |
| Faculty hero `علوم پایه` (f96) | ~150 | 7.8% | below 12% |
| `پردیس آفتاب` (f576) | ~150 | 7.8% | below 12% |
| Campus panel row text | ~24 | 1.3% | too small for body copy |
| Faculty captions (`دانشگاه علوم آزمایشگاهی`) | ~13 | 0.7% | unreadable |
| Left/right text margin, faculty scenes | ~70 px inset | 6.5% | safe |
| Bottom margin, `مهلت ثبتنام:` baseline → frame bottom | ~175 px | 9.1% | safe, but the deadline **date** is clipped horizontally at x>1080 |
| Gate hero-size estimate | — | S1 44%, S2 45%, S3 45%, S4 31%, **S5 2%, S6 3%**, S7 46% | FAIL-ish (WARN) |

16:9 (1920x1080):

| Element | Measured px | % of 1080 | Rule |
|---|---|---|---|
| Payoff line (f708/f729) | ~140 | **13.0%** | passes (≥12% for 9:16; healthy for wide) |
| `مهلت ثبتنام:` (f729) | ~86 | 8.0% | acceptable |
| `پردیس آفتاب` (f576) | ~96 | 8.9% | acceptable |
| Panel row text | ~16 | 1.5% | too small |
| Black letterbox band, right edge | ~40 | 2.1% of width | unintended, not designed |
| Black letterbox band, bottom edge | ~40 | 3.7% of height | unintended |
| Deadline date right margin | ~130 from right | 6.8% | safe |
| Gate hero-size estimate | — | S1 60%, S2 54%, S3 54%, S4 54%, S5 3%, S6 29%, **S7 9%** | INFO in wide |

Conclusion on the layout rule: the film does **not** satisfy "hero ≥ 12% of the 9:16 height" for its message lines — the payoff is 3.1% and the deadline label 5.7%; the gate's own estimate independently bottoming out at 2-3% in S5/S6 corroborates that scenes 5-6 have no hero at all. Margins are *mostly* safe horizontally, but the 9:16 deadline date is clipped off-frame and the 16:9 raster carries ~40 px black bands that were never designed.

Sources/duration/size, measured with ffprobe:

```
silent-9x16.mp4 : 1080x1920 h264 yuv420p 30/1 fps nb_frames=750 duration=25.000000 size=9393267 bit_rate=3005845  (no audio stream)
silent-16x9.mp4 : 1920x1080 h264 yuv420p 30/1 fps nb_frames=750 duration=25.000000 size=10706174 bit_rate=3425975 (no audio stream)
```

Both files declare exactly one stream, `codec_type=video` — silent v1 is silent, no hidden audio.

---

## Defects (what | severity | class | the file that would have to change)

| # | Defect | Severity | Class | File that must change |
|---|---|---|---|---|
| 1 | **Debug HUD burned into every frame of both mp4s.** `film.html:48` appends `"&debug=2"` to `location.search`; `film.html:391` then inserts a white fixed `<pre id="dbg">` each frame (`f30 undefined` in scene 1, long JSON in faculty scenes). Visible in extracted mp4 frames `mp4_f729.png` (both ratios); it is also the entire 16:9 `edge-touch` FAIL (`f630 top bbox 1180,0,1412,32`) and the builder's own `check-debug-9x16.png` shows it. | **Blocker** | Render/debug leakage | `work/persian/htmlfilm/s09-university-sun/film.html` (lines 48, 391) |
| 2 | **CTA never rendered.** `film.html:360` gates the button on `prog(t,9.0,0.6)` with `t = b-35`; the answer scene starts at beat 35 = 21.0 s, so the button needs ≥30.0 s in a 25.000 s film. `events.json` declares `deadline stamp` beat 43 = 25.8 s and `CTA pulse` beat 48 = 28.8 s — both after the end. Zero CTA frames exist. | **Blocker** | Goal delivery | `film.html` (line 360; event beats in `film.html:85-88` and `events.json`) |
| 3 | **Deadline date `۱۵ مهر` absent in 9:16** (clipped past x=1080) and **segment-reversed in 16:9** (`۱۵ مهر` rightmost, label to its left). Cause: `block()` at `film.html:358` with `align:"right"` advances subsequent RTL segments to the right. | **High** | Bidi/segment order + per-ratio overflow | `film.html:358` (and/or `block()` in `work/persian/htmlfilm/lib/pa-motion.js`, which I did not open) |
| 4 | **3 of 4 campus panel numbers are broken:** `۸۴` drawn overlapping the label `هیئت`, `۴` and `۵۲` not visible. Proof: `zoom-panel-f576.png` (builder's own zoom) and `t19_20s_f576.png`. Also the label `سال تاریخ` is wrong Persian for a founding year. | **High** | Persian typography/layout (information density axis) | `film.html:329-332` (copy at line 82) |
| 5 | **`events.json` describes an edit the mp4 does not contain.** Declared cuts `[0,150,255,396,480,576,690]` = 0, 5.0, 8.5, 13.2, 16.0, 19.2, 23.0 s; the renderer dispatches scenes by beat (`film.html:376-382`: b<5, 10, 16, 19, 23, 35 → 3.0, 6.0, 9.6, 11.4, 13.8, 21.0 s). ffmpeg scene detection on the delivered 9:16 mp4 reports real visual changes at **3.0 s and 13.8 s and 21.0 s** (`select='gt(scene,0.25)'` → pts_time 3, 13.8, 21), not at 5.0/8.5/16.0/19.2/23.0. So the "6 cuts on the bar line" claim is not what the film does, and every consumer of `events.json` (sound build, duplicate-template, dead-frames) is aligned to a different film. The header's arithmetic is also wrong: 25.000 s at 100 BPM = **10.42 bars / 41.67 beats**, not "12.5 bars = 50 beats". | **High** | Data/render divergence | `film.html` (dispatch thresholds + header) and `work/persian/htmlfilm/s09-university-sun/events.json` |
| 6 | **16:9 carries ~40 px black letterbox bands on the right and bottom inside the 1920x1080 raster** (open in any extracted wide frame, e.g. `_qc_stills_16x9/mp4_f729.png`). The composition is not full-bleed and the safe area is silently smaller. | **Medium** | Per-ratio layout / capture | `film.html` (stage sizing / `fit()`, lines 91-92, 399) or the capture path `work/persian/htmlfilm/capture.mjs` |
| 7 | **`duplicate-template` FAIL both ratios** (S4~S5 pHash 0.84 / IoU 0.79 in 9:16; S4~S5 0.81/0.79 and S6~S7 0.94/0.88 in 16:9). The four faculty scenes are one composition with a recolor; the ghosted duplicate name below the sheet doubles the sameness. | **Medium** | Motion craft / anti-slideshow | `film.html` (`scFaculty`, lines 240-285) |
| 8 | **Hero text below the 12% rule in 9:16:** payoff 3.1%, deadline label 5.7%, faculty hero 7.8%; gate estimate S5 2% / S6 3%. The same line is 13.0% in 16:9, i.e. the primary ratio is 3-4× weaker for the same sentence. | **Medium** | Per-ratio layout | `film.html` (`LAYOUT["9x16"]` sizes, lines 61-72; payoff `film.html:352`) |
| 9 | **9:16 `edge-touch` FAIL, 24/308 frames.** `f93-99` left bbox `0,1080,12,1580` is the exam-hall gold/dark sliver crossing the left edge (visible in `t3_20s_f096.png`); `f690-744` is the deadline plate inside ~2% of the bottom edge in the answer scene. | **Medium** | Layout / edge safety | `film.html` (scene art + answer plate, lines 338-362) |
| 10 | **Faculty captions are unreadable (≈13 px on 1080 ≈ 0.7% height)** in scenes 2-4, so three of the four faculty names are asserted in `COPY` but never legible; the opening question `سؤالِ من چه میشود؟` is not legible in any still I read either. | **Medium** | Media legibility | `film.html` (`L.sub`/caption fonts) |
| 11 | **`_stills/` (9:16) is stale relative to the delivered mp4**: those PNGs contain no debug HUD, while frames extracted from `silent-9x16.mp4` do (and `_stills-16x9/` does contain it). The evidence folder therefore does not represent what shipped. | **Low** | Provenance/evidence | regenerate `media/film-versions/s09-university-sun/v1/_stills/` |
| 12 | Worker self-report `media/briefs-local/storylab-batch2/results/s09-university-sun.json` **does not exist** (verified: `Test-Path` false). No claim of the builder's could be cross-checked; every number in this review comes from my own commands. | **Low** | Process | the batch's results folder |

---

## System friction I hit as a reviewer

1. **`read` and `shell` are documented as placeholders, and `read_client` failed intermittently** — `read_client` first answered `unknown tool "read_client"`, then accepted the call but demanded `file_path`, then answered `unknown tool` again for the identical call. I fell back to `pwsh` + `Get-Content` for every text file. A reviewer bolted to a shell is exactly the wrong reviewer for a "look at the picture" order.
2. **No gate catches a burned-in debug HUD.** Everything in `run-gates.mjs` treats the raster as art; a white monospace box only surfaces as a 2-frame `edge-touch` hit in 16:9 and is invisible in 9:16 (24 hits, all attributed to art). A "no overlay/debug pixels" or "monochrome-box" check would have caught this in seconds. This is the single most expensive gap I hit.
3. **`number-lint` PASS is uninformative**: `0 files` for a source that is full of number tokens. I cannot tell a real pass from a no-op, and FILM-GATES says an N/A/unknown is blocking — this is neither, so it reads as a pass by accident.
4. **The gate's own hero-size estimator disagrees with a human eye in both directions** (S7 46% in 9:16 where no digits are on screen; S7 9% in 16:9 where the payoff is the biggest text in the film). I had to measure by hand to say anything true.
5. **`_stills/` cannot be trusted as evidence** (stale vs the mp4) and `zoom-*.png` / `check-debug-*.png` files left in the version folder are the builder's own diagnostics, not QC output — a reviewer must re-extract from the mp4, which is what I did. If the stills had been taken at face value, the debug HUD would have been missed entirely.
6. **No `VERSION.json` in the version folder** (only `gates-*.json` and the mp4s), so I could not re-check declared hashes/sizes/metrics against my measured run; per the recon brief, `VERSION.json` is a reviewer input.

---

## What I could not check

- **Sound, loudness, SFX-on-picture, beat grid, cue offsets** — silent v1 with no audio stream at all (ffprobe: one `video` stream only in both files, no audio). Every audio rule in FILM-GATES is unclaimable and blocked, not passed. `events.json` declares 21 audio events (wipes, hits, ticks, ambient) with `type`/`variant` but nothing in the delivered files can confirm any of them; I did not verify them.
- **Cut-to-event coincidence in the audio sense** — impossible without the mix; I could only compare declared cut times against visual changes (defect 5).
- **Whether the font really resolved to `PAHead`/Vazirmatn at runtime** — I verified the local woff2 exists, the `@font-face` uses a relative local URL only, the boot awaits `document.fonts.load("900 40px PAHead")` + `document.fonts.ready`, and the glyph shapes match Vazirmatn. I did **not** run a headless `document.fonts.check`/family readback, so "no silent system fallback" is a strong inference, not a measurement. (The `.notdef`-style boxes that would prove a fallback do not appear in any still.)
- **Contrast ratios** — FILM-GATES lists contrast as "to build" (no gate). The header claims 15.6:1 / 9.2:1 / 7.6:1; I did not compute them from pixels, so I neither confirm nor deny those numbers. My eye says the gold-on-indigo and warm-white text where it is large reads fine, and the 13 px captions fail for size regardless of contrast.
- **Full-length watch / motion character at 30 fps** — I reviewed stills plus frames extracted from the encoded files, not a continuous playback. Smoothness, any strobing, and the feel of the camera move are unverified.
- **The `_stills/` vs mp4 provenance question** — I can report that they disagree (defect 11) but not which build each came from; there is no `VERSION.json` and no build log in the folder.
- **`block()` implementation** — used by the deadline and the campus panel; I read its call sites in `film.html` but did not open `work/persian/htmlfilm/lib/` (forbidden by the order), so I attribute defect 3/4 to `film.html:358` and `film.html:329-332` in the first instance and note the shared helper as the second candidate.
- **Anything about an `mp4` I am not permitted to touch** — I did not modify either file; my extracted frames live only in `_qc_stills_9x16/` and `_qc_stills_16x9/`.
