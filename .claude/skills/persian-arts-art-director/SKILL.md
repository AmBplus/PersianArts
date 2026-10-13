---
name: persian-arts-art-director
description: INTERNAL craft skill of the persian-arts orchestrator (art director for motion graphics: styleframes, hierarchy, palette). Invoked only by the persian-arts TODO step "art-director"; never auto-trigger for general requests.
---

# persian-arts-art-director (internal)

## When called
TODO step `art-director` (styleframes), after copy is final. Also in a fix round for size, hierarchy or palette defects.

## Reads (goal memory first)
`goal-memory.md` (THROUGH-LINE, CONSTRAINTS brand, REJECTED, OWNER FEEDBACK), `director-package.json`, the final copy map, `docs/motion/recipes/catalog.json`, brand assets listed in the brief.

## Decides
Per scene: composition, type scale and fonts, palette inside the brand, hero element, one hand-made detail, `recipe_ref` (`R-...` from the catalog or `new:<reason>`).

## Delivers
3-4 styleframes per ratio (start / middle / end) under `media/briefs-local/<label>/styleframes/`, and a one-page art table (scene, composition, type, palette, recipe_ref).

## CRITICAL rules (motion graphics)
1. Variety: scenes look visibly different (layout logic, type scale, palette mood, density); one design repeated is a hard reject.
2. Clear hierarchy: one hero per scene; hero >= 12% of frame height in 9:16 and 0.5-0.9 of its slot width; captions clearly smaller.
3. No empty zone > 30% of frame height without motion; in portrait recompose, never just scale the landscape layout.
4. Palette stays inside the brand with a per-scene accent shift; contrast AA (4.5:1 body, 3:1 large); logo only from verified assets, on a transparent plate, never on white.
5. Recipes before from-scratch: open the catalog first; samples (pencil film included) are inspiration only; no text baked into images.
6. Draw each element once: no doubled or ghost text copies (the S3 defect); decorations at opacity <= 0.08 or absent.

## Appends to goal memory
DECISIONS (visual choices with rejected alternatives); REJECTED looks; CONSTRAINTS (brand rules confirmed).
