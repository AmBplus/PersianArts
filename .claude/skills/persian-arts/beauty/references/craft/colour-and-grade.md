# craft: colour and grade

Six tokens, one accent, one hero-contrast frame, one grade recipe. Anything else is scene-by-scene decoration.
Palettes with measured contrast live in `data/palettes.csv` (`BTY-PAL-001` … `BTY-PAL-024`, plus the measured library rows — see §8); check a candidate with
`node .claude/skills/persian-arts/beauty/tools/palette-contrast.mjs`.

## 1. Palette construction

Six tokens, declared as CSS custom properties **and** mirrored in a JS object for canvas fills
(`BTY-COLOR-001`, `ART-DIRECTION-STANDARD.md` §1):

| token | role | constraint |
|---|---|---|
| `ink` | darkest value, text and silhouette | never pure `#000`; mix toward the key hue |
| `page` | the field the world sits on | a **hue**, saturation ≥ 12% (`BTY-COLOR-005`) |
| `surface` | objects, panels, cards | ≥ 12% L* from page (`BTY-COLOR-002`) |
| `accent` | brand hue, one per film | logo + primary CTA only (`BTY-COLOR-006`) |
| `signal` | one attention colour, different hue from accent | ≤ 2 uses/scene, ≤ 1/frame (`BTY-COLOR-004`) |
| `shadow-1..3` | the same hue as page, 3 steps darker | 8–14% L* per step, never black, never grey (`BTY-LIGHT-016`) |

Mechanism: with no token layer there is nowhere to put a colour system, so each scene picks colours ad hoc — this is
the literal mechanism by which the navy→green→brown→purple→end-card-blue sequence shipped (`CRAFT-AUDIT.md` D5;
measured: 0 CSS custom properties in all five films).

Area budget: ~60% page / 30% surface / 10% accent+signal across the film (`BTY-COLOR-003`). State the accent budget
per scene as a percentage in the scene table (`BTY-COLOR-010`). Mechanism: an accent is defined by scarcity; past
~10% area it becomes the field and the CTA stops being findable.

## 2. ONE accent rule

One accent colour per film, one job (brand mark + primary CTA), ≤ 10% area (`BTY-COLOR-006`). Signal is a *different*
hue and even scarcer (`BTY-COLOR-004`). Mechanism: two colours doing the same job cancel; the eye needs one "act here"
colour. Corollary: the accent is the only element allowed to be the most saturated thing in frame.

## 3. Dark↔light arc

Scene tinting, not scene recolouring: shift the *value* or *saturation* of `page` per scene within ±12% L* or ±10%
saturation; 0 new hue families after scene 1 (`BTY-COLOR-007`). Grade warm-to-cool across the run — page saturation
shift up to 10%, key-hue temperature slide 6–14% (`BTY-COLOR-011`). Mechanism: a slow single-axis drift gives the film
an arc the viewer feels without noticing, while a new hue family per scene gives every beat equal importance, so
nothing leads and nothing resolves.

The end card stays in the page-hue family and on the one white token (`BTY-COLOR-009`). Mechanism: the end card is the
frame the client screenshots; a fifth world there reads as a different film (D5, D10).

## 4. Grade moves (fixed three-step recipe)

1. Cool the shadows: one `multiply` layer, `rgba(fill, .20)`.
2. Warm the highlights at the key: one `screen` layer with a radial key gradient 0.13 → 0 centred on the key position.
3. Vignette the corners: `source-over` radial of the `shadow-2` token, 0 → 0.62.

Then an ACES-filmic tonemap over the composite (Narkowicz 11-instruction fit, exposure 0.9–1.1, ~2–4ms fullscreen at
1080×1920) — `BTY-TEXTURE-005`, `BTY-TEXTURE-004`. Mechanism: the split-tone creates a colour opposition between
shadow and highlight that reads as photographed light; the filmic curve rolls highlights instead of clipping them,
which is most of what "expensive" means.

Optional, capped: chromatic aberration 0.5–2px radial (`BTY-TEXTURE-007`), quarter-res two-mip bloom
(`BTY-TEXTURE-006`), ≤ 30 bokeh sprites (`BTY-TEXTURE-008`). Mechanism: each is a *lens* artefact; used at lens scale
they read as glass, used large or uniformly they read as a broken codec.

## 5. Harmony

- One light temperature per film; every gradient, glow and shadow tint derives from it (`BTY-LIGHT-015`).
- Cool fill ≤ 25% and stated as fill (`BTY-LIGHT-007`).
- Material gradients run along the declared light axis, within 20° of the key (`BTY-MATERIAL-007`).
- Unify mixed imagery with a duotone or gradient map: 2 hues, grayscale contrast 1.1, one multiply layer for
  highlights and one screen layer for shadows (`BTY-COLOR-012`). Mechanism: a duotone forces every source into the
  film's two hues, which is how one world is maintained across cards with different original looks (SKILL.md rule 18c).

## 6. Avoiding the default-gradient look

The default-gradient look = a linear two/three-stop ramp between two unrelated hues, centred, used as the field.

- Build the field from 3–6 soft radial blobs on a dark base, each 50–70% extent, centres moving, two hues plus one
  accent (`BTY-TEXTURE-003`). Mechanism: real light in air is radial and uneven; a linear ramp is the shape a
  template takes.
- Keep page a hue with saturation ≥ 12% rather than a neutral, so the shadows inherit a colour (`BTY-COLOR-005`).
- Never place a second hue family in the same frame just to distinguish regions; use value and surface instead
  (`BTY-COLOR-007`).
- Cap the gradient at the material's own light axis (`BTY-MATERIAL-007`); a gradient that ignores the key reveals that
  the "light" is arbitrary.

## 7. Palette selection from the data layer

`data/palettes.csv` carries 24 named palettes, each with `world`, `mood`, `use_when`, `avoid_when` and measured
contrast notes (e.g. `BTY-PAL-001` دمنوش گرم — warm tisane: ink/page 13.5:1 PASS, muted/page 4.7:1 PASS, accent/page
4.3:1 PASS large, signal/page 5.0:1 PASS large, surface-page L* 15.0 PASS). Search with
`node .claude/skills/persian-arts/beauty/tools/craft.mjs find "<world>"`, then quote the palette id in the film header
and re-measure the actual pixels behind the text (`BTY-TYPE-008`). Mechanism: picking from a measured palette turns a
taste argument into a constraint check.

## 8. Measured library palette (from `library-design-system.md`, n=251)

The 39 typography posters of the shipped library run on **one navy plate, `#0D1D2C`** — 89.7 % of them
(4.2 % of the 212 shotcraft posters) — and library-wide the light mode is **neutral cream `#F4F4F3`**
(148/251 posters, 59.0 %), not a tinted page. Both are now rows in `data/palettes.csv`: `BTY-PAL-023`
(navy house plate) and `BTY-PAL-024` (neutral cream). History: the pack's creams were *tinted*
(`#F2E3C9`, saturation 0.17) while the measured library cream has saturation 0.004 — a real difference,
not a rounding artefact; `#F4F4F3` was added, nothing was removed.

- **Accent hue ranking:** desaturated gold `#B27338` (7) → `#CE924A` (5) → violet `#5B2E6F` (5) →
  `#36446B` (4). Family counts are cluster medoids from the report, not exact `accent_hex` matches.
- **Accent area:** median **1.22 %** of the frame (p90 11.35 %, max 32.96 %); only 6 of 44 accent posters
  pass 10 % — so `BTY-COLOR-010`'s ceiling is real and the median is the working bar.
- **Contrast:** typography median background-vs-ink **5.76:1**; library median 3.98:1 and only 33.5 % of
  posters reach 4.5:1, so grade to the typography bar, not the corpus median (`BTY-COLOR-014`).

Rules for these facts: `BTY-COLOR-013/014/015`; confirmations in
`media/briefs-local/storylab-beauty/rule-confirmations.csv`.
