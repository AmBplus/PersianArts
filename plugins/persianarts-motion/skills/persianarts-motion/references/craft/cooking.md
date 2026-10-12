# Cooking: how to combine ingredients into a new scene

## What an ingredient is

An ingredient is a tested piece of motion with a **locked choreography** and a **free surface**:

| Locked (its identity — do not change) | Free (yours to set) |
|---|---|
| the move itself: path, easing family, stagger ratio, rhythm of its internal beats | all text and data (`slots`) |
| what makes it work in Persian (joined groups, prefix typing, mask slack) | tuning within ranges (`knobs`): density, direction, count, intensity |
| its internal timing proportions | its duration within `duration.min…max` (proportions scale) |
| | its whole look — colours, fonts, texture — which come from the **theme** |

Every ingredient lives in one **layer**. A scene is a stack of layers, usually 2–4:

| Layer | Job | Examples |
|---|---|---|
| `background` | space and mood, never the subject | dot-field wave, aurora, paper, grid, void |
| `layout` | where things sit; the composition grid | split-compare, centre-halo, list-column, bento |
| `text` | how words arrive and leave | paper-cut words, prefix type, word relay, marker underline |
| `element` | the information object | counter, chart build, step list, hub map, card stack |
| `camera` | how we look at it | breath zoom, 2.5D push, crash zoom, whip pan |
| `transition` | how this scene becomes the next | one-shape carry, page turn, wipe, beat cut |
| `accent` | one moment of emphasis | underline, halo, confetti, spark, stamp |

## The recipe for a good scene

1. **Start from the beat's job**, not from the pantry. Write `purpose` and `primarySubject` first.
2. **Choose the element or text ingredient that *is* the primary subject.** Exactly one hero per frame.
3. **Add a background that supports it** — lower energy than the hero, and different from the previous scene's.
4. **Add a camera move only if it means something** (focus, reveal, travel to the next idea).
5. **Add at most one accent**, timed to the musical hit of the scene.
6. **Choose the transition** by meaning (continue / new chapter / contrast), from the film's 1–2 families. Put it in
   the scene-level `transition` field of `film.json` (not as a layer); it plays at the end of the scene into the next.
7. **Check contrast with neighbours** (anti-slideshow §Scene design) and the energy curve of the film.

Good mixing makes something none of the ingredients was on its own — e.g. the *marker underline* accent landing
on a word delivered by *paper-cut words*, over a *dot-field* background whose density drops at the hit, with the
camera breathing in. Bad mixing stacks four loud ingredients that compete for the eye.

## Compatibility rules

- Energy: the hero ingredient's `energy` ≥ every other layer's; at most one layer at energy ≥ 4.
- Two text ingredients in one scene only if one is clearly secondary (caption / kicker) and smaller.
- Layers that move the whole frame (camera, some transitions) don't stack: one frame-mover at a time.
- Respect `goodFor` / `avoidFor` in each ingredient's meta; `avoidFor` is a strong hint, not a hard ban — break it
  only with a reason written in the scene's `notes`.
- Persian flags: an ingredient with `fa.perLetter: true` needs shaped outlines or ZWJ splitting for its slot text;
  `fa.needsMaskSlack` means keep line height ≥ the value in the theme font.

## Recipes are for learning

`recipes/<name>/` holds example films: `film.json`, a still contact sheet, and `WHY.md` explaining the choice for
every scene. Read one or two close to your brief to see *how* good combinations are built. Then cook your own:
change the theme, re-order and re-cast scenes, swap ingredients, invent new combinations. Copying a recipe's
scene list and theme unchanged is a failure of this stage.

## Bringing your own ingredient

When the pantry lacks what the beat needs, write a new ingredient in the project's `scenes/` folder:

```ts
// scenes/text.ink-drip-title/index.tsx
import {defineIngredient, useTheme, useScene, z, faWord} from '@pa/kit';

export const meta = defineIngredient({
  id: 'text.ink-drip-title', layer: 'text',
  purpose: 'title that bleeds into the paper like ink', goodFor: ['title'], avoidFor: ['dense-info'],
  energy: 2, mood: ['calligraphic', 'calm'],
  duration: {min: 60, ideal: 90, max: 150},
  slots: z.object({title: faWord(18)}),
  knobs: z.object({bleed: z.number().min(0).max(1).default(0.5)}),
  events: ['inked', 'settle'], sfx: {inked: 'paper.brush'},
  locked: ['ease.enter'], fa: {perLetter: false, needsMaskSlack: true},
});

export default function InkDripTitle({slots, knobs}: Props<typeof meta>) {
  const t = useTheme();                 // colours, fonts, motion tokens — never literals
  const {progress, event} = useScene(); // scene-local time + emit('inked') at the hit
  /* … */
}
```

Rules: theme roles only — no hex colours or font names in scenes (check with
`grep -nE "#[0-9a-fA-F]{6}|fontFamily|Math\.random" scenes/`; a linter rule arrives in phase 1), deterministic (`random(seed)`,
never `Math.random()`), scene-local time from `useScene()` (never the composition's duration), and Persian rules
apply. If it turns out good, propose it for the pantry in the delivery report.
