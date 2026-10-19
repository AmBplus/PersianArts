# QC Review — s12-pikavar-route (independent reviewer, no trust in builder claims)

Film: `work/persian/htmlfilm/s12-pikavar-route/film.html` · 20.000 s · 30 fps · 600 f · SILENT v1 · 9:16 + 16:9 · one take.
Finals: `media/film-versions/s12-pikavar-route/v1/silent-9x16.mp4`, `silent-16x9.mp4`.

## Verdict (SHIP / SHIP WITH NOTES / FIX)

**FIX.** The picture craft is real — one continuous camera take, a live counter that genuinely reaches 0, a coherent dark-map world and a real doorstep payoff. But the shipped version has (a) edge-touch FAIL on **both** ratios, (b) a systematic label-over-digit collision in the 16:9 HUD, (c) **no brand name «پیکآور» and no call-to-action anywhere on screen** for a film whose goal is a company introduction, (d) **no VERSION.json at all** in the version folder, and (e) both finals over the size guidance. (a)+(b) are picture defects, (c) is goal delivery, (d)+(e) are delivery-package defects; none is a render failure, all are fixable in one round.

## Score (0-100) + breakdown (story, Persian typography, per-ratio layout, motion craft, goal delivery)

**66 / 100**

| Axis | Score | Why |
|---|---|---|
| Story | 15/20 | Real arc distance→motion→arrival, 5 legible beats, no dead air; thin on stakes (one parcel, no seller, no city rhyme) |
| Persian typography | 16/20 | Vazirmatn actually loads, joins and RTL correct, Persian numerals correct and isolated-by-script; header claim about "LTR isolate" is now false and the footer caption of the code contradicts the header |
| Per-ratio layout | 10/20 | 9:16 HUD clean; 16:9 label «زمان تا تحویل» overlaps the digits on every still, and 16:9 title ink reaches x≈0 (left edge), matching the gate's edge-touch hits |
| Motion craft | 15/20 | Continuous camera with keyed z/cy, parallax streets, route draw-in, pulse dots, district blooms, parcel bob/squash, door light push — not a slideshow |
| Goal delivery | 10/20 | Counter payoff and «رسید.» land, but the brand never appears and there is no pickup CTA; a viewer cannot name the company or the action |

## Gates (raw output both ratios + your reading)

Command (exactly as ordered, both ratios):

```
node work/persian/tools/gates/run-gates.mjs media/film-versions/s12-pikavar-route/v1/silent-9x16.mp4 --src work/persian/htmlfilm/s12-pikavar-route --events work/persian/htmlfilm/s12-pikavar-route/events.json --one-take --no-logo
```

Raw stdout 9:16 (exit 1):

```
logo-colour gate skipped (no brand asset)
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=600  sampled=214  scenes=1
edge-touch           | FAIL | 136/214 sampled frames; frames 87-201, 225-234, 264-276, 303-426, 432-441, 489-492, 498-504, 510-597; e.g. f87 bottom bbox 44,1500,296,1916
empty-band           | PASS | worst f0 14%
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | 9:16 target >= 12%; below: none; S1 39%@f447
[exit code: 1]
```

Raw stdout 16:9 (exit 1):

```
logo-colour gate skipped (no brand asset)
# run-gates silent-16x9.mp4  1920x1080  frames=600  sampled=214  scenes=1
edge-touch           | FAIL | 112/214 sampled frames; frames 0-84, 90, 111, 138-279, 285, 291, 300, 309-351, 387-390, 405-408, 564-570; e.g. f0 top bbox 904,0,1092,180
empty-band           | PASS | worst f213 5%
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | target 12% applies to 9:16 only; S1 60%@f483
[exit code: 1]
```

My reading:
- **empty-band PASS is credible**: worst band 14% (9:16, at f0) and 5% (16:9) versus the 30% limit; the map lights, route pulse dots and camera push keep the band alive. Confirmed by eye at f003/f090/f285/f450 — no flat flood, no clear sky.
- **dead-frames PASS is weak evidence**: `1 scene starts checked` because events.json declares `cut_frames:[0]` and one html = one scene. There is no second scene start to test, so this is a 10-frame window check at t=0 only. It does not prove the mid-film is free of near-uniform runs.
- **duplicate-template N/A** is expected for a one-take single-html film, but note the gate prints "needs scene starts (events.json)" **even though --events was passed** — the worker's self-report flags the same thing. It is a tool-reporting wart, not a film defect.
- **number-lint PASS reads `0 files`** — i.e. it linted the source with `--src` and found no un-isolated number runs. It has nothing to scan for this film because all digits are drawn with `faDigits()` inside canvas text, so this PASS is nearly vacuous.
- **edge-touch FAIL is real ink, not only scenery**: I checked the flagged frames by eye (see below). In 16:9 the parcel box itself touches y=0 at f0 (`bbox 904,0,1092,180`), and in 9:16 the parcel/route blobs sit at `y1500..1916` (bottom band) at f87. `--scenery` was **not** passed, and there is **no VERSION.json** carrying `scenery:true`, so by FILM-GATES note 2.10/2.11 the gate stays FAIL: the full-bleed exemption was never declared. Even granting the scenery exemption, the 16:9 parcel touching the top edge is not scenery.
- `hero-size INFO, below: none` in 9:16 is the gate's own measurement and it says the hero never drops under 12% (39% at f447). My pixel estimate is more conservative (~12%), see layout section.

## Stills reviewed (one line per image + path)

Existing stills: 13 PNGs in `_stills/` and 13 in `_stills-16x9/`; no new capture was needed (>= 5 per ratio available).

9:16 — `media/film-versions/s12-pikavar-route/v1/_stills/`
1. `t0_10s_f003.png` — dark navy-teal map, dashed street grid, parcel centred in a warm bloom, counter «۲۰» huge white with amber label «زمان تا تحویل» above and «ثانیه» below; title not yet faded in (alpha starts at 0.3 s); digits fully legible, nothing touches the edge.
2. `t3_00s_f090.png` — counter «۱۷»; route just live; the unit «ثانیه» sits **on top of** the «شهرک غرب» district bloom and its ghost label → local legibility drop (unit is small and low-contrast against the bloom); title «فاصله فقط یک عدد است.» now visible at the bottom, RTL correct, joins intact, margins safe.
3. `t9_50s_f285.png` — counter «۱۰»; route drawn as an amber polyline with glowing pulse dots; districts passed are warm (میرداماد/ونک) and unpassed cool (ولیعصر) — the one-world rule reads correctly here; the amber route exits the **left frame edge** at y≈760 (a gate lead, decorative).
4. `t15_00s_f450.png` — counter «۵» (the Vazirmatn ۵ reads as a heavy drop shape, correct but the heaviest glyph in the set); destination district lit, «درب منزل» label appears, doorway bloom growing; the unit «ثانیه» again overlaps a district glow.
5. `t19_97s_f599.png` — final frame: counter «۰», the door is open and a large dark figure (the handover) fills the middle of the HUD column, «ثانیه» lands on the figure's torso, route line runs behind the label; «رسید.» stamps bottom-centre, clean and legible. Payoff lands, but the counter's own unit has the worst contrast of the whole film on the frame that matters most.

16:9 — `media/film-versions/s12-pikavar-route/v1/_stills-16x9/`
6. `t0_90s_f027.png` — **not a crop**: the city is a tall right-hand column with its own street pattern, parcel near the top edge (touches y=0 at f0), counter «۱۹» on the left. Defect visible: the amber label «زمان تا تحویل» is drawn **over** the top of the digits. The title at the bottom-left has ink at x≈0 (left edge).
7. `t9_50s_f285.png` — counter «۱۰»; same label-over-digit overlap (the «ز» sits on the «۱»); route zig-zags down to the parcel at centre-right; districts bloom warm/cool as in 9:16; the composition is genuinely re-laid-out, not stretched.
8. `t15_00s_f450.png` — counter «۵»; label again overlapping the glyph; door light growing at bottom-centre; 16:9 keeps a lot of empty right-hand map.
9. `t19_97s_f599.png` — final frame: counter «۰» reaches zero; «رسید.» stamps into the **same upper-left band as the label** and collides with «زمان تا تحویل» (two text blocks on each other); the handover figure enters at bottom-centre. Payoff readable but crowded.
10. `t3_00s_f090.png` / `t6_50s_f195.png` / `t12_50s_f375.png` (cross-checked) — same HUD collision pattern every time; no new state.

Verdict on the ratios: **the 16:9 is genuinely designed** — different `route`, different `cam` keys, different text boxes in the `LAYOUT` table (lines 63-70) and visibly different composition in the stills. It is not a crop. The label/digit collision proves the re-composition was never eyeballed after the last layout edit.

## Countdown payoff (value per still, does it reach 0?)

Contract (film.html line 48): `remaining = duration_s * (1 - prog(T, 0, DUR - 1/FPS))`, LAST = 19.9667 s.

| Still | t (s) | expected remaining | **counter read in the image** | legible? |
|---|---|---|---|---|
| 9:16 `t0_10s_f003` | 0.10 | 19.90 | **۲۰** (20) | yes, large white on navy |
| 16:9 `t0_90s_f027` | 0.90 | 19.10 | **۱۹** (19) | yes, but label overlaps the glyph top |
| 9:16 `t3_00s_f090` | 3.00 | 17.00 | **۱۷** (17) | yes |
| 9:16 `t9_50s_f285` | 9.50 | 10.48 | **۱۰** (10) | yes |
| 16:9 `t9_50s_f285` | 9.50 | 10.48 | **۱۰** (10) | yes, label overlaps |
| 9:16 `t15_00s_f450` | 15.00 | 4.98 | **۵** (5) | yes |
| 16:9 `t15_00s_f450` | 15.00 | 4.98 | **۵** (5) | yes, label overlaps |
| 9:16 `t19_97s_f599` | 19.97 | 0.03 | **۰** (0) | digit legible; «ثانیه» unit lands on the handover figure |
| 16:9 `t19_97s_f599` | 19.97 | 0.03 | **۰** (0) | digit legible; «رسید.» collides with the label |

**It reaches 0 on the last frame of both ratios, and the digits are legible in every still I looked at.** Rounding is `Math.round` (19.90→20, 10.48→10, 4.98→5, 0.03→0) — consistent, no off-by-one, no frame where the hero digit is unreadable. The only legibility problems are the 16:9 label/digit overlap and the 9:16 finale where the handover figure crosses the unit label, not the digit itself. So the promised payoff is delivered; the counter is not a decoration.

## Persian typography and numbers

- **Font is real, not a fallback.** `film.html:34` declares `@font-face{font-family:"PAHead";src:url("fonts/Vazirmatn-Variable.woff2") format("woff2");font-weight:100 900;font-display:block}` and the file exists at `work/persian/htmlfilm/s12-pikavar-route/fonts/Vazirmatn-Variable.woff2` (111,128 bytes, first 4 bytes `77 4F 46 32` = "wOF2", valid WOFF2). All text runs use `PAHead` and only `PAHead` (lines 139, 197, 201, 206, 207, 211, 217, 222). The page gates the first frame on the font: `Promise.all([document.fonts.load("900 40px PAHead"), …600…]).then(()=>document.fonts.ready).then(()=>{render(0); window.film.ready=true;})` (line 255), so no render can happen before the face is usable — this is the mechanism that makes a silent fallback unlikely, and the stills confirm a single consistent Persian face with correct Vazirmatn-style joins (e.g. «فاصله» with joined ف+ا+ص+ل+ه, «میرداماد», «سعادتآباد» with ZWNJ handling intact). I could not read the WOFF2 name table (Brotli-compressed), so "Vazirmatn" is evidenced by the file, the variable-weight declaration and the rendered letterforms, not by a font-metadata dump.
- **Joins are intact everywhere I looked** — no letter-spacing, no per-character splitting, no broken joins; «فاصله فقط یک عدد است.» and «رسید.» both render as proper RTL words.
- **No mirroring**: the whole stage is `direction:rtl` and canvas text uses `ctx.direction="rtl"`; the RTL copy reads right-to-left correctly in both ratios (title in 9:16 bottom, receipt bottom-centre 9:16 / upper-left 16:9).
- **Numbers**: digits are drawn with `faDigits(n)` and the code comments explicitly say *"Persian digits in RTL logical order (NOT an LTR isolate: that mirrors the number)"* (line 208) — and `progress-s12.md` records that an earlier LTR-isolate version did mirror «۱۵» into «۵۱». So the deliberate choice is RTL-logical Persian numerals, and the stills show ۲۰/۱۹/۱۷/۱۰/۵/۰ in the correct order. `number-lint` PASS is therefore correct for the shipped code. **However, this contradicts the header comment (line 18) which still claims "Every digit sits in an LTR isolate"** — a stale claim inside the deliverable. FILM-GATES' "Digits LTR" rule (100% of number tokens with direction ltr or isolate) is not satisfied as written, but for Persian-only numeral runs in an RTL context the shipped behaviour is the correct localization; the film needs the header corrected and a one-line note, not a code revert.
- **The ۵ glyph** is a heavy drop shape that at 300 px could be mistaken for a decorative mark; it is correct but the heaviest read in the set.
- Unit label «ثانیه» is a separate `fillText` at `c.x - c.size*1.15`, `textAlign` default (start) — in 9:16 it lands centred under the digits (fine) and in the finale it collides with the handover figure; in 16:9 it sits clear below the digits.

## Story and goal

From the header (`film.html:13-16`):
- **Goal**: same-day city pickup for small online sellers.
- **Desired action**: order a pickup (پیکآور).
- **Logline**: «فاصله فقط یک عدد است» — one small parcel crosses the dark city while the counter falls to zero.
- Promised arc: MAP (0-3) → DRAW (3-9.5) → CROSS (9.5-14) → TURN (14-18.5) → DOOR (18.5-20), counter hits 0 at 19.967 with the «رسید.» stamp.

**Arc is visible and the arrival is a real payoff, partly.** Distance→motion→arrival reads in the stills: the parcel starts small in a bloom among unlit districts, the amber route draws itself as a wake with pulse dots, districts flip from teal to warm as the line crosses them, the last district hands over to a doorway whose circle of light grows and then opens, and the counter lands on 0 as «رسید.» stamps. The camera never cuts and the counter gives the whole take a spine — this is what stops it being an abstract map loop.

**But the promised action is never delivered on screen.** Grepping the film for brand/CTA tokens returns only the html `<title>`, the header comment and the two copy strings: `const TITLE = "فاصله فقط یک عدد است.", RECEIPT = "رسید.";` (line 49). **There is no «پیکآور» wordmark, no logo, no «سفارش پیک» / order-a-pickup line, no URL, no app-store or phone cue, not even a shipping-brand visual signature.** A viewer finishes the film knowing a parcel arrived on time but cannot name the company or the action — the film's own GOAL line is unmet. The «رسید.» stamp is a nice narrative close but it is a receipt, not a brand. Combined with `logo-colour skipped (no brand asset)` this is the largest goal-delivery gap in the film.

## One-world finale

Palette, background family and typography are consistent end to end: `#05121b → #0b2b3a` navy-teal base, `#17455a` streets, `#ffb43c` warm route/keys, `#ffe6b8 + #ff9a3c` parcel, white type, all in `PAHead`, in both the opening map stills and the f599 finale. The finale does not switch art direction and the same map grid (dashed streets, building plates, district blooms) is still visible behind the door.

**Judged as "dark map world resolving to a doorstep": it reads as one world, but the doorstep is weak as a place.** The door is a circle of light on a rectangle plus a small «درب منزل» label; at f599 the door area is dominated by a large, very dark handover silhouette that reads as a generic figure/building block rather than a lit doorway, and there is no doorstep detail (mat, lamp, threshold, interior light spill) to make arrival feel like a different kind of place. It is the same map with a glowing circle, which honours "one world" at the cost of the arrival being visually distinct. I would call it consistent-but-not-cathartic; the doorway needs one warm interior tone to land.

## Distinct visual states (count + names)

**5 visibly distinct states** (matching the header's own scene list, and each confirmed in stills, no two interchangeable):

1. **MAP** (t0-3) — parcel small in the first bloom, title copy in, counter high in the HUD, route not yet drawn. (`_stills/t0_10s_f003.png`)
2. **DRAW** (3-9.5) — amber route drawing itself behind the parcel, pulse dots running along it, camera zooming and tracking, districts still cool. (`_stills/t3_00s_f090.png`, `t6_50s_f195.png`)
3. **CROSS** (9.5-14) — tight camera on the crossing, passed districts blooming warm against cold unpassed ones, route fully present. (`_stills/t9_50s_f285.png`, `t12_50s_f375.png`)
4. **TURN** (14-18.5) — the last district hands over, the doorway ring of light grows, camera settles then pushes z 1.9→2.2, «درب منزل» appears. (`_stills/t15_00s_f450.png`, `t17_00s_f510.png`)
5. **DOOR** (18.5-20) — the door opens, the handover figure is present, counter reaches ۰, «رسید.» stamps. (`_stills/t19_00s_f570.png`, `t19_97s_f599.png`)

Not a slideshow: states are separated by continuous camera motion, not by cuts (there are none — one html, `cut_frames:[0]`), and each state adds one new element rather than swapping layouts. Within each state the parcel keeps travelling, so there is no static hold longer than the title's own fade.

## Layout measurements per ratio

Measured from the stills (pixel positions read off the images; declared values from the `LAYOUT` table, `film.html:57-70`).

**9:16 (1080x1920)** — declared `counter:{x:520,y:550,size:300}`, `labelY:300`, `unitY:680`, `title:{x:540,y:1500,size:56}`, `receipt:{x:540,y:1690,size:104}`, `scrim:{y:200,h:900}`.
- Hero digit height: digits «۲۰» span y≈340..570 → **≈230 px ≈ 12.0% of 1920 height**; cap-height arithmetic from `size:300` gives ≈216 px ≈ 11.3%. **At or marginally below the 12% hero target by my measurement**; the gate's own estimate says ≥12% everywhere (39% at f447), which suggests the gate measures the glyph bbox differently (bbox+glow or width-slot). I report the ambiguity rather than a clean PASS.
- Hero width/slot: 2-digit block ≈ x355..690 = 335 px of 1080 = **31% of frame width**, centred, not clipped.
- Safe margins: top ink (label) starts at y≈275 → 14.3% top margin; title block sits y≈1465..1520 → 6.2% from bottom; receipt baseline 1690 with cap ≈100 px → bottom ink ends ≈1745 → **9.1% bottom margin**. Left/right: widest text (title, max 880 centred) leaves >9% each side. **9:16 margins are healthy.**
- Collisions: unit «ثانیه» overlaps a district bloom at f090/f285, and at f599 it sits on the handover figure. The counter never collides with the title or the receipt.

**16:9 (1920x1080)** — declared `counter:{x:470,y:430,size:288}`, `labelY:230,labelSize:50`, `unitY:570`, `title:{x:700,y:880,size:66,max:1000,lines:2}`, `receipt:{x:250,y:170,size:96}`.
- Hero digit height: «۱۹» spans y≈285..480 → **≈195 px ≈ 18.1% of 1080** (target applies to 9:16 only, so this is informational).
- **Defect, measured: the amber label collides with the digits.** Label baseline 230 with size 50 → label ink ≈ y185..245; digit ink starts ≈ y285 by my read but the stills show the «ز/م/ان» strokes clearly crossing the upper third of «۱۹»/«۱۰»/«۵». Label bottom and digit top overlap by roughly 40-60 px in all four 16:9 stills. In 9:16 the same two elements clear each other (label 300, digit top ≈340) — so the 16:9 numbers were never re-checked after the layout was re-composed.
- **Defect, measured: title ink reaches the left edge.** Title is right-aligned at x=700 with `max:1000`, so its box runs x=-300..700; the visible line in `t0_90s_f027`/`t9_50s_f285` starts at x≈0-20 (the leftmost letter/period), i.e. **≤1% left margin**, and the gate's edge-touch FAIL at frames 0-84/138-279 is consistent with it. `progress-s12.md` says "12:06 fixed 16:9 title overflowing the left edge (x 310 -> 700, max 880 -> 1000)" — the fix was insufficient for a right-aligned box of width 1000 at x=700.
- **Defect: the «رسید.» receipt collides with the label.** `receipt:{x:250,y:170,size:96}` vs `labelY:230` — at f599 both texts occupy the same upper-left band and overlap (visible in `_stills-16x9/t19_97s_f599.png`).
- Parcel at f0 has bbox y=0 (`904,0,1092,180`) → the parcel **touches the top edge** at the 16:9 opening; safe margin 0%.
- Right/bottom margins are generous (map column), so the left/top crowding is a composition choice that went wrong, not a lack of space.

## Size and encoding

```
silent-9x16.mp4 : h264, 1080x1920, yuv420p, 30/1 fps, 600 frames, 20.000 s, 17,104,127 bytes, 6,841,650 b/s
silent-16x9.mp4 : h264, 1920x1080, yuv420p, 30/1 fps, 600 frames, 20.000 s, 13,999,190 bytes, 5,599,676 b/s
```
- Both are ~17.1 MB and ~14.0 MB (**16.3 MiB / 13.4 MiB**). The guidance is ~12 MB per final: **9:16 exceeds it by ~43%, 16:9 by ~17%.** Both violate it.
- Cause is visible in the folder: the films are **stream-copied concatenations of two 300-frame captures** — `_seg-9x16-a.mp4` (8,328,762) + `_seg-9x16-b.mp4` (8,776,080) = 17,104,842 ≈ the final 17,104,127; `_seg-16x9-a.mp4` (7,258,505) + `_seg-16x9-b.mp4` (6,741,372) = 13,999,877 ≈ the final 13,999,190. **`pa compress` was never run on either**, so the delivery package is at pre-compression size. Per recon-qc R4 / L-104, dense line art like this map wants crf 25 / level 4.1 / maxrate 14M — a compress pass is the expected remedy, played against the SSIM guard (min 0.985).
- Both files carry **no audio stream** (ffprobe lists a single video stream), which is correct for silent v1.
- Both are exactly 600 frames / 20.000 s / 30 fps / yuv420p, so duration and frame-count claims in the worker's self-report are confirmed.
- Implication: the size problem is a **delivery-package problem, not a picture problem** — the frames are fine, the packaging step is missing, and it will only get worse if the sound version is added on top without compress.

## Friction evidence from the builder's debug scripts

- **`_bal.mjs`** — a hand-written JS bracket/string/comment/regex balance scanner that prints depth per line and reports "NEGATIVE at line N" or "OPEN … at end of line N". It exists because `film.html` is one ~21.5 KB inline `<script>` blob; one unbalanced brace kills the whole page, and the only signal from capture.mjs was a blank/stale still. Together with `progress-s12.md` ("12:01 fixed 3 syntax defects (stray ")" in blocks(), "140}" for "140]", unclosed rgba string)") this says the builder was **debugging a film through a syntax-error oracle**.
- **`_dbg.mjs`** — spawns chrome-headless-shell on a fixed port 9455, navigates to `film.html?capture=1&ratio=…`, and dumps `Runtime.consoleAPICalled` / `Runtime.exceptionThrown` plus `typeof PA`, `typeof window.film`. Note its own placeholders: `err: 'no-access'`, `manual render test: 'no-access'` — the script itself admits it cannot reach the film's internals. It exists because **there is no first-class "why is my frame blank" diagnostic**; the reviewer/worker had to hand-roll CDP plumbing.
- **`_fix.mjs`** — a one-off literal string replacement: `'"rgba(8,32,44,0.75")'` → `'"rgba(8,32,44,0.75)"'`, printing `replacements: N`. It exists because an **editing tool corrupted a CSS colour string** (dropped the closing paren, turning `rgba(...)` into a broken `rgba(...")`), and the repair was a scripted sed rather than a re-read of the file. I verified the shipped file is clean: `Select-String` for the broken literal returns **0** hits, so the fix landed.
- **`_scan.mjs`** — the follow-up: scans every line for `"rgba(...)"` strings that do not end in `)` and prints line number + context. It exists because after the first fix the builder **no longer trusted the file** and wanted a general detector for the same corruption class.
- **What this says about the SYSTEM (not the film)**: (1) the toolchain gives no page-error surface — a syntax error surfaces only as an empty still, so workers build their own CDP debuggers and bracket scanners; (2) text-edit tooling can silently corrupt string literals inside an inline script, and there is no post-edit syntax gate before a 300-frame render is attempted (L-088-style); (3) capture.mjs's hard default port 9333 with no isolation **silently served a still from another film** (recorded at 12:00) — the worker's own self-report says this class of collision "destroyed the first s08 and s12 attempts" — so the biggest system friction is **port/target isolation plus the absence of any cheap render-liveness assertion**; (4) the ~300 s per-call capture ceiling forces hand-rolled segment-and-concat that no tool owns, which is exactly how both finals ended up oversized. Fixing the tool (port auto-isolation, a `--segment`/resume mode, a syntax pre-check, an exit-on-error assert) would have saved most of this build's pain; none of the four scripts should be necessary.

## Defects (what | severity | class | the file that would have to change)

| # | Defect | Severity | Class | File that must change |
|---|---|---|---|---|
| D1 | No brand name «پیکآور», no logo and no order-a-pickup CTA anywhere on screen; the film's stated desired action is never asked for | **High** | goal delivery / copy | `work/persian/htmlfilm/s12-pikavar-route/film.html` (copy + a brand plate in the DOOR state) |
| D2 | edge-touch FAIL on both ratios: 136/214 frames 9:16 (`f87 bottom bbox 44,1500,296,1916`), 112/214 frames 16:9 (`f0 top bbox 904,0,1092,180`); part of it is real ink — 16:9 parcel touches y=0 at the opening, 16:9 title ink reaches x≈0 | **High** | layout / edge margin | `film.html` (`LAYOUT["16x9"].route`/`cam` start, `title.x/max`) |
| D3 | 16:9 HUD label «زمان تا تحویل» overlaps the hero digits in every 16:9 still (label baseline 230 + size 50 vs digit ink from ≈y285 at `counter.y:430,size:288`) | **High** | per-ratio layout | `film.html` (`LAYOUT["16x9"].counter` / `labelY`) |
| D4 | 16:9 «رسید.» (`receipt:{x:250,y:170,size:96}`) collides with the label on the final frame — two text blocks on each other at the payoff | **High** | layout / finale | `film.html` (`LAYOUT["16x9"].receipt`) |
| D5 | **No `VERSION.json` in `media/film-versions/s12-pikavar-route/v1/`** — no source path, ratios, `outputs[]` sha256/size, `metrics.gates`, scenery/logo switches. Other films (e.g. `s07-kite-wind/v1`) have one. Blocks the delivery package and blocks the `scenery:true` exemption that would legitimately answer D2's scenery portion | **High** | delivery package / gates evidence | `media/film-versions/s12-pikavar-route/v1/VERSION.json` (new file; film.html untouched) |
| D6 | Both finals exceed the ~12 MB guidance (17.10 MB / 14.00 MB) because they are stream-copied concats of two 300-frame segments and `pa compress` was never run | **Medium** | size / encoding | `media/film-versions/s12-pikavar-route/v1/*.mp4` via `pa compress` (not a film.html change) |
| D7 | 9:16 finale: the `ثانیه` unit lands on the handover figure (worst contrast in the film on the frame that matters); district blooms also run under the unit at f090/f285 | **Medium** | layout / contrast | `film.html` (`LAYOUT["9x16"].unitY`/`unitSize`, scrim, or DOOR-state figure placement) |
| D8 | Header comment (line 18) still claims "Every digit sits in an LTR isolate" while the code (line 208) deliberately does the opposite and `progress-s12.md` records that the isolate mirrored the digits. The deliverable documents behaviour it does not have | **Medium** | documentation / gate claim (FILM-GATES "Digits LTR") | `film.html` header comment |
| D9 | 16:9 doorstep reads as a glowing circle plus a large dark silhouette, not a place; arrival is not visually distinct from the map | **Low-Medium** | one-world / art direction | `film.html` (DOOR-state door/interior treatment) |
| D10 | `dead-frames PASS` rests on a single scene window at t=0 (`cut_frames:[0]`), so mid-film uniformity is unproven; `number-lint PASS` reads `0 files` because all digits are canvas-drawn — two near-vacuous PASSes | **Low** | gate evidence quality | `work/persian/htmlfilm/s12-pikavar-route/events.json` (declare more scene starts) or the gates themselves |
| D11 | 4 debug scripts left in the film folder (`_bal.mjs`, `_dbg.mjs`, `_fix.mjs`, `_scan.mjs`) | **Low** | housekeeping | the film folder (not required for correctness; I did not delete them) |

## System friction I hit as a reviewer

- `run-gates.mjs` prints `duplicate-template N/A needs scene starts (events.json)` **even when `--events` is passed** — the worker's self-report flags the same; the gate cannot see `cut_frames:[0]` as a scene start, so this row will read N/A for every one-take film.
- The gate's `hero-size` number and my pixel measurement disagree (gate: `S1 39%@f447`, below: none; me: ≈12.0% digit height). The gate's estimator is not documented in its output, so I could not reconcile it and I report both instead of choosing one.
- `number-lint` reports `0 files` — a PASS that means "nothing to lint", not "numbers verified"; any reviewer reading the table alone would mistake it for evidence about the on-screen digits.
- `FILM-GATES.md`'s "Digits LTR" requirement (100% of number tokens with `direction: ltr` or isolate) is in tension with the localization lesson this film implements (Persian numerals must stay RTL-logical or they mirror). The gate row is "to build" so nothing enforces it, but the doc gives no guidance for Persian-numeral-only tokens — a reviewer cannot pass or fail this cleanly.
- No reviewer-side way to run the counter's own formula: the film exposes no numeric state (and `_dbg.mjs` itself returns `no-access`), so counter correctness had to be verified by reading digits out of stills. That worked here, but it made the payoff check purely visual.
- The version folder has no `VERSION.json` and no contact sheet (`sheet*.jpg`/`contact*.jpg`), both of which recon-qc §3 lists as required QC pack items — so the pack is incomplete and `pa deliver` has nothing to read for `outputs[]`/`metrics`.
- Per the review's output rule, my only write is this `review-1.md` (temporary gate logs were deleted after pasting; both still folders already held 13 PNGs per ratio, so no new QC stills were generated, and `film.html`, `lib/` and the mp4s were never touched).

## What I could not check

- **Any audio claim.** The film is silent v1 and both finals have no audio stream, so loudness, true peak, SFX-to-picture within 1 frame, audio continuity, loop seam and every cue-offset claim are **not run / blocked**, not passed.
- **VERSION.json claims.** The file does not exist, so I could not re-check source path, ratios, `outputs[].sha256/size`, `metrics.gates` or `verify{}` against the measured run — they are unclaimable rather than wrong.
- **Font identity by metadata.** I confirmed a valid WOFF2 at the declared path, `@font-face` with variable weights, `document.fonts.load` gating and Vazirmatn-consistent rendered letterforms; I could not decompress the name table to read the internal family name, so "it is Vazirmatn and not a fallback" rests on those four pieces of evidence rather than on a font dump.
- **Contrast numerically.** No WCAG contrast tool exists in the toolset (`Contrast` is "to build" in FILM-GATES); my contrast statements are by eye (white on navy reads strong; `ثانیه` over blooms/figure is the weak case).
- **Mid-film motion quality.** The 13 stills per ratio sample the states; I did not decode and watch all 600 frames of both mp4s, so smoothness, any transient stutter at the 300-frame concat seam (`_seg-*-a`/`-b` join at f299/f300), and micro-jitter are unverified. The concat seam in particular is a plausible artefact I could not see in stills.
- **The 5th/6th stills I did not open** (`t2_20s_f066`, `t4_50s_f135`, `t6_50s_f195`, `t12_50s_f375`, `t17_00s_f510`, `t18_50s_f555`, `t19_00s_f570`) — their counter values are inferred from the same formula, not read.
- **Deliver/compress behaviour.** I did not run `pa deliver`, `pa compress` or TV-check, so the actual post-compress size, SSIM outcome and TV-safe pixel status of the finals are unknown (the worker's self-report claims tv-check fails silent mp4s on audio tags, which I did not reproduce).
