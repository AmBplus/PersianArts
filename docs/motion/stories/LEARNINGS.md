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
- minutes used (pa time) / budget 25: about 14 of 25 at deliver (env 0.8, treatment 0.8, build 2.4, capture 3.8 (plus two re-captures of 104 s each), sound 7.1, qc 12.1, deliver 13.4)
- run-gates result: edge-touch FAIL (maze walls and light rays are full-bleed scenery, 145/212 frames), empty-band FAIL only 2 frames at the flood onset (35%; was 22 frames at 50% until sun rays were added to the flat flood), dead-frames PASS, number-lint PASS, logo-colour skipped (--no-logo), hero-size INFO
- pa audio-check (payoff offsets ms, LUFS, clipping): PASS 19.6 s, -14.4 LUFS, TP -2.5, tail -96.9 dBFS, max simultaneous 3, offsets 0.0 ms (events derived from the same keyframes that drive the picture)
- pa pacing ranges: with --cuts events.json --track tr-house-vibez: tempo 122 ok, energy arc ok, cuts on beat 0% / bar 0% = false alarm (one continuous camera, cut list is only camera moves), build too slow / hold long = detector counts a single 18 s scene
- transition strip viewed (jumps?): yes, every 3 frames around the bonk (8.4 s), gate slide (12.8 s), lock/door (15.7-17.5 s) and the flood + copy (17.6-19.7 s); the key stays centred and continuous across camera zooms (camera = key position 0.6 beats earlier); no jumps
- what the skill/tool lacked (expected: no camera helper; no path-follow helper; no squash/stretch helper; seeded RNG helper missing): all four confirmed and built; also missing: seeded maze + solver + dead-end finder, a deterministic seed search (done offline with a vm script), `pa time mark env` (phase list has no env), audio-check --events (flag does not exist), build_sound auto-whoosh at every cut_frame (camera moves are not cuts: pass cut_frames [0]), a scenery switch for edge-touch, heredoc with triple quotes through the bash tool breaks (use the Write tool for film files)
- fix made at the source (file): work/persian/htmlfilm/lib/pa-camera.js (keys, pathFollow with tangent, camera, hop squash-stretch, persistent actor), lib/pa-maze.js (maze, solve, branch), lib/pa-selftest.mjs (node self-test, PASS), pa-motion.js made node-loadable; docs/motion/portable.json own_films; skill 2.10
- new lesson id (L-###): L-087 (no camera/path/maze lib), L-088 (flat end flood fails empty-band, add light rays), L-089 (build_sound auto whoosh on camera moves), L-090 (pacing/edge-touch false alarms on one-take camera films), L-091 (pa time phases lack env / audio-check lacks --events)

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
- minutes used (pa time) / budget 25: about 13.5 of 25 at the end of the tool fixes (treatment 2.4, build 3.3, capture 4.9, sound 6.8, qc 8.9, deliver 10.1, fix 11.6); film delivered at 10.1 min
- run-gates result: edge-touch FAIL on full-bleed sky/hills (now N/A with the new --scenery switch / VERSION.json scenery:true), empty-band FAIL 62 frames in the first capture (clear sky, fixed by guaranteed clouds in the opening view, then PASS worst 16%), dead-frames PASS, number-lint PASS, logo-colour skipped
- pa audio-check (payoff offsets ms, LUFS, clipping): PASS 20.3 s, -14.4 LUFS, TP -1.8, tail -78.8 dBFS, max simultaneous 3; cue offsets 0.0 ms; --events: 9 of 9 events on the beat grid within 5 ms; warns RMS +6.9 dB at 9-10 s (build then drop) and -3.2 dB after
- pa pacing ranges: --cuts events.json --track tr-miromax-promo-513944: tempo 118 ok; visual speed after/before the drop = 3.92x (mean frame diff 0.99 -> 3.89, acceptance > 1.5); detector put the drop at 9.96 s (0.2 s early: dim + flash ramp); cuts on beat/bar are not meaningful for this film (new --one-take mode)
- DROP: pa music-drop tr-miromax-promo-513944 = bar 8, grid 16.4298 s, strongest hit 16.4223 s (-7.5 ms). Bed starts 3 bars in (--t0 -6.1017) so the drop lands on film beat 20 = 10.1695 s = frame 305 (-2.8 ms); cue vs contact offset table 0.0 ms. The kit drop itself is soft (bed RMS +2.6 dB at the drop): the audible weight comes from the added kick + sub boom
- transition strip viewed (jumps?): yes, every 3 frames at the gust (5.0 s), the drop (9.9-10.4 s: dim, flash, kite shoots up, camera follows), the snap (17.5-18.2 s) and the ending; no jumps, kite continuous
- what the skill/tool lacked (expected: no follow-through/chain helper, no beat-grid lookup from a music excerpt, no tool to find the drop): all confirmed. Built: lib/pa-chain.js (chain + integrate), pa music-drop. Also: edge-touch scenery switch, pacing one-take mode, pa time phase env, audio-check --events (all four open items from S03 fixed with tests in work/persian/tools/test_s07_fixes.py)
- fix made at the source (file): work/persian/htmlfilm/lib/pa-chain.js (+ selftest), work/persian/tools/audio/music_drop.py (+ pa music-drop), gates/run-gates.mjs (--scenery), pacing/pacing.py (--one-take), audio/audio_check.py (--events), timing/time.mjs (env), test_s07_fixes.py, skill 2.11
- new lesson id (L-###): L-092 (clear sky fails empty-band), L-093 (no drop finder: fixed), L-094 (edge-touch scenery switch: fixed), L-095 (pacing one-take: fixed), L-096 (time env + audio-check --events: fixed), L-097 (kit drops are soft: open)

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
