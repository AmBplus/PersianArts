# PLAYBOOK-BUILD-MOTION: from idea or brief to a finished 9:16 film with sound

Target: one film, 9:16 first, with 1:1, 4:5 and 16:9 derived. Time figures come from the measurements in `PLAYBOOK-RENDER.md`.
Every order to a worker contains: goal, input paths, output paths, acceptance command, forbidden actions, and "no human is present, do not ask questions".

## Steps

| # | Step | Owner | Command or artefact | Time (measured or estimated) |
|---|---|---|---|---|
| 1 | Intake: write the raw brief and the owner's wording to `media/briefs-local/<slug>/source.md` (client material stays git-ignored). Tracked files use the label only. | Lead decides, worker writes | `media/briefs-local/<slug>/` | 5 min |
| 2 | Refine the brief into the prompt template (fields: role, goal, audience, deliverables, beats, copy tokens, palette, fonts, safe zones, sound plan). | Haiku (one page) or GLM | Template in `research/prompt-design-brief.md` section 3; refiner recipe in section 5 | 10 min |
| 3 | Concept choice with the matrix (brand fit, assets, engine gaps, slideshow risk, rubric risk). Default: pencil story unless a hi-res photo arrives. | Lead decides from a worker brief | One-page decision brief | 10 min |
| 4 | Scene build: one scene group per GLM milestone order, time-boxed to 20 minutes, one file group each. | GLM flash via `qh order` (Sol only for hard cases) | `work/persian/src/film/<film>/scenes.tsx`, `motion.ts` | 20 min per milestone |
| 5 | Stills check: four ratios, payoff frames. Acceptance: `npx remotion still <bundle> <Comp> <out.png> --frame=N` for each listed frame, plus a `tsc` check. | Worker (GLM order) | `media/film-versions/<film>/_stills-<tag>/` | 4 s per still |
| 6 | Beat test of the music: `python sound/tools/music_map.py <track.mp3> --out <track>.music.json`. Only PASS tracks go on. | Worker (Haiku for one track) | sidecar in `sound/library/bgm/` | 2 min per track |
| 7 | Cue sheet: from frames (not old numbers). Start from `work/persian/tools/cues/make_cues_v5.py` and `build_v5.py` (v51 scripts in the same folder). Output `cues-9x16.json` in the version folder. | GLM order | `media/film-versions/<film>/<version>-cues/cues-9x16.json` | 20 min |
| 8 | Silent render, four ratios: `pwsh -File work/persian/render_all.ps1 -Film social -Bpm <bpm> -T0 <t0> -OutDir media/film-versions/<film>/<version>` (use `-Film uni` for the teaser). Preview first: `-Mode preview -Frames 150-210`. | Worker (Haiku runs and reports numbers) | `silent-<ratio>.mp4`, `render-report.json` | 30 s for four ratios |
| 9 | Mix: music bed with `work/persian/mix_film.ps1`, SFX with `work/persian/mix_sfx.ps1`. Targets: bed -18 LUFS, duck -3 dB over 150 ms, final -14 LUFS, true peak at or below -1 dBTP, music ends on a downbeat. Measure with loudnorm. | Worker (GLM or Haiku) | `social-9x16-<version>.mp4` | 1 to 2 min |
| 10 | Owner listening checklist (below). Owner scores each ratio. Scores go to `calibration/owner-feedback.md`. | Owner (no worker) | Score line in `VERSION.json` `owner_score` | owner time |
| 11 | Independent review: a Sonnet reviewer scores the output with `evals/rubric-v2.md` (approve at 85 and above). | Sonnet reviewer | review verdict (short) | 10 min |
| 12 | Version folder and `VERSION.json` (see template below). Commit only by a worker, on explicit order, with a path whitelist. | Worker | `media/film-versions/<film>/<version>/VERSION.json` | 5 min |

## Owner listening checklist (step 10)
1. Watch the 9:16 film once with sound. Note the first beat that feels late or early.
2. Listen to the sound alone with the picture muted. Is the music clear and not too loud?
3. Each payoff: does a hit have a sound on the hit frame? Does the final chord have a tail?
4. Check 1:1 and 16:9 stills for safe-area text.
5. Score each rubric-v2 criterion from 1 to 10 in one line.

## VERSION.json template
```json
{
  "film": "pencil-social",
  "version": "<version>",
  "date": "YYYY-MM-DD",
  "BPM": 120,
  "T0_S": 0.0,
  "track": "sound/library/bgm/<slug>.mp3",
  "track_t0_s": 0.0,
  "cues_file": "<path>",
  "ratios": ["9:16", "1:1", "4:5", "16:9"],
  "silent_render": "silent-9x16.mp4",
  "file": "social-9x16-<version>.mp4",
  "notes": "Personal test only. <what changed>",
  "owner_score": null
}
```

## Time expectations
- Silent render of an 18 s film: 15 to 20 s per ratio; four ratios in parallel about 30 s.
- Preview: about 6 s. Still: about 4 s. Mix: about 1 s per analysis pass.
- Scene build: one GLM milestone of 20 minutes; a full film is usually three to five milestones.
- Owner listening: at least one session per version.

## Order templates

### GLM via qh order (implementation)
```
GOAL: <one deliverable>
INPUTS: <exact paths>
OUTPUTS: <exact paths>
ACCEPTANCE: <exact command, for example: cd work/persian/src/workbench && npx tsc --noEmit -p . ; then the still commands listed below>
FORBIDDEN: edit any file not in OUTPUTS; run git; touch media/**, sound binaries, work/persian/.*.env; put any client name or institution word in a file; add secrets.
REPORT: <path>.md, max 25 lines: files changed, acceptance numbers, what is unverified.
TIME BOX: 20 minutes. Write a plan file first and a progress file after each step.
No human is present, do not ask questions.
```
Submit with `qh order` (check `qh order --help` for the current flags, for example effort medium and a tight timeout).

### Haiku via the Agent tool (quick work, model haiku)
```
Task: <one action, for example run render_all preview and report the wall times and cache hits>
Command: <exact command>
Report: at most one page, numbers only, failures included.
Forbidden: edits to tracked files, git, network downloads.
No human is present, do not ask questions.
```

### Codex imagegen (raster assets)
```
Use $imagegen (built-in image_gen) to create: <prompt>. Palette: <hex list>. Transparent background if needed. No gradients, no texture, solid fills, max 5 colours.
Save as PNG to <absolute output path>. Then resize with Pillow to <w>x<h>, check mode and alpha, and write report.txt next to it with the sizes and the alpha fraction.
No human is present, do not ask questions.
```
Run through a worker with the account's `CODEX_HOME` (see `PLAYBOOK-SOUND.md` section 8). Test one image first.

## Known gaps
- The uni teaser has not reached step 8 (P1 and later not started).
- Track selection depends on the owner's decision about the FAIL tracks (see `STATE.md` section 3).
- Remote URL and `media/dana` deletions are owner decisions, not part of this process.
