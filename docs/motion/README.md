# docs/motion: START HERE

Status date: 2026-10-13. Read this file first in any new chat.

## What the project is
A Persian motion-graphics engine: Remotion (React, Chrome renders) scenes with Persian text, a beat-based cut grid, a sound library with a beat test, and a render and mix pipeline. Output: short 9:16 social films (1:1, 4:5 and 16:9 derived) with a single music track and recorded or library SFX.

## Owner's fixed decisions
- Personal, non-commercial use for now. Do not raise licence talk unless the owner asks.
- Sample films are tested in 9:16 only until later. Still, every ingredient must work in 9:16, 1:1, 4:5 and 16:9 before it is accepted.
- Sound: recorded or library sound only. No text-to-speech and no synthesis for voice. One music track per film; cuts land on beat or bar.
- Anti-slideshow is a hard rule. Storytelling is a rule, but a character is optional (a plain object such as a pencil is enough).
- The client's name and institution words never appear in any tracked file. Use the label `uni-admissions`.
- Git: work is on `main`. Commits and pushes are made by a worker, on explicit order, with a path whitelist.
- Full source: `C:\Users\Amir\Videos\HANDOFF-FULL.md` (section 2, Persian), `CLAUDE.md`, `AGENTS.md`.

## Brain and hands workflow
1. The lead session decides, orders and judges. It never edits files, runs builds, greps repos, or runs git.
2. Implementation goes to GLM flash through `qh order` (default). Sol models only for hard cases or after GLM failed twice.
3. Quick hands-on work (lookups, one-page briefs, status checks, small edits up to about 50 lines) goes to the Agent tool with model `haiku`.
4. Independent Sonnet reviewers score cheap-model output (approve at 85 and above).
5. Every order has: goal, input paths, output paths, acceptance command, forbidden actions, and "no human is present, do not ask questions".
6. Git (add, commit, push) only by a worker on explicit order, limited to whitelisted paths.
7. Each decision is recorded in `DECISIONS.jsonl`. Each confirmed method goes to a PLAYBOOK file.

## Files
- `STATE.md`: where things stand, open decisions, known defects, next steps.
- `DECISIONS.jsonl`: every decision with evidence, status and owner approval.
- `PLAYBOOK-RENDER.md`: confirmed render methods, timings, commands, unconfirmed items.
- `PLAYBOOK-SOUND.md`: sound library, music beat test, cue rules, mix recipe, fetch scripts.
- `PLAYBOOK-BUILD-MOTION.md`: fast path from brief to finished 9:16 film with sound, with order templates.
- `research/INDEX.md`: list of the decision briefs kept in `research/`.
- `research/*.md`: copies of the decision briefs (client references removed).
- Tracked tools: `work/persian/render_all.ps1` (+ `render_all.md`), `work/persian/mix_film.ps1`, `work/persian/mix_sfx.ps1`, `work/persian/freesound_fetch.py`, `work/persian/freesound_fill.py`, `work/persian/freesound_payoff_fill.py`, `work/persian/jamendo_fetch.py`, `work/persian/tools/cues/` (cue builders, see its README.md), `sound/library/` (manifests and catalogues).

## New chat checklist
1. Read this README.
2. Read `STATE.md`.
3. Read the tail of `DECISIONS.jsonl` (last 20 lines).
4. Run `qh orders` to see what workers are doing.
5. Confirm repo state with `git status` (worker or lead, read-only).
6. Then take the user's task. Build with `PLAYBOOK-BUILD-MOTION.md`.
