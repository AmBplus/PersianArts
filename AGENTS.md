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

## Model roles

- Decisions, planning, review of results and orchestration: the main session model.
- Implementation tasks (writing/rewriting code, renders, mechanical fixes) are delegated to **Sonnet 5.5, medium effort**.

## Git

- The owner decided (2026-10-11) to work on `main` directly. `main` auto-deploys the library to GitHub Pages
  (`.github/workflows/deploy-library.yml` on `library/**`), so be deliberate about changes under `library/`.
- Push over SSH (`git@github.com:AmBplus/PersianArts.git`); HTTPS needs an interactive login on the owner's machine.
- During long batches keep `pwsh -File work/persian/autosync.ps1` running (commit + push of this project's paths every 5 min).
