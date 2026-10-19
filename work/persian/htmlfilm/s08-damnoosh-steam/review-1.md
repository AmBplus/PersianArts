# QC Review — s08-damnoosh-steam (v1)

Independent reviewer. Repo D:\P\project\persianArts. No git, no edits to film.html or lib/. All numbers below are from commands I ran myself in this session; the worker self-report at `media/briefs-local/storylab-batch2/results/s08-damnoosh-steam.json` was read only as a list of claims.

## Verdict

**FIX** — bounded, one round. The picture is competent and Persian-clean, but two gates FAIL with **true** (not false-alarm) causes in both ratios: `empty-band` (9:16 worst 40% of frame height dead, 90/164 sampled frames; 16:9 worst 62%, 84/164) and a 16:9-specific framing error where the hero glass is cut by the bottom frame edge (f108–f120, edge-touch bbox 800,748→1468,1076). Gate exit code is 1 on both ratios, which FILM-GATES treats as blocking; score 74 < the 85 approval line.

## Score (0-100) and breakdown (story 19/25, Persian typography 18/20, per-ratio layout 12/20, motion craft 11/15, goal delivery 14/20) = **74**

Evidence per component is under the matching section below. Motion craft is the weakest-evidenced score: I judged it from gate-sampled frames + stills, not from a full-length watch (see "What I could not check").

## Gates (raw output, both ratios, plus your reading of it)

Command A (9:16), verbatim:

```
node work/persian/tools/gates/run-gates.mjs media/film-versions/s08-damnoosh-steam/v1/silent-9x16.mp4 --src work/persian/htmlfilm/s08-damnoosh-steam --events work/persian/htmlfilm/s08-damnoosh-steam/events.json --one-take --no-logo
logo-colour gate skipped (no brand asset)
# run-gates silent-9x16.mp4  1080x1920 (portrait)  frames=450  sampled=164  scenes=1
edge-touch           | FAIL | 26/164 sampled frames; frames 0-24, 63-87, 418; e.g. f0 right bbox 980,1596,1076,1692
empty-band           | FAIL | 90 frames > 30%; frames 186-189, 195-264, 270-339, 345-414, 420-447; worst f345 40% (y 60-100%)
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | 9:16 target >= 12%; below: none; S1 59%@f417
[exit code: 1]
```

Command B (16:9), verbatim:

```
node work/persian/tools/gates/run-gates.mjs media/film-versions/s08-damnoosh-steam/v1/silent-16x9.mp4 --src work/persian/htmlfilm/s08-damnoosh-steam --events work/persian/htmlfilm/s08-damnoosh-steam/events.json --one-take --no-logo
logo-colour gate skipped (no brand asset)
# run-gates silent-16x9.mp4  1920x1080  frames=450  sampled=164  scenes=1
edge-touch           | FAIL | 8/164 sampled frames; frames 69-78, 108-114, 120; e.g. f69 right bbox 1680,404,1916,464
empty-band           | FAIL | 84 frames > 30%; frames 24, 30, 111-114, 120-147, 207, 213, 243, 261-264, 270-339, 345-447; worst f114 62% (y 0-62%)
dead-frames          | PASS | 1 scene starts checked (window start-2..start+10)
duplicate-template   | N/A  | needs scene starts (events.json)
number-lint          | PASS | 0 files; no un-isolated number runs
hero-size (estimate) | INFO | target 12% applies to 9:16 only; S1 59%@f189
[exit code: 1]
```

My reading, hit by hit, checked against generated frames rather than taken on trust:

- `empty-band` 9:16 — **TRUE defect.** detail.empty shows a single band from 0.60–1.00 of frame height (share 0.35–0.40) for frames 186–447. My still `_qc_stills_9x16/t11_50s_f345.png` (worst frame f345) shows the reason: below the desk line the frame is a flat wood floor with faint streaks, ~40% of the picture, moving nothing. The header comment claims the grain prevents exactly this (L-088/L-092/L-101); the grain is there but is not motion and not structure, so it does not clear the gate.
- `empty-band` 16:9 — **TRUE defect, worse.** detail.empty worst f114 share 0.62 from y 0 to 0.62. My still `_qc_stills_16x9/t3_80s_f114.png` shows the top ~60% as near-empty wall with dust specks while the entire subject (glass, pour) is jammed into the bottom-right corner and cut by the bottom edge.
- `edge-touch` 9:16 — **mostly false alarm, minor true hit.** The 26 hits are the static desk dressing at the right/left edges (f0–f24 right bbox 980,1596,1076,1692 = the paper note; f63–f87 left bbox 0,~1000→370,~1500 = the book/knife block). Visible in `_stills/t0_05s_f002.png` (light paper wedge sliced by the right edge) and `_stills/t14_40s_f432.png` (same wedge). No *text* touches any margin in any still I looked at, so this is set decoration on a full-bleed stage, i.e. the S03/L-090 class; it still costs frames because nothing is declared `scenery` in a VERSION.json (none exists).
- `edge-touch` 16:9 — **TRUE defect.** f108–f120 bottom bbox 800,748→1468,1076 is the hero glass running out of the bottom of the frame during the pour; f69–f78 right edge is a warm bokeh puff crossing the edge (cosmetic, atmospheric; seen as round blobs at x≈1680–1916 in my `_qc_stills_16x9/t2_30s_f069.png`, which also shows the tin cut by the left frame edge with the label plate sliced).
- `dead-frames` PASS, `number-lint` PASS (0 un-isolated number runs), `hero-size` INFO 59% (≈4.9× the 12% bar) — accepted, with one caveat: number-lint reports "0 files", i.e. it linted nothing in the source; the PASS is an absence of evidence, not a measurement. I therefore checked the digits by eye instead (below).
- `duplicate-template` N/A even though I passed `--events` with `cut_frames [0]`. One html = one scene, so the gate cannot run on this film type. FILM-GATES/A-3 says N/A is blocking and never a pass. That is a **tooling limitation, not a defect of the film**, but it does mean this row can never be closed for a one-take film.

## Stills reviewed (one line per image, and the file path)

Nine stills per ratio already existed in the version folder; I looked at 8 of the 9:16 set, 4 of the 16:9 set and 7 more frames I generated myself with `capture.mjs` (port 9610/9611/9612, dirs `_qc_stills_9x16`, `_qc_stills_16x9`).

1. `media/film-versions/s08-damnoosh-steam/v1/_stills/t0_05s_f002.png` — 9:16 macro on the closed tin; the cream label plate fills the middle with «دمنوش آرام» (bold) over «گیاهان آرامبخش», green sprig over the text; legible, high contrast; tin body and base cut by left/right/bottom edges (full-bleed macro, intentional); a paper note is sliced by the right edge (the f0 gate hit); no copy overlay.
2. `.../v1/_stills/t3_15s_f095.png` — 9:16 pour; glass lower-left with a bright water line, tin at right with its label cut by the right frame edge («آرام» reaches the edge, «دمنوش» is off-frame), warm mist; legible where present; the label being sliced is the 16:9-style framing mistake appearing in a 9:16 frame too.
3. `.../v1/_stills/t6_30s_f189.png` — 9:16 pushed-in wide: tin right-of-centre, glass left, wall stripes + dust, a large soft bokeh disc behind the glass; no text; nothing touches an edge; bottom ~35% is floor.
4. `.../v1/_stills/t8_60s_f258.png` — 9:16 wide with the pendant lamp and light pool visible, tin centre-right, glass left; no text; large empty dark areas top and bottom; the same composition family as #3 and #5 (see states).
5. `.../v1/_stills/t11_00s_f330.png` — 9:16 with the support line «دمنوش آرام: ۶۰ ثانیه وقت میخواهد تا شب آرام شود.» in the top band; legible, correct RTL order, «۶۰» renders as Persian ۶/۰ inside the isolate; **no** edge touch; the bottom ~40% is bare floor.
6. `.../v1/_stills/t14_40s_f432.png` — 9:16 finale: headline «یک فنجان، تمام خستگیِ امروز» (izafe kasre visible under گ) with a full-width rule under it, CTA «همین حالا امتحان کن» in ochre below; legible; the tin is the hero and holds its label; nothing touches an edge horizontally, the paper wedge still sits on the right edge lower down.
7. `.../_qc_stills_9x16/t11_50s_f345.png` — 9:16, gate's worst empty-band frame; identical copy block to #5 over a 40%-tall flat floor; confirms the FAIL by eye.
8. `.../_qc_stills_9x16/crop_support_9x16.png` — crop of the support line at 1:1: «دمنوش آرام: ۶۰ ثانیه وقت میخواهد تا شب آرام شود.» — joins intact, ZWNJ gap in «میخواهد» preserved, colon sits at the left end of «آرام» (correct RTL), Persian numerals, no stray bidi boxes.
9. `.../_qc_stills_9x16/crop_headline_9x16.png` — 1:1 crop of the headline: «یک فنجان، تمام خستگیِ امروز» + rule + CTA; letterforms clean, kasre present, no clipped ink; the rule starts clear of the tin.
10. `.../_qc_stills_9x16/crop_label_9x16.png` — 1:1 crop of the tin label: «دمنوش آرام» / «گیاهان آرامبخش» in Vazirmatn Bold on the ruled cream plate; joins and the sprig overlap are clean; slight grain overlay on the plate, no legibility loss.
11. `.../v1/_stills-16x9/t0_05s_f002.png` — 16:9 macro on the tin, centred and cropped top/bottom (designed macro, not a 9:16 crop); label legible; nothing horizontal touches an edge.
12. `.../v1/_stills-16x9/t6_30s_f189.png` — 16:9 wide: tin hard left, glass right, big empty wall above and a floor band below; no text; nothing touches an edge.
13. `.../v1/_stills-16x9/t14_40s_f432.png` — 16:9 finale: headline + rule + CTA sit in the top ~30% and the **headline and the rule run across the tin** (the tin is behind «تمام خستگی» and the rule crosses its upper body); copy block is right-of-centre, not centred on the 1920 frame; the bottom third is empty floor. This is a designed re-composition (tin left / cup right — the mirror of the 9:16 finals), so **the 16:9 is not a crop of the 9:16**; but the copy/product collision is not a designed overlap, it reads as an accident.
14. `.../_qc_stills_16x9/t3_80s_f114.png` — 16:9, gate's worst empty-band frame: top 62% empty wall, glass cut by the bottom frame edge at bottom-right; both gate FAILs visible in one frame.
15. `.../_qc_stills_16x9/crop_headline_16x9.png` — 1:1 crop of the 16:9 headline: same string, same letterforms; the kasre under «خستگی» is present but low-contrast against the tin body behind it (the word sits over the product).
16. `.../_qc_stills_16x9/t2_30s_f069.png` — 16:9 at the gate's f69 hit: round warm bokeh puffs sliced by the right edge (the edge-touch hit), the tin cut by the left edge with its label plate sliced (text itself is clear of the edge).

## Persian typography findings

Verified on 1:1 crops, not on the claim in the header.

- **Letter joins: intact.** In `crop_support_9x16.png` «دمنوش», «آرام», «ثانیه», «وقت», «خواهد», «شود» and in `crop_headline_9x16.png` «فنجان،»، «تمام»، «خستگی»، «امروز» all show continuous, correctly connected forms; nothing looks like per-character splitting or letter-spacing damage (the two classic failures in `docs/PERSIAN-LOCALIZATION-LESSONS.md`).
- **ZWNJ preserved.** «میخواهد» keeps the half-space (visible gap, no join); the label's «آرامبخش» likewise. No ZWNJ rendered as a box or as a break.
- **Numerals: Persian, and the digit run is a real isolate.** The only digit token is «۶۰», rendered with Persian ۶ and ۰ (not Latin 60), inside `\u2066…\u2069` per the source (`const iso = s => "\u2066" + s + "\u2069"`, `iso(faDigits(60))`). Direction is correct: the run sits between «دمنوش آرام:» and «ثانیه» with the phrase continuing right-to-left, and no control characters leaked into the raster (the source deliberately builds the isolate from characters, and the crop shows no stray box).
- **RTL order and punctuation: correct.** The colon after «آرام» lands on the left end of that word, the comma after «فنجان» sits on its left, and the line begins at the right. No mirroring errors; no reversed words.
- **Font is Vazirmatn, not a system fallback.** Evidence: (a) the only family declared for every text role is `PAHead` → `fonts/Vazirmatn-Variable.woff2` (111,128 bytes, present in the film folder) and every `ctx.font` call goes through `FONT()` which names only `PAHead`; (b) `Promise.all([document.fonts.load("800 40px PAHead"), …])` gates the start, and both captures completed, so the face resolved; (c) the rendered letterforms are Vazirmatn's, not a fallback's — closed round dots, the flat-barred ک/گ, the descender form of ی, and the same shapes recurring identically on the tin label («دمنوش آرام» label at 0.05 s) and in the headline at 14.4 s. A silent fallback to a system serif/sans (Times/Iranian Sans/Tahoma-class) would change dot shape and the آ madda, and would not have produced the Persian-extended «۶۰» pair consistently at both type sizes.
- **Two small typographic notes, not defects:** the headline's izafe kasre is a very small mark that almost disappears once the word is over the tin body in 16:9 (`crop_headline_16x9.png`); and the support line's «۶۰ ثانیه» sets a 60-second promise inside a 15-second film, which is copy-strategy, not typography, but it is the sentence a viewer is most likely to notice.

## Story and goal findings

From the film.html plan header:

- **GOAL:** sell the herbal-tea tin «دمنوش آرام» to 25–45 urban viewers who are tired in the evening.
- **desiredAction (verbatim):** "remember the brand and open the link in the caption".
- **LOGLINE (verbatim):** "A tired night, one cup, and a steam that lifts the whole day off your shoulders."
- Protagonist is declared as THE STEAM, staged on the tin and the glass cup; scenes COLD → POUR → RISE → BREATHE → STAGE → WARM on a 96 BPM grid; one continuous take, `cut_frames [0]`.

Judgement from the frames:

- **The arc is really there.** The stills walk the declared path: macro on a closed tin in the dark (#1), water hitting the glass (#2), pushed-in steam/warm bokeh (#3), the lamp pool and a clearing desk (#4), the copy/benefit beat (#5), the hero tin with headline + CTA (#6). The camera scale genuinely changes across the film (macro → wide → rest), and the gate's per-frame edge bboxes move frame to frame, so this is motion, not a slideshow.
- **First second vs last second do feel like different moments.** f002 is a tight, cool-ish macro on a closed product with no copy; f432 is a wide, warm, fully lit stage with three copy layers and the tin upright as the hero. The tension→release→warmth shape the brief promises is legible in the frames alone.
- **The payoff is thin.** The "steam lifts the day off your shoulders" idea is delivered as *one* visible pour plus ambient mist; in the stills the steam reads as faint bokeh and thin threads, not as a protagonist with a beginning, a burst and a settle. The last three seconds are a held wide with type over it — a correct product-ad ending, but the emotional release is asserted by the headline rather than shown. The tin never gets a human hand, a cup that is drunk from, or any before/after of the tired viewer, so "remember the brand" is carried entirely by repetition of the label.
- **The CTA is present and held.** «همین حالا امتحان کن» enters at 12.25 s and is still on screen at 14.4 s, on brand colour, legible. The declared action is "open the link in the caption"; that is a caption-dependent CTA and this silent cut has no handle/@ or link line on screen, so the on-screen action is only implicit. Acceptable for a caption-driven ad, but it is the weakest link in goal delivery and it is why goal delivery is 14/20 rather than higher.

## One-world finale

**Yes — the finale is the same film.** It reuses (a) the palette: the same amber/ochre `#e0a144/#f0c063` family for the CTA and rule, the same deep brown night `#171009/#2a1a0e` wall, the same cream `#fff3dc` for the headline and label plate, and no blue anywhere in any still I looked at; (b) the background family: the same wall with the same vertical stripes/line, the same desk with the same floor streaks and the same pendant lamp seen at f258 and f330/f432 (16:9 keeps the same set, just wider); (c) the typography: the identical `PAHead`/Vazirmatn face at 700/800 weights, so the finale's «یک فنجان، تمام خستگیِ امروز» is the same voice as the tin label at 0.05 s. Nothing in the finale introduces a new set, a new colour, a new typeface or a new graphic language. The one thing I would flag inside this otherwise-consistent world is the 16:9 finale's copy-over-product collision (#13) — same world, careless blocking.

## Distinct visual states (count + names)

**6 visibly distinct states** (counting a state only when a viewer could tell the picture changed):

1. **COLD macro** — closed tin filling the frame, label plate dominant (f002).
2. **POUR** — water line into the glass, tin at the side, mist at the rim (f095 9:16, f114 16:9).
3. **PUSHED-IN wide / warm bokeh** — glass left, tin right, disc-shaped bokeh behind the glass, wall stripes (f189).
4. **WIDE with lamp pool** — pendant lamp and light pool in frame, desk clearing (f258).
5. **STAGE medium + support line** — same medium framing as 3/4 with «دمنوش آرام: ۶۰ ثانیه…» in the top band (f330/f345).
6. **WARM finale wide + headline/rule/CTA** — camera at rest, tin hero, three copy layers (f360/f432).

Anti-slideshow: **passes on count but with a caveat.** 6 states in 15 s is comfortable for a product ad, and the camera never freezes between them. The caveat: states 3, 4 and 5 share one blocking (product mid-frame, wall stripe background, floor below) and differ mainly in scale and in whether copy is present, so a viewer may perceive **4 real beats, not 6** — and the last 3 s hold state 6 without a change, which is exactly the region where both `empty-band` FAILs peak.

## Defects found (what | severity | class | file that would have to change)

1. Bottom band with no motion or structure: 9:16 40% of frame height dead for frames 186–447; 16:9 62% dead at f114 (empty-band FAIL, both ratios) | **high** | systematic (composition/art direction, not a slip) | `work/persian/htmlfilm/s08-damnoosh-steam/film.html` — 16:9 needs its own floor/desk treatment and a foreground element in the lower band; the grain in the current build is not motion and does not clear the gate.
2. In 16:9 the hero glass runs out of the bottom frame edge during the pour (f108–f120, bbox 800,748→1468,1076) and the tin is sliced by the left edge at f69 (label plate cut; text itself survives) | **high** | misunderstanding (the 16:9 camera keys were derived from the 9:16 blocking without re-checking the frame edges) | `film.html` — the `LAYOUT["16x9"].cam` cy keys and/or `cup`/`tin` positions.
3. Static desk dressing is permanently sliced by the frame edge: paper note at the right edge, frames 0–24 and f418 (9:16 bbox 980,1596,1076,1692; right bbox 920,1228,1076,1336) and the left-edge book/knife block at f63–f87 | **low** | accidental | `film.html` (move the prop out of the edge, or declare `scenery` and record it in a VERSION.json `metrics.gates` entry, which is what FIX-2.10/2.11 asks for and what is missing here).
4. In the 16:9 finale the headline and the rule draw across the tin (word «خستگی» over the product body, rule over the tin's upper body) and the copy block is off-centre to the right of a 1920-wide frame | **medium** | accidental | `film.html` — `LAYOUT["16x9"].c1/c2/c3/rule` x positions.
5. The steam — the declared protagonist — reads as faint bokeh/threads rather than a legible actor with a burst and a settle, so the logline's "lifts the whole day off your shoulders" is carried by the headline instead of the picture | **medium** | systematic (art direction / effects density) | `film.html` (steam/`mistK`, puff alpha and count).
6. On-screen CTA depends on a caption that is not part of this deliverable (no link line, no handle in frame) while the declared desiredAction is "open the link in the caption" | **low** | rule-conflict (silent v1 + caption-channel ad) | copy decision, not a code fix; note it in the version notes rather than change the film.
7. `number-lint` PASS is vacuous for this film (the gate reports "0 files", i.e. it linted no source). The film itself is clean on digits (I checked «۶۰» by eye), but the PASS cannot be counted as evidence | **low** | rule-conflict / tooling | `work/persian/tools/gates/number-lint.mjs` (not mine to change).
8. `duplicate-template` returns N/A on a film whose `events.json` I passed explicitly (`cut_frames [0]`) — `sceneStarts()` yields 1 for a one-html film, so the row can never be closed | **low** (process, not picture) | rule-conflict | `work/persian/tools/gates/duplicate-template.mjs` and/or the FILM-GATES applicability table.

## System friction I hit as a reviewer (what the tooling/docs made hard for an INDEPENDENT reviewer)

- **`duplicate-template` is unclosable on one-take films.** I passed `--events …/events.json` containing `cut_frames: [0]` and still got `N/A needs scene starts (events.json)`. FILM-GATES says an N/A is blocking and never a pass, so a legitimate delivery can never satisfy the full table. The worker's report claimed the same thing; I reproduced it. Either the gate should print "not applicable: single-scene film" (a statement, not an N/A) or the doc must say the row is out of scope for one html = one scene.
- **`--one-take` is accepted silently and changes nothing in the output.** There is no line telling me the flag was understood, and with no `VERSION.json` in the version folder I could not confirm `scenery:true`/`logo:false` either — so I cannot distinguish "the flag worked" from "the flag was ignored", which is exactly the ambiguity a reviewer must not have.
- **No `VERSION.json` in `media/film-versions/s08-damnoosh-steam/v1/`.** The QC brief tells the reviewer to re-check source path, ratios, `outputs[].sha256/size` and `metrics.gates` against the measured run, and `pa deliver` expects names not matching `final*/social-*-v*` to be listed in `outputs[]` or it dies with `no finals found`. None of that is checkable here. This is the single biggest process gap I hit: I can measure the mp4s, but I cannot verify that what was declared matches what was rendered.
- **The stills can never be gated.** `capture.mjs` writes `t0_05s_f002.png`, and `recon-qc` states stills-folder mode accepts only `/still/i` names containing `f<N>` and exits 2 otherwise. So the stills the reviewer is told to look at are invisible to the gate machinery, and every gate verdict has to go through the mp4 with `--step` sampling (164 of 450 frames here) — which is how a reviewer can miss a 2-frame event between samples.
- **`hero-size` prints `S1 59%@f417` with no legend.** I could not tell what "S1" is (scenario? slot?) from the output or from FILM-GATES; I only know the number clears the 12% bar by a wide margin.
- **No contact sheet** (`sheet*.jpg`/`contact*.jpg`) exists in the version folder, although the brief's evidence pack wants one to attach the visual-review score to frame numbers; I had to build my own mental sheet out of 9 files with names that encode seconds, not frame numbers (`t11_00s_f330` vs `f345` mismatches are easy to make).
- **Two ratio paths, two flag sets.** The mp4 comes from `pa render` (9:16 only, hard-coded) and 16:9 must come from `capture.mjs --out`; the QC brief's gate command has no `--ratio`, so an independent reviewer has to trust the filenames to know which ratio a table belongs to. Adding the probed ratio to the gate header (it prints `1080x1920 (portrait)`, which saved me) is the only reason the output is unambiguous.
- **`--scenery` is the escape hatch for the edge-touch false alarm, but the brief tells me to run `--one-take`.** I ran the exact prescribed command, got FAILs, and had to reason from the bbox coordinates and my own stills to separate the decoration hits from the real one. I did not re-run with `--scenery`, because the prescribed command is the one that must be reported.

## What I could not check

- **Everything audio, because there is no audio track in either mp4** (ffprobe shows exactly one stream, `codec_type=video`; no `aac`/`mp3` stream, so the silent-v1 claim holds). Blocked, and blocking per FILM-GATES, not passed: loudness (I = -14 LUFS), true peak (≤ -1 dBTP), SFX-to-picture alignment within 1 frame, audio continuity across cuts, loop seam (RMS within 1.5 dB, centroid 15%, beat phase 20 ms), music beat-grid error ≤ 15 ms, drop placement vs the track, and every cue-offset claim in `events.json` (the `t_s` values are picture timing only, unverifiable against sound). `events.json` carries `bpm: 96` and `t0_s: 0` for a film with no music, so those fields are declarations, not measurements.
- **Motion quality by eye.** I never watched the 15 s at speed. I judged motion from the gate's 164 sampled frames (bbox/diff behaviour), from the plan's camera key table, and from stills. Easing quality, sweep rhythm, whether the steam ever "bursts", and whether anything flickers or judders between my sample points are **not verified**; the motion-craft score is an inference, and a reviewer who watches the mp4 may move it.
- **Contrast (WCAG AA) numerically.** No contrast gate exists ("to build" in FILM-GATES); I judged legibility by eye on the crops only. The one place I would want a number is the 16:9 headline over the tin body.
- **`VERSION.json` fields** (source path, ratios, `outputs[].sha256/size`, `metrics.gates`, `verify`) — the file does not exist in the version folder, so nothing was compared against the measured run.
- **The worker's claimed friction list** (capture port collisions, 300 s capture limit, throughput numbers, tv-check audio noise) — I did not reproduce those; I only reproduced the `duplicate-template N/A` claim. The `bytes`, `frames`, `fps` and `gates_summary` numbers in `media/briefs-local/storylab-batch2/results/s08-damnoosh-steam.json` do match my independent measurements, so on those points the report is honest.
- **Whether the delivery pipeline accepts this folder** (`pa deliver` / `pa compress`): not run, by instruction, and the missing `VERSION.json` makes me expect `no finals found`; flagging it rather than testing it.

## Measurements recorded for the record

```
=== silent-9x16.mp4 ===
codec_name=h264  profile=High  level=40  width=1080  height=1920  pix_fmt=yuv420p  r_frame_rate=30/1  nb_frames=450
duration=15.000000  size=8252701  bit_rate=4401440
size_MB = 7.87

=== silent-16x9.mp4 ===
codec_name=h264  profile=High  level=40  width=1920  height=1080  pix_fmt=yuv420p  r_frame_rate=30/1  nb_frames=450
duration=15.000000  size=7374770  bit_rate=3933210
size_MB = 7.03
```

Both are **under the ~12 MB per-final guidance** (7.87 MB and 7.03 MB; 4.40 and 3.93 Mbps). H.264 High **level 4.0**, not 4.1 — stricter than the lib rule's `level 4.1 / maxrate 14M`, so no size/level violation to report. No audio stream in either file. I did not re-encode anything.
