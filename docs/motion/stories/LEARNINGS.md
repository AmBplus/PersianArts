# قالب لاگ یادگیری (Learning log)

Fill one block after each story build. Rule: every gap becomes a fix at the source (skill, recipe, lib, gate) plus a line in docs/motion/LESSONS-LEDGER.jsonl.

## S01 استکان چای
- minutes used (pa time) / budget 12:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no spring/keys helper in lib; no loop-seam gate (frame 0 vs last frame diff); steam path generator missing):
- fix made at the source (file):
- new lesson id (L-###):

## S02 فانوس دریایی و کشتی
- minutes used (pa time) / budget 20:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no camera helper (pan/zoom with parallax); no persistent-actor timeline; per-ratio layout table missing; fog without live blur):
- fix made at the source (file):
- new lesson id (L-###):

## S03 کلید و هزارتو
- minutes used (pa time) / budget 18:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no camera helper; no path-follow helper (position on polyline by arc length); no squash/stretch helper; seeded RNG helper missing):
- fix made at the source (file):
- new lesson id (L-###):

## S04 سه رود، یک دریا
- minutes used (pa time) / budget 18:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no equal-peers layout check; no marbling blend helper; per-ratio layout table; no gate for colour-blend contrast):
- fix made at the source (file):
- new lesson id (L-###):

## S05 شهری روی صفحه دفتر
- minutes used (pa time) / budget 20:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no camera/zoom helper; DOM-node budget: capture speed with 100+ nodes; no instancing helper; no scale-aware stroke width):
- fix made at the source (file):
- new lesson id (L-###):

## S06 ساعتی که به صفر نمی‌رسد
- minutes used (pa time) / budget 12: about 10.5 of 15 (studio pass; treatment 1.4, build 3.5, capture 3.9-8.1, sound 8.1, qc 9.0, deliver 9.3 min marks)
- run-gates result: edge-touch PASS, empty-band PASS (worst 25%), dead-frames PASS, number-lint PASS, logo-colour FAIL = false positive (the film has no logo; gate has no "no logo" scope switch), hero-size INFO 46%
- pa audio-check (payoff offsets ms, LUFS, clipping): PASS 16.2 s, -14.4 LUFS, TP -2.0, tail -96.3 dBFS (tail rule not meaningful for a loop), max simultaneous 2, cue offsets 0.0 ms; warns "RMS step 9.6 dB 0-1 s" = bed fade-in
- pa pacing ranges: advisory only: cuts on bar downbeat 0% ("not bar-locked": false alarm, the film has no cuts, only lap resets at beats 12/20/28; detector found scene changes at 5.88/10.04/15.83 s = colour changes), loudness arc -17.4/-17.2/-18.2
- transition strip viewed (jumps?): yes on the silent mp4 (frames 0-2, 177-185, 300-308, 414-422, 485-487) and a still of the copy at 14.7 s; no jumps; resets are ring ripples + colour cross-blends; video loop seam: mean abs luma diff frame 0 vs frame 487 = 0.55% (<2%); audio loop seam: first 0.5 s vs last 0.5 s RMS diff 1.3 dB (<1.5) but this is partly luck: the builder fades the bed in 0.4 s and out 0.6 s, so the last bar does not truly resolve into the first
- what the skill/tool lacked: no Persian digit/tick helper (wrote lib/pa-motion.js); no loop-seam gate for video or audio (measured by hand); build_sound.py has no loop mode (bed fade-in/out, tail logic, settle-final fade); pa deliver track skipped the film until it was added to docs/motion/portable.json own_films; logo-colour gate fails on films without a logo; pacing assumes cuts; capture PNG ~3 min for 488 frames
- fix made at the source (file): work/persian/htmlfilm/lib/pa-motion.js (faDigits, ltr isolate, mulberry32 rng, spring/ease, beats clock, tick sched, loopBlend); docs/motion/portable.json (own_films += s06-clock-never-zero); remaining: loop mode in build_sound.py, loop-seam gate, logo-colour no-logo switch
- new lesson id (L-###): L-075 (no loop-seam gate), L-076 (build_sound.py has no loop mode), L-077 (logo-colour false positive without logo)

## S07 بادبادک و باد
- minutes used (pa time) / budget 18:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no follow-through/chain helper; no beat-grid lookup from a music excerpt; no pa tool to find the drop time in a kit track):
- fix made at the source (file):
- new lesson id (L-###):

## S08 جشن فانوس‌های عددی
- minutes used (pa time) / budget 18:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no counter/odometer in lib (only inline in pencil); no real-scale legend helper; number-lint rules for fictional data; DOM count):
- fix made at the source (file):
- new lesson id (L-###):

## S09 نامه‌ای که پرنده شد
- minutes used (pa time) / budget 20:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no path-morph helper; right-to-left reveal clip may cut glyph overhangs; font fallback risk in capture; no text-to-path outline tool):
- fix made at the source (file):
- new lesson id (L-###):

## S10 میز کارگاه، قبل و بعد
- minutes used (pa time) / budget 16:
- run-gates result:
- pa audio-check (payoff offsets ms, LUFS, clipping):
- pa pacing ranges:
- transition strip viewed (jumps?):
- what the skill/tool lacked (expected: no spring helper (overshoot); per-ratio layout table; no gate for equal peer sizing; tool rig helper):
- fix made at the source (file):
- new lesson id (L-###):
