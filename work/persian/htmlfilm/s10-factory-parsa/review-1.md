# QC Review — s10-factory-parsa (independent reviewer, silent v1)

Reviewer did not build this film. Every number below comes from a command run in this session or from an image read in this session. The worker self-report `media/briefs-local/storylab-batch2/results/s10-factory-parsa.json` **does not exist** (`MISSING`), so there was no claim sheet to cross-check — all claims below are first-hand.

---

## Verdict (SHIP / SHIP WITH NOTES / FIX)

**FIX.**

Two hard gate FAILs on both ratios (empty-band, duplicate-template) plus an edge-touch FAIL on 16:9, and — worse — the film **does not deliver two things it was explicitly asked to deliver**: the row of 3 partner stand-ins never appears in any frame, and the payoff tolerance number never leaves the screen. `run-gates.mjs` exits 1 on both finals. One fix round, then re-gate.

---

## Score (0-100) + breakdown (story, Persian typography, per-ratio layout, motion craft, goal delivery, brand-mark handling)

**56 / 100** — below the 85 approval bar.

| Axis | Score | Max | Note |
|---|---|---|---|
| Story | 12 | 20 | Nine cut-scenes with a real billet arc, but the arc is not readable: the object changes silhouette per scene without a continuous transformation of the *same* profile, and the tolerance payoff becomes a permanent HUD (see Process story). |
| Persian typography | 12 | 20 | Shaping/joins are correct, digits are Persian, font is genuinely Vazirmatn (verified). Loses points for the un-isolated `mm`/`±` number token and the Persian-digit/Latin-unit mix. |
| Per-ratio layout | 8 | 15 | 16:9 is a genuinely separate composition (not a crop) — but 16:9 edge-touch FAILs and its finale leaves the whole left half empty; 9:16 partner baseline sits inside the hazard band. |
| Motion craft | 8 | 15 | Real camera pull, sparks, saw, sling, outBack mark settle, deterministic `rng(1010)`. But long static holds: `empty-band` FAIL on 241/249 sampled 9:16 frames. |
| Goal delivery | 5 | 15 | CTA «درخواست استعلام قیمت» is present and legible, but the "peers/partners" proof the order demanded is missing, and there is no contact/URL line. |
| Brand-mark handling | 11 | 15 | In-file SVG mark, own colours, transparent ground, no white plate — rule satisfied. Loses points because the mark is not on any plate/clear-space system and it sits against a partly empty field; also the `mark()` fallback would silently draw a plain orange arc if the data-URI failed. |

---

## Gates (raw output both ratios, plus the logo-gate variant experiment and your conclusion about L-081)

### 9:16, `--no-logo`
```
$ node work/persian/tools/gates/run-gates.mjs media/film-versions/s10-factory-parsa/v1/silent-9x16.mp4 --src work/persian/htmlfilm/s10-factory-parsa --events work/persian/htmlfilm/s10-factory-parsa/events.json --no-logo
logo-colour gate skipped (no brand asset)
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=600  sampled=249  scenes=6
edge-touch           | PASS | 249 frames sampled, margin 6px
empty-band           | FAIL | 241 frames > 30%; frames 0-84, 93-138, 147-267, 276-363, 369-538, 543-597; worst f27 69% (y 31-100%)
dead-frames          | PASS | 6 scene starts checked (window start-2..start+10)
duplicate-template   | FAIL | 6 scene midpoints; S3~S4 pHash 0.90 IoU 0.61
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | 9:16 target >= 12%; below: none; S1 20%@f84 S2 19%@f147 S3 26%@f240 S4 21%@f288 S5 23%@f522 S6 23%@f533
EXIT=1
```

### 16:9, `--no-logo`
```
$ node work/persian/tools/gates/run-gates.mjs media/film-versions/s10-factory-parsa/v1/silent-16x9.mp4 --src work/persian/htmlfilm/s10-factory-parsa --events work/persian/htmlfilm/s10-factory-parsa/events.json --no-logo
logo-colour gate skipped (no brand asset)
# run-gates silent-16x9.mp4  1920x1080  frames=600  sampled=249  scenes=6
edge-touch           | FAIL | 15/249 sampled frames; frames 63-66, 426, 525-538; e.g. f63 top bbox 1092,4,1292,132
empty-band           | FAIL | 64 frames > 30%; frames 0-81, 93-117, 147-177, 540-543; worst f540 58% (y 0-58%)
dead-frames          | PASS | 6 scene starts checked (window start-2..start+10)
duplicate-template   | FAIL | 6 scene midpoints; S3~S4 pHash 0.94 IoU 0.58
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | target 12% applies to 9:16 only; S1 31%@f81 S2 46%@f159 S3 48%@f240 S4 38%@f288 S5 44%@f519 S6 43%@f534
EXIT=1
```

Note on `number-lint`: `0 files` — the detector found **no source files to scan**, yet printed PASS. That is a vacuous PASS, not evidence (see Defects). `hero-size` and `dead-frames`/`duplicate-template` also used the **wrong scene starts**: the gates read `cut_frames` from `events.json` (`[0,96,192,288,384,528]` after clamping to <600), while the film's own code cuts at `CUT_BEATS × 15 = [0,60,120,180,240,330,420,510,540]`. So "scenes=6" is an artefact; the film has 9 cuts. The dead-frames PASS and duplicate-template FAIL were measured on frames that are *not* this film's cuts.

### Logo-gate variant experiment (L-081)
```
=== A: default (NO --no-logo), all gates ===
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=600  sampled=249  scenes=6
edge-touch           | PASS | ...
empty-band           | FAIL | ...
dead-frames          | PASS | ...
duplicate-template   | FAIL | ...
number-lint          | PASS | ...
logo-colour          | FAIL | f555: brand colour rgb(105,131,208) absent from the finale (0.000% of frame): emblem recoloured or missing
hero-size (estimate) | INFO | ...
EXIT=1

=== B: --only logo-colour (NO --no-logo) ===
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=600  sampled=249  scenes=6
(no gate rows printed)
EXIT=0

=== C: --only logo-colour --logo-files work/persian/src/workbench/public/uni-local/emblem-layers.svg,layers.json ===
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=600  sampled=214  scenes=1 (no events.json)
(no gate rows printed)
EXIT=0

=== D: does the default logo asset exist? ===
True
True
```

**L-081 is SETTLED: the defect still bites, and it is a FALSE-POSITIVE FAIL, not a skip.**

Evidence:
1. The default `--logo-files` path **does exist** (`work/persian/src/workbench/public/uni-local/emblem-layers.svg` and `layers.json` → both `True`). So the gate does not back off for a missing asset.
2. With no `--no-logo`, the gate runs and FAILs 9:16 at f555, hunting for **`rgb(105,131,208)` — a blue** — which is the colour of the unrelated *uni-local workbench* emblem. This film's brand colours are `#ff7a1a` / `#c9d2db` / `#4a545e` (its own in-file SVG, `film.html:124-133`). The film's finale provably shows its own orange mark (see finale stills). **The FAIL is therefore a false positive caused by the gate defaulting to another product's asset.**
3. `--no-logo` "fixes" it by printing `logo-colour gate skipped (no brand asset)`. That message is **factually wrong for this film**: the film *has* a brand asset (an inline data-URI SVG that renders in every finale frame); it just is not a file on disk. So the switch is a lie-shaped workaround, and `pa deliver --gates` passes `--no-logo` automatically (per FILM-GATES §Gates added in skill 2.8), i.e. delivered films are never logo-checked.
4. Worse, `--only logo-colour` (without `--no-logo`) prints **no rows at all and exits 0** — a silent skip that reads as green. A reviewer who spot-checks only that one gate gets a false pass.

Correct behaviour would be: read the brand colours from the film's own declaration (or accept a `--logo-colours "#ff7a1a,#c9d2db"` argument), and if no brand colours can be determined, emit an explicit `logo-colour | N/A | no brand colours found` row (FILM-GATES: an N/A is blocking, never a PASS).

---

## Stills reviewed (one line per image + path)

All paths relative to `media/film-versions/s10-factory-parsa/v1/`.

**9:16**
1. `_stills/t0_50s_f015.png` — opening GATE: a grey slab "billet" with X scan-lines and random dots floats centre; copy «شمش خام» + sub «فولاد AISI 4140 — قطعهٔ ریختگی» legible and correctly joined; bottom ~65% of frame is empty dark floor (this is the f27=69% empty-band FAIL family); no edge-touch.
2. `_stills/t3_30s_f099.png` — CUT: circular saw blade biting the billet, sparks absent at this frame; **no copy at all**; strong legibility of the tool, weakest story beat; no edge-touch.
3. `_stills/t6_50s_f195.png` — MEASURE: a white-outlined vertical bar (the caliper jaw) crossing the billet plus an orange/grey barcode strip above; **no Persian copy visible in this frame**; reads as an abstract bar, not a caliper.
4. `_stills/t9_70s_f291.png` — BORE: copy «سوراخکاری و پخزنی» + «پخ ۴۵ درجه — شعاع ۲ میلیمتر» legible; the tolerance block «رواداری» + huge `±۰٫۰۲ mm` occupies the middle band; bore + orange chamfer glow on the part; joins correct.
5. `_stills/t10_60s_f318.png` — same BORE scene 0.9 s later; tolerance number identical; confirms the number is a static overlay, not a one-beat payoff.
6. `_stills/t13_00s_f390.png` — INSPECT: copy «بازرسی کیفی» + «هر قطعه، پیش از بستهبندی اندازهگیری میشود.» legible; part with bore + orange tick badge; **tolerance number still on screen** 6.1 s after it landed.
7. `_stills/t15_20s_f456.png` — PALLET/loading: copy «بارگیری» + «بستهبندی صنعتی، آمادهٔ ارسال»; one large part plus **three small parts whose bore+chamfer renders as two crossed orange rings** — they do not read as the same object as the big part; tolerance number still there.
8. `_stills/t17_70s_f531.png` — SHIP: copy «خط تولید، یک شیفت کامل»; a long grey diagonal (the sling) cuts across the **whole** frame and passes through the tolerance number line; tolerance number still there at 17.7 s.
9. `_stills/t18_60s_f558.png` — finale mid: mark + wordmark «صنایع پارسا» + tagline «تولید قطعات صنعتی دقیق», plus a stray part icon lower-left; **no partner row, no CTA, no barcode**.
10. `_stills/t19_50s_f585.png` — finale: same content; mark mid-settle; still **no partner row**.
11. `_stills/t19_60s_f588.png` — finale: «از شمش تا اطمینان.» + CTA «درخواست استعلام قیمت» now visible; still **no partner row, no «نمونهٔ مشتریان صنعتی» label, no barcode/ISO block**.
12. `_qc_stills_9x16/t19_90s_f597.png` — **last frame of the film**: mark, wordmark, tagline, CTA. Partner row absent. Definitive.

**16:9**
13. `_stills-16x9/t1_00s_f030.png` — opening in the wide composition: billet **stage-left**, copy rail at x≈470 left, wide shop floor with perspective grid. **Designed, not a crop** — the 9:16 opening centres the billet; this one puts it left with a different hall spread. Right two-thirds of the frame is empty (empty-band 0-81).
14. `_qc_stills_16x9/t2_10s_f063.png` — the edge-touch hit: the ceiling lamp/bracket row and the vertical hanger at the top **touch y=4px** (gate: `f63 top bbox 1092,4,1292,132`). Confirmed by eye.
15. `_stills-16x9/t4_40s_f132.png` — MACHINE: copy «به اندازهٔ مو، دقیق.» left; gantry + sparks cluster on the billet; the gantry's dark frame plus the machine body **touch the top edge** again.
16. `_stills-16x9/t10_60s_f318.png` — BORE wide: copy + sub left, `±۰٫۰۲ mm` block left, machine centre-right. Confirms the same tolerance-overlay behaviour in 16:9.
17. `_stills-16x9/t15_20s_f456.png` — PALLET wide: copy left, big part centre, three small crossed-ring parts on a pallet; the pallet sits low-centre, floor grid fills the right half (mostly empty).
18. `_stills-16x9/t18_60s_f558.png` — finale right-hand composition: mark at x≈1450, wordmark/tagline right-aligned at x=1210; **left half of the frame is empty**; no partner row.
19. `_qc_stills_16x9/t19_90s_f597.png` — last frame: copy «از شمش تا اطمینان.» top-right, mark, wordmark, tagline, orange CTA rule + «درخواست استعلام قیمت». **No partner row anywhere.** Left half empty to the end.

---

## Brand mark judgement

**PASS on the stated rule; FAIL on nothing in the rule, low marks only on finish.**

- The mark is an in-file vector SVG in `film.html` (`MARK_SVG`, lines 124-133), rasterised through a `data:image/svg+xml;charset=utf-8,` URI into `ctx.drawImage`. There is **no external asset file**, which is exactly why `--no-logo`'s "no brand asset" message is wrong.
- **Own colours:** the SVG draws with `#ff7a1a` (orange), `#c9d2db` (steel highlight) and `#4a545e` (steel fill) — only this film's own palette, never re-tinted to another brand's colours (contrast with the L-081 gate, which looks for a blue `rgb(105,131,208)`).
- **Transparent background:** the SVG has `<defs>` + stroked/filled paths and **no background `<rect>`**; the only fill behind it is `url(#g)`, a radial orange gradient fading to `stop-opacity="0"`. Verified visually in `_qc_stills_9x16/t19_90s_f597.png` and `_qc_stills_16x9/t19_90s_f597.png`: the hexagon sits directly on the dark hall gradient, with the billboard behind it visible through the transparent corners.
- **Never on a white plate:** there is no white plate anywhere in the finale. The largest light surface drawn is `ctx.fillStyle = "rgba(255,122,26,.035)"; ctx.fillRect(0,0,W,bandY)` (`film.html:396`) — a 3.5 % orange wash, not a plate, and not white. Rule satisfied.
- Residual risk (not a rule breach): `mark()` (`film.html:129-132`) silently falls back to a plain orange stroked circle if `markImg` has not loaded. In the delivered files the full mark renders in every finale frame, so the fallback is dormant — but nothing in the film asserts that, and no gate would catch a silent fallback.

---

## Partner row judgement

**FAIL — the row does not exist in any delivered frame.**

The code is there and it is well-written; it simply never becomes visible.

`film.html:420-434`:
```js
// partner / peer row: LABELLED typographic stand-ins, equal weight+size, one baseline, even spacing
const pa = prog(n, CUTS[8] + 58, 18);
if (pa > 0.01) {
  ...
  const names = ["شرکت فولاد آریا", "پتروشیمی خلیج", "راه‌آهن ایران"];
  names.forEach((t, i) => {
    const x = L.partner.x0 + (i - 1) * L.partner.gap;
    ctx.fillStyle = C.light; ctx.fillText(t, x, L.partner.y);
    ... underline ...
  });
  ctx.fillStyle = C.dim; ctx.font = `700 ${Math.round(L.partner.size * 0.78)}px PAHead`;
  ctx.fillText("نمونهٔ مشتریان صنعتی", L.partner.x0, L.partner.y - L.partner.size * 1.5);
```

`CUTS[8] = F(CUT_BEATS[8]) = F(36) = 36 × 15 = 540` (`FPB = FPS*60/BPM = 30*60/120 = 15`). So the row starts fading in at frame **540 + 58 = 598**, over 18 frames, in a 600-frame film. At the last frame n=599 the alpha is `(599-598)/18 ≈ 0.056`. The row is at best 5 % opaque for one frame, then the film ends. It is invisible in the file, and no gate covers it.

- **Equal height/weight?** Cannot be judged from the film because it never renders. From the code, all three names share `700 ${L.partner.size}px PAHead` and one baseline `L.partner.y` — the *intent* meets rule 12.
- **Evenly spaced?** Code places them at `x0 + (i-1)*gap` with one `gap` (240 in 16:9, 288 in 9:16) — even by construction, though name lengths differ (`شرکت فولاد آریا`, `پتروشیمی خلیج`, `راهآهن ایران`), so the *gaps* are even while optical rhythm is not; the underline width is fixed, so the widest name would nearly fill it.
- **Clearly labelled as stand-ins?** A label exists in code — «نمونهٔ مشتریان صنعتی» at 78 % size above the row — but it, too, is inside the `pa > 0.01` block, so it never appears either. **In the delivered film there is no label, so the stand-ins are not merely unlabelled, they are absent.**
- Second, latent defect even if the timing were fixed: in 9:16 `bandY = L.cta.y + 92 = 1610 + 92 = 1702` (`film.html:389`) and `L.partner.y = 1712` — the partner baseline would sit **inside the hazard-stripe band** (1702-1732), i.e. three names printed across a warning stripe. In 16:9 the geometry is safe (`L.partner.y = 656`, `bandY = 656 + 78 = 734`).

Evidence: `_stills/t18_60s_f558.png`, `_stills/t19_50s_f585.png`, `_stills/t19_60s_f588.png`, `_qc_stills_9x16/t19_90s_f597.png`, `_stills-16x9/t18_60s_f558.png`, `_qc_stills_16x9/t19_90s_f597.png` — six frames spanning both ratios and the last frame of each, none showing a partner name.

---

## One-world finale (opening vs finale)

Side by side: `_stills/t0_50s_f015.png` (opening, 9:16) vs `_qc_stills_9x16/t19_90s_f597.png` (finale, 9:16); and `_stills-16x9/t1_00s_f030.png` vs `_qc_stills_16x9/t19_90s_f597.png`.

**Verdict: ONE WORLD — this part holds.**

- **Palette:** both are the same graphite ladder. Opening ground `#14181d` → `#2b333c`; the finale ground is drawn as `#0f1318 → #191f26 → #0d1116` (`film.html:380-382`), one shade family, with the same `C.light`/`C.white` type and the same `#ff7a1a` accent used the identical way (fill/light only, never body text). No colour in the finale is absent from the opening.
- **Background family:** the same hall. The opening hangs the same bank of light bays and the same perspective floor grid; the finale redraws the light bays at 45 % opacity (`film.html:383-384`) and the same floor grid (`film.html:386-388`), only without the perspective vanishing so hard. It reads as the same building.
- **Typography:** identical — `PAHead` (Vazirmatn) at weight 700/900 throughout, same `copyLine` family and same orange rule language. The finale adds the hazard stripe, which also appears in the shop-floor scenes (`f531`), so it is not a new visual world.
- **Where it drifts:** the finale is **much emptier** than any shop-floor frame. In 16:9 the entire left half is bare; in 9:16 the top 55 % is bare, and the finale is the worst empty-band frame (`worst f540 58% (y 0-58%)`). So the finale does not look like a *different film*, it looks like a *thinner* one — same world, under-dressed room.

---

## Process story readability

**From the header (verbatim, `film.html` top comment, lines 8-22):**
- GOAL: "B2B credibility for a fictional precision manufacturer; audience = procurement managers and industrial buyers"
- desiredAction: "request a quote / book a factory visit"
- LOGLINE: «از شمش تا اطمینان» — "one metal billet becomes a finished, inspected part."
- PROTAGONIST: "a single billet of raw metal: the SAME object in every shot (one rig, one silhouette that is progressively machined: rough blob -> squared blank -> chamfered part with a bored hole -> stamped, on the pallet, into the mark)."

**Judgement: partially readable — the transformation is legible as a sequence of states, but the "same object carries through" claim is only half true.**

Readable:
- The billet is genuinely the same *rendering function* (`billet(n, x, y, w, h, {m})`) throughout, always the same rounded-corner slab with the same X scan-lines, the same steel gradient and the same elliptical contact shadow. f015 (raw) → f195 (jigged) → f291/f318 (bored, orange chamfer) → f390 (bored + inspected tick) → f456 (bored + tick on the pallet) is a real progression, and it is readable in one glance per beat.
- The payoff number «رواداری ±۰٫۰۲ mm» with the orange rule lands on the part and is unmistakably the film's hero gesture.

Not readable / broken:
1. **The payoff never releases.** `const numA = prog(n, CUTS[3] + 26, 10);` (`film.html:353`) has **no fade-out term**. It enters at frame 206 and is still at alpha 1 at frame 599. Verified in stills f291, f318, f390, f456, f531 — the number is on screen for **394 of 600 frames = 66 % of the film**. The header calls frame 312 "tolerance number lands (beat 20)" as an *event*; in the picture it is a permanent lower-middle overlay that flattens five otherwise different scenes into one. This is also the mechanical cause of the `duplicate-template` FAIL (S3~S4 pHash 0.90/0.94 — a 112-118 px white number dominates every mid-scene pHash).
2. **The three small parts don't read as the same object.** At `f456` the big part shows one clean bore with an orange chamfer ring; the three small parts instead show **two crossing orange rings** with no readable bore (the chamfer + bore circle collapse at small scale). The viewer sees "big part, three different little things", not "the same part, three times".
3. **No saw/second shape is ever explained.** The billet's outline never actually changes *silhouette* — it is always the same rounded rectangle; only overlays (X-lines, jig, bore, tick) change. So "rough blob → squared blank → chamfered part" is asserted in the header but not visible in the frames; the object is never a "rough blob".
4. **Scene 2 (CUT) has no copy at all** (`t3_30s_f099.png`): the one beat that explains "a billet is cut" carries no words, while the beat that says "به اندازهٔ مو، دقیق." (`f132`) is about measurement, not cutting.
5. **Two of nine scenes (f195, f099) carry no Persian copy** — a silent film with no words for 4 of its 20 seconds.

---

## Persian typography

- **Font: VERIFIED Vazirmatn, not a fallback.** `@font-face{font-family:"PAHead";src:url("fonts/Vazirmatn-Variable.woff2") format("woff2");font-weight:100 900;font-display:block}` (`film.html:41`) and every text call uses `PAHead`. The file exists at `work/persian/htmlfilm/s10-factory-parsa/fonts/Vazirmatn-Variable.woff2` (111 128 bytes), magic bytes `77 4F 46 32` = `wOF2` (valid WOFF2), and the Brotli-compressed name table decompresses to:
  ```
  0 Copyright 2015 The Vazirmatn Project Authors (https://github.com/rastikerdar/vaz
  1 Vazirmatn
  2 Regular
  3 33.003;    ;Vazirmatn-Regular
  4 Vazirmatn Regular
  5 Version 33.003
  ```
  So the loaded face really is Vazirmatn v33.003. Because there is **no fallback family** in the `@font-face` and `font-display:block`, a 404 would have produced missing/blank Persian text; nothing is blank in any still, confirming the load.
- **Letter joins: correct.** «شمش خام», «به اندازهٔ مو، دقیق.», «سوراخکاری و پخزنی», «بازرسی کیفی», «بارگیری», «بستهبندی صنعتی، آمادهٔ ارسال», «صنایع پارسا», «از شمش تا اطمینان.», «درخواست استعلام قیمت» all show correct initial/medial/final forms with no per-character splitting and no dropped joins. No letter-spacing is applied (`fa()` sets no `letterSpacing`), which is the usual cause of broken joins — avoided here. ZWNJ is used correctly in «اندازهگیری», «بستهبندی», «میلیمتر».
- **Persian numerals: yes** — `faDigits()` is used (`film.html:358`, `:366`): `۰` `۰۲`, `۴۵`, `۲`.
- **Bidi / LTR isolation of the number token: FAIL.** `fa("±" + faDigits("0") + "\u066B" + faDigits("02") + " mm", ...)` (`film.html:358`) puts a Latin unit and a neutral `±` **inside an RTL run with no LTR isolate** (no `\u2066…\u2069`, no `\u200E`). The rendered line visibly separates into three tokens with the unit at the **far left** and the sign between the unit and the digits — i.e. `mm | ± | ۰٫۰۲` rather than one `±۰٫۰۲ mm` token. See `_stills-16x9/t10_60s_f318.png`, `_stills-16x9/t15_20s_f456.png`, `_stills/t9_70s_f291.png`. FILM-GATES' "Digits LTR" rule demands 100 % of number tokens carry `direction: ltr` or an isolate; this token does not, so the rule is unmet by construction.
- **Unit mixing:** the hero uses Latin `mm` while the sub-line two scenes later says `میلیمتر` («پخ ۴۵ درجه — شعاع ۲ میلیمتر»). One film, both spellings.
- **Decimals:** `\u066B` (Arabic decimal separator ٫) is used, which is right for Persian — but combined with Latin `mm` it produces the mixed `۰٫۰۲ mm` seen above.
- **Mirroring:** the layout is not mirrored nonsense — the stage is `direction: rtl` and copy is centred/right-aligned appropriately; `AISI 4140` inside «فولاد AISI 4140 — قطعهٔ ریختگی» (`f030`) keeps its LTR order correctly (Vazirmatn's Latin glyphs, correct order, correct em dash). That single Latin token is, ironically, isolated better than the hero number.
- **Contrast:** body copy (`C.dim` #9aa5b0 / `C.white` #eef2f5 on #14181d–#1b2127) is comfortably above 4.5:1. The CTA is `C.amber` #ffb347 on the dark ground — fine. The one soft spot is the finale tagline «تولید قطعات صنعتی دقیق» in 9:16, where the orange CTA rule is 28 px below the baseline and visually crowds the descenders (`_qc_stills_9x16/t19_90s_f597.png`).

---

## Distinct visual states (count + names)

**9 cut-states** (the film's own `CUT_BEATS = [0,4,8,12,16,22,28,34,36]` × 15 frames = [0, 60, 120, 180, 240, 330, 420, 510, 540]). Named, with the frame I actually looked at:

1. **GATE / raw billet** (f0-59; seen f015) — floating slab under gate lights, copy «شمش خام».
2. **CUT / saw bites** (f60-119; seen f099) — circular blade into the slab, **no copy**.
3. **MACHINE / sparks** (f120-179; seen f132) — gantry closes, spark cluster, copy «به اندازهٔ مو، دقیق.».
4. **MEASURE / caliper** (f180-239; seen f195) — white jaw bar + barcode strip, tolerance number enters at f206, **no copy visible**.
5. **BORE / drill** (f240-329; seen f291, f318) — copy «سوراخکاری و پخزنی» + «پخ ۴۵ درجه — شعاع ۲ میلیمتر», bore + orange chamfer.
6. **INSPECT** (f330-419; seen f390) — copy «بازرسی کیفی», orange tick badge.
7. **PALLET / loading** (f420-509; seen f456) — copy «بارگیری», one part + three crossed-ring parts on a pallet.
8. **SHIP** (f510-539; seen f531) — copy «خط تولید، یک شیفت کامل», long diagonal sling across the frame.
9. **MARK / finale** (f540-599; seen f558, f585, f588, f597) — mark, wordmark, tagline, «از شمش تا اطمینان.», CTA, hazard stripe.

**But how many are *visibly* distinct?** Far fewer than 9. States 1, 4, 6, 7, 8 all share the same composition — billet in the middle of the same hall, copy rail in the same slot, and from f206 onward the **same 112-118 px white `±۰٫۰۲ mm` block in the same place**. That is exactly what `duplicate-template` caught (S3~S4 pHash 0.90 in 9:16, 0.94 in 16:9) and it is confirmed by eye: f291, f318, f390, f456, f531 are the same picture with different words. **Honest count of clearly distinct visual states: 4** — (a) empty-hall raw billet, (b) saw/spark machine action, (c) bored+inspected part with the number, (d) finale mark card. Anti-slideshow: **weak-to-marginal, fails the duplicate-template gate**. A cut-based film is expected to change the *stage*, not just the caption.

---

## Defects (what | severity | class | the file that would have to change)

| # | Defect | Severity | Class | File that must change |
|---|---|---|---|---|
| D1 | **Partner row (rule 12) never appears.** `pa = prog(n, CUTS[8] + 58, 18)` starts at frame 598 of 600; max alpha ≈ 0.056. The 3 stand-ins, their shared baseline and the «نمونهٔ مشتریان صنعتی» label are all inside that block, so the delivered film has none of them. This is an explicit order requirement, unmet. | **Critical** | Brief delivery / timing | `work/persian/htmlfilm/s10-factory-parsa/film.html:421` (and the finale duration vs `CUT_BEATS[8]`) |
| D2 | **The tolerance number never leaves.** `numA = prog(n, CUTS[3] + 26, 10)` has no fade-out; on screen f206→f599 = 66 % of the film. Kills the one-beat payoff and causes the duplicate-template FAIL. | **High** | Story / motion | `film.html:353` |
| D3 | **`empty-band` FAIL on both ratios** (9:16: 241/249 sampled frames, worst f27 69 %, y31-100 %; 16:9: 64 frames, worst f540 58 %, y0-58 %). Confirmed by eye: the lower two-thirds of the 9:16 opening and the whole left half of the 16:9 finale are static. Gate exit 1. | **High** | Gate FAIL / layout | `film.html` (hall floor needs moving content; finale needs the left/top half dressed) |
| D4 | **`edge-touch` FAIL on 16:9 only** — 15/249 frames, `f63 top bbox 1092,4,1292,132`; the ceiling lamp row/hangers touch y=4 px; confirmed visually at `_qc_stills_16x9/t2_10s_f063.png`. 9:16 PASSes. | **High** | Gate FAIL / layout | `film.html` (16:9 hall ceiling geometry) |
| D5 | **`duplicate-template` FAIL on both ratios** (9:16 S3~S4 pHash 0.90 IoU 0.61; 16:9 pHash 0.94 IoU 0.58). Two scene midpoints are the same picture. Partly a symptom of D2; also genuinely identical staging across GATE/MEASURE/INSPECT/PALLET/SHIP. | **High** | Gate FAIL / composition | `film.html` |
| D6 | **`events.json` is desynced from the film and internally impossible.** `cut_frames: [0,96,192,288,384,528,672,816,864]` and `duration_frames: 600`. The render cuts at `CUT_BEATS × 15 = [0,60,120,180,240,330,420,510,540]`; the JSON's values are `CUT_BEATS × 24`. Three of its cuts (672, 816, 864 = 22.4 s, 27.2 s, 28.8 s) fall **outside a 20.000 s film**. Consequently the gates' `dead-frames`, `duplicate-template` and `scenes=6` were measured on the wrong frames, and `cta` (frame 552) / `settle` (568) contradict the header's own beats 42/44. | **High** | Data integrity / instrument | `work/persian/htmlfilm/s10-factory-parsa/events.json` (and the header's `f96/f192/…/f864` annotations, same 24-frame error) |
| D7 | **`logo-colour` false-positive FAIL by default; silent skip under `--only`.** Without `--no-logo` the gate hunts `rgb(105,131,208)` (the uni-local workbench emblem's blue) and FAILs the film's orange mark at f555. With `--only logo-colour` it prints no row and exits 0. With `--no-logo` it prints the untrue `skipped (no brand asset)`. **This is L-081, still open.** | **High** | Tooling / gate correctness | `work/persian/tools/gates/run-gates.mjs` + `logo-colour.mjs` (not this film's file) |
| D8 | **`number-lint` prints `PASS | 0 files`.** It scanned nothing and called it a pass — a vacuous PASS, which FILM-GATES forbids (`N/A` is blocking, never a PASS). The real bidi defect (D9) therefore went unreported. | **High** | Tooling / gate correctness | `work/persian/tools/gates/run-gates.mjs` (`--src` file discovery) |
| D9 | **Hero number token is not LTR-isolated.** `fa("±" + faDigits("0") + "\u066B" + faDigits("02") + " mm", …)` — no `\u2066…\u2069`; the unit `mm` lands on the far left of the RTL line and the `±` sits between unit and digits, so it does not read as one token. Violates FILM-GATES "Digits LTR" (100 % of number tokens isolated). | **Medium** | Persian typography / bidi | `film.html:358` |
| D10 | **Unit inconsistency:** Latin `mm` in the hero number vs `میلیمتر` in the sub-line (f291 «پخ ۴۵ درجه — شعاع ۲ میلیمتر»). | **Low** | Persian typography | `film.html:358` |
| D11 | **9:16 partner baseline lands inside the hazard band** (`L.partner.y = 1712` vs `bandY = L.cta.y + 92 = 1702`, band height 30). Even after D1 is fixed, three names would be printed across the warning stripe. | **Medium** | Layout | `film.html:87, 389` |
| D12 | **The three small parts do not read as the same object** — the bore+chamfer collapses into two crossing orange rings (f456, `_stills-16x9/t15_20s_f456.png`). Undercuts the "SAME object" promise. | **Medium** | Story / art | `film.html` (`billet()` small-scale `{m:4}` branch) |
| D13 | **Two scenes carry no copy** (f099 saw, f195 caliper) in a silent film — 4 s with no on-screen words for the audience named in the header. | **Medium** | Story / copy | `film.html` scene 2 and 4 |
| D14 | **No `VERSION.json` in `media/film-versions/s10-factory-parsa/v1/`** (`Test-Path` → `False`), and no `sheet*.jpg`/`contact*.jpg`. `pa deliver` reads VERSION.json and rewrites metrics from it; with none present, gates metrics and sha256s are unclaimed, and FILM-GATES' "Visual review" evidence pack cannot be assembled as specified. | **Medium** | Delivery record | new `media/film-versions/s10-factory-parsa/v1/VERSION.json` |
| D15 | **`mark()` silent fallback** — if the SVG data-URI has not loaded, the brand mark degrades to a plain orange circle with no warning and no gate (`film.html:129-132`). Dormant in these files, but unguarded. | **Low** | Robustness | `film.html:129-132` |
| D16 | **Header comment contradicts the film it documents**: it claims cuts at f96/f192/f288/f384/f528/f672/f816/f864, a CTA at f504, and "number lands at f240"; the code cuts at f60/f120/f180/…/f540 and the number lands at f206. A reader who trusts the header will mis-time every fix. | **Medium** | Documentation | `film.html` top comment block |
| D17 | **16:9 finale leaves the left half empty** — every element is on the right (mark x=1450, copy/wm/cta x=1210). Confirmed at `_qc_stills_16x9/t19_90s_f597.png`. | **Medium** | Composition | `film.html` `LAYOUT["16x9"].finale*` |
| D18 | **Sling line crosses the tolerance number** at `f531` in 9:16 — a grey diagonal passes straight through the hero number line. | **Low** | Legibility | `film.html` (draw order in scene 8) |

Nothing above is an ffmpeg/size/format defect: `ffprobe` on both finals returns a single `h264`, `yuv420p`, `30/1`, 600-frame video stream and **no audio stream** — silent v1 is honest.

---

## System friction I hit as a reviewer

1. **`events.json` lies about the film's own timeline, and gates trust it.** This is the worst friction: I had to read `film.html` to discover that `FPB = FPS*60/BPM = 15` while `events.json` was written with 24, before I could decide whether `scenes=6` or `duplicate-template S3~S4` meant anything. Every timing-based gate row for this film is measured on frames that are not its cuts. The gate runner should refuse (or loudly mark N/A) when an `events.json` declares `cut_frames` beyond `duration_frames`.
2. **`number-lint` returned `PASS | 0 files`.** A green row produced by scanning nothing is worse than an N/A, because it actively hides the real bidi defect (D9) sitting in `film.html:358`.
3. **The logo gate has three different wrong behaviours** (`FAIL` on another brand's colours; empty table + exit 0 under `--only`; untrue "no brand asset" under `--no-logo`). There is no way to tell it "this film's brand colours are `#ff7a1a,#c9d2db`" from the command line, so a film with a legitimate in-file mark cannot be logo-checked at all.
4. **No `VERSION.json` and no worker self-report** (`media/briefs-local/storylab-batch2/results/s10-factory-parsa.json` → `MISSING`). I was told to treat the self-report as claims to verify; there were no claims, so I could not check a single number the builder asserted, and I could not cross-check the builder's own gate run. There is a stale `gates-9x16-logo.json` (28 501 B) in the version folder that no document explains.
5. **The top comment block is actively misleading** (D16) — it is presented as the film's specification, and it disagrees with the code in every frame-table it prints. For a reviewer, the only trustworthy description of the film would have been derived, not written by hand.
6. **Nothing in the pipeline checks that a claimed element actually renders.** D1 (partner row) is invisible in 100 % of frames and every automated check passed the film on that axis; I found it only by reading a still of the last frame and then doing arithmetic on `film.html:421`. A cheap "declared element visible for ≥ N frames" assertion would have caught it.
7. **Minor:** `run-gates.mjs` on a stills folder rejects `capture.mjs`'s `t0_50s_f015.png` naming (per `recon-qc.md` §2), so the stills I generated for the gate-flagged frames could themselves not be gated — I had to gate the mp4 and use the stills only by eye.

---

## What I could not check

1. **The missing worker self-report.** `media/briefs-local/storylab-batch2/results/s10-factory-parsa.json` does not exist, so no builder claim was verified or falsified — I reviewed the artefacts, not the report.
2. **Sound.** Silent v1 by design and by `ffprobe` (one video stream, no audio). Loudness, true peak, SFX-to-picture within 1 frame, audio continuity at cuts, beat grid ≤ 15 ms, drop placement and every cue-offset claim are **impossible** to check and are recorded as not-run, which FILM-GATES counts as blocking — not as pass. Related and separately unverifiable: the header's claim "every cut is a hard cut on a beat" cannot be *measured* on a silent file; I could only confirm the cut frames are the beat grid computed in code.
3. **Frame-accurate motion.** I read stills, not the full 600-frame motion. Dead-frame behaviour *between* my stills, the saw's rotation, the spark trajectory, the sling's swing and the mark's `outBack` settle were judged from stills and code, not by watching the video end to end. In particular I did **not** watch the full 20 s of either ratio — the `empty-band` and `duplicate-template` verdicts rest on the gate output plus the 19 stills listed above.
4. **WCAG contrast measured numerically.** I judged contrast by eye on the stills (all body copy looks comfortably above 4.5:1; the amber CTA above 3:1); no automated contrast gate exists (`FILM-GATES`: "to build") and I did not compute ratios.
5. **The 16:9 `--out`/deliver path.** I did not run `pa render`, `pa deliver`, `pa compress` or `pa pacing`. Whether these finals are the ones `deliver` would pick, and whether compression's SSIM guard would accept them, is unverified. There is no `VERSION.json` for deliver to read.
6. **`hero-size` numbers.** The gate printed `hero-size (estimate)` with per-scene percentages (9:16 all ≥ 19 %, above the 12 % bar). It is labelled an *estimate* and I did not measure digit height in pixels myself, so I am relaying the gate's number, not confirming it.
7. **Whether the HTML is the exact source of these mp4s.** I did not re-encode the film, so I cannot prove the delivered mp4s came from the current `film.html` revision. The stills I captured live from `film.html` match the delivered stills (same mark, same number, same absence of the partner row), which is strong but not a hash-level proof.
