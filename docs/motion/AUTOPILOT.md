# AUTOPILOT: unattended work protocol (motion / Persian)

Status: 2026-10-13. Owner pre-approved unattended work. No human is present: never ask questions; park owner-only decisions.

**AUTOPILOT PAUSED by owner 2026-10-13 ~08:20.** GLM (zcode) sidelined: it timed out on P2 (1500 s) and P3 (1202 s);
do not use GLM for scene work. Use Haiku for quick actions and Sol (codex-a gpt-6.1-sol via `qh order` / `qh run`)
for implementation until the owner says otherwise. Running orders at pause: none (order 15 stopped). Details and next
actions: [RESUME.md](RESUME.md). The loop and backlog below stay valid, but no new orders start until the owner resumes.
Resume first: [RESUME.md](RESUME.md). Project state: [STATE.md](STATE.md). Start page: [README.md](README.md).

## Purpose
Keep the motion and Persian pipeline moving while the owner is away, and keep everything important in git so a
fresh machine or chat can resume from `git pull` alone. Work is organised as a prioritised backlog (below) and each
checkpoint pushes only whitelisted, text-only, secret-free paths.

## Roles
- Lead (this session) = brain only. Decides, writes orders, reads short reports, decides accept / fix / escalate / stop.
- Haiku (Agent tool, model `haiku`) = quick hands: lookups, status, small edits (<= 50 lines), one-page briefs.
- GLM flash via `qh order` = default implementation, one milestone per order.
- Sol (gpt-6.1-sol, gpt-6-sol) = hard cases, or after GLM failed twice. Codex only for imagegen.
- Independent Sonnet reviewer = scores cheap output (approve at 85+). Never Haiku judging its own work.
- Owner = decides owner-only items only (Waiting for owner list).

## Loop (each cycle)
1. Read `qh orders`, `docs/motion/STATE.md`, `RESUME.md`, this backlog.
2. Issue next orders: max 2 GLM-queued, max 2 Haiku in parallel, Sol only as escalation.
3. Check quotas: Claude plan usage (session tool), `qh quota` and `qh rate` for glm and codex.
4. Judge reports (short reads only). Record each decision as one line in `docs/motion/ledger.jsonl` via a worker.
5. When changes exist: run `work/persian/tools/checkpoint.ps1 -DryRun`, then the real run (commit and push).
6. Update `STATE.md` and `RESUME.md` through a worker.
Every order ends with: no human is present, do not ask questions, and the footer that appends to `manual-orders.jsonl`.

## Quota protocol
- Trigger: Claude 5h window >= 85%, OR weekly >= 90%, OR context >= 90%.
- Action: stop issuing new orders; run checkpoint (commit + push); update the RESUME HERE block; schedule ONE
  wake-up at the reset time (scheduled-tasks tool). Do not spin.
- Worker quota (glm or codex) exhausted: use the other tier; keep Haiku for quick tasks. Never switch to a forbidden model.
- Peak window for GLM (Mon-Fri 14:00-18:00 UTC+8): prefer Haiku or Sol for latency-critical work; run heavy GLM outside it.

## Hard stops (never autonomous)
- CAPTCHA or bot-detection bypass. Changing the git remote. Force push, or pull or rebase on push rejection.
- Touching `media/dana/`. Committing `media/**`, binaries (mp3 wav ogg flac m4a mp4 mov webm png jpg jpeg webp zip)
  over 1 MB, secrets, or any client name or institution wording (use the label `uni-admissions`).
- Mass porting of Persian cards. Publishing or deploying `library/**`. Destructive deletes. Spending money.
- Owner-only decisions: park them (below), never decide them.

## Waiting for owner (recommended default, then move on)
- rubric-v2 weights: rec accept 1.5 weights, cap 6.
- Remote URL: `origin` is `git@github.com:AmBplus/PersianArts.git` (SSH, set by owner 2026-10-13; the old persiandoodle HTTPS URL is retired).
- `media/dana/` (tracked, with many deletions in the working tree): rec keep tracked, move later.
- Listening feedback on pencil v51.
- Public wording and claims for the uni-admissions teaser.
- Jamendo: irrelevant (personal use).

## Failure rules
- An order fails twice: escalate to Sol (`qh run` or `qh order` with gpt-6.1-sol), or park it with notes in the RESUME block.
- Stalled order (no progress-file update for > 10 min): stop it and re-order a narrower slice with partial results as input.
- Same failure more than twice: stop looping, park it, report the failure to the owner exactly as returned.

## Commit rules
- Commit every meaningful batch (>= every 60 min of work, or when a milestone finishes), via
  `work/persian/tools/checkpoint.ps1 -Message "<subject>"`. Whitelist only; message ends with the Claude-Session trailer; no Co-Authored-By.
- Push to `origin main`. Never force. On rejection, report and stop (exit 2): the local commit is kept.
- Other workers' paths (`docs/motion/reports`, `work/persian/src/film/uni`) are excluded by the script; their owners commit them.
- Binaries are never committed by default (skipped and counted). The checkpoint log is `docs/motion/last-checkpoint.txt`.

## BACKLOG (ordered; each item has an acceptance check)
- B1 Finish uni-admissions teaser. Wait for P3 (order 13). Full silent render via `render_all`; cue sheet from the payoff
  frame table; music pick from `media/music-staging/owner/BPM-REPORT.md` (lighter tracks: miromax 118, lnplus 110,
  px-99s-d 118, the-mountain 110); mix with the v51 recipe; 9:16 final in `media/film-versions/uni-admissions/<version>/`.
  Accept: 4 ratio stills verified, mp4 present and 9:16.
- B2 Re-measure render benchmarks with raw logs into `work/persian/_bench/results-<date>.csv`. Experiments: shared browser
  and page-cap queue (`batch_render.mjs`), first-frame warm-up, scene-cost audit on a copy. Update `PLAYBOOK-RENDER.md`,
  `DECISIONS.jsonl`, ledger. Accept: CSV has raw timings and reproduces on re-run.
- B3 Architecture M3+: `render_all.ps1` emits canonical `VERSION.json`, `render.txt`, `mixed-<ratio>.mp4`; migrate 13
  legacy VERSION.json; scaffold `films/<slug>/` template WITHOUT moving code; `pa` CLI skeleton in `work/persian/tools/pa/`
  (new-film, render, mix, preview, version, verify, scan, research-log) calling existing scripts; contracts validated in
  the autosync guard. Accept: `contracts/validate.mjs` passes.
- B4 Pencil defects: 1:1 nib crossing the day-7 tick; day-7 rings grazing row 6. Then 4-ratio pass for v51 (render_all,
  stills, verify). New version v52 only if visuals change. Accept: stills checked, reviewer score >= 85.
- B5 Reporting: daily summary and detail via GLM; keep `docs/motion/STATE.md` fresh; rebuild ledger; every Haiku order
  appends to `manual-orders.jsonl`. Accept: STATE.md dated today.
- B6 Prompt-refiner as a reusable step: turn `work/persian/prompt-design-brief.md` into a template plus a `new-film`
  brief command; test on a second synthetic brief. Accept: both briefs produce valid output.
- B7 Evals: rubric-v2 weights wait for owner. Meanwhile an independent reviewer scores existing samples with the draft
  criteria, WITHOUT claiming approval. Accept: scores labelled "draft, unapproved".

## Footer for every order (appends to manual-orders.jsonl)
"After finishing, append one JSON line {order, model, started, finished, result, files} to docs/motion/manual-orders.jsonl.
No human is present, do not ask questions."

## Time boxes and sidelining

Owner rule, 2026-10-13. Motivation: the uni teaser took about 6 h after two GLM timeouts.

- Every order states its expected time: a time box in minutes and a matching `--timeout`.
- A result that misses the expected time is an overrun. Report one plain line: order, expected vs actual, action taken.
- Action on an overrun: stop the job, then re-order a narrower slice with the partial output as input, or escalate to a stronger worker.
- Two overruns on the same kind of task sideline that worker or tool: no more orders to it until the owner lifts the rule.
- Do not run side research in parallel with the critical path. Finish the film first.
- Each overrun is recorded in `docs/motion/ledger/README.md` and decided in `docs/motion/DECISIONS.jsonl`.
