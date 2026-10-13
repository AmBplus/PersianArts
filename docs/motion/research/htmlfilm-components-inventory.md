# html-film base components: inventory and decision brief

Question: which base components do we have, which does the html-film lane (one self-documenting `film.html`, `window.film.seek(t)` pure in t, captured by `capture.mjs`) need, and which should be retired?
Scope: read-only inventory by file lists and exports. `work/persian/htmlfilm/**` was read only. Nothing in `media/briefs-local/conference-event` was touched. Not verified in depth: `demos/effects`, `demos/transition` internals, `anidoodle` internals (names only).

## Counts per category

| Category | Source | Count |
|---|---|---|
| (a) Persian kit exports | `work/persian/src/demos/_fa/index.tsx` | 14 exports (FONT_FILES, FaFamily, FaFonts, FaRoot, FA_SIZE, FA_LH, fs, faText, dir, revealFromStart, faDigits, joinedGroups, words, typeOn) |
| (b) Recipes | `docs/motion/recipes/catalog.json` | 22 (11 verified-in-film, 11 candidate) |
| (c) Remotion components | `work/persian/src/film/{social,uni,conference}` | 7 Pen/Ribbon exports, 6 scene-level components per film, Emblem logo, Wipe, ConfFilm + events |
| (d) html-film helpers | `work/persian/htmlfilm/pencil/film.v2.html` (494 lines) | ~24 functions (clamp, prog, lerp, shake, stomp, stampIn, inkPts, loopPts, drawOn, pen, txt, badge, 6 scene fns, cf, render) |
| (e) Tools | `work/persian/tools/` | cues 17, gates 9 (.mjs), ledger 2, render 3, top-level 5 |
| (f) Library | `library/` | 5 entry categories (explainer, mg, onetake, shotcraft, talkcraft), 11 render-spec JSON, 11 data files, 1 typography effects file; `assets/` is build output, not source |
| (g) Schemas, themes, contracts | `plugins/persianarts-motion`, `contracts/` | 1 theme, 6 plugin schemas, 5 contract schemas, 9 stage docs, 8 craft techniques, 4 Persian refs, 4 tools |

## Component table (html-film lane)

Status: INLINE-ONLY (keep inside one film), PORT-TO-LIB (move to `work/persian/htmlfilm/lib/`), NOT NEEDED, NEEDS-NEW (does not exist yet for html).

| Component / helper | Where | What it does | html-film status | Why | Effort |
|---|---|---|---|---|---|
| clamp, prog, lerp | film.v2.html:98-100; social & uni motion.ts:46-48 | time and interpolation utilities | PORT-TO-LIB | proven in pencil v2 | S |
| easing: outExpo, outBack, outCubic, inOutSine, inExpo | motion.ts:51-57; recipe R-kit-easing (long/v4/kit.ts) | one easing module | PORT-TO-LIB | recipe verified; film.v2 uses outExpo at line 249 (definition not located in my grep, verify) | S |
| spring | none | physically based ease | NEEDS-NEW | not present in any html or Remotion file I read | S |
| shake | film.v2.html:109; motion.ts:60 | decaying shake | PORT-TO-LIB | used in pencil | S |
| stomp, stampIn | film.v2.html:114,118 | word stamp-in | PORT-TO-LIB | used in pencil | S |
| inkPts, loopPts, tipAt, vnoise | film.v2.html:126-148 | ink line point generation | PORT-TO-LIB | prerequisite of drawOn | S |
| drawOn (variable-width ribbon) | film.v2.html:149; social Pen.tsx Ribbon:105, nib:96 | draw-on stroke as filled tapered path | PORT-TO-LIB | proven in pencil v2; the React Ribbon is superseded | M |
| pen() hand-with-pen | film.v2.html:183; social Pen.tsx:21 | pen character | INLINE-ONLY | story-specific; generic parts go to the rig | - |
| txt, badge | film.v2.html:204,207 | text box and number badge | PORT-TO-LIB | used in pencil | S |
| faText (no letter-spacing, RTL, size) | _fa index.tsx:71 | Persian text style | PORT-TO-LIB | CSS rule, trivial to port | S |
| FA_SIZE, FA_LH, fs | _fa index.tsx:66-68 | Persian size compensation | PORT-TO-LIB | one constant | S |
| FONT_FILES, FaFamily | _fa index.tsx:12,38 | font map | PORT-TO-LIB | the lib needs font loading, not the map | S |
| FaFonts (delayRender) | _fa index.tsx:50 | blocks frame until font ready | NOT NEEDED | Remotion API; html replaces it with `await document.fonts.load()` before `window.film.ready` | S |
| FaRoot | _fa index.tsx:59 | RTL root div | NOT NEEDED as component | replaced by a root CSS block | S |
| revealFromStart (inset clip) | _fa index.tsx:83 | left-to-right clip reveal | PORT-TO-LIB with caution | clip box may cut overhanging glyph edges; the right-to-left word reveal must be tested | M |
| words | _fa index.tsx:105 | split on whitespace | PORT-TO-LIB | word is the unit (per recipe R-kit-word-mask-fit) | S |
| joinedGroups | _fa index.tsx:93 | group joined letters | PORT-TO-LIB | needed to avoid splitting joined letters | S |
| typeOn (character typing) | _fa index.tsx:108 | types text character by character | NOT NEEDED | cuts joins; word-level reveal instead | - |
| faDigits | _fa index.tsx:87; pencil inlines digits at 268 | Persian digits | PORT-TO-LIB | pencil already needs it | S |
| counter (flip / odometer) | film.v2.html:245-271; recipe R-flip-board-counters; data/odometer-digit-roll | digit roll | PORT-TO-LIB | proven in pencil | S |
| ring-pulse | film.v2.html:353, 402 | expanding ring | PORT-TO-LIB | used in pencil | S |
| Wipe | social/scenes.tsx:340 | colour wipe between scenes | PORT-TO-LIB | pencil has its own wipe (progress: fix4 done) | S |
| Emblem logo loader | uni/Logo.tsx:68; recipe R-logo-layered-svg | layered SVG logo, built with motion | PORT-TO-LIB (rewrite) | loads layers at render time; html needs a transparent loader with own colours | M |
| cut table / cf() | film.v2.html:422; social/motion.ts:35-38 | scene frame table | INLINE-ONLY | pattern is fine, but keep it per film | - |
| Remotion motion scaffolding (useSceneFrame, TEMPO, AUDIO_SRC) | social & uni motion.ts | React frame hooks | NOT NEEDED | html uses `seek(t)` only | - |
| safe-zone / slot per ratio | film.v2.html:92 slot(); social & uni layout.ts; conference SIZES | layout boxes per aspect | NEEDS-NEW (generalise slot) | slot exists in pencil; per-ratio table is new | S |
| parallax / camera | recipe R-parallax-journey, R-iwan-push-through; demos/camera/* | depth moves | NEEDS-NEW | no html version; source is React | M |
| persistent actor/world timeline | none | one world over continuous scenes | NEEDS-NEW | required for continuous scenes; no source | L |
| simple SVG character rig (groups, pivots, bob, look, blink) | pen() is closest; social Pen.tsx | body parts as groups | NEEDS-NEW | no rig exists; NOT facial expression sets | M |
| circuit / binary background generators | not located in my inventory | background art | NEEDS-NEW (unverified) | I did not find them; check demos/effects before building | M |
| shape-transition recipes (circle-match-iris, line-carry, hidden-cut) | recipe candidates; demos/transition/* | transitions | NEEDS-NEW | candidate status only | M |
| gates (dead-frames, edge-touch, empty-band, hero-size, number-lint, logo-colour, duplicate-template) | tools/gates/*.mjs | QC checks on rendered frames | PORT-TO-LIB (as QC, not in film) | check against film.seek frames | M |
| Persian lint and shaping (lint_fa.py, shape_persian.py, split_fa.js) | plugins/persianarts-motion/.../tools | text QC | PORT-TO-LIB (as QC) | keep as checker, not runtime | S |
| conference ConfFilm + events.ts | src/film/conference | Remotion event film | NOT NEEDED | separate lane | - |
| library entries and render-specs | library/entries, render-specs | Remotion templates | NOT NEEDED | Remotion-era; keep as history | - |
| film.html (v1, 428 lines) | htmlfilm/pencil/film.html | superseded | NOT NEEDED | v2 replaces it | - |

## Proposed `work/persian/htmlfilm/lib/` API (25 items)

Proven in pencil v2 unless marked NEW.

1. `clamp(v, a=0, b=1)` (proven)
2. `span(t, start, dur)` -> 0..1, seconds (proven as prog)
3. `lerp(a, b, u)` (proven)
4. `ease.outExpo(u)`, `ease.outBack(u)`, `ease.outCubic(u)`, `ease.inOutSine(u)` (proven in recipe; partly proven in pencil)
5. `spring(t, {from, to, k, c})` (NEW)
6. `keys(t, [[t0, v0], ...], ease?)` (NEW)
7. `shake(t, at, amp, len=0.33)` (proven)
8. `stampIn(t, at, from=1.9)` (proven)
9. `drawOn(pts, u, {width, color, bad})` -> SVG path d (proven)
10. `inkPts(x0, x1, y, amp, waves, jag, seed, n)` (proven)
11. `counter(t, from, to, start, dur, fmt)` (proven)
12. `faDigits(v)` (proven)
13. `ltr(text)` -> wrap in U+2066/U+2069 isolate (proven in pencil digits/URL use)
14. `revealWords(words, u, dir='rtl')` -> per-word opacity/clip, never per glyph (NEW, test on joins)
15. `faText(px, opts)` -> CSS object, no letter-spacing, RTL (proven)
16. `ringPulse(t, start, period, rMax, color)` (proven)
17. `wipe(t, start, dur, color, dir)` (proven)
18. `cutAt(t, cuts)` -> {index, local t} (proven as cf)
19. `slot(fx, fy, fw, fh)` plus `safeZone(ratio)` (slot proven, safeZone NEW)
20. `parallax(layers, camT)` (NEW)
21. `actor(id).at(t)` persistent track (NEW)
22. `makeRig(parts, pivots)` and `pose(rig, {bob, lookX, blink})` (NEW; no facial sets)
23. `logoLoader(layers, colours)` -> transparent SVG (NEW rewrite of Emblem)
24. `bgCircuit(seed, w, h, t)` and `bgBinary(seed, rows, t)` (NEW, unverified)
25. `film` contract: `{fps, duration, seek(t), ready}` (proven)

## Top 8 ports (in order), with one-line acceptance

1. Time and easing module (items 1-4): seek the same t in v2 and in lib, identical numbers.
2. drawOn and ink (items 9-10): pixel diff 0 against film.v2 stroke at u=0.5.
3. Persian text helpers (items 12-15): no glyph cut in a 9:16 still; digits all Persian.
4. Counter (item 11): monotonic from->to, ends exactly at `to`.
5. Stamp, shake, ring-pulse (items 7-8, 16): same output as film.v2 at 3 times.
6. Wipe and cut table (items 17-18): dead-frames gate passes; no duplicate frames at cuts.
7. Slot and safeZone (item 19): text boxes inside safe zone for 4 ratios (edge-touch gate).
8. Logo loader (item 23): transparent background, own colours, renders in 9:16.

Next (not in top 8): spring, keys, rig, parallax, persistent actor. Each needs a new proof film.

## Retire list (keep as history under git)

- social/Pen.tsx, social/motion.ts, uni/motion.ts (Remotion frame hooks)
- social/scenes.tsx, uni/scenes.tsx, conference/* (Remotion scenes)
- _fa FaFonts and FaRoot (React), _fa typeOn
- htmlfilm/pencil/film.html (v1, superseded by v2)
- library/entries and render-specs (Remotion templates)

## Risks

- One film proves all of this (pencil, 9:16 only). Recipe ratios are verified only for 9:16 and 16:9.
- Spring, rig, parallax, persistent actor and background generators have no html proof.
- Inset-clip word reveal may clip overhanging Persian glyphs; test before use.
- Circuit and binary generators were not located in my inventory; check demos/effects before any build.
- Gates and lint tools assume Remotion frames; they need an adapter to read `seek(t)` output.
- Effort for the rig and actor timeline is likely underestimated.
