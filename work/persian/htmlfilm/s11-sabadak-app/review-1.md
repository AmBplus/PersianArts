# QC Review — s11-sabadak-app (silent v1, independent reviewer)

Reviewer: independent QC (did not build this film). Time-boxed. All numbers below are my own measurements unless labelled "claim".
Reviewed artefacts: `media/film-versions/s11-sabadak-app/v1/silent-9x16.mp4`, `.../silent-16x9.mp4`, `_stills/*.png`, `_stills-16x9/*.png`, `work/persian/htmlfilm/s11-sabadak-app/film.html`, `.../events.json`.

## Verdict (SHIP / SHIP WITH NOTES / FIX)

**FIX** (one narrow fix round). The film is genuinely well-built — beat-locked cut list, correct Persian typography, two real per-ratio compositions, honest self-report — but it FAILS two gates on **both** ratios, and one of those failures is not a tool artefact: a coral chip is drawn on top of a letter in the finale (visible in the delivered mp4, not just a still), and 58.9 % of an 18 s "CUT-BASED and FAST" ad is a near-static hold that the empty-band gate flags for 177/194 sampled frames. Fix those two, re-gate, and this ships. Note that `number-lint` and `duplicate-template` produced **no evidence at all** here, so the "digits isolated" and "no repeated template" checks are currently unproven, not passed.

## Score (0-100) + breakdown (story, Persian typography, per-ratio layout, motion craft, goal delivery)

**75 / 100**

| Axis | Score | Reading |
|---|---|---|
| Story | 16 / 20 | chaos → focus → order is legible and the copy carries it; the arc is then squandered by a 10.6 s static tail |
| Persian typography | 22 / 25 | joins, ZWNJ, Persian numerals and LTR isolates all correct; lost points for the finale chip covering a letter and the ۱۵٪ label straddling the pill edge |
| Per-ratio layout | 12 / 20 | 16:9 is a real second composition (not a crop) ✔; but safe-margin violations on 22/194 frames each ratio, label/pill detachment, and enormous airy bands on 9:16 |
| Motion craft | 17 / 25 | 9 distinct states, cuts exactly on the 130 BPM grid, kinetic type works; minus the long final hold and off-screen card entrances that slice text at the frame edge |
| Goal delivery | 8 / 10 | goal and desiredAction are clear and the ending is a real payoff frame; no install/CTA verb («نصب» / «دریافت») for an app ad |

Worker's self-reported `honest_score_0_100` = 74. My independent 75. Agreement within 1 point.

## Gates (raw output both ratios + your reading; dead-frames and duplicate-template called out)

9:16, exact command:

```
node work/persian/tools/gates/run-gates.mjs media/film-versions/s11-sabadak-app/v1/silent-9x16.mp4 --src work/persian/htmlfilm/s11-sabadak-app --events work/persian/htmlfilm/s11-sabadak-app/events.json --no-logo
logo-colour gate skipped (no brand asset)
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=540  sampled=194  scenes=1
edge-touch           | FAIL | 22/194 sampled frames; frames 33-57, 72-81, 129, 171, 180-198; e.g. f33 left bbox 0,720,280,952
empty-band           | FAIL | 177 frames > 30%; frames 0-27, 39-45, 57-93, 111-126, 132, 138-165, 171-174, 186-537; worst f189 52% (y 0-52%)
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | 9:16 target >= 12%; below: none; S1 41%@f93

EXIT=1
```

16:9, same command with `silent-16x9.mp4`:

```
# run-gates silent-16x9.mp4  1920x1080 (landscape)  frames=540  sampled=194  scenes=1
edge-touch           | FAIL | 22/194 sampled frames; frames 24-81, 132, 183; e.g. f24 top bbox 1124,0,1500,192
empty-band           | FAIL | 6 frames > 30%; frames 126, 264-276; worst f126 37% (y 0-37%)
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | target 12% applies to 9:16 only; S1 57%@f33

EXIT=1
```

My reading:

- **dead-frames — specifically.** PASS is technically true and practically worthless: it checked **one** "scene start" (frame 0, the paper flood, which is by construction not a dead frame) because the detector derives scenes from the html file and sees `scenes=1`. The brief flagged fast full-frame motion as the dead-frame risk; in fact the real dead-frame risk here is at the *other* end (the long quiet hold), which this gate never samples as a scene start. So: no near-uniform 3+ frame run at a scene start, yes; "no dead frames anywhere" is **not** what was measured. The 9:16 `empty-band` row is the useful signal instead: 177/194 frames with a >30 % motionless band, frames 186-537 (6.2 s → 17.9 s) — i.e. the entire finale.
- **duplicate-template — specifically.** `N/A`, and this is a **tool defect, not a film defect**: `--events work/persian/htmlfilm/s11-sabadak-app/events.json` was passed and that file *does* contain `"cut_frames": [0, 28, 55, 83, 111, 138, 166, 187, 222]`, yet the gate prints `needs scene starts (events.json)` and `scenes=1`. For a cut-based film this is the gate that matters most, and it silently did not run. The worker's report says exactly this in its `top_friction` — that claim is **true and I reproduce it**.
- **edge-touch FAIL is largely designed-in but not harmless.** The offending frames are the swarm/basket entrances (9:16 f33-57, f72-81; 16:9 f24-81): shop cards fly in *from off-frame*, so their corners, borders and the price text printed on them are sliced by the frame edge (`f33 left bbox 0,720,280,952` — x starts at 0). A card cut by the edge is a normal entrance; **text** cut by the edge is not. Fix = start the cards fully outside the frame and have them arrive inside a 5 % safe inset.
- **empty-band FAIL on 9:16 (177/194, worst f189 = 52 %)** is the airy portrait design plus the long finale, exactly as the worker claims; the gate has no per-ratio calibration. I agree it is over-flagged as a *gate*, but I do **not** agree it is harmless: on the finale still the top ~60 % of a 1080×1920 frame is bare paper (measured below).
- **number-lint PASS is vacuous.** `0 files; no un-isolated number runs` — it scanned zero source files. I re-ran it alone (`--only number-lint`); same header, no files itemised. The tool walks for script/source files it recognises and this film is a single `.html`. So the "every number token is isolated LTR" requirement is **unverified by the gate**; it is only verified by my own reading of the source and stills (section 3). Any "number-lint PASS" used as delivery evidence is empty.
- **hero-size INFO does not measure the hero text.** `S1 41%@f93` — frame 93 is the sieve, and the 41 % blob is the coral dashed **ring**, not type. My own measurement of the actual headline at f003 is 8.1 % of frame height per line (section on layout). The gate did not fail because it never measured the thing the rule names; the film did not therefore pass it either.

## Stills reviewed (one line per image + path)

9:16 (`media/film-versions/s11-sabadak-app/v1/_stills/`):

- `t0_10s_f003.png` — cover: coral bag mark + «سبدک», headline «هفتتپهٔ صفحه،» ink / «یک لمس» coral; joins clean, بزرگ, fully legible; **bottom ~70 % is bare paper**; nothing touches the edge.
- `t0_70s_f021.png` — seal rain: coral tilted seal «۴۹٪» (Persian digits, U+066A percent, anisotropic but correct L→R order), boxed «۳۹۰٬۰۰۰»; second legible; text is not clipped but the seal's own corner crosses the frame edge at upper left.
- `t2_00s_f060.png` — swarm/basket: ten tilted shop cards («آجیل شیرین ۱۲۰۰۰۰», «دارو خانه ۱۹۹۰۰۰ تومان», «کتاب سبز ۳۹۰۰۰۰», «دختر پرتقال ۴۹۰۰۰», «پنبه نرم ۷۹۰۰۰ ۳۵٪»), coral «۴۹٪ تخفیف», ink «۳۹٪ تا پایان روز»; the left card **is cut by the frame edge (x=0)** and its label is unreadable; grey ghost cards are decorative and ~2:1 contrast (intentionally unreadable); no blur, no smear.
- `t3_20s_f096.png` — sieve: coral dashed ring, cards sucked to centre, faint coral «همین یکی»; rotated card text is upside-down/rotated by design (they are the chaos vector, not copy); upper 40 % empty.
- `t4_10s_f123.png` — press: fingertip above one coral-outlined card, «دارو خانه / ۱۹۹۰۰۰ تومان / ذخیره شد»; crisp, numbered, correctly joined; no motion smear.
- `t5_00s_f150.png` — signed: ink ring + white check on coral disc, «ثبت شد؛ پرداخت با یک لمس» above, «۱۹۹۰۰۰ تومان» below; clean and legible; large empty mid-band.
- `t5_80s_f174.png` — road: «سبدک» coral + «۲۱ دقیقه تا در خانه» (ETA, Persian numerals) above a black/coral van; legible; van clear of the right edge; big empty middle.
- `t6_60s_f198.png` — door: ink-outlined door (cut by the left frame edge — deliberate), warm dark-red glow, parcel «سبدک», coral «۴۸ ساعت» on the house; legible; **left door edge at x=0**.
- `t16_00s_f480.png` — finale (9:16): mark + cover headline + sub «سبدک؛ یک لمس، بقیهاش با ما», coral pill with «۱۵٪ ·» black-on-coral, label «تخفیف اول» spilling off the pill to the right, **coral chip drawn ON the letter «ف» of «تخفیف»**, bottom tab strip «تخفیف اول / ۱۹۹۰۰۰ تومان / سبدک». Defect confirmed again on a frame decoded straight from the mp4 (`_qc_mp4_f480.png`): the word reads «تخفی[chip]ف».

16:9 (`media/film-versions/s11-sabadak-app/v1/_stills-16x9/`):

- `t0_10s_f003.png` — different composition: logo at top-left (s 0.72 vs 1.15), headline in the **left third** at y≈340, right two thirds empty paper. Designed, not a crop.
- `t4_10s_f123.png` — finger at x≈560 centre-left, single card at bottom-right (x≈1180), card text 「دارو خانه ۱۹۹۹۰۰۰ تومان / ذخیره شد」; clearly a re-composition (portrait had both elements stacked on the centre axis).
- `t9_00s_f270.png` — cover text again + sub + an **empty** coral pill at x≈360-760 with its label «تخفیف اول · ۱۵٪» floating far to the right at x≈900-1300; pill and label are visibly detached.
- `t13_00s_f390.png` — same frame family, pill now filled, chip clear of the glyphs (unlike 9:16); 4-item bottom strip «۲۱ دقیقه تا در خانه / تخفیف اول / ۱۹۹۰۰۰ تومان / سبدک» at 0.9 alpha.
- `t16_00s_f480.png` — finale 16:9: mark, headline, sub, coral pill, label + chip, four-item tab strip. Same world as 9:16, wider arrangement.

16:9 is **designed, not a crop**: headline moves from centre (y 480-784 of 1920) to the left third (y≈340 of 1080), logo scale 1.15→0.72, shelf 10 slots → 3-column right stage, van y 1420→720, strip 3 items → 4 items, per-ratio font sizes (head 132→86, sub 54→40). Confirmed from `film.html` LAYOUT and from the stills.

## Digits and Persian typography

Every digit shown, by still:

| Still | Token as rendered | Form check |
|---|---|---|
| `t0_70s_f021.png` | «۴۹٪» (seal), «۳۹۰٬۰۰۰» (boxed) | Persian ۴۹; percent is U+066A (slashed circles, Arabic form, not Latin `%`); digits read L→R inside the token ✔ |
| `t2_00s_f060.png` | «۴۹٪ تخفیف», «۳۹٪ تا پایان روز», «۱۲۰۰۰۰», «۱۹۹۰۰۰ تومان», «۳۹۰۰۰۰», «۴۹۰۰۰», «۷۹۰۰۰», «۳۵٪», «قیمت قبل ۳۹۰٬۰۰۰» | all Persian ۰-۹; thousands separator U+066C present in source, **barely visible at delivery scale** (see defects) |
| `t3_20s_f096.png` | none | — |
| `t4_10s_f123.png` | «۱۹۹۰۰۰ تومان» | Persian, digit-run LTR, «تومان» correct on the RTL side |
| `t5_00s_f150.png` | «۱۹۹۰۰۰ تومان» | same |
| `t5_80s_f174.png` | «۲۱ دقیقه تا در خانه» | ETA number present, Persian numerals ✔ |
| `t6_60s_f198.png` | «۴۸ ساعت» | Persian numerals ✔ |
| `t16_00s_f480.png` | «۱۵٪», «۱۹۹۰۰۰ تومان», «۲۱ دقیقه تا در خانه» | Persian ✔ |

Requirement check: **≥ 3 price/discount numbers ✔** (۳۹۰٬۰۰۰ / ۱۹۹٬۰۰۰ / ۱۲۰٬۰۰۰ / ۸۹٬۰۰۰ / ۷۹٬۰۰۰ / ۴۹٬۰۰۰ prices; ۴۹٪ / ۳۹٪ / ۳۵٪ / ۱۵٪ discounts) and **one delivery/ETA number ✔** («۲۱ دقیقه», plus «۴۸ ساعت»).

Isolation: source wraps every numeric token — `const LRI="\u2066", PDI="\u2069"; NUM/GROUP/PCT` all emit `LRI … PDI`, `PC = "\u066a"`, `GROUP` inserts `\u066c` — and the render agrees: numbers read left-to-right while the surrounding Persian reads right-to-left («۱۹۹۰۰۰ تومان» shows تومان to the left of the digits, correct). No reversed or mirrored Persian anywhere in the nine stills; no broken joins (`هفتتپهٔ` keeps its ZWNJ break, `بقیهاش` correct, «سبدک» final ک correct). The only "broken word" is the finale chip collision, which is a draw-order/geometry bug, not a shaping bug.

Font: **Vazirmatn, not a silent fallback**, evidence — (a) `work/persian/htmlfilm/s11-sabadak-app/fonts/Vazirmatn-Variable.woff2`, 111,128 bytes, local file referenced by the single `@font-face{font-family:"PAHead"; … font-weight:100 900}`; (b) all text in all 14 stills renders in that face with **zero tofu/□ and zero substitution** — the Persian digits show Vazirmatn's ۴۵۶ forms and the ک / final ه / گ forms are Vazirmatn's, not Tahoma/Arial's; (c) a fallback would either show boxes or visibly different digit shapes at these sizes. Caveat: I could not open the woff2's `name` table to confirm the internal family string (see "What I could not check").

## Fast-cut readability (shots too short to read, if any)

`events.json` `cut_frames: [0, 28, 55, 83, 111, 138, 166, 187, 222]`, duration 540 frames. Measured shot lengths:

| # | Shot | Frames | Seconds | Readable? |
|---|---|---|---|---|
| 1 | COVER | 28 | 0.93 | yes (5 words, static hold) |
| 2 | SWARM | 27 | 0.90 | yes (chaos state, numbers are scenic) |
| 3 | BASKET | 28 | 0.93 | yes |
| 4 | SIEVE | 28 | 0.93 | yes |
| 5 | PRESS | 27 | 0.90 | yes |
| 6 | SIGNED | 28 | 0.93 | yes («ثبت شد؛ پرداخت با یک لمس» + one price) |
| 7 | ROAD | 21 | 0.70 | **tightest shot**; headline «۲۱ دقیقه تا در خانه» is on screen while the van crosses — legible in the still, but it is the one shot with no settle slack |
| 8 | DOOR | 35 | 1.17 | yes |
| 9 | QUIET | 318 | 10.60 | yes, far too long |

**No shot is under the ~8-frame minimum** (shortest = 21 frames = 0.70 s, 2.6× the floor). Conversely the opposite failure is present: shot 9 is 318 frames = **58.9 % of the whole film**, near-static bare paper; the design brief was "CUT-BASED and FAST", and the last 10.6 s is neither. Splitting it into 2-3 payoff beats (or adding the tab-strip/price build as separate cuts) would both satisfy pacing and clear most of the 177 empty-band hits.

## Story and goal

From the `film.html` header block (verbatim):

- **Goal / logline:** «هفت‌تپهٔ صفحه، یک لمس» — the chaos of scrolling a hundred shops collapses into one tap.
- **Protagonist:** a finger / one tap ripple; the product cards and price seals are the weather it moves through.
- **Desired action (implied by the copy):** install/keep «سبدک» and tap once — «سبدک؛ یک لمس، بقیه‌اش با ما», «ثبت شد؛ پرداخت با یک لمس».
- Scenes as declared: COVER → SWARM → BASKET → SIEVE → PRESS → SIGNED → ROAD → DOOR → QUIET.

Is the promised **chaos → focus → order** arc visible? Yes, and it is the film's strongest feature: frames 0-82 pile ten tilted cards with conflicting prices and dead «ذخیره» buttons (real chaos, readable as chaos), f83-110 funnels them into one card inside the coral ring (focus), f111-137 the finger presses with a 4-frame full-ink flip (the one high-contrast punctuation in the film), f138-221 delivers confirmation, ETA and the parcel (order). I saw each of those beats in the stills. Where it breaks down is the *last* act: after f222 the film stops telling and just holds the cover composition for 10.6 s.

Is the ending a real payoff? Partly. The finale does close the loop — the same mark and headline return, the noise is gone, and the bottom tab strip («۲۱ دقیقه تا در خانه / تخفیف اول / ۱۹۹۰۰۰ تومان / سبدک») is a nice "this is the app you now have" gesture. But there is **no install/CTA verb** and the one piece of new information in the finale (the ۱۵٪ first-order offer) is the exact element that is visually broken by the chip collision — so the payoff frame is also the film's most defective frame.

## One-world finale

Yes. Finale frames use the same paper `#f7f4ec` + dither dot field, same ink `#14120f`, same single coral `#e2503c`, the same mark/logo lock-up, the same headline typography and the same greys; measured finale bands (`t16_00s_f480.png`, 9:16) reproduce the cover's geometry almost exactly — logo y187-396 vs cover y145-354, headline y455-593 / y606-729 vs cover y480-635 / y651-784. Palette, background family and typography all match: **one world ✔**.

Side effect worth flagging: because the finale is nearly the *same composition* as the cover, the film contains two near-duplicate layouts (f003 and f480, IoU of the ink mask very high by eye). That is precisely what `duplicate-template` would judge (pHash < 0.85 / IoU < 0.70) and it could not run (see Gates). I flag it as a risk, not a proven FAIL, because I could not measure pHash with the shipped tool.

## Distinct visual states (count + names)

**9 visibly distinct states** (matches the declared cut list, verified in stills):

1. COVER — paper flood, mark stamp, headline, price-seal rain (f0-27)
2. SWARM — ten shop cards raining in at wrong angles, dead «ذخیره» (f28-54)
3. BASKET — pile peaks, one coral card «۴۹٪ تخفیف» + crossed-out «۳۹۰٬۰۰۰» wins (f55-82)
4. SIEVE — all cards sucked into one, coral dashed ring, «همین یکی» (f83-110)
5. PRESS — fingertip, 4-frame full-ink flip, coral ripple (f111-137)
6. SIGNED — ink ring + coral check disc, «ثبت شد؛ پرداخت با یک لمس», one price line (f138-165)
7. ROAD — ink/coral van crossing with «۲۱ دقیقه» ETA (f166-186)
8. DOOR — door opens, warm glow, parcel handed in, «۴۸ ساعت» (f187-221)
9. QUIET — bare paper, mark, headline, sub, ۱۵٪ pill, tab strip (f222-539)

That is 9 states in 18 s = one state per 2 s, delivered as hard cuts on the beat grid — **not** a slideshow (states 2-5 are dense, layered, moving frames). The counter-risk is state 9 only.

## Layout measurements per ratio

All measured from the delivered stills with a pixel row-profile (ink threshold 170/255, step 2), reporting ink band height as % of frame height.

**9:16 (1080×1920) — `t0_10s_f003.png` (cover):**

```
band y145-354 h=210 (10.9%)   logo + «سبدک»
band y480-635 h=156 (8.1%)    headline line 1 «هفتتپهٔ صفحه،»
band y651-784 h=134 (7.0%)    headline line 2 «یک لمس» (coral)
```
→ hero headline = **8.1 % per line, 305 px = 15.9 % for the two-line block**. Against the "hero ≥ 12 % of 9:16 height" rule: the *block* passes, a *single line* does not. I could not isolate a pure digit run cleanly (digits sit inside box outlines and my digit bbox hit the box stroke), so the honest statement is: largest measured digit-bearing line is the ETA headline at **156 px = 8.1 %** (`t5_80s_f174.png`, bbox w=686), and the biggest pure-digit card number «۴۸» is only **69 px = 3.6 %** (`t6_60s_f198.png`). On this evidence the hero-12 % rule is **not demonstrated** for any single digit run; the gate's 41 % is the ring (above).

**9:16 finale `t16_00s_f480.png`:** headline 139 px (7.2 %) + 124 px (6.5 %), sub 50 px (2.6 %), pill+label band 116 px (6.0 %), bottom strip 34 px (1.8 %); the band from y≈1180 to y≈1780 is empty paper → **~31 % of the frame height motionless in the middle**, and with the top margin the empty-band reading of 52 % at f189 is credible.

**Safe margins, 9:16:** cover/finale text sits inside ≈ x 115-965 of 1080 (margins ≈ 10.6 % / 10.6 %) — fine. But `edge-touch FAIL 22/194` puts real content at x=0 (f33) and y=0 upper corners (f198 door, f021 seal), i.e. **margin = 0 on those frames**; 9:16 is not margin-clean across the film.

**16:9 (1920×1080):** the two ink bands I measured at `t4_10s_f123.png` are the finger (y392-735, 344 px = 31.9 %) and the card (y745-1014, 270 px = 25.0 %), not text; text sizes are set per-ratio in the layout table (head 132→86, sub 54→40, strip 40→32). Composition is left-third text / right-third shelf, so horizontal margins are ≈ 5-15 % depending on the element. `edge-touch FAIL` again with `f24 top bbox 1124,0,1500,192` — the seal/card entering from off-frame **touches y=0**, so the 16:9 is not margin-clean either. No text is at the extreme left/right edge in the sampled 16:9 stills.

## Honesty check of the studio self-report (claim | measured | agree?)

Source: `media/briefs-local/storylab-batch2/results/s11-sabadak-app.json`.

| Claim in the report | My measurement | Agree? |
|---|---|---|
| 9:16 `bytes` 2964092 | 2,964,092 B = 2.827 MB | ✔ exact |
| 16:9 `bytes` 2573072 | 2,573,072 B = 2.454 MB | ✔ exact |
| `frames` 540, `fps` 30 (both) | `nb_frames=540`, `r_frame_rate=30/1`, duration 18.000000, `yuv420p`, no audio stream | ✔ exact |
| 9:16 edge-touch "FAIL (22/194; f33 left bbox 0,720,280,952)" | identical string from my own run | ✔ exact |
| 9:16 empty-band "FAIL (177 frames >30 %, worst f189 52 %)" | 177 frames > 30 %, worst f189 52 % (y 0-52 %) | ✔ exact |
| 16:9 edge-touch "FAIL (22/194; f24 top bbox 1124,0,1500,192)" | identical | ✔ exact |
| 16:9 empty-band "FAIL (6 frames >30 %, worst f126 37 %)" | 6 frames, worst f126 37 % (y 0-37 %) | ✔ exact |
| dead-frames PASS (both) | PASS, but only **1** scene start checked (frame 0) | ✔ output matches; evidence is thin and the report repeats the gate's framing without that caveat |
| duplicate-template N/A (both) | N/A despite `events.json` carrying 9 cut frames | ✔ matches, and the report's `top_friction` correctly calls it a tool problem |
| number-lint PASS (both) | PASS **over 0 files** | ⚠ output matches, but "PASS" implies the isolation check ran; it did not scan anything |
| hero-size "INFO S1 41 %@f93" / "12 % target applies to 9:16 only" | output identical, but the 41 % blob is the decorative ring; my headline is 8.1 %/line | ⚠ claim is accurate as quotation, misleading as evidence |
| `font_ok: true` | local Vazirmatn woff2 present, referenced once, no tofu/mirroring anywhere | ✔ (limited evidence, see below) |
| `one_world_finale: true` | palette/background/typography shared with the rest | ✔ |
| `honest_score_0_100: 74` | my independent score 75 | ✔ within 1 point |
| `stills_looked_at` (8 files) | all 8 files exist and are the ones I re-inspected | ✔ |
| (not claimed) missing VERSION.json / contact sheet in v1 | `media/film-versions/s11-sabadak-app/v1/` holds only 2 mp4 + 2 gates json + 2 still dirs; `pa deliver … --dry-run` reports "TV-safe: تأیید نشده - claimed, not verified" | ✘ omission — required evidence pack incomplete (recon §3) |

**No dishonesty found.** Every number in the report reproduces exactly; the two soft spots (number-lint PASS over 0 files, hero-size 41 % being a ring) are the *gate's* weaknesses, and the report's own friction list already flags the duplicate-template problem it could have hidden. What it does hide by omission is the incomplete version folder (no VERSION.json, no sheet) — worth a note, not a credibility hit.

## Defects (what | severity | class | the file that would have to change)

| # | Defect | Severity | Class | File that would have to change |
|---|---|---|---|---|
| 1 | Coral chip drawn on top of the letter «ف» in «تخفیف» in the finale — the word is visually broken in the delivered mp4 (9:16 f480; also the label «تخفیف اول · ۱۵٪» straddles the pill's right edge, half on coral, half on paper) | **High** | typography / draw order | `work/persian/htmlfilm/s11-sabadak-app/film.html` lines 365-368 (`rr(...)` pill at `L.head.x - bw/2`, label `txt(... ISV ? W-210 : 1120 ...)`, chip `rr(ISV ? W-150 : 1250, ...)`) |
| 2 | Final shot QUIET = 318 frames = 10.6 s = 58.9 % of the film near-static; drives 177/194 9:16 and 6/194 16:9 empty-band FAILs and contradicts the "FAST" brief | **High** | pacing / empty-band | `film.html` `quiet(p,n)` (lines 354-373) + `events.json` cut list |
| 3 | Off-frame card/seal entrances put card **text** at the frame edge (x=0 / y=0), 22/194 sampled frames each ratio | Medium | safe margins / edge-touch | `film.html` swarm/basket/seal slot motion (start offsets) |
| 4 | `duplicate-template` never runs on a cut-based film: `run-gates --events events.json` still reports `scenes=1` although `cut_frames` has 9 entries — the "no repeated template" check is unproven (and cover/finale look near-identical) | Medium | tooling / unproven gate | `work/persian/tools/gates/duplicate-template.mjs` + `run-gates.mjs` (sceneStarts from `cut_frames`) |
| 5 | `number-lint` PASS is empty: scans 0 files for a single-`.html` film, so the "digits inside LTR isolates" requirement has no gate evidence | Medium | tooling / unproven gate | `work/persian/tools/gates/number-lint.mjs` (must parse `.html`/inline JS) |
| 6 | `hero-size` measures the largest ink blob (the coral ring, 41 % @f93 / 57 % @f33) not hero text; headline lines measure 8.1 %/7.0 % of 9:16 height, so the ≥12 % hero rule is neither proven nor disproven | Medium | tooling / layout evidence | `work/persian/tools/gates/hero-size.mjs` (only if such rule is to be enforced) |
| 7 | No `VERSION.json` and no contact sheet/`sheet*.jpg` in the version folder, so outputs, metrics and the review sheet cannot be re-verified the way recon §3 requires; `pa deliver --dry-run` prints "TV-safe: claimed, not verified" | Medium | evidence pack | `media/film-versions/s11-sabadak-app/v1/VERSION.json` + a sheet jpg |
| 8 | Thousands separator `٬` (U+066C) is present in source but barely perceptible at delivery scale («۱۹۹۰۰۰ تومان» reads as unseparated) | Low | typography | `film.html` `GROUP()` / price drawing sizes |
| 9 | 4-frame full-ink flip (f111-137 family) creates two near-black frames; combined with ~4-5 % of runtime at maximum contrast this is a flicker risk on mobile autoplay | Low | motion comfort | `film.html` press scene ink flip |
| 10 | No install/CTA verb («نصب» / «دریافت») anywhere; the app-ad desired action is only implied | Low | goal delivery | `film.html` TXT block + finale |

## System friction I hit as a reviewer

- `run-gates --events <file>` accepts an events file with 9 `cut_frames` and still prints `duplicate-template N/A … scenes=1`. Spent time proving the file was correct before believing the gate.
- `number-lint … PASS | 0 files` — a PASS that certifies nothing. Nothing in the output says "0 files scanned is not evidence".
- `hero-size INFO 41 %@f93` for a frame whose only large ink is a decorative dashed ring; a reviewer who trusts the INFO line would certify a hero size the film does not have.
- `empty-band` has one global threshold with no per-ratio calibration; on an intentionally airy portrait layout it reports 177/194 frames, which drowns the one signal that matters (the static finale).
- `run-gates` exit 1 is the only summary without `--json`; the two `gates-*.json` in the version folder were produced by the worker, so a reviewer must re-run anyway to know nothing was laundered.
- Frame decoding to compare still vs encode required hand-rolled `ffmpeg -vf select`, and PNG stills from `capture.mjs` cannot be diffed against the mp4 by any shipped tool — I had to eyeball them.
- The version folder lacks `VERSION.json`, so there is no machine-readable place to check sizes/hashes/gates against; everything above had to be measured from raw files.
- I had no `read`/`ls` file tool available in this session (only a shell), so every file inspection was a shell call — slower for the 14 images and repeated small measurements.

## What I could not check

- **Audio of any kind** — v1 is silent by design; loudness, true peak, cue offsets, beat-grid alignment and the XFADE loop seam are all unverified and must remain `not-run` in any VERSION.json.
- **The woff2 identity beyond the filename**: I verified a local `Vazirmatn-Variable.woff2` (111,128 B) is referenced and that rendering matches Vazirmatn with no fallback evidence (no tofu, correct Persian digit/ک/ه forms), but I did not open the font's `name`/`cmap` tables, so "the file really is Vazirmatn" rests on filename + rendered appearance.
- **Numerical WCAG contrast ratios**: I judged legibility by eye (grey `#7d766a` sub-text on `#f7f4ec` is roughly 3.5-4:1, i.e. AA only because it is large text; the ghost card text is decorative at ~2:1). No contrast gate exists and I did not compute per-pixel ratios.
- **Motion-blur / strobing in motion**: I reviewed 14 stills and 2 decoded frames, not the 540-frame sequence at speed; gate hits are the only frame-level evidence I opened by eye (f33, f189, f24, f126, f480). No subjective walk-through of the swarm cut in real time.
- **`duplicate-template` verdict**: impossible to obtain from the tool on this film (N/A); my "cover and finale look near-identical" is a visual observation only, no pHash.
- **Bitrate/banding of the delivered encodes**: I decoded 2 frames from the 9:16 mp4 and saw no obvious banding in the coral disc or the dither field, but at ~1.26 Mbps (2.827 MB / 18 s) the mp4 is only 2-3 frames of spot-check; `pa compress` SSIM guards were not run.
- **Whether a v1 sound version or a promoted `output/` copy exists** — I only inspected the v1 silent folder.
