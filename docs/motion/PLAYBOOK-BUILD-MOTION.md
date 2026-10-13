# PLAYBOOK-BUILD-MOTION: from idea or brief to a finished 9:16 film with sound

Target: one film, 9:16 first, with 1:1, 4:5 and 16:9 derived. Time figures come from the measurements in `PLAYBOOK-RENDER.md`.
Every order cites `docs/motion/FILM-GATES.md` and names its target stage. Structural PASS validates a draft record only; it is not preflight, delivery, creative, or publication approval. Required not-run, unknown, stale, failed, or to-build checks block the claimed stage. See `PLAYBOOK-PROCESS-MEASUREMENT.md` and `plans/MEASURED-TEMPLATE.md` for evidence records. Nothing is public until required evidence is reviewed and the owner accepts it.

## Default lane: html-film (owner decision 2026-10-13)
One file `work/persian/htmlfilm/<label>/film.html` holds the plan (header comment: GOAL, copy, art direction, scene table, EVENTS, music, FIX LOG) and the film (`window.film.seek(t)`). Steps: intake -> memory-init -> treatment -> build -> capture -> sound (owner's word) -> qc -> fix-round (v2, same file) -> deliver -> RETRO. Remotion (steps below) only for heavy effects not yet proven in html-film.
Commands (repo root):
- Stills at EVENTS (look at all 9): `node work/persian/htmlfilm/capture.mjs --html <film.html> --still 0.1,0.53,3.93,5.63,13.0,15.63,18.33,19.6 --stills-dir <dir>/_stills` (about 1.4 s for 9).
- Full silent render: `node work/persian/htmlfilm/capture.mjs --html <film.html> --out <dir>/silent-9x16.mp4` (`--frames a-b` for a range). Wrapper: `pwsh -File work/persian/tools/pa.ps1 render -Lane html -Film <film.html> -OutDir <dir> [-Stills t1,t2]`.
- Events: evaluate the EVENTS block into `<dir>/events.json` (reference: media/film-versions/pencil-html/v2/_tools/export_events.mjs).
- Sound (owner's word only): resolve cues to contact times (`cues-resolved.json`, offsets <= 5 ms), then the v51 recipe via media/film-versions/pencil-html/v2/_tools/build_html_v2.py (bed -18 LUFS, duck -3 dB / 150 ms, final -14 LUFS, TP <= -1 dBTP).
- Gates: `node work/persian/tools/gates/run-gates.mjs <dir>/silent-9x16.mp4 --src <film.html dir>` (applicability: FILM-GATES.md html-film note).
Timing evidence (pencil pilot, 9:16, 19.7 s): capture 590 frames in 40.3 s (14.6 fps); v1 about 6 min to silent mp4 with stills; v2 fix round about 9 min; about 16 min worker time from first line to mp4 with sound; Remotion for the same film about 1 hour. Time box: 20 minutes of worker time per film. Lessons of the pilot (QC 74, SHIP WITH NOTES): pen face states, variable-width ribbons, vertical centring, 6-8 frame colour wipe at cuts, hero >= 12%, CTA idle loop.

## Steps (Remotion lane, kept for heavy effects)

| # | Step | Owner | Command or artefact | Time (measured or estimated) |
|---|---|---|---|---|
| 1 | Intake: write the raw brief and owner's wording to `media/briefs-local/<slug>/source.md` (client material stays git-ignored). Tracked files use the label only. Create a production record from `docs/motion/plans/TEMPLATE.md`; list consulted files, constraints, risks, and source files. | Lead decides, worker writes | `media/briefs-local/<slug>/`; `docs/motion/plans/<date>-<slug>.md` | 5 min |
| 2 | Refine the brief into the prompt template (role, goal, audience, deliverables, beats, copy tokens, palette, font roles, safe zones, sound plan). Preserve approved story/character intent and dynamic motion. Plan Persian reading, bidi number runs, and actual loaded font faces/weights for their roles. | Follow current applicable routing in `DECISIONS.jsonl` | Template in `research/prompt-design-brief.md` section 3; refiner recipe in section 5 | 10 min |
| 3 | Choose a concept with the matrix (brand fit, assets, engine gaps, slideshow risk, rubric risk). Start from the framework, decisions, demos/effect catalogs, library and shared utilities; assess each on its merits. A prior film is a sample only, never the default concept or structure. Record idea, code, and process reuse opportunities and observed reuse separately. | Lead decides from worker brief | Decision brief and plan reuse map; supersession in `DECISIONS.jsonl` | 10 min |
| 4 | Define story beats, scene purpose, motion and event/hit contract before implementation. Use the latest applicable worker-routing decision in `DECISIONS.jsonl`; do not assume a model or worker from this playbook. Preserve the plan's character/story intent and dynamic motion. | Current routing decision | Scene files and `motion.ts` under the film directory | 20 min per milestone (timebox per order) |
| 5 | Stills check: review meaningful payoff/story frames across required ratios. Attach actual frame evidence; a command or declaration alone does not establish visual quality. | Worker plus independent reviewer | Stills/contact sheet and `frameChecks` in production record | 4 s per still (estimate) |
| 6 | Beat test of the music: `python sound/tools/music_map.py <track.mp3> --out <track>.music.json`. Only PASS tracks go on. | Worker (Haiku for one track) | sidecar in `sound/library/bgm/` | 2 min per track |
| 7 | Cue sheet: generate from current film frames and event/hit contract, not old frame numbers. | Follow current applicable routing in `DECISIONS.jsonl` | `cues-9x16.json` in version folder | 20 min per milestone (estimate) |
| 8 | Silent render, four ratios: `pwsh -File work/persian/render_all.ps1 -Film social -Bpm <bpm> -T0 <t0> -OutDir media/film-versions/<film>/<version>` (use `-Film uni` for the teaser). Preview first: `-Mode preview -Frames 150-210`. | Worker (Haiku runs and reports numbers) | `silent-<ratio>.mp4`, `render-report.json` | 30 s for four ratios |
| 9 | Mix: music bed with `work/persian/mix_film.ps1`, SFX with `work/persian/mix_sfx.ps1`. Targets: bed -18 LUFS, duck -3 dB over 150 ms, final -14 LUFS, true peak at or below -1 dBTP, music ends on a downbeat. Record actual analyzer output; script presence alone is not a measured result. | Follow current applicable routing in `DECISIONS.jsonl` | Mix, analyzer evidence, version record | 1 to 2 min (estimate) |
| 10 | Owner listening checklist (below). Owner scores each ratio. Scores go to `calibration/owner-feedback.md`. | Owner (no worker) | Score line in `VERSION.json` `owner_score` | owner time |
| 11 | Independent review: a Sonnet reviewer scores the output with `evals/rubric-v2.md` (approve at 85 and above). | Sonnet reviewer | review verdict (short) | 10 min |
| 12 | Run applicable record stage and all required checks; keep failures and unrun items explicit. Complete `VERSION.json`. A delivery PASS still does not publish: owner acceptance is required. Commit only by a worker, on explicit order, with path whitelist. | Worker; owner accepts | Production record, gate output, `VERSION.json` | 5 min (estimate) |

## Owner listening checklist (step 10)
1. Watch the 9:16 film once with sound. Note the first beat that feels late or early.
2. Listen to the sound alone with the picture muted. Is the music clear and not too loud?
3. Each payoff: does a hit have a sound on the hit frame? Does the final chord have a tail?
4. Check 1:1 and 16:9 stills for safe-area text.
5. Score each rubric-v2 criterion from 1 to 10 in one line.
6. Review Persian reading, RTL copy, LTR number runs, and actual loaded font face/weight for each intended role.

## VERSION.json template
```json
{
  "film": "<film-slug>",
  "version": "<version>",
  "date": "YYYY-MM-DD",
  "BPM": 120,
  "T0_S": 0.0,
  "track": "sound/library/bgm/<slug>.mp3",
  "track_t0_s": 0.0,
  "cues_file": "<path>",
  "ratios": ["9:16", "1:1", "4:5", "16:9"],
  "silent_render": "silent-9x16.mp4",
  "file": "<film-slug>-9x16-<version>.mp4",
  "production_record": "<production-directory>/process.json",
  "notes": "Personal test only. <what changed>",
  "owner_score": null
}
```

## Time expectations
- Silent render of an 18 s film: 15 to 20 s per ratio; four ratios in parallel about 30 s.
- Preview: about 6 s. Still: about 4 s. Mix: about 1 s per analysis pass.
- Scene build: use the current worker-routing decision; milestone timeboxes are explicit. Historical figures are estimates, not routing policy.
- Owner listening: at least one session per version.

## Order templates

### Worker order
```
GOAL: <one deliverable>
INPUTS: <exact paths>
OUTPUTS: <exact paths>
ACCEPTANCE: <exact command and FILM-GATES target stage; name each required check and evidence path>
FORBIDDEN: edit any file not in OUTPUTS; run git unless explicitly ordered; touch media/**, sound binaries, work/persian/.*.env; put any client name or institution word in a file; add secrets.
REPORT: <path>.md, max 25 lines: files changed, measured results, what is unverified.
TIME BOX: <minutes>; report progress to the live status board and update the requested progress file.
No human is present, do not ask questions.
```
Use the current `DECISIONS.jsonl` worker-routing decision and order mechanism. Do not infer that an old sample, route, or script is the current default.

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
- The uni teaser has not reached a verified delivery; consult current `STATE.md` before relying on this historical snapshot.
- Music beat threshold and SFX event comparison need executable gates; script presence does not mean a threshold is wired or the final mix is checked.
- Review, Persian reading, bidi, font-role, and preserved-positive-trait evidence needs human/source-backed review. Structural validation does not establish those facts.
- Track selection depends on the owner's decision about the FAIL tracks (see `STATE.md` section 3).
- Remote URL and `media/dana` deletions are owner decisions, not part of this process.

## Confirmed Persian file-encoding safeguard (2026-10-13)
Python reads/writes for Persian source, copy, director and props must explicitly use UTF-8. After copy edits, parse director and runtime props with UTF-8 and compare authoritative scene text. Keep a versioned snapshot before edits; a renderer pass alone does not prove copy integrity.

## Deliver (last step of every film)
- `pwsh -File work/persian/tools/pa.ps1 deliver <film> <version>` puts the finals in `output/<film>/<version>/` (hardlinks) and refreshes `output/LATEST/` and `output/INDEX.md`. Preview with `--dry-run`; rebuild only with `deliver --rebuild`.
- The studio must run it and tell the owner the path `output/LATEST/<film>-<ratio>.mp4`. Details: `output/README.md`.


## Lessons 2.5 (conference teaser v1-v5; ledger L-056..L-066)
After sound: `pa audio-check`; after the last render: `pa strip` around each transition in both ratios; finale = same world; peer logos equal; contrast >= 4.5:1; deliver with `pa deliver` (compressed by default). Diagnose first, then change. Next-version loop: owner feedback -> frozen scope -> one studio order -> deliver.

## Arcs (2.6): an optional menu, not a template
`docs/motion/recipes/arcs.json` holds 6 DIVERSE story shapes drawn from the references (reveal-ladder, problem-turn, one-object-journey, count-stack, type-statement, before-after-pairs). INSPIRATION ONLY: every film defines its own story (logline, protagonist/object, emotional arc, payoffs) from its goal; using a shape is optional, justified in the film.html header, never copied. `pwsh -File work/persian/tools/pa.ps1 arc` lists the menu; `pa arc <shape> --bpm 118 --duration 24` prints a bar/beat/seconds scene table (cuts on bar downbeats). Pacing numbers: docs/motion/knowledge/PACING-PROFILES.md. After the render run `pa pacing <final.mp4> --profile story|teaser|typography|ad` (advisory). Music: `pa music-pick`.
