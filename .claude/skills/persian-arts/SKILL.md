---
name: persian-arts
description: Motion-graphics studio skill for Persian/RTL animated videos in this repo — use for any motion graphic, promo, teaser, reel, social cut, or Persian animated video request, and whenever the user types /persian-arts. Produces motion (not stills) — story → script → storyboard → image/motion → sound, with measurement-based QC. It is the ONLY motion/video skill here; do not use persian-motion-director or any other director/video skill.
skill_version: 3.1
---

# persian-arts — motion-graphics studio (redesigned for motion & narrative)

## When to activate
Any request to *make, improve, or evaluate* a Persian/RTL motion graphic, promo, teaser, reel, social cut, or animated video — any duration, any ratio. Output is a **motion graphic** (movement + narrative), never a static image. If a user-level video skill auto-triggers, stop and use this one.

## Design principles (non-negotiable)
1. **Motion & narrative first.** The visual toolkit (typography/lockup, shape, light, texture, data, camera) exists to serve *movement and story*. A lockup is one tool among many — never the spine of the skill or the film.
2. **Depth over flatness.** Every scene has ≥ 3 depth layers (bg/mid/fg), a light direction with shadow/rim, and texture at low opacity. Flat single-plane scenes are a defect.
3. **Motivated motion.** Every move has an easing with a named job, an entry/exit overlap (≥ 12 frames at scene joins), and a reason (light, gravity, attention, sound).
4. **One world.** Palette family, type family, and a persistent element carry across all scenes; the finale shares the same world.
5. **Persian-correct typography.** No letter-spacing on Persian; animate joined groups/words, never code points; faDigits + Ltr isolate; RTL layouts mirrored by design, not by flipping.
6. **Evidence-based QC.** Watch and listen before scoring: extract frames, measure LUFS/true peak, spot every transition. Scores without timestamps/frames are invalid.

## Tokens (defaults — override in the brief)
- **Ratio 9:16 1080×1920** (also 16:9 1920×1080 as a separate composition, never a crop), 30 fps, H.264, ≤ 2s keyframe interval.
- **Loudness −14 LUFS**, true peak ≤ −1.0 dBTP, tail < −50 dBFS.
- **Type, as numbers (not adjectives):** hero = **0.12 × H** (230px at 9:16) · body = 0.45–0.55 × hero (104–126px) · sub-line = 0.38 × hero. Max 2 primary sizes per film. Every line is measured and shrunk to fit `W − 2×marginX` (never letter-spaced, never squeezed). Fonts from `assets/fonts/` (Vazirmatn, Estedad, Amiri, Lalezar).
- **Colour:** 60/30/10 base/secondary/accent; accent reserved for the payoff; contrast ≥ 4.5:1 body, ≥ 3:1 hero.
- **Easing jobs:** enter outCubic 0.35–0.55s · reveal outExpo 0.5–0.9s · settle outBack 0.3–0.45s · impact spring d 0.35–0.6 · ambient inOutSine.
- **Scene joins:** ≥ 12 frames overlap (light-wipe / shape-morph / match-cut / camera-through / depth-dissolve).

## Craft kit — `work/persian/htmlfilm/lib/pa-film.js`
Every film loads `pa-motion.js` + `pa-film.js` and uses `window.PF`. Do not re-implement these:
- `PF.win(t, a, b)` — **use this for every window.** `PA.prog(T, s, d)` takes a *duration*; passing an end time makes fades finish late (this shipped overlapping copy in clip 1 — C1-02).
- `PF.typeQueue(lines, {gap: 0.4})` — throws at load if two copy lines can be on screen together. No film ships without it.
- `PF.drawLine({text, x, y, px, weight, color, alpha, t, t0, stagger, maxW})` — word-level reveal (never per-character: it breaks Persian joins), RTL from the right, auto-shrinks to `maxW`.
- `PF.fitPx` — the size-only fitting used by `drawLine`.
- `PF.motion` — named jobs: enter / reveal / settle / spring / ambient / exit. ≥ 3 distinct jobs per film.
- `PF.beam` — a light shaft with a gradient along it and an alpha ramp across it (never a filled polygon — C1-03).
- `PF.grain` + `PF.vignette` — called every frame before type (C1-04). Grain is pre-baked into 3 full-frame layers; do not re-fill the canvas with a pattern per frame (it triples render time).

## Render pipeline — `work/persian/htmlfilm/capture.mjs`
```
node work/persian/htmlfilm/capture.mjs --html <film.html> --ratio 9x16 --out <file.mp4> [--draft] [--frames N-M] [--still t1,t2 --stills-dir <dir>] [--shot surface|canvas] [--browser <path>] [--no-optimize]
```
- Browser order: `--browser` → `PA_CHROME` → system Chrome → Edge → bundled `chrome-headless-shell`; each candidate is health-checked with a timed `Page.enable`, because a browser whose GPU/renderer is dead accepts the socket and answers nothing (C1-09).
- Every CDP call is time-boxed (20s, `PA_CDP_TIMEOUT_MS`); a failed render deletes its output instead of leaving a stale mp4.
- `@font-face` families are force-loaded before frame 0 (a canvas-only film never triggers font loading on its own — C1-11).
- Gate before the long encode: canvas luma at 3 times (all black ⇒ abort) **and** captured-frame luma vs canvas luma (a stale compositor surface looks plausible until measured — C1-09).
- Encodes with `-g 60 -keyint_min 60` (2s keyframes — C1-10).
- `--shot canvas` exports `canvas.toDataURL()` instead: pixel-exact, but a single PNG over ~4MB cannot come back through CDP (`returnByValue` times out), so keep it for small/draft frames only.


## Craft skills (children — read at their step, never standalone)

Nine craft skills live beside this file as `.claude/skills/persian-arts-*/`. The orchestrator (this file) owns the film, the order of steps and the call itself; a child owns one craft and returns its deliverable to the parent. Read a child's `SKILL.md` only when the workflow reaches its step. A child never auto-triggers, never scores its own work, and never replaces the parent.

| Workflow step | Child skill | What it returns |
|---|---|---|
| 1 Story · 3 Storyboard | `persian-arts-director` | logline, arc, scene table |
| 2 Script | `persian-arts-writer` | timed Persian lines |
| 2 Script (on-screen wording) | `persian-arts-copy-editor` | edited Persian copy |
| 3 Storyboard (look) | `persian-arts-art-director` | styleframes, palette, hierarchy |
| 4 Image & motion (grammar) | `persian-arts-motion-designer` | easing/camera/transition choices |
| 4 Image & motion (edit) | `persian-arts-motion-editor` | pacing, holds, picture lock |
| 4 Image & motion (build) | `persian-arts-technical` | Remotion/html build, render, probe |
| 5 Sound | `persian-arts-sound` | events.json, mix on the beat |
| 6 QC & metrics | `persian-arts-qc` | scored gates with timestamp evidence |

Rules:

- The step names and time boxes are the ones in `docs/motion/todo.template.json` (lane `html-film`); the pass/fail thresholds are the rows of `docs/motion/FILM-GATES.md`.
- If a child is unavailable, the parent does that step itself with the parent rules — it never substitutes another director/video skill.
- `.agents/skills/` is a generated mirror (Codex); edit only `.claude/skills/` and re-run `node scripts/sync-persian-arts-skill.mjs`.

## Workflow (per film)
1. **Story** → logline, protagonist/object, arc (hook ≤ 3s → build → payoff on the beat → close/CTA). `references/narrative.md`.
2. **Script** → short Persian lines (≤ 12 words headline, ≤ 18 body), each timed to picture; ≥ 1.5s on screen per line. `references/narrative.md`.
3. **Storyboard** → scene table: beats, seconds, layers, light, easing, transition into the next scene, and the EVENTS contract (each payoff → a sound cue).
4. **Image & motion** → build from `assets/film-template/film.html` (palette tokens, grain, vignette, pure `seek(t)`); palettes `references/palettes.md`; motion `references/motion.md`. Card library (`work/persian/tools/cards/card-find.mjs`) is a composition reference, not a mandate.
5. **Sound** → `events.json` from the real edit, then `sound/tools/mixer/build_sound.py` (music bed + cues + ducking), then `pa.ps1 audio-check`. `references/audio.md`.
6. **QC & metrics** → extract scene frames + measure (`scripts/frames-extract.mjs`, `scripts/qc-check.mjs`), score the 9 criteria with timestamp evidence, write `metrics/clip-0N.json`.
7. **Improve the skill** → every issue becomes a rule/example/checklist item here or in `references/`; log it in `metrics/skill-changelog.md`.
8. **Next clip** with the updated skill; verify prior issues are actually fixed.

## Anti-patterns (explicit — fix these at the source)
- ❌ **Lockup-centric design** — the whole film orbiting one text lockup; the lockup is one moment, not the structure.
- ❌ **Flat, layered-less scenes** — one plane, no light, no shadow, no texture, no depth.
- ❌ **Linear lifeless motion** — `linear` easing > 0.2s, everything entering at once, no stagger, no follow-through, no motivation.
- ❌ **Jumps and judder** — hard cuts between scenes without ≥ 12-frame overlap or an intentional beat-locked cut; discontinuous values between frames.
- ❌ **Off-brand colour** — random hues, more than 2 accents per scene, blue text on blue, grey #808080 text, text over imagery without scrim.
- ❌ **Clichés** — the same rotating 3D text, the same generic whoosh on everything, overused globe/lightbulb metaphors, decorative spinning shapes with no narrative job.
- ❌ **Overused lockup/typography tricks** — per-character animation of Persian (breaks joins), letter-spacing on Persian, one static text card after another.
- ❌ **Dead openings** — nothing happens in the first 3–5 seconds; the hook is missing.
- ❌ **Un-evidenced scoring** — a score without a timestamp, frame, or quoted text line is invalid and must be redone.
- ❌ **`prog(t, start, end)`** — `PA.prog`'s third argument is a duration; use `PF.win` for windows.
- ❌ **Light as a filled polygon** — a straight, hard boundary is a defect; build beams with `PF.beam`.
- ❌ **Type by eye** — a size that is not measured against the hero/body tokens and not fitted to the safe width is a defect.
- ❌ **Two copy lines on screen at once** — `PF.typeQueue` must be in the film; overlap is a critical defect.
- ❌ **Shipping a render nobody measured** — a render is accepted only if the capture gate passed and the frames were looked at.

## Folder structure
```
.claude/skills/persian-arts/
  SKILL.md                  ← this file (principles, workflow, tokens, anti-patterns, checklist)
  references/               ← palettes.md · motion.md · audio.md · narrative.md
  assets/                   ← fonts/ (Vazirmatn, Estedad, Amiri, Lalezar) · film-template/film.html
  scripts/                  ← qc-check.mjs (measure video/audio) · frames-extract.mjs (keyframes for metrics)
  beauty/                   ← existing routed craft pack (rules, palettes, recipes, lint)
```

## Quality criteria (score each 1–10 with evidence)
| code | measures |
|---|---|
| STORY | hook in 3s, clear arc (start/peak/end), coherent message |
| SCRIPT | fluent & concise Persian, line length matched to picture timing |
| VISUAL | layering & depth, texture, light & shadow, detail, composition |
| MOTION | natural easing, rhythm, smooth transitions, motivated moves, no jumps |
| TYPO | readable, adequate on-screen time, hierarchy, correct text animation |
| AUDIO | clear voice, fitting music/effects, balanced mix (voice never buried) |
| SYNC | sound/picture/text aligned; moves on the music's beat |
| TECH | resolution, fps, no artifacts, compression, LUFS standard |
| OVERALL | one coherent, professional piece |

Reference levels: 3 = obvious flaw a casual viewer notices · 6 = works but ordinary · 9 = professional-studio grade.

## Metrics record (every clip)
Write `metrics/clip-0N.json` exactly in the schema of the mission brief: `files`, `specs`, `scores` (each with `evidence` — timestamp/frame/text), `issues` (unique id `C{clip}-{n}`, `severity`, `timestamp`, `description`, `root_cause` pointing at a skill/prompt gap, `skill_change` pointing at the rule added, `status`), `average`. Save scene keyframes in `metrics/frames/clip-0N/`. Update `metrics/scoreboard.md` and `metrics/skill-changelog.md` after every clip.

## Pre-delivery checklist
- [ ] Story: hook visible in first 3s, one payoff on a beat, close/CTA present.
- [ ] Script: every line ≤ 18 words and ≥ 1.5s on screen; no repeated words.
- [ ] Visual: 3+ depth layers per scene; one light direction; texture present; 60/30/10 palette.
- [ ] Motion: ≥ 2 named easings with jobs; every scene join has ≥ 12-frame overlap or beat-locked cut; no linear > 0.2s.
- [ ] Typo: no letter-spacing/per-char animation on Persian; hero ≥ 12% of 9:16 height; contrast checked.
- [ ] Audio: events.json matches the real edit; −14 LUFS; true peak ≤ −1.0; ducking under cues; `pa audio-check` pass.
- [ ] Sync: payoff events on the beat grid (≤ 5ms); text appears with its narration/move.
- [ ] Tech: 1080×1920 (or brief ratio) 30fps, keyframe ≤ 2s, no black/freeze frames beyond intent, `qc-check.mjs` run.
- [ ] Evidence: scene frames saved in `metrics/frames/clip-0N/`; every score has a timestamp/frame; issues have root causes and skill changes.
