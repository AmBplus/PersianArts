# craft: premium techniques

Premium is not a budget line. In this repo it is a short list of decisions that were measured as *missing* in five
delivered films whose vocabulary was already sufficient (`CRAFT-AUDIT.md`: "a designer with canvas2d gradients, blend
modes, shadowBlur, per-ratio layout and a spring easing can absolutely build a premium short film").

## 1. The five mandatory techniques (name the scene for each, in the header)

`BTY-PROC-009`, `ART-DIRECTION-STANDARD.md` §6:

1. **A stated key light with a visible consequence** — one frame where the viewer could point at the source and trace
   its effect across ≥ 2 surfaces (a lit rim, a cast shadow, a pool with soft falloff). `BTY-LIGHT-009`.
2. **A contact shadow under every grounded object**, plus one object with a genuine *material* treatment — metal
   two-tone reflection, glass with specular streak and edge, paper with fibre and a fold. Flat fill is banned.
   `BTY-LIGHT-004`, `BTY-MATERIAL-001`.
3. **A three-plane composition** with a real foreground occluder, in ≥ 1 scene per film, both ratios.
   `BTY-DEPTH-001`, `BTY-DEPTH-002`.
4. **A named easing used for mass** — `spring` or `outBack` on a physical prop, with anticipation and follow-through.
   `BTY-MOTION-006`, `BTY-MOTION-004`.
5. **A hero-contrast moment** — one frame where type, scale, colour and light all peak; ideally the end card, and it
   must be clean enough to screenshot. `BTY-COLOR-008`, `BTY-COMP-007`.

Mapping them before the build is what forces them to exist; a blank header field is a build error (`BTY-PROC-010`).

## 2. Real depth

Depth is three planes separated by value (≥ 15% L*), focus (background blur 3–8px) and grain (background 6–10% vs
foreground 2–4%), plus haze 8–18% at the horizon and atmosphere drawn both behind and in front of the subject
(`BTY-DEPTH-001`, `BTY-LIGHT-013`, `BTY-DEPTH-003`, `BTY-DEPTH-004`, `BTY-DEPTH-011`, `BTY-LIGHT-014`). Mechanism: the
eye segments on value and detail density; blur alone does not create separation. Measured failure: an identical floor
grid in every shot is a watermark, not a room (`CRAFT-AUDIT.md` D4).

## 3. Restrained palette

Six tokens, one accent with one job, signal ≤ 2 uses/scene, 60/30/10 area budget, one temperature, one white
(`BTY-COLOR-001`, `BTY-COLOR-003`, `BTY-COLOR-004`, `BTY-COLOR-006`, `BTY-LIGHT-015`, `BTY-TYPE-027`). Mechanism:
"expensive" reads as a small number of large deliberate value steps. Measured failure: five colour worlds including the
end card, and two near-whites in one film (`CRAFT-AUDIT.md` D5).

## 4. One idea per beat

One dominant idea per frame, supporting elements ≤ 2, ≤ 3 type roles including the numeral, one live text block per
region (`BTY-COMP-006`, `BTY-TYPE-004`, `BTY-TYPE-024`). Mechanism: attention is a single slot; two dominants means
neither lands. Corollary: one effect per beat (`effects-and-craft-kit.md` §0.3).

## 5. Deliberate imperfection

- Vary duplicate props: rotation ≥ 3°, depth ≥ 12% scale, separate occlusion — or use one hero (`BTY-MATERIAL-008`).
- Seeded wobble/sketch character (`lib/pa-ink.js` seeded wobble; `line-boil` in the shotcraft library) instead of
  mathematically perfect straight lines.
- Uneven paper edge and fold (`BTY-MATERIAL-003`); a soft mask edge (2–6px feather) rather than a 1px step
  (`BTY-TEXTURE-010`).
- A little optical chromatic aberration at lens scale (0.5–2px) (`BTY-TEXTURE-007`).
Mechanism: perfect regularity is the signature of a generated frame; small, *seeded* irregularities read as material
and as a camera, and seeded keeps `seek(t)` pure.

## 6. Texture

Grain 3–8% opacity with overlay/soft-light from 6–10 pre-rendered tiles swapped by frame index; paper from one seeded
fractal-noise tile plus a wide 6–12% L* gradient; bokeh ≤ 30 sprites with one layer blur; atmosphere motes
(`BTY-TEXTURE-001`, `BTY-TEXTURE-002`, `BTY-TEXTURE-009`, `BTY-TEXTURE-008`, `BTY-LIGHT-014`). Mechanism: a synthetic
image has no micro-structure, so the eye reads it as vector; a light, *static-per-frame* grain layer supplies the
missing high-frequency information and hides banding.

## 7. Vignette

Corners ≥ 10% L* darker than centre, extreme-corner alpha 0.45–0.65 in the page-hue shadow token
(`BTY-LIGHT-006`, `BTY-TEXTURE-005`). Mechanism: a corner falloff is a lens signature; it also gives the frame a
centre of gravity for free.

## 8. Optical, not mathematical, alignment

Align to the measured ink box of the real string, not to a grid of Latin character widths (`BTY-TYPE-019`,
`BTY-FA-026`); a label's rule is the measured label width (`BTY-TYPE-010`); underlines clear the measured descender
(`BTY-TYPE-018`); the copy rail is a column edge, not a rounded pixel value
(`composition-and-variety.md` §4). Mechanism: the eye aligns visible ink, not boxes — box-perfect alignment looks
slightly wrong and nobody can say why.

## 9. "The last 10%"

The items that are cheap, invisible in a spec, and decisive on screen:

- Contact shadow under everything grounded (`BTY-LIGHT-004`) — the single cheapest fix in the whole standard.
- One rim per object (`BTY-LIGHT-005`).
- Ambient falloff so the frame has a lens (`BTY-LIGHT-006`).
- Settle after the stop, follow-through on the trailing element (`BTY-MOTION-004`).
- One hold per film where nothing moves but the air (`BTY-MOTION-011`).
- HUD anchor fixed; nothing in the HUD eases (`BTY-MOTION-009`).
- One white token (`BTY-TYPE-027`); one accent job (`BTY-COLOR-006`).
- End card built last, as its own artefact, screenshot-clean (`BTY-COMP-007`).
- Landscape cut reviewed as its own film (`BTY-RATIO-002`).
- Stills regenerated from the final mp4 before judging anything (`BTY-PROC` chain; `SKILL.md` rule 17e, L-119).

## 10. Anti-patterns that read as generic (from the audit)

Flat single-fill stickers (D6) · a hero at 8% of frame area (D7) · a 90% blank scene (D7) · one stage for the whole
film (D8) · a re-cropped landscape (D9) · an end card that stops being designed (D10) · text on text (D3) · a migrating
HUD (D3) · one weight carrying every word (D2) · an arbitrary palette (D5) · objects lit by nothing (D1) · a
decorative grid identical in every shot (D4). Every one of these is free to fix and none required a new renderer.

## 11. The mechanism behind all of this

`BTY-PROC-011`: a prose lesson is advisory; only a mechanical check is not. `LESSONS-LEDGER` L-001 ("one design
repeated, robotic template across scenes") and L-002 were recorded on 2026-10-13 and re-diagnosed verbatim on
2026-10-16. Premium is therefore not a taste claim here — it is a list of checks that must be run
(`checklists/pre-delivery.md`, `tools/lint-film.mjs`).
