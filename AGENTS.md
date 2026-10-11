# AGENTS.md — PersianArts

Guidance for any AI agent (Claude, Codex, Grok, …) working in this repository.

## Converting foreign-language content to Persian

When you convert anything written for another language (Chinese/English motion demos, UI copy, typography effects) into
Persian, **read [`docs/PERSIAN-LOCALIZATION-LESSONS.md`](docs/PERSIAN-LOCALIZATION-LESSONS.md) before you start**. It lists the
problems we already hit (letter-spacing breaking joins, per-character splits, single-weight fonts, fonts silently falling
back, mirrored layouts losing balance, dot-matrix digits, baked-in raster text, registry durations, idiomatic copy, …) and the
fixes that worked. When you hit a new problem, add it there (symptom → cause → fix) so the next agent does not loop on it.

Also binding:

- [`docs/PERSIAN-RENDER-CONTRACT.md`](docs/PERSIAN-RENDER-CONTRACT.md): only literal on-screen text is replaced; motion keeps
  fidelity; nothing is public until verified with source-fidelity evidence.
- Shotcraft localization workspace: `work/persian/` (kit `work/persian/src/demos/_fa/index.tsx`, per-card harness
  `work/persian/render-card.mjs`, card facts `work/persian/card-info.mjs`). Edit only your own card directory.

To **resume the shotcraft → Persian project**, start with [`docs/PERSIAN-SHOTCRAFT-HANDOFF.md`](docs/PERSIAN-SHOTCRAFT-HANDOFF.md)
(method, tools, how to continue) and `work/persian/PROGRESS.md` (where we are).

## Brain and hands rule (compact)

The lead Claude session is the brain: it decides, orders, judges results and talks to the owner — nothing else. It never searches, reads files to "understand", greps, edits files, runs builds/tests/scripts, or runs git; all research, implementation, verification and git are done by workers (research returns a one-page DECISION BRIEF: question, 2-4 options, evidence, risks, recommendation). Implementation: GLM flash by default (via `qh order`), Sol models (gpt-6.1-sol, gpt-6-sol) only for hard cases or after GLM failed twice; independent Sonnet reviewers score cheap output (approve at 85+). Git runs by worker, on explicit order, only on a whitelist of paths named in the order. Every order states: goal, context paths, constraints/forbidden actions, deliverable files, report path/format, acceptance criteria, and "no human is present, do not ask questions". Decision loop: order -> read only the worker's report -> accept / fix round / escalate / stop, recorded in one line. The lead may only: speak orders, read short reports and review verdicts, run `qh order`, `qh orders`, `qh result`, `qh quota`, `qh rate`, spawn reviewers, converse with the owner. Honesty: report exactly what workers returned, including failures; never claim a check you did not order. Emergency exception: the brain may personally look or act ONLY when the matter is truly essential, no worker can do it, and waiting would cause real harm or deadlock — minimal action, then tell the owner in one plain sentence. Managing slow workers: one order = one deliverable, ~20-minute time box; exact input/output paths and acceptance command; a plan file within minutes and a progress file (work/.../progress-<order>.md) updated every step; effort medium (low for mechanical); tight `--timeout`, stop and re-order narrower after 10 minutes without progress; avoid GLM peak window (Mon-Fri 14:00-18:00 UTC+8); use Sol in parallel when latency matters; quality comes from acceptance commands + reviewer, not long runs.

## Git

- The owner decided (2026-10-11) to work on `main` directly. `main` auto-deploys the library to GitHub Pages
  (`.github/workflows/deploy-library.yml` on `library/**`), so be deliberate about changes under `library/`.
- Push over SSH (`git@github.com:AmBplus/PersianArts.git`); HTTPS needs an interactive login on the owner's machine.
- During long batches keep `pwsh -File work/persian/autosync.ps1` running (commit + push of this project's paths every 5 min).
