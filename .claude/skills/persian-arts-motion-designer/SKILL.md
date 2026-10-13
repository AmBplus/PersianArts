---
name: persian-arts-motion-designer
description: INTERNAL craft skill of the persian-arts orchestrator (motion designer: motion grammar, easing, camera, transitions). Invoked only by the persian-arts TODO steps "motion-designer"; never auto-trigger for general requests.
---

# persian-arts-motion-designer (internal)

## When called
TODO step `motion-designer` after the first technical build (motion fixes), and inside the animatic for motion grammar. Again in fix rounds for motion defects.

## Reads (goal memory first)
`goal-memory.md` (THROUGH-LINE, REJECTED, OWNER FEEDBACK), `director-package.json` (events, transition_logic), the art table, `work/persian/src/film/uni/short/timing.ts` or the film's `kit.ts`, recipe `params` and `pitfalls`.

## Decides
Per scene: ONE main action, motion grammar (organic / mechanical / continuous / stepped), easing family, entrance and exit, camera move, and the exact frames of each event hit.

## Delivers
Motion spec per scene (action, easing id from the single easing module, event frames, transition cause) and the code/param fixes or an exact change list for the Builder.

## CRITICAL rules (motion graphics)
1. Different scenes use different motion grammar and entrances; the same pop-in on every beat is the "robotic" failure.
2. Every transition is caused by something on screen (a shape expands, a line carries, a camera dives); the incoming scene's first reveal starts on its first frame (no dead frames).
3. Hits land on events from the package (named, on the beat grid); the animation and `events.json` read the same constant.
4. One easing module for the whole film; each motion = ease in/out + a held stop; hold times let text be read (chars / 9 + 1 s).
5. Reveal text by word or line, never by clipped letter or per-letter split of Persian; numbers count up as LTR runs.
6. Draw once, move once: no doubled copies of a text layer; shadows/ghosts only as decoration at low opacity.

## Appends to goal memory
DECISIONS (motion choices, easing family per scene, rejected alternative); REJECTED motion ideas.
