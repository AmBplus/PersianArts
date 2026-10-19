# craft: light and depth

Why frames read as premium or cheap, in the order the eye resolves them: value structure first, material second,
atmosphere third. Ids are `data/beauty-rules.csv`.

## 1. The light model comes before the drawing

Declare in the header, before any scene exists: `KEY` (direction, colour hex, softness, intensity), `FILL` %, `RIM`
px, `AMBIENT` floor — `BTY-LIGHT-001`. Mechanism: a stated key is the single reference every shading decision traces
back to; without it there is no lit side, so no material. The audit's D1 is exactly this failure: objects "lit by
nothing" — the s08 jar is a vertical even gradient with no falloff, core shadow or bounce
(`CRAFT-AUDIT.md` D1, `_frames/s08-9x16/s08_06.75s.png`).

One `hero lit frame` per film: the source visible in frame and its effect readable on ≥ 2 surfaces
(`BTY-LIGHT-009`). Mechanism: a light the viewer can locate turns the frame into a place; light with no source is a
smudge (s12's "searchlight" ellipses read as lens dirt, `CRAFT-AUDIT.md` D1).

## 2. Elevation: the five-term stack

Per non-flat object, in order — base gradient → core shadow → contact shadow → rim → ambient falloff (`BTY-LIGHT-003`).
Mechanism: each term answers a different perceptual question. Base gradient = surface orientation. Core shadow = which
way the form turns. Contact shadow = whether it touches the ground. Rim = that the edge is a real edge. Ambient = the
depth of the room. Skip one and the object collapses to a sticker.

Numbers that hold up: lit:shade ≥ 1.35:1 in L*, shade ≥ 20% darker than base, soft terminator, rim 2–4px at 1080 and
≥ 15% L* above base, corners ≥ 10% L* darker than centre, ambient corners 8–14% per shadow step of the page hue
(`BTY-LIGHT-002`, `BTY-LIGHT-005`, `BTY-LIGHT-006`, `BTY-LIGHT-016`).

## 3. Contact shadow is the cheapest depth in the frame

Short dark ellipse under anything grounded: width ~1.15× base, height 8–14% of it, alpha 30–50%, radial gradient to
transparent, drawn **before** the object (`BTY-LIGHT-004`). Mechanism: a grounded object and a floating one differ by
one dark ellipse; without it props "sit on the frame rather than in the world" (`CRAFT-AUDIT.md` D6 — s09 jars, s10
billets).

## 4. Glow and emission

Two-stop glow with true falloff plus a hot core: core alpha 0.85–1.0 at ≤ 0.35× radius, falloff to 0 at 1.6–2.2×
radius, ≤ 1 emissive accent per frame, ≤ 2 signal uses per scene (`BTY-MATERIAL-005`, `BTY-LIGHT-012`). Mechanism: a
glow is read as emitted light only if it has a hot centre and a long tail; a flat hard-edged halo reads as a sticker.
Scale the treatment to host size (`hr *= clamp(h/320, 0.42, 1.15)`) or a small prop looks radioactive and a large one
dead (`BTY-LIGHT-011`).

Atmosphere light is built from elongated soft radial pools with falloff, core peak ~0.14 alpha, two nested pools,
outermost stop fully transparent (`BTY-LIGHT-008`). Mechanism: above ~0.25 alpha a pool stops being light and becomes
paint; a clipped polygon with a hard edge is never light (`BTY-LIGHT-010`). The batch's proven model is the s08
pendant-lamp pool with dust and bokeh — pool ≥ 1.2× hero width, 20–40 motes, ≤ 30 bokeh sprites at 0.06–0.18 alpha
(`BTY-LIGHT-018`).

## 5. Ambient occlusion illusion without a 3D renderer

Three cheap stand-ins, all stateless in `t`:

1. A tight ellipse or radial gradient where the object meets its support (`BTY-LIGHT-004`).
2. An inner shadow term on recessed panels (8–14% L* darker at the top edge) — frosted glass, cards, wells (`BTY-MATERIAL-006`).
3. A corner vignette (0 → 0.62 alpha of the page-hue shadow token) which reads as a lens and as room depth at once (`BTY-TEXTURE-005`, `BTY-LIGHT-006`).

Never grey: shadows are the page hue at three darker steps, 8–14% L* apart (`BTY-LIGHT-016`). Mechanism: grey shadows
under a tinted light are the fastest tell that the "light" is a gradient, not a source.

## 6. Shadow stacking and depth planes

Three planes minimum — foreground occluder, subject, environment — separated by ≥ 15% L*, by focus and by grain
(`BTY-DEPTH-001`, `BTY-LIGHT-013`). Blur the background 3–8px at 1080 and cap its detail at < 40% of the subject's;
give it more grain than the foreground (6–10% vs 2–4%) (`BTY-DEPTH-003`, `BTY-DEPTH-004`). Add haze 8–18% of the
environment colour, densest at the horizon (`BTY-DEPTH-011`). Mechanism: the eye separates planes by value gap and
detail density, not by perspective lines — a floor grid identical in every shot is a watermark, not a room
(`CRAFT-AUDIT.md` D4).

## 7. Contrast ratios that read as "expensive"

- Body text ≥ 4.5:1, large text ≥ 3:1, measured on the rendered pixels behind the text (`BTY-TYPE-008`).
- Surface ≥ 12% L* from page; ≥ 15% between adjacent planes (`BTY-COLOR-002`).
- Ink is never pure `#000`; mix toward the key hue (`ART-DIRECTION-STANDARD.md` §1).
- Exactly one white token in the film (`BTY-TYPE-027`).
- One hero-contrast frame, named, ideally the end card (`BTY-COLOR-008`).

Mechanism: "expensive" is a small number of large, deliberate value steps — a dark room with one lit pool and a clean
white type layer. Cheap is many small competing steps of similar value.

## 8. Why muddy mid-tones kill it

Muddy = everything sits in the 35–65% L* band with low separation. Symptoms: surface 12% or less from page
(`BTY-COLOR-002`), planes under 15% apart (`BTY-LIGHT-013`), a background whose detail density matches the subject's
(`BTY-DEPTH-003`), ambient light used as the only light term (D1). Mechanism: the eye uses relative value to segment,
and a narrow band gives it nothing to segment with, so the frame reads as grey noise regardless of how many gradients
are in it. The fix is never more gradients — it is fewer values, further apart.

## 9. Failure modes seen in this repo (do not repeat)

- Evenly lit field, no source, no ratio between lit and unlit — `CRAFT-AUDIT.md` D1.
- Semi-transparent grey ellipses as "light" — `CRAFT-AUDIT.md` D1 (s12).
- Flat single-fill props: glass as 1px outlined ellipses, a paper bag as a pure white polygon — `CRAFT-AUDIT.md` D6.
- One stage repeated with a swapped prop: seven s10 frames share pillars, ceiling lamps, wall, floor grid and title
  position — `CRAFT-AUDIT.md` D8.
- Lighting idea present but object shading and dead floor undercut it — `CRAFT-AUDIT.md` credit note (s08).
