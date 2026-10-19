# quick-reference — atomic beauty rules

Searchable surface for the `persian-arts` beauty pack. Rules 1–167 mirror `data/beauty-rules.csv` (same ids, same
numbers — the CSV stays the source of truth; this file adds the mechanism line and a themed order). Rules 168+ come
from `ART-DIRECTION-STANDARD.md`, `CRAFT-AUDIT.md` and `docs/PERSIAN-LOCALIZATION-LESSONS.md`; each cites its source
path. Grep-able by id (`BTY-FA-00`), by theme heading, or by the imperative verb.

Format: `N. **Imperative.** mechanism — id`.

## LIGHT (1–18)

1. **Declare one key light per film** — direction, colour hex, softness, intensity. A stated light is what every shading decision traces back to; with no declared key there is no lit side and no shade side — `BTY-LIGHT-001`.
2. **Give every object a lit side and a shade side** driven by that key: lit:shade ≥ 1.35:1 in L*, shade ≥ 20% darker, soft terminator. Real materials are read by the ratio between lit and unlit value; constant ratio makes the brain read coloured shape instead of material — `BTY-LIGHT-002`.
3. **Build the shading stack in order**: base gradient → core shadow → contact shadow → rim highlight → ambient falloff. Each term answers a different perceptual question; skipping one makes the object read as a sticker — `BTY-LIGHT-003`.
4. **Put a contact/occlusion shadow under everything grounded**: a short dark ellipse, 30–50% alpha, width ~1.15× base, height 8–14% of it. Cheapest single fix for floating objects — `BTY-LIGHT-004`.
5. **Give every non-flat object one rim toward the key**: 2–4px at 1080, ≥ 15% L* above base. A single rim is what makes flat vector colour read as lit illustration — `BTY-LIGHT-005`.
6. **Darken the corners ≥ 10% L\*** relative to centre, vignette alpha 0.45–0.65 at the extreme corner. A corner falloff gives the frame a lens, so the eye lands on the centre — `BTY-LIGHT-006`.
7. **Keep cool fill ≤ 25% of total light** and state it as fill. An unstated second temperature reads as an accident, not as bounce — `BTY-LIGHT-007`.
8. **Build atmosphere light from elongated soft radial pools with falloff**, never a clipped polygon: core peak ~0.14 alpha, 2 nested pools, outermost stop fully transparent. Above ~0.25 alpha light stops being light and becomes paint — `BTY-LIGHT-008`.
9. **House the key in frame at least once**: the source visible, its effect readable on ≥ 2 surfaces. A traceable source is what proves a lighting model exists — `BTY-LIGHT-009`.
10. **Reject semi-transparent grey ellipses as light.** Falloff must reach full transparency at the edge, and the tint must come from the palette key hue; grey reads as a smudge on the lens — `BTY-LIGHT-010`.
11. **Scale emissive treatments to host size**: `hr *= clamp(h/320, 0.42, 1.15)`, `alpha *= clamp(h/420, 0.40, 1.15)`. A fixed glow radius makes small props look radioactive and big props look dead — `BTY-LIGHT-011`.
12. **Cap emissive/signal light at 1 instance per frame** and 2 signal uses per scene. Two glows compete, so neither is the bright thing — `BTY-LIGHT-012`.
13. **Separate adjacent depth planes by ≥ 15% L\***; likewise subject vs environment inside one plane. Value separation is what the eye actually uses for depth; blur alone does not separate planes — `BTY-LIGHT-013`.
14. **Draw atmosphere both behind and in front of the subject**: 6–14 foreground motes, alpha 0.06–0.20, 2–9px, one plane blurred. Air that exists only behind the hero reads as wallpaper — `BTY-LIGHT-014`.
15. **State one light temperature per film** and derive every gradient, glow and shadow tint from it. One temperature is what makes separate scenes read as one shoot — `BTY-LIGHT-015`.
16. **Declare the shadow ladder as three steps of the page hue** — never black, never grey; 8–14% L* drop per step. Coloured shadows are how real shadows behave in a tinted room — `BTY-LIGHT-016`.
17. **Give glass a specular streak, an edge and a thickness term, or do not draw glass** — ≥ 3 terms, stroke ≥ 2px at 1080. Without these, glass degrades to a wireframe (`CRAFT-AUDIT.md` D6) — `BTY-LIGHT-017`.
18. **Reuse the proven reference lighting model**: s08 pendant-lamp pool with dust and bokeh — pool ≥ 1.2× hero width, 20–40 dust motes, ≤ 30 bokeh sprites at 0.06–0.18 alpha. It is the batch's best lighting asset and it is measured — `BTY-LIGHT-018`.

## DEPTH (19–30)

19. **Build ≥ 3 distinct planes per scene**: foreground, subject, environment; adjacent planes ≥ 15% L* apart; environment carries the least detail. Depth is built from value and detail density, not from perspective lines — `BTY-DEPTH-001`.
20. **Put an occluding foreground element at a frame edge** in at least one scene per film, in both ratios; blur or darken it 10–25%. An edge occluder sells depth for free because it proves something is in front of the lens — `BTY-DEPTH-002`.
21. **Blur and darken the background plane** relative to the subject: `ctx.filter` blur 3–8px at 1080; background detail < 40% of the subject's. Optical focus is the strongest depth cue available in canvas — `BTY-DEPTH-003`.
22. **Give the background more grain than the subject**: background 6–10% vs foreground 2–4%. Air grain reads as atmosphere; subject grain reads as noise — `BTY-DEPTH-004`.
23. **Replace decorative wallpaper grids with a room that has a material and a horizon**: 1 horizon/floor line per scene, wall value range ≥ 12% L* across the frame. A grid identical in every shot stops being space and becomes a watermark (`CRAFT-AUDIT.md` D4) — `BTY-DEPTH-005`.
24. **Make wall and floor planes share their boundary exactly** — wall bottom y equals floor top y, both ratios. A 1px seam at the horizon reads as a broken render — `BTY-DEPTH-006`.
25. **Use 3–6 parallax planes with graduated ratios** (adjacent ratio 0.15–0.35, nearest up to 1.25× base drift) instead of one moving layer. Differential motion is what makes the parallax read as distance — `BTY-DEPTH-007`.
26. **Treat empty regions as designed forms**, not leftovers: every empty region is a named form; > 60% undifferentiated field is a defect. Negative space is read as a shape or as an omission — `BTY-DEPTH-008`.
27. **Never ship a scene > 60% blank field**; measure the share on the still. Large dead fields read as "we ran out of things to draw" (`CRAFT-AUDIT.md` D7) — `BTY-DEPTH-009`.
28. **Vary the background family between consecutive scenes**: no two consecutive scenes share one; ≥ 3 distinct families per film. A repeated stage is learned by scene two, after which the film stops being watched — `BTY-DEPTH-010`.
29. **Add a haze/fog term between environment and camera**: 8–18% of the environment colour, densest at the horizon. Aerial perspective separates far from near without blurring — `BTY-DEPTH-011`.
30. **Scale the depth rig with the framing in macro scenes**: `translate(anchor) scale(k) translate(-anchor)`, k = 1.55 for an extreme-macro tool. A fixed rig breaks the moment the shot becomes macro — `BTY-DEPTH-012`.

## MATERIAL (31–40)

31. **Ban the flat single fill.** Every material is built from ≥ 2 of {gradient, rim, occlusion, grain, blend mode}; keep a kit of 5–6 named treatments per film. One flat fill for every material collapses the film onto a single plane (`CRAFT-AUDIT.md` D6) — `BTY-MATERIAL-001`.
32. **Define a materials kit of 5–6 named treatments and reuse it deliberately** — matte, paper, metal, glass, emissive, glass-over-X; each with ≥ 2 terms and a scale function. Named treatments are how materials stay consistent across scenes and authors — `BTY-MATERIAL-002`.
33. **Give paper fibre, a soft fold and a slightly uneven edge**: fibre grain 3–6% alpha at 2–4px, fold = 6–12% L* linear shift across the sheet. Paper's tell is micro-texture plus one fold, not a beige fill — `BTY-MATERIAL-003`.
34. **Metal needs a two-tone reflection plus an environment line plus an edge highlight** — dark band 35–55% of object height, bright band 45–65%, edge 1–3px. Metal is read from the horizon line it reflects, not from greyness — `BTY-MATERIAL-004`.
35. **Give emissive materials a two-stop glow with true falloff plus a hot core**: core 0.85–1.0 alpha at ≤ 0.35× radius, falloff to 0 at 1.6–2.2× radius, ≤ 1 per frame. A hard-edged glow reads as a sticker, not as emission — `BTY-MATERIAL-005`.
36. **Give frosted glass a rim and an inner shadow**, not a flat rounded rect: frost 0.10–0.22 alpha, inner shadow 8–14% L* darker at the top edge, rim 1–2px at 60–80% alpha. Frost is read from the darkened top edge, not from transparency alone — `BTY-MATERIAL-006`.
37. **Fill every material gradient along the declared light axis**, within 20° of the key direction. A gradient along the object's own symmetry contradicting the key is the fastest way to reveal that no light exists — `BTY-MATERIAL-007`.
38. **Kill copy-pasted duplicate props**: if N > 1, vary rotation ≥ 3°, depth ≥ 12% scale, and occlude each separately — or use a single hero. Perfect repeats read as a pattern stamp — `BTY-MATERIAL-008`.
39. **Cut props that cannot beat a photograph, or stylise them fully.** The photoreal register is unreachable in canvas (`CRAFT-AUDIT.md` tooling limits); committing to a stylised flat-material register is the honest move — `BTY-MATERIAL-009`.
40. **Never let an object be a bare stroke outline with no fill and no thickness**: stroke ≥ 2px at 1080, every closed shape has a fill or an explicit open-form intent. Wireframe-looking props read as unfinished drawings — `BTY-MATERIAL-010`.

## TEXTURE (41–50)

41. **Run a grain overlay at 3–8% opacity** with overlay or soft-light blending; 20%+ reads as screen dirt. A little grain unifies a synthetic image and hides banding — `BTY-TEXTURE-001`.
42. **Pre-render 6–10 grain tiles and swap by frame index**; never animate `feTurbulence`. Animated turbulence is not a pure function of t and costs a filter rebuild every frame — `BTY-TEXTURE-002`.
43. **Build the mesh-gradient background from 3–6 soft radial blobs on a dark field** (each 50–70% extent, moving centre), two hues plus one accent. Blob meshes read as light in air; a linear two-stop ramp reads as a template — `BTY-TEXTURE-003`.
44. **Apply an ACES-filmic tonemap to the composited frame** (Narkowicz 11-instruction fit, ~2–4ms fullscreen at 1080×1920, exposure 0.9–1.1). A filmic curve rolls the highlights instead of clipping them, which is most of what "expensive" means — `BTY-TEXTURE-004`.
45. **Grade in three fixed steps**: cool the shadows, warm the highlights at the key, vignette the corners. A consistent three-step grade is the cheapest way to make separate scenes read as one shoot — `BTY-TEXTURE-005`.
46. **Keep bloom cheap**: quarter-resolution bright pass, two mips, added back. Full-resolution multi-mip bloom buys nothing visible and costs the frame budget — `BTY-TEXTURE-006`.
47. **Cap chromatic aberration at 0.5–2px and use it as a lens effect, not a glitch**: radial offset `uv + (uv-0.5)*k`. Small and radial reads as glass; large and uniform reads as a broken codec — `BTY-TEXTURE-007`.
48. **Cap a bokeh field at ~30 sprites**, alpha 0.06–0.18, size by depth, one `ctx.filter` blur for the whole layer. Bokeh is a depth cue; more than ~30 sprites it becomes confetti — `BTY-TEXTURE-008`.
49. **Build paper texture from one fixed-seed feTurbulence fractalNoise tile plus one wide 6–12% L* gradient.** Seeded + cached keeps `seek(t)` pure and cheap — `BTY-TEXTURE-009`.
50. **Use a soft luma or gradient matte for every mask edge** (feather 2–6px or 4–10% of travel); never a 1px step. A hard mask edge is the single most reliable "made in a browser" tell — `BTY-TEXTURE-010`.

## COLOUR (51–62)

51. **Declare six palette tokens**: ink, page, surface, accent, signal, shadow-1..3 — as CSS custom properties *and* a mirrored JS object for canvas. With no token layer there is nowhere to put a colour system, so each scene picks colours ad hoc (`CRAFT-AUDIT.md` D5) — `BTY-COLOR-001`.
52. **Keep surface ≥ 12% L\* away from page** (≥ 15% between depth planes). Below 12% the object disappears into its own background — `BTY-COLOR-002`.
53. **Hold ~60% page / 30% surface / 10% accent+signal** by screen area across the film. Above ~10% the accent stops being an accent — `BTY-COLOR-003`.
54. **Budget signal at ≤ 2 uses per scene and ≤ 1 per frame**, and give it a different hue from accent. A scarce signal is what makes the CTA findable — `BTY-COLOR-004`.
55. **Let page be a hue, never a neutral grey** (saturation ≥ 12%); the page hue is also the shadow family. A grey page forces grey shadows and kills the world — `BTY-COLOR-005`.
56. **Give accent one job: the brand mark and the primary CTA only**; accent area ≤ 10% of the film. Two jobs for one colour means neither reads — `BTY-COLOR-006`.
57. **Tint scenes by value/saturation only** (±12% L* or ±10% saturation of page); introducing a new hue family after scene 1 is a defect. Scene recolouring is what produces the navy→green→brown→purple→end-card-blue failure (`CRAFT-AUDIT.md` D5) — `BTY-COLOR-007`.
58. **Name exactly one hero-contrast frame per film** in the header — ideally the end card. If two frames claim it, neither lands — `BTY-COLOR-008`.
59. **Keep the end card in the film's own page-hue family** and on the same white token; 0 new hue families there. The end card is the screenshot; a fifth colour world reads as another film — `BTY-COLOR-009`.
60. **State the accent budget per scene in the scene table** as a percentage of frame area, target ≤ 10%. A stated budget is checkable; "restrained" is not — `BTY-COLOR-010`.
61. **Grade warm-to-cool across the film** (page saturation shift up to 10%, key-hue temperature slide 6–14% over the run, 0 hue-family change) so the ending is not a different world. A slow temperature move gives the film an arc without a new palette — `BTY-COLOR-011`.
62. **Use a duotone or gradient map to unify imagery into one designed palette**: 2 hues, grayscale contrast 1.1, one multiply layer for highlights and one screen layer for shadows. A duotone makes stock imagery obey the film's palette — `BTY-COLOR-012`.

## TYPE (63–90)

63. **Use eight named roles**: display, headline, deck, body, label, legal, numeral, button, with the CSV's sizes/weights. Named roles are what turn a size ladder into a hierarchy (`CRAFT-AUDIT.md` D2) — `BTY-TYPE-001`.
64. **Force two-axis contrast**: at least one adjacent role pair differs ≥ 200 weight units AND ≥ 1.5× size. Two lines differing only in scale read as one line that got smaller — `BTY-TYPE-002`.
65. **Use ≥ 300 axis units of weight gap inside one family**; 300/400/500 is forbidden. A 250/550/850 three-step system is visible; adjacent weights are not — `BTY-TYPE-003`.
66. **Cap at three type roles per frame**, numeral counted as one of the three. Four live blocks is a layout failure, not richness — `BTY-TYPE-004`.
67. **Express every size in px against a 1080 short-axis reference** (`size = factor * min(W,H)`), ladder 20:24:40:72:120:168:260. A min-axis reference gives both ratios identical optical size without a second spec — `BTY-TYPE-005`.
68. **Hold the modular ladder; never jump 3+ steps inside one visual group** (max 2 steps apart). Big jumps inside a group destroy the grouping the reader needs — `BTY-TYPE-006`.
69. **Hold landscape measure to two ~700px columns**, never one 1500px line; 9:16 body measure 700px (~45–55 Persian chars); display max 940px tall / 1400px wide. 45–55 characters is the readable measure; longer lines lose the return sweep — `BTY-TYPE-007`.
70. **Meet contrast floors against the actual pixels behind the text**: body ≥ 4.5:1, large ≥ 3:1, measured on the rendered still. Token-level contrast is a claim; pixel contrast is the fact — `BTY-TYPE-008`.
71. **Text over scenery requires a knockout, a scrim at 55–75%, or ≥ 45% L\* separation.** Scenery behind type varies per frame, so the guarantee has to be structural, not statistical — `BTY-TYPE-009`.
72. **Give the label role a graphic device**: a 3–4px accent rule above the label, right-aligned to its measured width, 10–14px gap. A rule ties the eyebrow to the block it labels and gives the eyebrow a reason to exist — `BTY-TYPE-010`.
73. **One display line per film carrying the claim**: 1–3 words at 96–132px (1080 reference). One claim is memorable; three are none — `BTY-TYPE-011`.
74. **Set the numeral role from the surrounding family or a deliberate display face used throughout**; weight 700–800, figure 120px / unit 28px, U+06F0–06F9 only. A numeral from another family reads as pasted-in — `BTY-TYPE-012`.
75. **Never put Latin display numerals inside a Persian layout**: 0 Latin numeral runs. Mixed numeral systems read as two languages in one frame — `BTY-TYPE-013`.
76. **Bump Persian size 5–10% or one weight step** above the Latin spec it came from. Persian x-height is smaller, so an equal spec reads lighter (`docs/PERSIAN-LOCALIZATION-LESSONS.md` §2) — `BTY-TYPE-014`.
77. **Never fake bold on a single-weight face** — Lalezar, Aref Ruqaa, Amiri, Katibeh, Gulzar, Gandom, Shabnam, Samim, Parastoo, Nahid, Scheherazade New, Lateef, Vazirmatn-RD. Asking 600/800 from a one-weight font smears the letterforms — `BTY-TYPE-015`.
78. **Never build hollow/outline Persian type with `-webkit-text-stroke`**: 0 uses. It strokes each overlapping glyph contour, so every join shows a seam; use 2× stroke + `paint-order: stroke fill` with an opaque fill, or SVG `feMorphology` dilate−erode — `BTY-TYPE-016`.
79. **Set line-height ≥ 1.4 display Naskh, ≥ 1.6 body, ≥ 1.9–2.2 Nastaliq**, and mask containers ≥ 1.5em. Persian ascenders/dots and descenders need the taller line box or a mask clips them — `BTY-TYPE-017`.
80. **Push underlines/overlines ≥ 1.35× the Latin offset** from the baseline, ≥ 6px clearance from the measured descender. A decoration placed with Latin metrics floats off a Persian line (`PERSIAN-LOCALIZATION-LESSONS.md` §3) — `BTY-TYPE-018`.
81. **Derive type offsets from the measured ink box of the real string** (`actualBoundingBoxAscent/Descent`), never a Latin cap/x-height grid. Shaping decides the ink box; hard-coded grids are wrong for every Persian string — `BTY-TYPE-019`.
82. **Ban `text-transform` and any fake italic/skew on Persian**: 0 uses. Uppercase is meaningless and Persian has no italic, so a skew reads as a rendering error — `BTY-TYPE-020`.
83. **Reserve the layout box with a hidden ghost copy at the final weight** whenever animating weight; ≤ 1 animated text node per shot. Animating weight changes advance widths, so everything after it reflows mid-shot — `BTY-TYPE-021`.
84. **Animate weight only** — we hold no Persian face with a width or optical-size axis (wght 100..900 Vazirmatn/Estedad/NotoKufiArabic, 400..900 Sahel, 300..700 Lemonada). Claiming a wdth or opsz axis that does not exist produces a silent no-op — `BTY-TYPE-022`.
85. **Keep scaleX stretch ≤ 1.04 and never use it as the primary width device**; prefer kashida. Stretching distorts letterforms, which the eye reads as a bad font before it reads it as a style — `BTY-TYPE-023`.
86. **Cap two live text blocks per region**, separated by ≥ 1.5× the larger cap height or an explicit rule. Block collision is the worst-shipping defect in the batch (`CRAFT-AUDIT.md` D3) — `BTY-TYPE-024`.
87. **Keep all text inside the envelope**: 9:16 → 72px sides, 140px top, 180px bottom; 16:9 → 96px sides, 64px top/bottom. Nothing clipped by the canvas edge, ever — `BTY-TYPE-025`.
88. **Put every text block on one 8px baseline grid shared by all scenes.** A shared baseline is what makes separately-built scenes look composed — `BTY-TYPE-026`.
89. **Keep exactly one white token** in the film; 0 near-white pairs within 3% L*. Off-by-a-little whites always read as an accident (`CRAFT-AUDIT.md` D5) — `BTY-TYPE-027`.
90. **Probe Persian glyph coverage before a face ships** — ی ک پ چ ژ گ آ ه ئ ء ZWNJ and U+06F0–06F9. A missing glyph silently falls back mid-word and looks like a bad font — `BTY-TYPE-028`.

## PERSIAN / RTL (91–121)

91. **Apply `letter-spacing: 0` to every Persian run, always.** Any non-zero tracking separates the joined letters; tracking is a Latin-only device — `BTY-FA-001`.
92. **Treat letter-spacing breaking Persian as an open engine bug, not a font choice** (issue 40618336; CSSWG question on Arabic digits open). Naming it a bug is what stops a "style" exemption — `BTY-FA-002`.
93. **Never split Persian text per code point** — each element becomes its own shaping context and renders isolated (ز و د instead of زودتر). Shaping is per run; splitting a run destroys the joins — `BTY-FA-003`.
94. **Never give a per-character or per-word Persian span margin, padding or border** (0/0/0). Inline boxes with any box model still shape across spans in Chromium, but the box inserts visual gaps that read as broken joins — `BTY-FA-004`.
95. **Avoid `inline-block` cells for Persian units** — an atomic inline is an isolation boundary and breaks joins; use inline with nowrap. Atomicity separates; inline keeps the shaping run intact — `BTY-FA-005`.
96. **Rank split units**: whole word → closed joining segment → growing prefix → line mask. Whole word = 1 shaping run; segment = started non-join-to-right, ended non-join-to-left; line mask = 0 re-shaping — `BTY-FA-006`.
97. **Add U+200C between the visible prefix and the hidden remainder of a typeOn reveal**, every frame. The invisible next letter drags the last visible letter into its medial form; ZWNJ blocks that — `BTY-FA-007`.
98. **Never split a base letter from its diacritic, and never transform a glyph that carries marks** (harakat U+064B–U+0652). The cluster is one shaping unit; splitting or transforming it detaches the marks — `BTY-FA-008`.
99. **Transform the ancestor element, never the individual glyph**, when scaling Persian; scale/rotate/translate/skew/opacity/blur are all safe on an ancestor. A per-glyph transform re-anchors each letter and breaks the join visually — `BTY-FA-009`.
100. **Keep every ZWNJ word unbreakable with a nowrap inline span**, never inline-block; 0 orphans at a line end. ZWNJ words are single semantic units and must not break — `BTY-FA-010`.
101. **Never use `word-break: break-all`, `overflow-wrap: anywhere` or hyphenation on Persian**: 0 uses. Breaking inside a word exposes isolated letterforms; Persian hyphenation rules are not implemented — `BTY-FA-011`.
102. **Break Persian lines manually from an explicit line array**, never by a live browser wrap; line count constant for all t. A live wrap makes the composition a function of font timing, which breaks determinism — `BTY-FA-012`.
103. **Use only Persian digits U+06F0–06F9 and only Persian ی U+06CC / ک U+06A9.** Arabic ي/ك look wrong to a Persian reader even when the word is right — `BTY-FA-013`.
104. **Set Persian digits from a Persian-digit face even when the line uses another family** (Vazirmatn/Estedad, or a `unicode-range` restricted @font-face for U+06F0–06F9). Digit shapes vary more between families than letters do — `BTY-FA-014`.
105. **Isolate only the numeral run with LRI U+2066 / PDI U+2069**, never a whole phrase: پخ + iso(۴۵) + درجه. Isolating more than the run changes the sentence's own direction — `BTY-FA-015`.
106. **Keep the unit inside the same isolate as the number**: ≥ 3 bidi classes (EN number, ET sign, L unit) must sit in one isolate or they reorder. `±` is ET/neutral and a unit like mm is class L — `BTY-FA-016`.
107. **In canvas, put the isolate characters inside the drawn string AND set `ctx.direction = ltr` at the same call site.** Canvas has no DOM bidi resolution, so both halves are needed — `BTY-FA-017`.
108. **Name the canvas isolate helper `iso()` on the numeral's own line** so `number-lint` recognises it (regex `\biso\s*\(`). A clean grep is cheaper than a reviewer noticing a misplaced sign — `BTY-FA-018`.
109. **Use Persian separators**: thousands U+066C, decimal U+066B, percent U+066A; 0 Latin `.`/`,` inside Persian numbers. A Latin decimal point inside Persian digits reads as a foreign token — `BTY-FA-019`.
110. **Keep a mask container ≥ 1.5em tall** (≥ 1.9em Nastaliq) so a reveal never clips dots or descenders; inner run translateY 0.3em → 0. Persian ink extends above and below the Latin em box — `BTY-FA-020`.

## STORY, TYPE EVIDENCE, AND TEMPORAL CHECKS (216–219)

216. **Give opener and outro distinct memorable hooks with an earned payoff**, linking the promise to the close and checking the payoff with owner feedback — `BTY-HOOK-002`.
217. **Search `library/data/typography-models.json`**; record each candidate's exact `key`, source path/ref, and story job. Inspect implementation before reuse; rendered review required to validate Persian shaping. Catalog metadata alone proves availability, not a ready-made component or correct rendering — `BTY-TYPEUSE-002`.
218. **Separate observed evidence, owner feedback, and inference**; omit invented facts and numeric thresholds — `BTY-EVIDENCE-002`.
219. **Check text flicker on consecutive rendered frames or playback**; static lint is not proof of temporal stability — `BTY-TEMP-002`.
111. **Never scale a Persian line below 1.0 as a reveal** when its mask is tight; reveal scale band 1.04 → 1.00. Scaling below 1 pushes the ink out of the mask and clips it — `BTY-FA-021`.
112. **Use colour-only per-character spans as the one legitimate per-character device**: 0 transform, 0 margin, 0 inline-block. Chromium shapes across colour-only spans, so joins survive — `BTY-FA-022`.
113. **Use integer-count tatweel U+0640 at 1–2 legal joints for kashida**, never letter-spacing; hide the integer steps under a fast easing or short motion blur. Kashida is the native Persian expansion device and it keeps the joins — `BTY-FA-023`.
114. **Prefer ZWJ U+200D over tatweel for joining control** without changing the word's width; tatweel only for a deliberate kashida look. ZWJ controls joining type silently; tatweel adds ink — `BTY-FA-024`.
115. **Do not justify Persian paragraphs** (0 `text-align: justify`). Justification solves the gap problem by stretching word spaces, which reads as a broken measure in Persian — `BTY-FA-025`.
116. **Re-measure Persian text after `document.fonts.load()`**; a mount-time measurement uses the fallback font. A measurement on the wrong face produces the wrong box and the wrong reveal — `BTY-FA-026`.
117. **Keep Nastaliq to ≤ 5 words at ≥ 100px**, never for numbers, labels or captions; line-height ≥ 1.9. Nastaliq is a calligraphic face: small sizes lose the stroke contrast and numerals do not belong in it — `BTY-FA-027`.
118. **Reveal Nastaliq along its own baseline**, never a left-to-right horizontal wipe: per-couplet line reveals, a clip window travelling with the ink. Nastaliq slopes; a horizontal wipe crosses the baseline instead of following it — `BTY-FA-028`.
119. **Never set Persian text inside a CSS `mask-image` SVG data-URI** (0 uses). That document is isolated and has no page web fonts, so the text silently falls back to a system font — `BTY-FA-029`.
120. **Never use hand-drawn dot-matrix pixel Persian digits** (0); rasterise the real font into the grid or abandon the treatment. Hand-drawn 5×7 Persian digits are illegible (۲ read as ٣, ۴ as a blob) — `BTY-FA-030`.
121. **Size a numeral cell from the measured Persian glyph**, never a Latin digit cell: cell width ≥ `measureText` of the widest Persian digit at target size. Persian digits at large sizes exceed Latin-sized `overflow:hidden` cells and get sliced — `BTY-FA-031`.

## MOTION (122–136)

122. **Use ≥ 2 named easings per film and name each job**: enter `outCubic` 0.35–0.55s, reveal `outExpo` 0.5–0.9s, settle `outBack` 0.3–0.45s, impact `spring` 0.6–1.2s (d 0.35–0.6), ambient `inOutSine` 2–6s. A single easing for everything reads as a slideshow — `BTY-MOTION-001`.
123. **Ban linear for any object's own entrance**; linear is only legal for a constant-rate scrub such as a route draw. Linear has no acceleration, so the eye reads it as a machine move, not a motivated one — `BTY-MOTION-002`.
124. **Add anticipation before every fast move**: 3–8px against the direction for 80–150ms. Anticipation tells the viewer which way the mass is about to go before it goes — `BTY-MOTION-003`.
125. **Add mandatory secondary action** to anything that moves: follow-through lag 60–120ms, overlap, and a settle after the stop. A rigid object with nothing following it is unfinished — `BTY-MOTION-004`.
126. **Stagger grouped elements 60–90ms apart**, never simultaneously; per line 55ms, per word 40–70ms for Persian. Simultaneity destroys the reading order the group implies — `BTY-MOTION-005`.
127. **Settle heavy props with the closed-form spring, not integration** (`ease.spring(t,k,d)`, k≈95, d≈0.42 → ~89% arrived at 0.2s; v clamped [0,1.25]). A closed form is deterministic in `t` and cannot drift — `BTY-MOTION-006`.
128. **Never scale a spring arrival from zero**, and never let the settle make the prop invisible: `sy = 1 - 0.10*(1-v)`, roll a few degrees, 6–10px anti offset. Scaling from 0 pops the object into existence and destroys mass — `BTY-MOTION-007`.
129. **Start a scene's first copy block at cut + 0–2 frames and finish it within 12 frames**; later blocks may lag. The first beat after a cut is what tells the viewer the scene has begun — `BTY-MOTION-008`.
130. **Never move or ease the HUD layer**: 0 motion between scenes; counter and label hold one anchor for the whole film. A migrating HUD is a defect (`CRAFT-AUDIT.md` D3) — `BTY-MOTION-009`.
131. **Make heavy props land after light and atmosphere do**; light props lead with `outExpo`. Ordering by mass is how a scene reads as having weight — `BTY-MOTION-010`.
132. **Keep deliberate holds**: 1–2 holds of 0.4–1.0s per 15–20s film, with ambient drift continuing. Holds are where the viewer finishes reading; without them the film is noise — `BTY-MOTION-011`.
133. **Lock rhythmic light and beam angles to a beat-derived zero crossing**, never free rotation: `angle = offset * sin(pi*(beat-hit0)/period)`. Free rotation drifts off the musical grid — `BTY-MOTION-012`.
134. **Keep camera keys in scene-local time and reset the transform before the type layer** (`setTransform(1,0,0,1,0,0)`). Scene-local keys make a scene re-usable at any position in the timeline — `BTY-MOTION-013`.
135. **Use a differentiated camera vocabulary**: macro push 1.00→1.14 over ~2s `outCubic`, pull-back 1.06→0.90 `inOutSine`, 14px vertical over 26 frames per cut. One camera move repeated is a template; a differentiated set is a language — `BTY-MOTION-014`.
136. **Prefer camera moves over cuts where the world is continuous** (`lib/pa-camera.js` keys/pathFollow). A cut destroys continuity; a move preserves it — `BTY-MOTION-015`.

## CAMERA (137–140)

137. **Keep camera shake ≤ 0.4° and ≤ 0.3% scale, driven by `noise(t)`** — never `Math.random`. Shake from white noise does not repeat under seek; noise(t) does, and small amplitudes read as handheld, large as broken — `BTY-CAMERA-001`.
138. **Pair a whip pan with a directional blur, and only as a cut-hider**: 1–3 frames of travel, blur proportional to camera speed, one cut only. Used twice, the wipe becomes the film's grammar — `BTY-CAMERA-002`.
139. **Zoom in log space** so a push-in reads as an optical zoom rather than an accelerating slide. Linear scale keys accelerate perceptually; log keys are constant-rate — `BTY-CAMERA-003`.
140. **Reframe the camera per ratio rather than re-cropping one framing**: 9:16 horizon/floor at 640/1230, 16:9 at 400/700; hero moves stage-left in 16:9. A crop changes the composition without a compositional decision (`CRAFT-AUDIT.md` D9) — `BTY-CAMERA-004`.

## COMPOSITION (141–149)

141. **Use a 12-column grid in 9:16 and 16 columns in 16:9**, 24px gutters, margins from the envelope rule. A stated grid is what lets two scenes be built separately and still align — `BTY-COMP-001`.
142. **Hold the hero at ≥ 25% of frame height in 9:16 and ≥ 22% in 16:9** at the hero moment, measured on the text or subject — never on the largest decorative element. Scale is how a film declares what it is about; an 8%-of-area prop reads as "we had one asset" (`CRAFT-AUDIT.md` D7, `LESSONS-LEDGER` L-123) — `BTY-COMP-002`.
143. **Change framing, background family, entrance direction or hero scale band between every pair of consecutive scenes**: 0 shared values on any axis, ≥ 3 framing families per film. The audience learns a template by scene two, after which the film stops being watched (`CRAFT-AUDIT.md` D8) — `BTY-COMP-003`.
144. **Give the hero a floor and the frame a foreground in every scene**: hero ≥ 25% height, 1 foreground occluder, 1 named negative-space form. Floor + foreground turn a layout into a space — `BTY-COMP-004`.
145. **Fix one HUD/label anchor per film** and hold it for every scene and both ratios; the anchor differs between ratios only by the envelope. One anchor is what makes the film feel designed rather than assembled — `BTY-COMP-005`.
146. **Name one dominant idea per frame** in the scene table and let everything else serve it; supporting elements ≤ 2. Two dominants means none — `BTY-COMP-006`.
147. **Design the end card as its own artefact** — own grid, own y ladder, own safe area — built after the rest of the film; 0 text on text; screenshot-clean at 100%. The end card gets the most per-pixel attention and the least design time (`CRAFT-AUDIT.md` D10) — `BTY-COMP-007`.
148. **Model the end card on the batch's best frame**: stroked hexagon mark + headline + subtitle + one signal CTA + legal row + product, in a 3-step hierarchy. `_frames/s10-16x9/s10_19.80s.png` is the only frame in the batch with a real lockup — `BTY-COMP-008`.
149. **Keep decorative bands, stripes and ribbons out of any legal or ISO row** (0 overlaps, enforced with a region check). A band crossing a legal row is the exact defect of the best frame in the batch — `BTY-COMP-009`.

## RATIO (150–153)

150. **Compose both ratios from one per-ratio layout table**, never as a crop; `pa-layout.js` throws if a ratio is missing. A missing entry is the mechanism by which a crop ships silently — `BTY-RATIO-001`.
151. **Review the landscape cut as its own film**: ≥ 9 landscape stills looked at plus transition frames, end card at 100%. A crop is instantly readable as an afterthought (`CRAFT-AUDIT.md` D9) — `BTY-RATIO-002`.
152. **Preserve the RTL right-hand anchor in both ratios**; the anchor x differs only by the envelope (W−72 vs W−96). Flipping the anchor edge changes where the eye starts — `BTY-RATIO-003`.
153. **Change ≥ 5 things in a genuine re-composition**: horizon line, copy rail anchor, type sizes, hero scale band, end-card grid. Five is the minimum number that cannot happen by accident — `BTY-RATIO-004`.

## PROCESS (154–167)

154. **Make `window.film.seek(t)` a pure function of t** — frame index `round(t*30)`, 0 carried state, identical hash for the same t in any call order. Purity is what makes segmented capture and QA stills trustworthy — `BTY-PROC-001`.
155. **Ban CSS animation, transition and scroll-driven effects in a film** (0 `@keyframes`, 0 transitions on the capture path). CSS runs on the wall clock, so captured frames stop matching the timeline — `BTY-PROC-002`.
156. **Load assets locally, never from a CDN**: 0 `http(s)` URLs in film source; fonts from `work/persian/assets/fonts`. A remote asset makes the render dependent on the network and on someone else's versioning — `BTY-PROC-003`.
157. **Begin every scene painter with a full-canvas base fill** of a palette token. Without it, stale pixels from the previous frame survive the cut — `BTY-PROC-004`.
158. **Ban frame-integrated effects** — temporal accumulation, feedback buffers, per-frame particle physics, GPGPU ping-pong; a bounded 2–3 ghost motion blur computed by rendering t−1 and t−2 is allowed because it is stateless. Integration is state, and state breaks seek purity — `BTY-PROC-005`.
159. **Pre-bake any integration into a table ahead of time** (`integrate(f, dt=1/30, tmax=60)`); seek only interpolates. Pre-baking keeps the expensive part out of the frame budget — `BTY-PROC-006`.
160. **Budget every frame inside 82–350ms at 1080×1920**; 540×960 numbers multiply by about 4. The capture budget is the number every other row in `frame-budget.csv` must fit inside — `BTY-PROC-007`.
161. **Treat a WebGL transition as an accent**: it straddles one cut and lasts ≤ 14 frames (~1ms/frame extra over ~3ms/frame for a plain scene; 12-frame window measured on s10 v3). A shader used twice stops being an accent — `BTY-PROC-008`.
162. **Map the five mandatory premium techniques to named scenes in the header before building**: stated key light with visible consequence, contact shadow + one real material, three-plane composition, a named easing used for mass, one hero-contrast frame. Mapping them before the build is what forces them to exist — `BTY-PROC-009`.
163. **Treat a blank header field as a build error** (0 blanks). A blank field is where a defect enters unopposed — `BTY-PROC-010`.
164. **Turn prose lessons into mechanical checks.** A lesson that is only prose ships anyway (`LESSONS-LEDGER` L-001/L-002 were re-diagnosed verbatim three days later); the 7 gates plus 12 proposed visual gates are the fix — `BTY-PROC-011`.
165. **Never present an estimate as a measurement** when quoting frame cost; 1080p is 4× the pixels of 540×960. An unlabelled estimate becomes a budget everyone plans against — `BTY-PROC-012`.
166. **Prove a new technique with a measurement before committing a shot to it** — 1 measurement at 540×960 minimum. Cost is discovered, not assumed — `BTY-PROC-013`.
167. **Keep ≤ 3 type roles and 1 live text block per region when drawing text in canvas**; region boxes disjoint by construction. Disjoint-by-construction beats disjoint-by-inspection — `BTY-PROC-014`.

## SUPPLEMENT — card-first lane, RTL mirroring, capture integrity (168–215)

Sources: `.claude/skills/persian-arts/SKILL.md` rules 9/12/17/18, `docs/PERSIAN-LOCALIZATION-LESSONS.md`,
`media/briefs-local/storylab-craft/ART-DIRECTION-STANDARD.md`, `CRAFT-AUDIT.md`.

168. **Search the card library before designing a scene**: `node work/persian/tools/cards/card-find.mjs <query>`. The library already carries art direction; hand-drawing what a card expresses better is spent budget — SKILL.md rule 18a.
169. **Pick one `visualStyle` family per film** (or a deliberate dark↔light arc) and state it. Mixed styles is the "another world" defect — SKILL.md rule 18c, rule 12.
170. **Point at the cards you compose**: name the techniques borrowed from `library/media/typography/*` and `library/media/reference/shotcraft/*/*`. The reuse map is a claim about where the design came from — SKILL.md rule 18b.
171. **Compose via `WorkbenchManifest`**, not by stringing mp4s: absolute `from`/`duration` in frames, `component` refs, `props`, `schema`, `ManifestAudio` rows. Concatenated card mp4s are a draft for approval only — SKILL.md rule 18e.
172. **Produce each ratio as its own manifest/composition**, never a crop — SKILL.md §3c.
173. **Verify the output landed where you think**: a relative `--out` plus a working directory double-nests the path — SKILL.md §3c PATH TRAP.
174. **Load every font family a card uses** (`FaRoot` loads only its given family; wrap with `<FaFonts families=[...]>` for a second family). A silently-unloaded serif wordmark renders as the default and looks like Vazirmatn — `PERSIAN-LOCALIZATION-LESSONS.md` §2.
175. **Mirror what follows reading order, keep what is physical**: mirror sidebars, rails, headers, list icons, reveals, wipes, stagger order, carousels, progress, arrows; keep gravity, 3D physics, logos, code blocks, clocks, numerals inside a number — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
176. **Re-check composition balance after mirroring.** A title that sat beside a left sidebar can straddle the mirrored edge and become illegible (page-turn-transitions) — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
177. **Recompute decoration offsets from the real glyph box** after mirroring; underlines, glints and highlight bars move when Persian line-height grows (brand-ink-open underline floated 40px low) — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
178. **Mirror chart axes and series order, keep numeric logic**: category/time axes mirrored (latest at the left end), value axis on the right, bar fill order mirrored too (`x = N-1-i` for spectrum rows) so per-index maths and seeds stay identical — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
179. **Mirror diagonal sweeps as θ → 360−θ**, band anchored on the opposite edge (`right: 0` + `translateX(dir(x))`); flip sine swing phase with `dir()`. A non-mirrored sweep runs against the reading direction — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
180. **Apply the mirror transform to the clipPath rect and the path separately.** The clipPath lives in the untransformed user space of the referencing element; mirrored clip-path karaoke is `inset(0 X% 0 0)` → `inset(0 0 0 X%)` — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
181. **Mirror path-following text x → W−x and negate the tangent angle** (RTL text reads leftwards; `rotate(+θ)` flips pieces) — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
182. **Pin RTL pairs correctly**: start word pinned by its right edge, rotating word by its left edge so it grows toward the centre — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
183. **Widen the anchor for start-anchored sentences**: Persian start-anchored strings get wider, and the longest slot item overflows the far edge — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
184. **In RTL flex rows the DOM-first child sits right**: to show «٪» left of the number put it LAST in DOM and make the number a `direction: ltr` island — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
185. **Put `flexShrink: 0` on icons in pills** and widen the container; icons vanish when a wider Persian word shrinks the SVG to 0 — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
186. **Fit-check every mock-document block against its original line count**; shorten copy rather than letting a wrapped line overlap the next block; raise column gaps so an accent word cannot merge with a neighbouring non-joiner like «در» — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
187. **Check what the original actually renders before mirroring geometry** (an SVG `rotate(-90)` with a cx offset can turn a "horizontal" chain vertical) — `PERSIAN-LOCALIZATION-LESSONS.md` §3.
188. **Keep the locked part of a scramble as one text run**; render only the hopping noise as fixed-width `inline-block` cells, keep a hidden ghost copy of the final word for stable width, and exclude Persian zero from the noise pool (it renders as a dot) — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
189. **Inline per-character spans are safe for colour/text-shadow only**; never for transforms or inline-block, and order spans logically so a lock sweep runs right-to-left automatically — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
190. **Scale per-unit stagger by `(original span)/(units-1)`** because Persian joined groups are fewer than Latin characters; keep the first and last beats on their original frames — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
191. **Split falling/dropping units only after non-joiners**, then lay adjacent groups in an rtl flex row with zero gap so they still read as one word — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
192. **Draw letter-by-letter stroke wordmarks one joined group per continuous path**, gaps only between groups; keep س teeth short and sharp and the isolated ن bowl deep, or they read as blobs — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
193. **Never redraw stroke-segment titles as straight segments in Persian**: typeset the real word and reveal disjoint clip-path rectangles. Reem Kufi and Lalezar fragment badly; Vazirmatn 900 stays legible — `PERSIAN-LOCALIZATION-LESSONS.md` §1c.
194. **Make a pen/ink effect travel right-to-left along the real glyph outline**: body strokes first, then nuqta, kashida and small marks. Left-to-right, jumping between letters, or dots-before-body are all defects — `PERSIAN-LOCALIZATION-LESSONS.md` §1b.
195. **Pair calligraphic contexts with a genuinely elegant face** (Aref Ruqaa, Noto Nastaliq Urdu, Amiri, Markazi Text, Katibeh) at generous line-height, and verify it loaded. A strange glyph shape is a defect even when the words are right — `PERSIAN-LOCALIZATION-LESSONS.md` §1b.
196. **`WebkitTextStroke` matching the fill is the one safe way to fake weight** on a single-weight face (no seams when stroke and fill match) — `PERSIAN-LOCALIZATION-LESSONS.md` §1d.
197. **For neon outlines, fill the text and build the outline with an SVG filter** (`feMorphology` dilate−erode of SourceAlpha, composite out, flood colour, `filterUnits="userSpaceOnUse"` with a large region) — `PERSIAN-LOCALIZATION-LESSONS.md` §1d.
198. **Shape text once with HarfBuzz (harfbuzzjs, temp dir outside the repo) and embed outline paths** when text must live in a mask data-URI; re-derive any scale origin inside a solid stroke — `PERSIAN-LOCALIZATION-LESSONS.md` §1d.
199. **Add `wordSpacing` (~0.15em) to Lalezar at very large sizes** so two words do not read as one — `PERSIAN-LOCALIZATION-LESSONS.md` §2.
200. **Use Vazir Code only for code/terminal chrome** — it renders Persian stretched and unspaced; switch Persian runs inside code to Vazirmatn — `PERSIAN-LOCALIZATION-LESSONS.md` §2.
201. **Use Amiri for an editorial Persian serif** (Markazi Text's serif look is Latin-only; Markazi 700 is a good weight match for a Helvetica-800 original when sans is acceptable) — `PERSIAN-LOCALIZATION-LESSONS.md` §2.
202. **Replace an italic accent word with colour and/or a heavier stroke** — Persian has no italic — `PERSIAN-LOCALIZATION-LESSONS.md` §2.
203. **Use Persian digits in UI and headlines; keep Latin digits inside code, URLs and version strings** — `PERSIAN-LOCALIZATION-LESSONS.md` §4.
204. **Rasterise the real font into a dot-matrix grid** or keep the large-type fallback; verify the payoff frame's legibility specifically — `PERSIAN-LOCALIZATION-LESSONS.md` §4.
205. **Translate idiomatically for the demo's world** ("Ship" → «عرضه کن», "60s ago" → «۶۰ ثانیه پیش»), and keep the original timing beats when Persian length changes — `PERSIAN-LOCALIZATION-LESSONS.md` §5.
206. **Blur baked-in foreign text ≥ 16px, replace the plate, or regenerate**; mirror an image only if it carries no text — `PERSIAN-LOCALIZATION-LESSONS.md` §6.
207. **Take the design length from the source prompt**, not from a registry duration (30f cards whose design is 144f; a "40f" misparse of 140f) — `PERSIAN-LOCALIZATION-LESSONS.md` §7.
208. **Grep for temporary peeks (`FRAME_OFFSET`, `useCurrentFrame() + N`) before shipping**; never leave them in source — `PERSIAN-LOCALIZATION-LESSONS.md` §7.
209. **Keep header comments truthful** — reviewers flag mismatches such as "130×170 cells" when the code says 144 — `PERSIAN-LOCALIZATION-LESSONS.md` §7.
210. **Write with `encoding="utf-8"` for every Persian JSON/text read and write on Windows**; the cp1256 default silently no-ops a separator cleanup and can cut a phrase mid-glyph — `PERSIAN-LOCALIZATION-LESSONS.md` §7.
211. **Set keyframe interval ≤ 2 s on any capture encode** (`-g 60` at 30fps); x264's default keyint gives `gop=8.33s` and fails TV `gop_le_2s` — SKILL.md rule 17c (L-127).
212. **Never capture two films or ratios in parallel without automatic port isolation** (`capture.mjs` picks a free DevTools port) — a pinned port is a collision waiting to happen (L-112) — SKILL.md rule 17a.
213. **Re-encode joined capture segments**; segmentation bypasses per-segment encoder settings, and stream-copying produced a 17.1MB final (L-129) — SKILL.md rule 17b.
214. **Regenerate stills from the FINAL mp4 after the last render** (10 of 11 s09 stills disagreed with the delivered file, MAD 8.3–29.1) — SKILL.md rule 17e (L-119).
215. **Never enable a debug overlay on the capture path** — no gate detects one; grep the film source for `debug=2` / `&debug=` before capture — SKILL.md rule 17g (L-116).
