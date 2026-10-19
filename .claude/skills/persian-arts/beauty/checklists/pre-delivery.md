# pre-delivery checklist (mechanical)

Every item is answerable YES/NO. Where a machine decides it, the exact command/check id is named; where nothing
mechanical exists today, the item says **eyeball** and names the evidence to look at. A NO blocks delivery. Run on the
**final** artifacts, both ratios, after the last render.

## 0. Automatic (run, paste the output)

| # | Check | Command | Pass |
|---|---|---|---|
| 0.1 | Craft linter, no FAIL | `node .claude/skills/persian-arts/beauty/tools/lint-film.mjs <film source \| folder>` | exit code 0 |
| 0.2 | Purity checks | same, `--only P01,P02,P03,P04,P05` | no FAIL: no rAF, no `Date.now`/`performance.now` in render, no unseeded `Math.random`, no remote URL, no scroll API |
| 0.3 | Type checks | same, `--only T01,T02,T03,T04` | no FAIL: no letter-spacing on Persian, no text stroke, no per-character split, Persian numerals isolate-wrapped |
| 0.4 | Design checks | same, `--only D01,D02,D03` | PASS: token layer declared, key light declared, ≥ 2 roles differ in WEIGHT |
| 0.5 | Kit checks | same, `--only K01,K02,K03` | no FAIL: ≥ 2 kit families used, spring/overshoot present, shader used via story |
| 0.6 | Text overlap proxy | same, `--only X01` | no WARN over `overlapFrac` 0.15 |
| 0.7 | Data layer intact | `node .claude/skills/persian-arts/beauty/tools/craft.mjs check` | no error |
| 0.8 | Palette contrast | `node .claude/skills/persian-arts/beauty/tools/palette-contrast.mjs <palette id>` | contrast note still PASS for the surfaces actually used |
| 0.9 | Skill mirror | `node scripts/sync-persian-arts-skill.mjs --check` | `OK: Codex mirror in sync` |

Reminder: linter PASS means "no banned source pattern found", never "the film is good". It cannot see a frame.

## 1. Persian (blocking, CANNOT be waived)

| # | Item | Decides it |
|---|---|---|
| 1.1 | `letter-spacing` is 0 on every Persian run? | lint `T01` |
| 1.2 | No per-code-point split of Persian text? | lint `T03`; eyeball the mid-reveal frames |
| 1.3 | Every per-unit animation uses whole words, `joinedGroups()` or `typeOn()` prefix slices? | grep the source for char-index loops; eyeball two consecutive mid-reveal frames (each step adds one correctly shaped letter) |
| 1.4 | ZWNJ (U+200C) inserted between visible prefix and hidden remainder in any "hidden rest" typewriter? | **eyeball/grep** — look for the one ZWNJ at the prefix boundary |
| 1.5 | Persian digits U+06F0–06F9 only; ی U+06CC / ک U+06A9 only? | grep the Persian strings; `faDigits` at every numeral source |
| 1.6 | Numerals isolated with U+2066/U+2069 and unit in the same isolate? | lint `T04`; in canvas also `ctx.direction='ltr'` at the same call site and `iso(` on the numeral's line |
| 1.7 | Mask containers ≥ 1.5em (≥ 1.9em Nastaliq) so dots and tails are not clipped? | **eyeball** the still at the reveal midpoint |
| 1.8 | No `-webkit-text-stroke` outline on joined Persian? | lint `T02` |
| 1.9 | No Persian text inside a CSS `mask-image` data-URI? | grep `mask-image` + Persian |
| 1.10 | No dot-matrix hand-drawn Persian digits? | grep the digit renderer; eyeball the payoff frame |
| 1.11 | Every font family used is registered/loaded (no silent fallback)? | grep families against `FONT_FILES` in `work/persian/src/demos/_fa/index.tsx` (24 registered) |
| 1.12 | No fake bold on a single-weight face, no skew/italic, no `text-transform` on Persian? | grep weights against the single-weight list (`BTY-TYPE-015`, `BTY-TYPE-020`) |
| 1.13 | RTL right-hand anchor preserved in BOTH ratios? | eyeball ≥ 9 stills per ratio |
| 1.14 | Mirrored items are reading-order things only; physical things (gravity, logos, clocks, numerals) unmoved? | eyeball the landscape stills |

## 2. Design system present (blocking)

| # | Item | Decides it |
|---|---|---|
| 2.1 | Six palette tokens declared (ink, page, surface, accent, signal, shadow-1..3)? | lint `D01` plus grep the header |
| 2.2 | Key light declared (direction, colour, softness, intensity) with fill/rim/ambient? | lint `D02` |
| 2.3 | Exactly one white token used everywhere white appears? | grep fill/stroke colour literals; list distinct near-whites |
| 2.4 | Accent+signal ≤ 10% of frame area in every scene? | **eyeball** per still, against the stated scene budget |
| 2.5 | Surface ≥ 12% L* from page; adjacent depth planes ≥ 15% L* apart? | `palette-contrast.mjs` on the tokens; eyeball the stills |
| 2.6 | One hero-contrast frame named in the header, and it peaks? | grep the header; eyeball that frame |
| 2.7 | End card in the same page-hue family and the same white? | eyeball the end card still at 100% |

## 3. Craft of the frame (blocking)

| # | Item | Decides it |
|---|---|---|
| 3.1 | Every grounded object has a contact shadow? | eyeball each still; count objects without one |
| 3.2 | No object is a single flat fill (≥ 2 of gradient/rim/occlusion/grain/blend)? | eyeball; grep the material helpers |
| 3.3 | Three planes present (foreground occluder, subject, environment) in at least one scene per film, both ratios? | eyeball |
| 3.4 | Hero ≥ 25% of frame height (9:16) / ≥ 22% (16:9), measured on text or subject? | **measure on the still** (not on the largest decorative element — L-123) |
| 3.5 | No frame > 60% undifferentiated empty field? | **measure on the still** |
| 3.6 | Corners ≥ 10% L* darker than centre (vignette present)? | **measure on the still** |
| 3.7 | Atmosphere drawn both behind and in front of the subject? | eyeball; count foreground motes 6–14 |

## 4. Type and layout (blocking)

| # | Item | Decides it |
|---|---|---|
| 4.1 | ≥ 2 roles differ in weight by ≥ 200 AND size by ≥ 1.5×? | lint `D03` + eyeball |
| 4.2 | ≤ 3 type roles per frame (numeral counted)? | eyeball each still |
| 4.3 | No two live text blocks share a region (any ratio)? | lint `X01` proxy, then **eyeball** — the proxy reads declared rectangles, not pixels |
| 4.4 | Nothing clipped by the canvas edge; everything inside the envelope (9:16 72/140/180; 16:9 96/64/64)? | eyeball every still |
| 4.5 | Body ≥ 4.5:1, large ≥ 3:1 against the actual pixels behind the text? | sample the still, not the tokens |
| 4.6 | Text over scenery has a knockout, a 55–75% scrim, or ≥ 45% L* separation? | eyeball |
| 4.7 | One HUD/label anchor, identical in every scene and both ratios? | eyeball the still set; check the counter did not migrate (L-003 / s12) |
| 4.8 | All text on the shared 8px baseline grid? | eyeball + grep the y values |
| 4.9 | Does the opener establish a distinct memorable hook and the outro deliver an earned payoff, checked with owner feedback? | **eyeball** opener/outro; record owner feedback separately |
| 4.10 | Did the typography search include actual project components, with the choice justified by story, letterform shape, and function? | list searched components and evidence; reject generic unsupported labels |
| 4.11 | Are observed evidence, owner feedback, and inference kept distinct, with invented facts and numeric thresholds omitted? | **eyeball** the delivery note and design rationale |
| 4.12 | Is text stable across consecutive rendered frames or playback? | **eyeball** adjacent rendered frames/playback; static lint is not proof |

## 5. Motion (blocking)

| # | Item | Decides it |
|---|---|---|
| 5.1 | ≥ 2 distinct named easings used, each mapped to a named job? | lint `K02` + grep `ease.` calls |
| 5.2 | 0 linear entrances? | grep for a linear/identity progress on an entrance |
| 5.3 | spring or `outBack` on ≥ 1 physical prop, with anticipation and follow-through? | lint `K02`; eyeball the frames before/after the landing |
| 5.4 | Any fast move preceded by 3–8px anticipation for 80–150ms? | eyeball frames at ±0.1s |
| 5.5 | Grouped elements staggered 60–90ms apart (Persian per-word 40–70ms)? | grep the stagger constant |
| 5.6 | 1–2 deliberate holds of 0.4–1.0s in the film, with ambient drift during the hold? | eyeball the timing |
| 5.7 | HUD and any label layer never move or ease? | grep HUD tween; eyeball first/last frames |

## 6. Variety and ratios (blocking)

| # | Item | Decides it |
|---|---|---|
| 6.1 | No two consecutive scenes share framing, background family, entrance direction or hero scale band? | **list the four axes per scene** in the scene table; compare rows |
| 6.2 | ≥ 3 framing families and ≥ 3 background families per film? | count from the scene table |
| 6.3 | No three consecutive cards of the same dominant-element kind / visualStyle family? | list card `visualStyle` + dominant element per card |
| 6.4 | Landscape cut reviewed as its own film: ≥ 9 landscape stills + transition frames looked at? | list the stills path and count |
| 6.5 | ≥ 5 real changes between ratios (horizon, rail anchor, type sizes, hero band, end-card grid)? | diff the two layout tables |
| 6.6 | Each ratio produced as its own manifest/composition, never a crop? | inspect the two manifests |

## 7. Integrity of the delivered artifact (blocking)

| # | Item | Decides it |
|---|---|---|
| 7.1 | Stills for this review were extracted from the FINAL mp4 after the last render? | file mtimes: stills newer than the final |
| 7.2 | `events.json` derived from the real edit and verified against the delivered mp4? | `work/persian/tools/verify/film-integrity.mjs` I1 (L-118) |
| 7.3 | No debug overlay on the capture path? | grep `debug=2`, `&debug=` (L-116) |
| 7.4 | Keyframe interval ≤ 2s on the capture encode (`-g 60` at 30fps)? | ffprobe the final (L-127) |
| 7.5 | No `FRAME_OFFSET` / `useCurrentFrame() + N` temporary peek left in source? | grep (L-135 / lessons §7) |
| 7.6 | Truthful header comments (counts, names, versions match the code)? | read the header against the code |
| 7.7 | Assets local and in git/vault; no absolute paths; no remote URL? | lint `P04` + grep absolute paths |
| 7.8 | Version count ≤ 3 (v1 build, v2 one fix round, v3 final) unless the user asked? | check the version folders |
| 7.9 | Every aesthetic claim in the delivery note either measured here or marked as an estimate? | read the note |

## 8. Sign-off

- Items answered NO: list them with the frame/timecode that shows them.
- Every "eyeball" item must name the still path it was judged on; an item judged on no artifact counts as NO.
- Items that could not be run (command missing, ratio missing) are listed as **not run**, never as pass.
