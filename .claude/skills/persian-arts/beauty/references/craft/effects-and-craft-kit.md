# craft: effects and the craft kit

The arsenal, with the decision rule for each: **when it is the right choice** and **when it is a cliché**. Evidence
folders are real: `library/media/typography/<name>/poster.webp` (39 Persian text techniques) and
`library/media/reference/shotcraft/<category>/<sub>/poster.webp` (156 categories, 212 sub-techniques). Search them
before drawing anything new (SKILL.md rule 18a). Effect cost per frame: `data/frame-budget.csv`.

## 0. The selection rule

1. Name the **story job** first (reveal / compare / prove / escalate / close) and look it up in
   `data/beat-to-treatment.csv` (`BTY-BEAT-001`…`BTY-BEAT-045`: beat, emotional job, treatment, camera, type role,
   transition, effect id, easing, pitfall).
2. Then pick the technique whose *mechanism* matches the job. An effect chosen for looks has no timing logic, which is
   why it reads as decoration.
3. One effect idea per beat (`BTY-COMP-006`). Two effects on one beat means neither is the event.
4. Everything must be a pure function of `t` (`BTY-PROC-001`): no feedback buffers, no per-frame physics
   (`BTY-PROC-005`), no animated `feTurbulence` (`BTY-TEXTURE-002`, BANNED in the budget table).
5. Persians-specific constraints always win over the generic technique — read `persian-craft.md` before using any
   effect on a Persian string.

## 1. Text-technique arsenal (typography library, Persian-native)

| folder | mechanism | right when | cliché when |
|---|---|---|---|
| `typewriter` | `typeOn()` prefix slice, shaping re-flows per frame | a line should be *written* (testimony, chat, headline building) | used on a claim that should be read instantly |
| `splitflap` | cell roll per unit; one cell per **word** for headline cells | departures boards, counters, deadline drama | per-code-point cells on a headline show isolated forms (`PERSIAN-LOCALIZATION-LESSONS.md` §1) |
| `odometer`-style `counter`, `countdown` | digit roll / arc countdown, cells sized from the measured Persian glyph | a number is the claim (price, deadline, stock) | when the number is decoration; also when a cell is sized for Latin digits (`BTY-FA-031`) |
| `scramble` | locked prefix as one run, fixed-width `inline-block` noise cells, hidden ghost for width | "decoding", tech, discovery | when the locked part is also split (breaks shaping); when noise includes Persian zero |
| `glitch` | displacement/chromatic burst, ≤ 14 frames | one hostile beat, a cut-hider | as a general reveal: cheap, and it hides the type instead of showing it |
| `mask` | clip window travelling with the ink, ≥ 1.5em tall | line reveals, scene entries | a tight mask: slices dots and the yeh tail (`BTY-FA-020`) |
| `reveal` | line-box mask + rise, `outExpo` 0.5–0.9s (`BTY-REC-001`) | the default for a failed-fast headline | on every line at the same offset with no hierarchy |
| `kashida` | integer tatweel count at 1–2 legal joints | expansion, emphasis, the native tracking analogue | non-integer/sub-pixel tatweel; more than 2 joints (`BTY-FA-023`) |
| `nuqta` | dots drawn as separate authored marks | calligraphic/botanical concepts, ink worlds | dots revealed before the body (`PERSIAN-LOCALIZATION-LESSONS.md` §1b) |
| `inktrace`, `inktrace-penless` | stroke-follow draw, right-to-left, body then dots | poetry, signature, craft/process films | left-to-right pen or jumping between letters (§1b) |
| `outlinefill` | outline → fill transition (SVG `feMorphology` route) | two-state reveal of one word | `-webkit-text-stroke` seams (`BTY-TYPE-016`) |
| `highlight` | marker/highlighter bar behind a word | one key term inside a body line | three highlights in one frame (accent budget, `BTY-COLOR-004`) |
| `markerline` | hand-drawn rule/underline | editorial, annotation register | as a generic divider in every scene |
| `assembly`, `converge`, `letterdrop`, `wordpop`, `wordfade`, `flyingwords`, `dotsword`, `stomp`, `leadzoom`, `blurslide`, `brace`, `rollcycle`, `filmstrip`, `letterdrop` | per-group entrances with stagger | building a phrase from parts, rhythmic beats | three consecutive cards using the same entrance family (`composition-and-variety.md` §7) |
| `codeblock`, `terminal`, `docwrite`, `chipcycle`, `pillslot`, `demote`, `cutout`, `papercard`, `fonthymp`, `karaoke` | register-specific devices (code, docs, chips, karaoke timing) | the beat is genuinely that register | register used as a costume for a beat that is not code/doc/lyrics |

Timing and code for most of these are in `data/recipes.csv` (`BTY-REC-001`…`BTY-REC-060`, each with `trigger`,
`duration_ms`, `easing`, `code`, `do`, `dont`, `purity`, `cost`, `reference`). Persian-specific safety notes are in each
recipe's `do`/`dont`, e.g. `BTY-REC-001` forbids a tight mask that slices dots and descenders.

## 2. Image / material effect arsenal (shotcraft library)

| family | folders (verified names) | right when | cliché when |
|---|---|---|---|
| fracture / shatter | `fracture`, `tear-streak-transitions`, `UV-slice` block displacement | a break is the story (failure, rupture) | as a scene transition on every cut |
| particles | `particle-celebrate-hits`, `particle-sand-fill`, `counter-confetti`, `bubble-swarm-takeover` | a countable event / a celebration that is earned | confetti on a beat that carries no win (dilutes the payoff) |
| ink / paper / print | `riso-print-hits`, `print-texture-transitions`, `paper-craft-moves`, `paper-title-card`, `paper-plane-messenger`, `hatch-depth`, `line-boil` | craft, print, heritage, stationery worlds; s11's paper world is the batch's best hierarchy | paper used as a texture layer over an unrelated world |
| glass / glassmorphism | `cycle-glass-node-morph`, `glass-pill-dictation-typing`, `floating-glossy-label-pills`, `frost` | UI-native products, panels over imagery | glass panels with no rim/inner shadow = flat rounded rects (`BTY-MATERIAL-006`) |
| aurora / mesh / gradient | `aurora-bloom-bg-flip`, `value-stagger-gradient`, `gradient-transition`, `gradient-word-sweep`, `spectrum-morph-ui`, `radial-wave` | ambient field, mood shift, dawn/dusk arcs | the default two-stop linear ramp as the field (`colour-and-grade.md` §6) |
| FUI / reticle / scan | `fui-hud-moves`, `scan-bracket-sweep`, `scanline-annotate-focus`, `avatar-bracket-carousel`, `gauge-readout-moves` | measurement, inspection, "the machine is looking" | reticles on every scene, or a HUD that moves (`BTY-MOTION-009`) |
| flylines / maps / routes | `glow-flyline-moves`, `integration-hub-map`, `line-carry-transition`, `draw-svg-trace`, `cursor-flyover` | logistics, networks, delivery (s12's route map is the batch's best atmosphere) | flylines with no origin/destination semantics |
| 3D / camera | `basic-3d-scene`, `crane-rise-reveal`, `crash-zoom-punch`, `cube-navigation`, `depth-layer-moves`, `overhead-camera-moves`, `space-camera-moves`, `terminal-3d` | a world worth moving through; a genuine reveal | 3D used to make an object that would read better as a card, at MEASURE-FIRST cost |
| montage / rhythm | `montage-rhythm-moves`, `beat-cut-moves`, `sakuga-timing-shift`, `speed-ramp-freeze`, `rhythm-interrupt-moves`, `type-rhythm-sync` | escalation, recap, energy spike | a rhythm cut used where the film should hold (`BTY-MOTION-011`) |
| stamps / ledgers / docs | `card-stack`, `research-card-stack-scroll`, `doc-park-left-pill-deal`, `deck-deal-flyin`, `magician-card-flourish` | lists, dossiers, collections | card piles with rotated illegible text (s11 product cards, `CRAFT-AUDIT.md` D6) |
| dissolve / grain / print transitions | `grain-dissolve`, `print-texture-transitions`, `wipe-transitions`, `page-turn-transitions`, `gradient-transition` | a scene change that should feel material | a different transition per cut = no grammar |
| text-as-image | `text-as-mask`, `letterspace-materialize`, `outline-word-fill`, `marker-underline-title`, `type-entrance-moves`, `type-assembly-moves` | type IS the artwork (s11 register) | as decoration behind a headline that must read fast |

## 3. Cheap-vs-expensive discipline

- Spend the budget on one accent per film: a WebGL transition (≤ 14 frames, `BTY-PROC-008`) or one heavy shader —
  `CrossZoom` ~248ms/frame and `LinearBlur` ~238ms/frame are USE-AS-ACCENT, `StereoViewer` ~88ms likewise
  (`data/frame-budget.csv`).
- Free effects should be free: dust motes "free", bokeh ≤ 30 sprites "cheap", canvas2D slice reveal "a few ms",
  grain tile swap 1–3ms, vignette+letterbox ~1ms.
- MEASURE-FIRST before committing: mesh gradients, `ctx.filter` blur on the background plane, god rays, halftone,
  3D LUT, image-to-particles, three.js, UV-slice shatter. BANNED: full-res 5-mip bloom, live animated `feTurbulence`,
  temporal accumulation, GPGPU ping-pong, and scaling a 540×960 measurement to 1080p without ×4.

## 4. Failure modes to avoid

Effect used as costume (register mismatch) · two effects on one beat · an effect that hides the word instead of showing
it · an effect with no direction in an RTL film (mirror it: `persian-craft.md` §8) · confetti on an unearned beat ·
per-code-point cells on a Persian headline · an animated filter that breaks seek purity · a transition family that
changes every cut.
