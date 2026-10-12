# Anti-slideshow: what makes a film feel authored

A generated film fails as a "slideshow" in recognisable ways: scenes crossfade, every element shares one
ease-in-out, everything arrives at once and evenly spaced, springs bounce like a template, music is laid on at
the end, every scene is a centred title on a background, and the same hero device repeats under new text.
This file is the cure. Numbers and sources: `techniques/` and the timing table below (adapted from
atmirrr/persian-motion-director, MIT).

## Continuity — how scenes connect

- **Never crossfade scene to scene.** A dissolve reads as a slide change. Connect scenes with one of:
  - **One camera** travelling across a strip of scenes: small wind-up, whip with directional blur, settle.
    In RTL the camera's "forward" travels leftward. (`techniques/01-one-camera.md`)
  - **One object carries across**: the hero element stays mounted above the scenes and morphs its position,
    size, radius and colour into the next state. (`techniques/02-one-shape.md`)
  - **Cut on the fastest frame**, on the beat or 2 frames before, and continue the motion at the same speed.
  - A transition ingredient from `catalog/` (wipe, page-turn, carry) used *because the content changes meaning*.
- Pick **at most two transition families** per film and give each a meaning (e.g. carry = same topic continues,
  whip = new chapter).

## Timing and curves (theme `motion` tokens encode these; do not fight them)

| Situation | Rule |
|---|---|
| Entrance | `cubic-bezier(.16,1,.3,1)`, ≈ 20 f @60fps / 10 f @30fps |
| Exit | `cubic-bezier(.7,0,.84,0)`, ≈ 8 f @60fps / 4 f @30fps, only ~70 % of the travel |
| Stagger | 2–4 frames @60fps, on a curve (lead element first), never perfectly even |
| Scale-in | start at ~0.93 with opacity 0, never from 0 |
| Springs | text: no overshoot; UI: ≤ 2 % (stiffness 100 / damping 16). Remotion's default spring (16 % overshoot) is the template look |
| Multi-point moves | ease one progress value and map it through the points |
| Holds | hold long enough to read (≈ 0.25 s per word + 0.5 s); during a hold only the camera breathes (zoom 1.00 → 1.04) |
| Motion blur | along the direction of travel, proportional to speed; never across a cut |

## Scene design — every scene earns its place

For each scene answer, in `film.json`, before building:

- `purpose` — what this beat does that no other beat does. If two scenes can merge without loss, merge them.
- `primarySubject` — the thing the eye should land on: a diagram, a number, a word, an object, a character,
  a void. **No two consecutive scenes share a primary subject or a layout.**
- Contrast with neighbours on at least two axes: composition (centred / thirds / split / full-bleed), scale
  (close / wide), motion register (still / busy), palette emphasis, type treatment.
- The **signature device** from `direction.md` appears in one or two beats — usually the climax — not as
  scaffolding under every scene.

## Slideshow risk score (computed at storyboard and after the cook)

Score each dimension 0–5 (lower is better); average ≥ 3 → revise the plan, any dimension ≥ 4 → critical.

| Dimension | Smells like |
|---|---|
| repetition | same layout or shot size in consecutive scenes; one transition everywhere |
| decorative | layers with no stated job; particles and glows as filler |
| weak motion | movement without a reason; everything moves all the time, or nothing does |
| weak intent | scenes missing `purpose` / `primarySubject`, or a vague one ("show info") |
| text-card reliance | > 40 % of scenes are a title or text over a background |
| fades | any scene-to-scene crossfade; opacity-only entrances on most elements |

## Restraint

- Every move means something. One signature behaviour, reused deliberately.
- Texture only with a physical reason (paper, print, light). Default grain, halftone finales and ASCII shaders are
  the AI look of 2026.
- Build a system — 3 curves × 3 durations, a grid, a type scale — not one-off animations. The theme is that system.
- The final test: **could this film belong to any other topic after replacing the words?** If yes, the direction
  is too generic — go back to stage 1.
