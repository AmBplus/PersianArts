# Plan: <film title> (<slug>)

Date: YYYY-MM-DD. Status: planned | building | rendered | accepted. Retrospective: no (or "retrospective, reconstructed").

## Request
What the owner asked for, in one or two lines. Ratios, length, tempo, audience.

## Inputs consulted
Files actually opened while planning, one path per line, with the reason.
- `docs/motion/README.md`: start-here rules
- `docs/motion/PLAYBOOK-BUILD-MOTION.md`: steps 1-12
- (add every file opened; "not opened" items are listed under Risks)

## Reuse map
Samples are inspiration only; never copy a sample's concept or structure unless the plan states why.
Reference for reuse is the framework and library: playbooks, DECISIONS.jsonl, the `_fa` kit, demos and effect catalogs, and shared utilities (Logo/Emblem, geo, timing, theme) judged on their own merits.

| Needed element | Existing component (path) | Decision (reused / adapted / new) | Reason |
|---|---|---|---|
| e.g. easing functions | `work/persian/src/film/uni/motion.ts` | reused | identical signatures |

## New components
For each new component: name, file path, why nothing in the Reuse map fits, and which existing file was checked for it.
If none: write "none".

## Decisions
One line each: `D<n>: <decision>. Rejected: <alternative>. Evidence: <path or DECISIONS.jsonl id>.`

## Events / hit contract
Defined before the build. List each hit: frame (on a beat frame), scene, visual effect, sound cue. Name the timing source (`motion.ts` CUT_BEATS etc.) and the tempo rule.

## Risks
Known risks, plus the consulted-but-not-read list (files that exist in the inventory but were not opened).

## Time budget
Planned minutes per step (plan, build milestones, stills, render, mix, review), and the time box per worker order.

## Result vs plan
Filled after the render. Planned vs actual per row: time, reuse ratio, frames checked, render numbers from the worker report, owner score.
