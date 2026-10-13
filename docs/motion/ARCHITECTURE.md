# Motion architecture (option C)

Decision: [ADR-0001](adr/0001-architecture-option-c.md). Evidence: `work/persian/architecture-brief.md`.

## Folder tree and owners

```
contracts/            schemas, examples, validate.mjs, scan.mjs      owner: lead decides
films/<slug>/         vertical slice: film.json, brief.md, copy.json, scenes/, cues.json, assets.json, versions.json, eval/
kernels/render/       render_all.ps1, mix_film.ps1, mix_sfx.ps1        (moved later; shims first)
kernels/kit/          shared Remotion kit (today work/persian/src/demos/_fa)
sound/                sound kernel: library/, tools/
evals/                rubric.md, rubric-v2.md, briefs/               owner approves rubric changes
scripts/pa/           pa dispatcher (pa.ps1 -> Node core); no film logic
orders/templates/     glm-milestone, sol-hard, haiku-quick, reviewer
orders/sent/<id>/     order.md, progress.md, report.md (small, tracked)
docs/motion/          adr/, DECISIONS.jsonl, PLAYBOOK-*.md, STATE.md, ARCHITECTURE.md
media/film-versions/  IGNORED binaries per version (mp4, VERSION.json, render.txt, ffprobe.json)
media/briefs-local/   IGNORED client-sensitive briefs
work/persian/         legacy working area (not deleted)
library/              PUBLISHED (GitHub Pages); closed to the motion work
```

## Dependency rules

- `films/<slug>` may use `kernels/*` and `contracts/*` by path, and read `sound/library` by ID via `cues.json`. No film imports another film, `library/` or `work/persian/src` once a kernel exists.
- `kernels/render` imports no film; it takes a film path and writes a version folder.
- `sound/tools` and `evals/` import no film or `work/` code. `scripts/pa` calls kernels and reads contracts only.
- `plugins/persianarts-motion` reads `contracts/` and `scripts/pa`; never edits `films/` or `library/`.
- `library/` is imported by nothing except the publish step. Enforced by `pa scan --imports` (warn mode first).

## Slice template

`README.md`, `film.json` (film.schema), `brief.md` (brief.schema), `copy.json` (literal Persian tokens), `scenes/`, `cues.json` (cue-sheet.schema), `assets.json` (ingredients, fonts, sounds, licences), `versions.json`, `eval/` (rubric results per version).

## Naming conventions

- Films: kebab-case English slug (`pencil-social`). Client films use a neutral code (`client-a-admissions`).
- Versions: `v<N>-<variant>` (`v3-beat124-music`); N = next in `versions.json`; never overwrite.
- Cue IDs: `<slug>.c<NN>`; SFX `<sfxcat>-<name>` (per `sound/library/sfx/INDEX.md`).
- Orders: `YYYY-MM-DD-<worker>-<short-title>`. Decisions: `D-YYYYMMDD-NN`.

## Commands (`pa`)

| Command | Arguments | Writes |
|---|---|---|
| `pa new-film` | `<slug> --brief <file> [--dry-run]` | `films/<slug>/*` |
| `pa render` | `<slug> [--version vN] [--ratios 9x16,1x1] [--no-music]` | version folder, `render.txt`, `VERSION.json` |
| `pa mix` | `<slug> --version vN --track <slug> --t0 <s> [--sfx]` | version folder, `cues.json` link |
| `pa preview` | `<slug> --frames 150-210 [--stills 15,48]` | preview folder (not versioned) |
| `pa version` | `<slug> new\|list\|promote vN` | `versions.json`; promote needs owner flag |
| `pa verify` | `<slug> vN [--ref vM]` | `eval/vN.json`, `ffprobe.json` |
| `pa scan` | `[--confidential] [--secrets] [--binaries] [--schemas] [--imports]` | exit code, report |
| `pa research-log` | `"<question>" --decision "<text>" --why "<text>" [--adr ADR-n]` | DECISIONS line, `docs/motion/experiments/<date>-<topic>/` |
| `pa order` | `--template <name> --worker glm\|sol\|haiku --slice <slug> --timeout 1200` | wraps `qh order`; `orders/sent/<id>/` |

## RACI (A accountable, R responsible, C consulted, I informed)

| Task | Owner | Lead | GLM | Sol | Haiku | Sonnet reviewer | Git worker |
|---|---|---|---|---|---|---|---|
| Architecture, ADRs | A | R (orders) | - | C | - | C | - |
| Scene implementation | I | A (accepts) | R | R (hard) | - | - | - |
| Cue sheet, sound pick | A | R | C | - | R | - | - |
| Renders and verify | I | A | R | - | R | - | - |
| Score (craft) | A (final) | C | - | - | - | R (0-100) | - |
| Commit and push (whitelist) | A (approves) | R (orders) | - | - | - | - | R |

## Research results

A research order returns a one-page decision brief (question, 2-4 options, evidence as file:line or URL, risks, recommendation). The lead records the decision with `pa research-log`: one line in `docs/motion/DECISIONS.jsonl` plus small result files (csv, json, md; no binaries) under `docs/motion/experiments/<date>-<topic>/`.

## Confidentiality, secrets, ignored artefacts

- Client and institution names live only in `contracts/confidential-terms.local.txt` (git-ignored). Tracked files use neutral slugs. The term list is never printed; scans report paths and line numbers only.
- Secrets (`*.env`, API tokens) are never tracked (`pa scan --secrets`).
- Binaries stay under `media/` (ignored) and are never copied into `films/`. `versions.json` references each version by path, sha256, source commit, BPM, T0, track slug and cues file.
- A missing binary on this machine yields `missing` in `pa verify`; it never fails the film.
- Music and SFX are referenced by slug or ID only.

## pa: decision (2026-10-13)

Decision: adopt the incoming `work/persian/tools/pa.ps1` as THE command layer. It is PowerShell, already in git, and already the documented entry for setup, private-file copy, readiness check and the live board. The planned Node dispatcher at `scripts/pa/` is not created; new `pa` subcommands are added to `pa.ps1` and call the existing scripts. Mapping of the commands in the table above:

| Planned command | Today | Status |
|---|---|---|
| `pa new-film` | none | backlog (B3) |
| `pa render` | `work/persian/render_all.ps1` (run directly) | wrapper missing (B3) |
| `pa mix` | `work/persian/mix_film.ps1`, `work/persian/mix_sfx.ps1` | wrapper missing (B3) |
| `pa preview` | `render_all.ps1 -Mode stills` | wrapper missing (B3) |
| `pa version` | none (version folders by hand) | backlog (B3) |
| `pa verify` | `work/persian/tools/gates/run-gates.mjs`, `work/persian/tools/film-process-gates.mjs` | wrapper missing (B3) |
| `pa scan` | `node contracts/scan.mjs` | wrapper missing (B3) |
| `pa research-log` | none (DECISIONS.jsonl by hand) | backlog (B3) |
| `pa order` | `qh order` | wrapper missing (backlog) |
| `pa setup`, `setup-private`, `check`, `status` | `work/persian/tools/pa.ps1` | exists |

Status: decision proposed by the lead; owner confirmation is pending (DECISIONS line D-20261013-22).
