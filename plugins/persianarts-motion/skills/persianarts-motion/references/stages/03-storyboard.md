# Stage 3 — Storyboard → `film.json` draft + animatic

Goal: the whole film decided on paper, on the bar grid, before any real build.

1. Write the copy for every scene (Persian, natural, short — `../persian/copy.md`). Respect the user's verbatim
   copy. Reading time ≈ 0.25 s/word + 0.5 s.
2. Lay scenes on the section map: each scene `at`/`until` in `bar N` (or `bar N beat M`) of the **edited film
   timeline** (not the source track; `music.edits[]` maps one to the other). No music: seconds (`"4.5s"`).
3. For each scene write `purpose`, `primarySubject`, then pick layers from `catalog/INDEX.md` (read
   `../craft/cooking.md`). Mark ingredients you will bring yourself as `"use": "project:<layer>.<name>"`. Put the transition in the
   scene's `transition` field.
4. Choose 1–2 transition families with meanings; assign per scene.
5. Mark the climax (the signature device) and the energy curve: low → build → peak → resolve.
6. Run `pa validate film.json` — schema, slot text fits, slideshow risk, scene distinctness, music rules. Fix until
   clean. Without the tool: validate against `schemas/film.schema.json`, run `lint_fa.py film.json`, and score
   slideshow risk by hand (`../craft/anti-slideshow.md`) in a table in `direction.md`.
7. Render the animatic (`pa animatic`): grey boxes and real text on the real music at low resolution. Without
   the tool (phase 0) skip it and say so.

✋ Co-create: show the scene table (bar range · purpose · primary subject · ingredients · copy), the risk score and
the animatic. End the turn.
