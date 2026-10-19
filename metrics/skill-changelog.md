# Skill changelog — metrics/skill-changelog.md

## v3.0 (2026-10-18) — redesign for motion graphics (before clip 1)
Full rewrite of `.claude/skills/persian-arts/SKILL.md` for motion-graphics output (not stills):
- Removed lockup-centric framing; visual tools now serve **motion & narrative** (principle 1).
- Added depth/light/texture requirement (principle 2), motivated-motion + 12-frame transition overlap (principle 3), one-world (principle 4), Persian-correct type (principle 5), evidence-based QC (principle 6).
- Split heavy detail into `references/` (palettes.md, motion.md, audio.md, narrative.md); added `assets/` (fonts + film-template) and `scripts/` (qc-check.mjs, frames-extract.mjs).
- Added explicit **anti-patterns**: lockup overuse, flat scenes, linear motion, jump cuts, off-brand colour, clichés, dead openings, un-evidenced scores.
- Added 9-criterion quality scoring + `metrics/` recording contract (clip-0N.json, frames, scoreboard).

(Mission-driven improvement cycle: each clip's issues append entries here with issue ids, e.g. `C1-03`.)

## v3.1 (2026-10-18) — after clip 1 (دانه‌ی برف), from its 11 issues
**Pipeline (C1-09, C1-10, C1-11) — the clip could not be rendered at all before this:**
- `capture.mjs`: browser candidate chain (`--browser` → `PA_CHROME` → system Chrome → Edge → bundled shell) with a timed `Page.enable` health check; every CDP call time-boxed at 20s; output deleted on abort; `@font-face` families force-loaded before frame 0; `-g 60 -keyint_min 60`; a render gate that samples canvas luma 3× and cross-checks the captured frame against the canvas (a stale compositor surface passes every eyeball test and fails this one).
- Root cause of the "black video": the bundled `chrome-headless-shell`'s GPU/renderer died on this machine, `Page.captureScreenshot` then returned the stale surface (canvas layer missing), and with no timeout the script exited 0 leaving the previous file in place.

**Craft kit — `work/persian/htmlfilm/lib/pa-film.js` (new):**
- `PF.win(t, a, b)` fixes the `PA.prog` duration trap that produced clip 1's overlapping copy (C1-02) and its never-completing sprout (C1-05).
- `PF.typeQueue` fails the build on overlapping copy; `PF.drawLine` reveals word-by-word RTL and auto-fits the safe width (C1-01).
- `PF.beam` builds light instead of filling a polygon (C1-03); `PF.grain` + `PF.vignette` give every frame texture (C1-04); `PF.motion` names the easing jobs (C1-06).

**Docs:** `references/motion.md` (kit + prog trap + rhythm), `references/palettes.md` (light is built, texture mandatory, contrast on light), `references/narrative.md` (contact frames, closing-line rule, the 5-clip arc), `references/audio.md` (supported event types, cue density). `SKILL.md` tokens are now numbers (hero = 0.12×H), with the craft kit and the render pipeline documented and 5 new anti-patterns.

## v3.2 (2026-10-18) — after clip 2 (بهار), from its 5 new issues
- **Material recipes** (C2-01): `references/palettes.md` now says a material surface = base gradient + three scale bands (1–3px / 4–12px / 20–40px) + contact shadow in dark pockets. "Scattered pebbles" is named as the failure mode.
- **Track first, then tempo** (C2-03): `references/audio.md` — pick the music, then cut the film at that track's BPM. Tempo must not outrank mood (clip 2 put a corporate bed under a rain scene because both were 120 BPM).
- **Master headroom** (C2-04): re-measure true peak after the mix; if above −1.6 dBTP, lower the master 0.5 dB.
- **Pipeline efficiency** (C2-02): `PF.grain` now blits one of three pre-baked full-frame noise layers instead of re-filling the canvas with an overlay pattern each frame (7m43s → seconds per clip); `capture.mjs` gained `--crf` (default 18) and prints the delivery bitrate.
- **Sound kit**: `build_sound.py` resolves a track through `INDEX.json`'s `file` field; the old strip-`tr-` guess broke on every `tr-vd-*` track (`FileNotFoundError` on clip 2's first audio build).
