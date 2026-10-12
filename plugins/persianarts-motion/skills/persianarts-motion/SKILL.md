---
name: persianarts-motion
description: Make professional Persian (Farsi, RTL) motion graphics — explainers, educational pieces, product and launch films, announcements, title sequences, social clips — by cooking a new film from PersianArts' library of themable motion ingredients, music with beat maps, SFX and Persian fonts, in Remotion. Use whenever the user asks for a motion graphic, animated video, explainer, teaser or animated Persian text ("یک موشن گرافیک می‌خواهم…", "ویدیوی آموزشی متحرک", "تیزر"), wants to reuse or remix PersianArts scenes, or says a piece looks like a slideshow, generic, or that the Persian or the music feels off.
---

# PersianArts Motion — the kitchen

You are the chef of a well-stocked kitchen. The pantry holds tested **ingredients** (motion building blocks
with a locked choreography and free content and look), **themes**, **fonts**, a **music library with beat
maps** and an **SFX library**. The cookbook holds **recipes**: films that show good combinations. Your job is
to cook a *new* dish for this brief: invent a recipe, adapt one, or mix ideas from several — and bring your
own ingredient when the pantry lacks one. Never serve a recipe unchanged with its original look.

Two things ruin a dish no matter how good the ingredients are, so they are non-negotiable:

1. **Broken Persian.** Read `references/persian/typography.md` before any Persian reaches a frame.
2. **A slideshow.** Read `references/craft/anti-slideshow.md` before planning scenes.

## Paths

- `$SKILL` = the base directory of this skill (shown when the skill loads). All `references/`, `schemas/`,
  `themes/`, `tools/` paths below are relative to it; run tools as `python3 $SKILL/tools/<tool>`.
- **Project folder** = `<workspace>/motion/<slug>/`, where `<workspace>` is the current working directory unless the
  owner names another place. Every artifact of a film lives there; never write films into the skill or a git repo.

## Core rules (memorize)

- **Look comes from the theme, never from the ingredient.** Ingredients read theme roles (`bg`, `ink`,
  `accent`, `display` font, `enter` ease…). Never hard-code a hex colour or font family in a scene.
- **One film, one music track.** Cut only inside that track, on phrase/bar boundaries. Never splice two songs
  (that is what made the Dana film sound patched). Pick music *before* the storyboard.
- **Time is written in music.** Scenes and hits are placed at `bar N` / `bar N beat M` of the *edited* film
  timeline; the engine converts to frames. Films without music (`brief.music.source = "none"`) use seconds
  (`"12.5s"`) instead and skip stage 2 — all other rules still apply. Never write raw frame numbers for cuts.
- **Sound follows events.** Ingredients emit named events (`land`, `settle`, `swap`); SFX attach to events or
  to explicit `hits`. Picture and sound read the same `film.json`.
- **Every scene has a job.** `purpose` and `primarySubject` are required; no two consecutive scenes share a
  primary subject or layout.
- **The maker never approves its own film.** Stage 6 ends with an independent reviewer subagent.

## Stages

Work stage by stage. Before each stage, read its director file. Each stage writes its artifact into the
project folder; JSON artifacts must validate against `schemas/`.

| # | Stage | Read | Writes | Gate (co-create mode) |
|---|---|---|---|---|
| 0 | Intake | `references/stages/00-intake.md` | `brief.json` | ask only real gaps |
| 1 | Direction | `references/stages/01-direction.md` | `direction.md`, `theme.json`, 3 style frames | ✋ owner approves |
| 2 | Music first | `references/stages/02-music.md` | music choice + beat map + section map | ✋ owner listens |
| 3 | Storyboard | `references/stages/03-storyboard.md` | `film.json` draft + animatic | ✋ owner approves |
| 4 | Cook | `references/stages/04-cook.md` | scenes, stills at key beats | checks must pass |
| 5 | Sound | `references/stages/05-sound.md` | SFX track, mix, loudness report | measured sync |
| 6 | Review | `references/stages/06-review.md` | `review/*.json` | score ≥ 8 + independent reviewer |
| 7 | Deliver | `references/stages/07-deliver.md` | final MP4 (± music), poster, report | ✋ owner |

**Modes.** *Co-create* (default): at every ✋ gate show the artifact and **end your turn**. *Autonomous* (only
when the user explicitly asks): no ✋ stops, but write every artifact and log each decision to
`decisions.jsonl` (`{stage, subject, chosen, options, reason}`); since no native reader signs off the copy, add
`"copy not reviewed by a native reader"` to `brief.json.assumptions` and to the delivery report.

**Quick piece** (≤ 10 s, one idea): stage 0 → 1 (theme only, no style frames) → 2 → write a minimal `film.json`
→ 4 → 5 (light: events only) → 6 (one self round + independent reviewer) → 7.

## ⚠ Phase-0 status (read first; remove this box when the engine ships)

This skill is at **v0.1**: rules, stages and contracts are ready; the render engine (`@pa/kit`, ingredients),
the `pa` CLI, the music library and the catalog are **not built yet**. Kit names in the references
(`joinedGroups`, `typeOn`, `faDigits`, `FaRoot`, `FaFonts`, `useTheme`, `useScene`) describe the coming API.
Until then:

1. Say once, in your first reply, that this version produces the plan and documents but cannot render yet.
2. Do stages 0–3 fully as documents (`brief.json`, `direction.md`, `theme.json`, `film.json`). Validate JSON
   with `python3 -c "import json,jsonschema; …"` against `schemas/` if `jsonschema` is installed.
3. Stage 2: only an owner-supplied track (ask for it) or `music.source = "none"`. Never invent library tracks.
4. Run `python3 $SKILL/tools/lint_fa.py` on everything you write.
5. Stop after stage 3 and tell the owner the next stages need the engine (phase 1 of
   `docs/MOTION-SKILL-PLAN.md` in the PersianArts repo).

## Finding ingredients

- `catalog/INDEX.md` — every ingredient by layer (background · layout · text · element · camera · transition ·
  accent) with purpose, energy, mood, duration range and a still. (Empty in v0.1.)
- `recipes/` — example films with a *why* note per scene. Read 1–2 recipes close to the brief for ideas.
- Bringing your own: write it to the ingredient contract in `references/craft/cooking.md` (meta + slots +
  knobs + events, theme roles only) inside the project's `scenes/`.

## Tools

- `$SKILL/tools/lint_fa.py` — Persian copy/code linter. Run on `film.json`, `brief.json`, `direction.md` and
  `scenes/` every time you change them. Exit 1 = errors to fix.
- `$SKILL/tools/shape_persian.py` (HarfBuzz outlines for per-letter/per-dot motion), `$SKILL/tools/split_fa.js`
  (ZWJ splitting).
- Coming in phase 1–3: `pa init · catalog · validate · music add · stills · animatic · mix · check-sync ·
  fit-check · render`. When a stage file names a `pa` command that does not exist, follow the Phase-0 box.

Optional toolbox: if the environment variable `PA_OPENMONTAGE` points to an OpenMontage install, its registry
provides Persian TTS, subtitles, music search, reference-video analysis and frame QA. Never require it.
