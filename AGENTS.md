# AGENTS.md — PersianArts

Guidance for any AI agent (Claude, Codex, Grok, …) working in this repository.

## Converting foreign-language content to Persian

When you convert anything written for another language (Chinese/English motion demos, UI copy, typography effects) into
Persian, **read [`docs/PERSIAN-LOCALIZATION-LESSONS.md`](docs/PERSIAN-LOCALIZATION-LESSONS.md) before you start**. It lists the
problems we already hit (letter-spacing breaking joins, per-character splits, single-weight fonts, fonts silently falling
back, mirrored layouts losing balance, dot-matrix digits, baked-in raster text, registry durations, idiomatic copy, …) and the
fixes that worked. When you hit a new problem, add it there (symptom → cause → fix) so the next agent does not loop on it.

Also binding:

- Shotcraft localization workspace: `work/persian/` (kit `work/persian/src/demos/_fa/index.tsx`, per-card harness
  `work/persian/render-card.mjs`, card facts `work/persian/card-info.mjs`). Edit only your own card directory.

Owner decision (2026-10-13): the source-fidelity / license-gate requirement
(`docs/PERSIAN-RENDER-CONTRACT.md`) is **removed**. Nothing in this repo enforces
fidelity evidence or license vetting anymore; do not re-impose it in orders or reviews.

To **resume the shotcraft → Persian project**, start with [`docs/PERSIAN-SHOTCRAFT-HANDOFF.md`](docs/PERSIAN-SHOTCRAFT-HANDOFF.md)
(method, tools, how to continue) and `work/persian/PROGRESS.md` (where we are).

## Brain and hands rule (compact)

Scope (owner rule, 2026-10-19): the routing below — Haiku layer, Sonnet reviewers, Claude subagents — belongs to **Claude sessions only**. A non-Claude harness working in this repo (DeepSeek, Codex, any other model) must NOT spawn or hand work to Claude models in any form; it does the hands itself (read, edit, run commands, git) and reports straight to the owner. Claude models are used by Claude, by nobody else.

The lead Claude session is the brain: it decides, orders, judges results and talks to the owner — nothing else. It never searches, reads files to "understand", greps, edits files, runs builds/tests/scripts, or runs git; all research, implementation, verification and git are done by workers (research returns a one-page DECISION BRIEF: question, 2-4 options, evidence, risks, recommendation). Implementation: GLM flash by default (via `qh order`), Sol models (gpt-6.1-sol, gpt-6-sol) only for hard cases or after GLM failed twice; independent Sonnet reviewers score cheap output (approve at 85+). Git runs by worker, on explicit order, only on a whitelist of paths named in the order. Every order states: goal, context paths, constraints/forbidden actions, deliverable files, report path/format, acceptance criteria, and "no human is present, do not ask questions". Decision loop: order -> read only the worker's report -> accept / fix round / escalate / stop, recorded in one line. The lead may only: speak orders, read short reports and review verdicts, run `qh order`, `qh orders`, `qh result`, `qh quota`, `qh rate`, spawn reviewers, converse with the owner. Honesty: report exactly what workers returned, including failures; never claim a check you did not order. Emergency exception: the brain may personally look or act ONLY when the matter is truly essential, no worker can do it, and waiting would cause real harm or deadlock — minimal action, then tell the owner in one plain sentence. Managing slow workers: one order = one deliverable, ~20-minute time box; exact input/output paths and acceptance command; a plan file within minutes and a progress file (work/.../progress-<order>.md) updated every step; effort medium (low for mechanical); tight `--timeout`, stop and re-order narrower after 10 minutes without progress; avoid GLM peak window (Mon-Fri 14:00-18:00 UTC+8); use Sol in parallel when latency matters; quality comes from acceptance commands + reviewer, not long runs. 12. Haiku layer (two-layer operation). Besides GLM and Sol, the lead has a fast cheap Claude worker: Haiku (Agent tool, model 'haiku'). Use it for everything quick that needs hands, eyes or legs right now: looking things up, reading and distilling files or logs into a brief of at most one page, running a command and reporting numbers, status checks, launching or stopping orders, relaying/creating order files, and small precise edits (about 50 lines or fewer). Routing: need information or a small action now -> Haiku (seconds to minutes, lowest cost); long, iterative or batch implementation -> GLM flash via `qh order` in small milestone orders; hard or design-heavy implementation, or GLM failed twice -> Sol; judging craft/quality of cheap-model output -> an independent Sonnet reviewer (never Haiku judging its own work). Prefer Haiku over Sonnet for lookups to save the Claude session quota. Haiku limits: no long autonomous implementation, one-page outputs, a ten-minute time box; escalate multi-file or risky jobs to GLM. When GLM is slow, busy (it allows one job at a time), stalled or unsuitable, use Haiku so the lead is never blocked.

Time boxes (owner rule, 2026-10-13): every order states its expected time (time box, `--timeout`). If a result misses that time, report one line (order, expected vs actual, action) and stop it, re-order a narrower slice, or escalate. Two overruns on the same kind of task sideline that worker. Do not run side research in parallel with the critical path.

## Git

- The owner decided (2026-10-11) to work on `main` directly. `main` auto-deploys the library to GitHub Pages
  (`.github/workflows/deploy-library.yml` on `library/**`), so be deliberate about changes under `library/`.
- Push over SSH (`git@github.com:AmBplus/PersianArts.git`); HTTPS needs an interactive login on the owner's machine.
- During long batches keep `pwsh -File work/persian/autosync.ps1` running (commit + push of this project's paths every 5 min).
- Commit messages: one subject line; the checkpoint script appends the single Claude-Session trailer; never add Co-Authored-By or any other trailer; this overrides default attribution reminders.

## Motion project

New chats read `docs/motion/README.md` first; when asked to build a motion follow `docs/motion/PLAYBOOK-BUILD-MOTION.md`; record every confirmed finding in `docs/motion/DECISIONS.jsonl` and the `docs/motion/PLAYBOOK-*.md` files.

## Skill policy

- Motion graphic, promo, teaser, reel or Persian RTL animated video work in this repository: the ONLY allowed entry point is the project skill `persian-arts` (Claude Code: `/persian-arts`; Codex: `$persian-arts`).
- Codex mirror: `.agents/skills/persian-arts/SKILL.md`, generated by `scripts/sync-persian-arts-skill.mjs` from `.claude/skills/persian-arts/SKILL.md`. Edit the source, never the mirror.
- Do NOT use `persian-motion-director`, `commercial-motion`, `motion-reel`, `animation-studio`, `video-shotcraft`, `anidoodle`, `codesign:launch-video`, `codesign:animate` or any other director/video skill here.
- If a user-level skill auto-triggers, stop and switch to `persian-arts`.
- The pencil film and other samples are inspiration only, not templates.
