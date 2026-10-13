# Recipe library

Proven, reusable motion recipes, so a Builder never starts from zero and quality does not drop between films.
Catalog: `docs/motion/recipes/catalog.json` (22 entries at creation). Used by the Director (`recipe_ref` in `director-package.json`) and by the Builder (starting code).

## Entry format

| Field | Meaning |
|---|---|
| `id` | `R-<kebab>`; referenced from `scenes[].recipe_ref`. A scene with no fitting recipe writes `new:<reason>`. |
| `status` | `verified-in-film` (used in a rendered film) or `candidate` (idea only, never built into a Persian film). |
| `communicates`, `dramatic_function` | What the viewer understands; the role in the story (hook, proof, journey, resolution, transition, craft utility). |
| `suits` | `goals` and `genres` it fits (genres as in `brief.schema.json`). |
| `source` | Paths of working code (idea source in `idea_source` for derived pieces). |
| `params` | The knobs that were set in the film (counts, timings, palette, exit). |
| `frames_range`, `preview`, `regen` | Frames in the source film, still paths, and the command that regenerates them. Stills are git-ignored media: they must be regenerated, never assumed present. |
| `pitfalls` | Known traps, each tied to a defect when one was measured. |
| `gates` | `passed`, `failed_or_open`, `evidence` path (FILM-GATES rows or a review). |
| `ratios` | `9x16`, `1x1`, `4x5`, `16x9`: `true`, `untested`, or a failure note. Verified entries so far were rendered in 9x16 and 16x9 only. |

## Rules

1. A recipe is a starting point, not a template to paste: the Director states `reuse_category` (reused / adapted / idea-derived / new) per scene.
2. After every film, the Builder updates the entry it used: new pitfalls, gate results, ratio status. A recipe whose review failed keeps the failure in `failed_or_open` until a later render passes.
3. New recipe = new entry only after the scene passed independent QC (score >= 85) in a rendered film; before that it stays in the film's plan.
4. Regenerate stills: `pwsh -File work/persian/render_all.ps1 -Film uni/long -Mode stills -Ratios 9x16,16x9 -Bpm 120 -T0 0 -Frames <list> -OutDir media/film-versions/uni/long-v4/stills-a`.
5. Logo recipe (`R-logo-layered-svg`): SVG as is, otherwise layered redraw with an overlay difference score; confidential layers stay in git-ignored folders.
