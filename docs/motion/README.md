# docs/motion: START HERE

Status date: 2026-10-13. Read this file first in any new chat.

## MAP: who owns what (merged 2026-10-13)

Two systems live in this folder. The persian-arts system came in with 24baaae; the production system is ours. Both are kept.

| Area | Owner system | Where | Use it for |
|---|---|---|---|
| Entry point to build a film | persian-arts | `/persian-arts` (`.claude/commands/persian-arts.md`, skill `.claude/skills/persian-arts/`) | "build a film" or "make a motion": orchestration, intake, gates, QC |
| Craft skills (internal) | persian-arts | `.claude/skills/persian-arts-*/` (director, writer, technical, sound, qc, copy-editor, art-director, motion-designer, motion-editor) | steps the orchestrator calls; never triggered alone |
| Command layer | persian-arts | `work/persian/tools/pa.ps1` (setup, setup-private, check, status) | setup, private-file copy, readiness check, live board |
| Gates, board, goals | persian-arts | `work/persian/tools/gates/`, `work/persian/status/serve.mjs`, [GOAL-MEMORY.md](GOAL-MEMORY.md), [FILM-GATES.md](FILM-GATES.md), [STATUS-PROTOCOL.md](STATUS-PROTOCOL.md) | quality gates, live status |
| Process and lessons | persian-arts | [LESSONS-LEDGER.md](LESSONS-LEDGER.md) (lessons per film), [LOOP-POLICY.md](LOOP-POLICY.md), [METERING.md](METERING.md), [METRICS.md](METRICS.md) | retro lessons, loop and quota rules |
| Render and sound recipes | ours | [PLAYBOOK-BUILD-MOTION.md](PLAYBOOK-BUILD-MOTION.md), [PLAYBOOK-RENDER.md](PLAYBOOK-RENDER.md), [PLAYBOOK-SOUND.md](PLAYBOOK-SOUND.md) | render and sound steps; build-motion is the fast path after `/persian-arts` |
| Decisions | ours | [DECISIONS.jsonl](DECISIONS.jsonl) (validated by `contracts/schemas/decision.schema.json`) | what we decided, with evidence |
| Research | ours | [research/INDEX.md](research/INDEX.md) | decision briefs (question, options, evidence) |
| Production timing and quality accounting | ours | [ledger/](ledger/README.md) (`ledger.jsonl`, per-film tables), [reports/](reports/README.md) (daily two-level reports) | how long films take, what each version cost |
| Contracts | ours | `contracts/` (schemas, `validate.mjs`, `scan.mjs`) | JSON shapes and the confidentiality and secrets scan |
| Autopilot and architecture | ours | [AUTOPILOT.md](AUTOPILOT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [adr/](adr/0001-architecture-option-c.md), [RESUME.md](RESUME.md) | unattended-work protocol, folder plan, current state |
| Render and mix scripts | ours | `work/persian/render_all.ps1`, `work/persian/mix_film.ps1`, `work/persian/mix_sfx.ps1`, `work/persian/tools/cues/` | the actual render, mix and cue work |
| Checkpoint and commits | shared | `work/persian/tools/checkpoint.ps1` (whitelist commit and push, commit guard) | the only commit path; see the trailer rule in [AUTOPILOT.md](AUTOPILOT.md) |

Routing: "build a film" goes to `/persian-arts`, then PLAYBOOK-BUILD-MOTION for the render and sound recipes. "What did we decide or research" goes to DECISIONS.jsonl and research/. "Time or quality accounting" goes to ledger/ and reports/. LESSONS-LEDGER is not the production ledger: see the note in [ledger/README.md](ledger/README.md).

Commit trailer rule: every commit ends with exactly one `Claude-Session: ...` trailer and has no `Co-Authored-By` line (enforced by `checkpoint.ps1`). Commit ad89a30 has a stray `Co-Authored-By`; history is not rewritten. Details: [AUTOPILOT.md](AUTOPILOT.md).

`pa` decision: `pa.ps1` is the command layer; the planned `pa` CLI skeleton is not built separately. See the "pa: decision" paragraph in [ARCHITECTURE.md](ARCHITECTURE.md).

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

- Architecture (folder tree, dependency rules, commands, RACI): [ARCHITECTURE.md](ARCHITECTURE.md); decision record: [adr/0001-architecture-option-c.md](adr/0001-architecture-option-c.md)

- Daily reports (summary and detail per day, index): [reports/README.md](reports/README.md)

- Autopilot protocol and backlog: [AUTOPILOT.md](AUTOPILOT.md). Resume point (RESUME HERE block): [RESUME.md](RESUME.md).

## Fresh machine

No symlinks needed: the workbench scripts copy folders (gen-index.mjs, open.mjs), no OS special features.

Run from the repo root in PowerShell 7 (`pwsh`). Needs Node, npm, ffmpeg on PATH.
1. `git clone` the repo, then `cd` into it.
2. `pwsh work/persian/tools/pa.ps1 setup`: runs `npm ci` in `work/persian/src/workbench` (skipped if `node_modules` exists) and copies `work/persian/assets/fonts` into `workbench/public/fonts`.
3. Client-private files (never committed): set `$env:PA_PRIVATE_DIR` to the folder that holds them (label `uni-admissions`), then `pwsh work/persian/tools/pa.ps1 setup-private`. It copies `copy-map.json`, the four `uni-local` files and `confidential-terms.local.txt`, and prints MISSING names only.
4. `pwsh work/persian/tools/pa.ps1 check`: PASS/MISSING table; exit 1 if anything is missing.
5. Render: `pwsh work/persian/render_all.ps1 -Film social -OutDir media/film-versions/<film>/<version>` (add `-Mode stills` for quick stills; `-Film uni` needs step 3).
Optional env: `QH_HOME` (quota-hub folder, default sibling `../../tools/quota-hub`), `QH_DB` (quota-hub DB path override), `PA_REPO` (repo root for `persian-rtl-localize.js` and the cue scripts, if not run from the repo).
Not in git, by design: sound binaries under `media/sfx`, `media/music-pixabay`, `media/music-staging`, `media/film-v2-local` (large, licensed audio and local sources); `media/film-versions/**` (render outputs); `media/briefs-local/**` and `uni-local/` (client copy and logo files); `contracts/confidential-terms.local.txt` (client terms); `workbench/public/*` except `.gitkeep` (generated copies); `node_modules`. Copy the private files from the owner's private folder; the sound and music folders must be copied separately if a film needs them.

## Live status

- Start the board: `node work/persian/status/serve.mjs` (port 4747, localhost only); open http://localhost:4747/ .
- Data file: `work/persian/status/board.json` (goals, items, blockers, render progress). The page refreshes every 2 seconds.
- Update from the shell: `pwsh work/persian/tools/pa.ps1 status set <itemId> -State running -Percent 40 -Note "..."`; also `status add-item`, `status blocker add|clear`, `status show`.
- A running item with no update for 10 minutes shows as stalled (red). Rule for workers: [STATUS-PROTOCOL.md](STATUS-PROTOCOL.md).
- `render_all.ps1` writes frame x of y, fps and ETA into the render section automatically.
