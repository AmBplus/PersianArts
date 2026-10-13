# STUDIO: the lite studio (3 actors, 6 hats, 5 internal gates)

Status: proposal for the lead's decision, written 2026-10-13. Not yet wired into the skill or playbooks.
Origin: the owner's director-package proposal. Its diagnosis is adopted: motion is not effects plus a timeline; every scene needs a dramatic function, a visual cause for each transition, and a testable acceptance. Its structure (ten roles, owner approvals) is not, because our data says handoffs are the bottleneck (`docs/motion/METRICS.md`: 77% of wall time not producing, 41% waiting, 30 orders for one deliverable).

## 1. Actors and hats

Three actors. Roles from the proposal become hats: lenses and checklists that an actor applies, not separate agents.

| Actor | Hats worn | Job |
|---|---|---|
| Director | story, art, motion, sound | Decides and writes `director-package.json`; picks recipes; owns G1 to G3 |
| Builder | edit, technical | Implements scenes, events, render, mix; runs automatic checks; owns G4 to G5 build side |
| QC (independent, separate) | all six as a reviewer | Judges stills and renders; score 0-100, approve >= 85; never the author |

The producer hat (time, scope, risks) belongs to the lead: it sets the time cap and sees the status board.

| Hat | One-line checklist (applied to the package or the render) |
|---|---|
| Story | Each scene has a dramatic function and a `goal_trace` to a mustSay claim or the desiredAction; a silent viewer can retell it; no scene without a trace |
| Art | One identity, visibly different looks per scene, hero >= 12% of frame height in 9x16, no zone > 30% of height without motion, contrast AA, verified logo only |
| Motion | Each scene has one main action, an easing from `kit.ts`, a held stop, and every cut has a `transition_logic` that is a visual cause, never "cut" |
| Sound | One theme that evolves, SFX only on `events[]` rows, grid error <= 15 ms, SFX within 1 frame, -14 LUFS, TP <= -1 dBTP, musical ending |
| Edit | Rhythm varies (slow / growing / fast / release), no dead frames at cuts (first reveal on the incoming scene's first frame), durations match the package |
| Technical / producer | Numbers LTR, fonts really loaded, 9x16 and 16x9 robust, render report present, time cap and status board current |

## 2. Contract table (3 actors)

| Actor | Receives | Decides | Delivers | May change |
|---|---|---|---|---|
| Director | `brief.json` (with goal), recipe catalog, past reviews | Idea, scene list and timing, recipes, transitions, acceptance, events | `director-package.json`, styleframes (3-4), animatic, per-scene checklist | Everything in the package until G3 passes; afterwards only with a one-line change note and its time impact |
| Builder | Locked package, recipe source paths | Implementation, easing details, layout per ratio | Scene code, `events.json` (generated from package events), render + stills, gate outputs | Technique and layout freely; never the claims, scene order, durations, or acceptance (ask the Director) |
| QC | Stills/contact sheets, package, gate outputs | Score and defect list, ordered by severity | `review-<n>.md` (score, defects with file and frame) | Nothing in the film; may block delivery |

## 3. Internal gates (no owner approval)

The proposal's six gates stay, cheaper: concept and script merge into G1. Films <= 15 s merge G2 and G3 (a styleframe-plus-timing sheet replaces the animatic).

| Gate | Pass criteria | Checks that exist | Checks to build |
|---|---|---|---|
| G1 Concept + script | Package validates against `director-package.schema.json`; every scene has `goal_trace` and a non-"cut" `transition_logic`; claims inside truth_constraints | Schema (ajv, validated with `director-package.example.json`); `film-process-gates.mjs structural` | Script that fails a scene with no goal trace or a duplicate layout; claims-vs-`do_not_invent` text scan |
| G2 Styleframes (valuable) | 3-4 stills per ratio, start/middle/end; looks visibly different per scene; hero size, empty zone, contrast per FILM-GATES; a reviewer sees no repeated layout | FILM-GATES rows: Visual review (process exists) | Hero size, empty zone, contrast, digits-LTR scans (all "to build" in FILM-GATES); similarity check between styleframes |
| G3 Animatic (valuable) | Full length at low fidelity, temp music on the beat grid; silent viewer can retell; every cut has its visual cause; no dead frames | Music beat grid scripts (`music_map.py`, `grid_accept.py`) | Threshold gate for grid error; dead-frame detector (frames of near-uniform colour at cuts) |
| G4 Preview | Render obeys package: durations, events within 1 frame, numbers LTR, fonts as intended | Loudness mix script; cue sheet in `mix_sfx.ps1`; `film-process-gates.mjs preflight` | Final-mix event comparison; fonts-loaded check |
| G5 Final | Independent QC >= 85 on 9 stills per ratio, Persian reading and bidi evidenced, `delivery` stage PASS, all "to build" rows resolved or declared blocking | Review process; `film-process-gates.mjs delivery` | Automatic sheet/evidence integration |

Rule from FILM-GATES stays: a check recorded `not-run`, `unknown`, `to build` blocks the claimed stage.

## 4. Time budget template (30 s film, 40-minute cap)

Package + styleframes 8 min, animatic 5, build 15, QC + fix 8, buffer 4. Films <= 15 s: package + styleframes 5, build 8, QC + fix 5, buffer 2 (about 20 min). Overrun on a phase: one line to the lead (expected vs actual), then narrow or escalate, per the time-box rule.

## 5. Rejected from the proposal

| Item | Why |
|---|---|
| Ten separate roles/agents | Each handoff cost waiting and re-explaining (41% waiting, 30 orders); lenses give the same coverage |
| Owner approval at gates (concept_approval, approved styleframes, approved package) | The owner delegated delivery; gates are internal, evidence is shown with the final result |
| `approved_director_package.json` as an externally approved source of truth | Keep one package in `media/briefs-local/<label>/`; "locked" means the Builder may not change it, not that a person signed |
| Separate Writer and Editor documents | Writer is the story hat; the Editor hat is a checklist on the Builder's output |
| Per-scene render and assembly edit as a phase | Film is one pure-of-time composition; scenes are checked via stills, not separate renders |
| Free choice of ease/effect/engine "until approval" | Easing comes from `kit.ts`; effects from recipes; freedom is reduced to reduce variance |
| Sample content as a template | The Dana sample is an illustration; its name, domain and Persian copy are not reused (client names never enter the repo); no third-party director skills or skill installs were suggested in it, and none are adopted |

## 6. How it fits our pieces

| Existing piece | Role in the studio |
|---|---|
| `brief.json` + `goal` (`brief.schema.json`) | Input to the Director; the package copies `goal` unchanged |
| `plans/TEMPLATE.md` | Plan becomes a view of the package: "Scene -> goal trace" table = `scenes[].goal_trace`; "Reuse map" row per scene = `recipe_ref` + `reuse_category` |
| `events.json` | Generated from `scenes[].events` (single source), not written by hand |
| Status board (`work/persian/tools/pa.ps1 status`) | One item per film; steps = the 5 gates |
| `FILM-GATES.md` | The automatic checks of G2 to G5 |
| `recipes/catalog.json` | The Builder's starting code; the Director's `recipe_ref` |
| persian-arts skill | Intake -> package -> gates; the skill decides how to expose actors; not edited here |

Unproven: whether a Director that wears four hats produces packages the Builder can follow without clarification; whether G2/G3 would have caught v4's defects (doubled text, empty 9:16 zones) before the 30 s render. First pilot should measure orders, waiting share and QC score against the v4 baseline (79/100).

## 7. Skills and memory (2026-10-13)
- Craft skills (internal, called by the orchestrator one per TODO step): `.claude/skills/persian-arts-{director,writer,copy-editor,art-director,motion-designer,sound,motion-editor,technical,qc}/SKILL.md`. The "hats" of section 1 are these skills.
- Orchestrator: `.claude/skills/persian-arts/SKILL.md` runs `docs/motion/todo.template.json` (field `mode`: `single-agent` default, `cast` for large films; per-step class M/S, executor, gate, time box, `advisor`).
- Semantic memory: `docs/motion/GOAL-MEMORY.md` (protocol), `goal-memory.template.md`; one persistent STUDIO agent wears all hats, QC is independent, Haiku does mechanics, and the Opus advisor is consulted rarely: `docs/motion/ADVISOR.md`.
