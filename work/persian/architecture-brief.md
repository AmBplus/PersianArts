# ADR-0001 (proposed): Architecture for the PersianArts Motion project

Status: PROPOSED, for owner decision. Author: Haiku worker, order "architecture decision brief", 2026-10-13.
Scope: how films, sound, renders, evals, orders and decisions are laid out and driven. Read-only study; the only file written is this one.
Not read: `docs/motion/` (does not exist yet at study time; another worker is writing it). Reconcile with it before accepting. Items marked (guess) were not verified in files.

## 1. Context: what the repo looks like today (evidence)

| Area | Evidence | Problem |
|---|---|---|
| Top level | 20+ folders: `work/`, `media/`, `sound/`, `evals/`, `library/`, `skills/`, `plugins/`, `docs/`, `scripts/`, `assets/`, `download/`, `library-app/` (root listing) | No index says which folder is source, which is artefact, which is published. |
| `work/persian/` | `reports/` 163 files; 14 `*brief*.md` at root; 8 `progress-*.md` and 7 `report-*.md` at root; `out/` 84 entries; `_bench/`, `trial/`, `workflow/`, `sound-task/` (has its own `orders/`, `progress-*`, `report-*`); `owner-tools/` | Four or five places hold orders, reports and progress. Reports sit beside code. Work area is a dumping ground. |
| Film code | `work/persian/src/film/social/` (8 files) and `src/film/uni/` (9 files) each repeat `entry/layout/motion/theme/fonts/scenes` | Two films, duplicated structure, no shared film contract. |
| Render | `work/persian/render_all.ps1` (300 lines, `-Film social|uni`, OutDir must be `media/film-versions/<film>/<version>`); `render_all.md` says output is `silent-<ratio>.mp4` plus `render-report.json` | Version docs say `VERSION.json` and `render.txt` (`media/film-versions/README.md`). The two specs disagree. |
| Mix | `work/persian/mix_film.ps1` (needs `-Out`), `mix_sfx.ps1`; sidecar `sound/library/bgm/<slug>.music.json` | Mix reads sidecars from `sound/`, writes into `media/`; no cue sheet. |
| Fetchers | `work/persian/freesound_fetch.py`, `freesound_fill.py`, `freesound_payoff_fill.py`, `jamendo_fetch.py`, `pixabay-queue.ps1`; `sound/tools/fetch_pixabay_track.py` | Three fetch homes, two languages, one already in `sound/tools`. |
| Sound | `sound/library/` (bgm: 2 mp3 + 5 sidecars; sfx: `CATALOG.json`, `INDEX.md`, `TAXONOMY.md`, packs `kenney`, `freesound`, `owner-pack`, `anidoodle`); `sound/tools/` (`music_map.py`, `grid_accept.py`, tests); `sound/requirements.txt` (pins librosa, scipy, numpy) | Reasonably structured; the best-kept capability. Missing: an ID-based cue sheet linking music/SFX to a film. |
| Evals | `evals/rubric.md` (v1), `evals/rubric-v2.md` (DRAFT, owner approval pending), `evals/briefs/01..05-*.json` | Good: fixed briefs. Gate blocked until owner approves v2. |
| Plugin | `plugins/persianarts-motion/skills/persianarts-motion/`: `SKILL.md`, `schemas/` (6 JSON schemas: brief, film, ingredient-meta, music-track, review, theme), `themes/`, `tools/` (lint_fa.py, shape_persian.py, split_fa.js), `references/stages/00-07`, `catalog/`, `recipes/` | Real contracts exist here, but the film pipeline in `work/persian/` does not use them. |
| Skill | `skills/anidoodle/` (engine with `src`, `tools`, `dist`, `node_modules`, `example`, `references`) | Private study files are listed in `.gitignore` inside the same tree. |
| Published | `library/` (GitHub Pages via `.github/workflows/deploy-library.yml` on `library/**`); `library/data/*.json` (catalog 534 entries, shotcraft-full 157/214) | Do not disturb. Must stay isolated. |
| CI | `.github/workflows/`: `deploy-library.yml`, `persian-qa.yml` (`tools/persian-qa.mjs`), `render-scene.yml` (manual), `source-first-library-qa.yml` | No workflow checks schemas, secrets, binaries or confidentiality. |
| Git rules | `work/persian/autosync.ps1` commits only `work/persian`, two docs, `AGENTS.md`, `CLAUDE.md` | `sound/`, `evals/`, `docs/MOTION*`, `plugins/`, `media/**/VERSION` manifests are NOT auto-committed. |
| Ignore rules | `.gitignore`: `work/*` ignored except `work/persian/`; `media/film-versions/**` ignored except README; `media/film-v2-local/**` only binaries ignored; `sound/library/**/*.mp3` ignored | Binary policy is in several places. `media/dana/*.mp4` and `media/dana/music/*.mp3` are tracked in git (session git status: deleted from disk). |
| Commands | `docs/MOTION-SKILL-PLAN.md` lines 167-168 specify `pa render`, `pa mix`; plugin stage docs call `pa render --scene`, `pa mix --sfx` | No `pa` implementation found in the repo (grep over md/ps1/json). Designed, not built (guess: not built anywhere, verify). |
| Orders | `D:\P\tools\quota-hub` (`qh order`, `qh orders`, `qh result`, `qh stop`); `work/persian/sound-task/orders/` | Orders live in the hub and in project folders. |
| Root junk | Untracked: `.mimosa/`, `.playwright-mcp/`, `.remotion/`, `docs/DELEGATION-*.md`, `media/_contact_sheets/`, `scripts/persian-sound/verify_sound.py`, and others | Scratch at the root. |
| Naming | "PersianDoodle", "PersianArts", "persian-shotcraft", "anidoodle", "persianarts-motion", "MOTION-LIBRARY-ARCHITECTURE" (which is a library UI doc, not an architecture of the motion project) | Several names for one thing. The word "architecture" is already taken. |
| Confidentiality | Grep of `CLAUDE.md`, `AGENTS.md`, `docs/*.md` for "confiden|client": one hit, `docs/MOTION-SKILL-HANDOFF.md`. Film folder `media/film-versions/uni-admissions/`; brief folder `media/briefs-local/university-admissions/` | The owner's client-name rule is not written in CLAUDE.md or AGENTS.md. Folder names may leak a client. |

Summary of the mess: two film packages with duplicated code, orders and reports in at least four homes, a version spec that disagrees with the render script, a `pa` command that is designed but not built, an autosync whitelist that misses most of the motion work, and no schema check or confidentiality check in CI.

## 2. Options

**(A) Vertical slices per film** (`films/<slug>/` owns brief, copy, scenes, cues, assets list, versions manifest, eval results; shared kernels only for kit, render, sound, evals).
- Pro: matches how the owner thinks (one film at a time); each film is self-describing; fits the "film = thin config" idea.
- Con: alone, nothing standardises commands, schemas or research. Two films already duplicate code; slices would copy it again unless the kernel is extracted first.

**(B) Layered capability modules** (engine/kit, render, sound, evals, library of ingredients/themes/recipes, skill/commands; films are thin configs).
- Pro: matches the existing plugin (`schemas/`, `references/`, `tools/`); reusable parts; clear dependency direction.
- Con: no place for a film's own history. "Thin config" films still need their version and decision trail somewhere, so B alone recreates the scatter.

**(C) Hybrid**: capability kernels (B) + vertical slices for films (A) + one thin command layer (`pa`, PowerShell/Node dispatcher, and the `/persianarts-motion` skill as the front door) + contracts (JSON schemas) + ADRs, PLAYBOOKs, a decisions log and a research folder.
- Pro: each concern lives in one place; the designed `pa` commands get a home; schemas stop the render-spec disagreement; all existing scripts can stay in place behind shims.
- Con: more folders to explain; needs discipline. Costs one migration (section 6), done with zero big-bang moves.

**(D) Keep as is, with conventions only** (write rules into AGENTS.md).
- Pro: zero cost today.
- Con: already failing. 163 report files and 4 order homes show conventions have not held; the version spec and render script already disagree. Rules without a check will drift again.

## 3. Recommendation: option C, adopted in stages

Reasons from the evidence: (1) two films already share one render path and each duplicates its code (section 1), so a kernel is needed; (2) the owner wants a film to be a unit that can be versioned and re-judged, which is what slices give; (3) `docs/MOTION-SKILL-PLAN.md` already designs the `pa` command layer and the plugin stage docs already call it; (4) the plugin already has schemas to build on; (5) migration can be non-destructive (new folders and manifests first, moves last, shims kept). Option D is rejected by the evidence; A and B alone each leave one of the two gaps.

Decision principle: the lead orders, it does not browse. Everything the lead needs is one `pa` command or one manifest line.

## 4. Target folder tree (proposed; new folders only at first)

```
contracts/                    NEW  JSON schemas + examples (tracked)
  schemas/   brief, film, cue-sheet, version-manifest, research-entry, order, review
  examples/  one valid file per schema
  confidential-terms.local.txt   (git-ignored; owner supplies client names)
films/                        NEW  vertical slices (tracked: manifests and copy, not binaries)
  <slug>/    film.json  brief.md  copy.json  scenes/  cues.json  assets.json
             versions.json  eval/  README.md  (see slice template, section 7)
kernels/                      NEW (phase 2, shims first)
  render/    render_all.ps1, mix_film.ps1, mix_sfx.ps1 (move later; shims stay)
  kit/       work/persian/src/demos/_fa + shared film parts (move later)
  sound/     -> sound/ (already a kernel; keep as is)
  evals/     -> evals/ (already a kernel; keep as is)
scripts/pa/                   NEW  command dispatcher (pa.ps1 calls pa.mjs)
orders/
  templates/  glm-milestone.md, sol-hard.md, haiku-quick.md, reviewer.md, imagegen.md
  sent/       one folder per order id: order.md, progress.md, report.md (tracked, small)
research/                     NEW  experiments and decisions (tracked)
  DECISIONS.jsonl             one line per decision (id, date, decision, why, ADR link)
  adr/  ADR-0001...           architecture and tooling decisions
  playbooks/  PLAYBOOK-*.md   how-to per technique (may already exist in docs/motion/)
  experiments/<date>-<topic>/ small result files (csv, json, md); no binaries
docs/motion/                  owned by the other writer (README, STATE, PLAYBOOK-*, DECISIONS.jsonl). Reconcile: keep ONE DECISIONS.jsonl (suggest docs/motion/), with research/experiments linking to it.
media/film-versions/<slug>/<vN>/   IGNORED binaries + render.txt + ffprobe.json
media/briefs-local/           IGNORED client-sensitive briefs
work/persian/                 legacy working area; shrinks as slices take over (not deleted)
library/                      PUBLISHED; untouched by this architecture
plugins/persianarts-motion/   the skill; reads contracts/ schemas (copy or path), no runtime import from work/
```

Git rule: binaries are never tracked (except already-tracked `media/dana/` legacy, to be reviewed by the owner). Manifests and text are tracked. A version becomes tracked only by an explicit `pa version promote` and owner approval (section 5).

## 5. Dependency rules (what may import what)

- `films/<slug>` may import `kernels/*`, `contracts/*` (paths only) and read `sound/library` by ID through the cue sheet. It may NOT import another film, `library/`, or `work/persian/src` directly once a kernel exists.
- `kernels/render` imports nothing from films. It takes a film path plus props and writes to a version folder.
- `sound/tools` imports nothing from films or work. Fetchers write sidecars into `sound/library` only.
- `evals/` reads manifests and outputs; it imports no slice code.
- `scripts/pa` may call kernels and read contracts. It does not contain film logic.
- `plugins/persianarts-motion` is a consumer: it may read `contracts/` and `scripts/pa`, never edit `films/` or `library/`.
- `library/` is closed: nothing imports it except the publish step.
- Enforcement: a `pa scan` check (section 8) that greps imports and paths; start with a warning mode.

## 6. Artefacts and references

- Binaries (mp4, mp3, wav, png sheets) stay under `media/` (already ignored). Each version folder holds `render.txt` (exact command) and `ffprobe.json`.
- A tracked `films/<slug>/versions.json` lists every version: `id` (`v3-beat124-music`), path (`media/film-versions/<slug>/v3-.../`), sha256 of the mp4, source git commit, BPM, T0, track slug, cues file, ratios, eval result path, owner score, `promoted: false`.
- If a binary is missing on another machine, `pa verify` reports `missing` and does not fail the whole film.
- Music and SFX are referenced by slug and sidecar only (`sound/library/bgm/<slug>.music.json`). The cue sheet `films/<slug>/cues.json` maps scene and beat to sound IDs.
- Reconcile the version spec: `render_all.md` says `silent-<ratio>.mp4` and `render-report.json`; `media/film-versions/README.md` says `VERSION.json` and `render.txt`. Make `render_all.ps1` write both (phase 1 order).

## 7. Naming, slice template, commands

**Naming**
- Films: `<kebab-slug>` in English, the topic as the owner names it (e.g. `pencil-social`). Client-related slugs use a neutral code (`client-a-admissions`) and the real name lives only in `contracts/confidential-terms.local.txt` (guess: owner agrees).
- Versions: `v<N>-<variant>` (`v3-beat124-music`); N is the next number in `versions.json`; never overwrite.
- Cue IDs: `<slug>.c<NN>` for film cues, `<sfxcat>-<name>` for SFX (per `sound/library/sfx/INDEX.md`).
- Slices: one folder per film under `films/`; ingredients and themes keep their current IDs.
- Orders: `YYYY-MM-DD-<worker>-<short-title>` (e.g. `2026-10-13-glm-cue-sheet-pencil`).
- Decisions: `D-YYYYMMDD-NN` in `DECISIONS.jsonl`.

**Slice template** (every film must have these files; `pa new-film` creates them):
`README.md` (one page: intent, status), `film.json` (validates `contracts/schemas/film.schema.json`, based on the existing plugin schema), `brief.md` (validates `brief.schema.json`), `copy.json` (literal Persian text tokens), `scenes/` (one JSON or TSX per scene), `cues.json` (cue sheet), `assets.json` (ingredients, fonts, images, sounds used, with licences), `versions.json`, `eval/` (rubric-v2 results per version).

**Command catalogue** (`pa <command>`, PowerShell 7 entry `scripts/pa/pa.ps1`, Node core):

| Command | Arguments | Calls | Writes |
|---|---|---|---|
| `pa new-film` | `<slug> --brief <file> [--dry-run]` | template copy; `pa scan --schemas` | `films/<slug>/*`, empty `media/film-versions/<slug>/` |
| `pa render` | `<slug> [--version vN] [--ratios 9x16,1x1] [--no-music]` | `kernels/render/render_all.ps1 -Film -OutDir` | `media/film-versions/<slug>/<vN>/`, `render.txt`, `VERSION` entry |
| `pa mix` | `<slug> --version vN --track <slug> --t0 <s> [--sfx]` | `mix_film.ps1 -Out`, `mix_sfx.ps1` | version folder, `cues.json` link |
| `pa preview` | `<slug> --frames 150-210 [--stills 15,48]` | `render_all.ps1 -Mode preview/stills` | preview folder (not versioned) |
| `pa version` | `<slug> new|list|promote vN` | none | `versions.json`; `promote` only with owner flag |
| `pa verify` | `<slug> vN [--ref vM]` | ffprobe, SSIM (ffmpeg), stills check, rubric-v2 sheet | `eval/vN.json`, `ffprobe.json` |
| `pa scan` | `[--confidential] [--secrets] [--binaries] [--schemas] [--imports]` | grep, schema validator, `git ls-files` (read-only) | exit code and report |
| `pa research-log` | `"<question>" --decision "<text>" --why "<text>" [--adr ADR-n]` | none | `research/DECISIONS.jsonl` (or docs/motion), `research/experiments/<date>-<topic>/` |
| `pa order` (extra, wraps the hub) | `--template <name> --worker glm|sol|haiku --slice <slug> --effort medium --timeout 1200` | `qh order` | `orders/sent/<id>/order.md` |

**Roles (RACI)**

| Task | Owner | Lead Claude | GLM flash | Sol | Haiku | Codex imagegen | Sonnet reviewer | Git worker |
|---|---|---|---|---|---|---|---|---|
| Architecture and ADRs | A | R (drafts order) | - | C | - | - | C | - |
| Film brief | A | R | - | - | C | - | - | - |
| Scene implementation | I | A (accepts) | R | R (hard, or GLM failed twice) | - | - | - | - |
| Cue sheet and sound pick | A | R | C | - | R (quick lookup) | - | - | - |
| Image assets | A | R | - | - | - | R | - | - |
| Renders and verify | I | A | R (runs) | - | R (quick numbers) | - | - | - |
| Score (craft) | A (final score) | C | - | - | - | - | R (score 0-100) | - |
| Commit and push (whitelist) | A (approves) | R (order) | - | - | - | - | - | R |
| Promote version to git | A | R | - | - | - | - | - | R (on explicit owner order) |
| Confidentiality scan | I | A | R | - | R | - | - | - |

## 8. Testing and acceptance gates

Gate order for a film version (all reported as numbers by a worker, never asserted by the lead):
1. Schema: `pa scan --schemas` passes for film, brief, cues, versions.
2. Render: ffprobe matches the spec (size, fps, pixel format, duration within ±1 frame of the cue sheet).
3. Stills: frame checks at the cue frames (Persian text present, no empty frame, no clipped text; PERSIAN-RENDER-CONTRACT rules).
4. Motion fidelity: SSIM against the previous promoted version or against the reference frame; threshold set per film in `eval/` (guess: 0.90, to calibrate).
5. Audio: loudness target from `mix_film.ps1` (I -13.8, TP -2.5) and beat alignment from the sidecar `grid.verdict` = PASS.
6. Score: rubric-v2 (9 criteria) by an independent Sonnet reviewer; approve at 85+; the owner score is the final word. Blocked until the owner approves v2 (`evals/rubric-v2.md` is DRAFT).
7. Promotion: only after 1-6 pass and the owner says so.

CI-like checks, runnable as `pa scan` and later as a workflow (not added to `.github/workflows` until the owner agrees):
- Confidentiality scan: the terms in `contracts/confidential-terms.local.txt` must not appear in tracked files (paths and content). Local list, git-ignored.
- Secrets scan: patterns for `*.env` keys, API tokens (`FREESOUND`, `JAMENDO`, `sk-`, `Bearer`), and `.jamendo.env` / `.freesound.env` must not be tracked.
- No binaries committed: `git ls-files` must have no mp3/mp4/wav/png beyond the existing legacy list; allowlist explicitly.
- Schema validation of every `contracts/examples`, `films/*/film.json`, `versions.json`, `DECISIONS.jsonl` line.
- Import direction check (section 5) in warn mode first.

## 9. Migration plan (ordered milestone orders)

Principle: no move until a shim exists; every existing path keeps working until its replacement is verified. Each order is 20 minutes or less, one deliverable, exact paths, exact acceptance command, and ends with "no human is present, do not ask questions". Use `qh order --worker glm --effort medium --timeout 1200` unless marked haiku.

| # | Worker | Deliverable | Paths | Acceptance |
|---|---|---|---|---|
| M1 | haiku | `research/DECISIONS.jsonl` with one line for this ADR and an empty ADR folder | `research/`, `work/persian/architecture-brief.md` (read) | every line parses as JSON: `node -e "require('fs').readFileSync('research/DECISIONS.jsonl','utf8').trim().split('\n').forEach(JSON.parse)"` |
| M2 | glm, low | `contracts/schemas/` with 6 schemas; copy the 6 plugin schemas, add `cue-sheet` and `version-manifest` | `contracts/`, `plugins/persianarts-motion/skills/persianarts-motion/schemas/` (read) | `node contracts/validate.mjs --selftest` exits 0 (validator written in M2) |
| M3 | glm | `scripts/pa/pa.ps1` with `scan --schemas` and `--confidential` only | `scripts/pa/` | `pwsh -File scripts/pa/pa.ps1 scan --schemas` exits 0 on the examples |
| M4 | glm | `films/` template and `pa new-film <slug> --dry-run` | `films/_template/`, `scripts/pa/` | `pa new-film test-slug --dry-run` lists the template files, writes nothing |
| M5 | glm | Manifests for the two existing films (`pencil-social` and `uni-admissions`, slug names neutral, see confidentiality). Manifests only: `films/<slug>/film.json` and `versions.json` pointing at `work/persian/src/film/social` and `.../uni` | `films/`, read-only on `work/persian/` | `pa scan --schemas` passes; no file under `work/persian` changed (`git status` by the git worker, not the lead) |
| M6 | glm | `pa version list` backfill: scan `media/film-versions/**` (read only) and fill `versions.json`, mark legacy versions `legacy: true` | `films/*/versions.json`, `media/film-versions/` (read) | `pa version list pencil-social` prints the same count as `ls media/film-versions/pencil-social` |
| M7 | glm | Make `render_all.ps1` write `VERSION.json` and `render.txt` (fix the spec disagreement); add `pa render` as a wrapper that calls it unchanged | `work/persian/render_all.ps1`, `scripts/pa/` | a `-Mode preview` run writes both files; wall time not worse than before (numbers from the worker) |
| M8 | glm | `pa mix` wrapper and `cues.json` for the first film | `scripts/pa/`, `films/<slug>/cues.json` | `pa mix ... --dry-run` prints the exact `mix_film.ps1` command |
| M9 | glm | Orders folder and templates, `pa order` wrapper around `qh order` | `orders/templates/`, `orders/sent/`, `scripts/pa/` | `pa order --template glm-milestone --dry-run` prints the `qh order` line |
| M10 | glm | Sound fetchers: move `work/persian/freesound_*.py`, `jamendo_fetch.py` to `sound/tools/` and leave a 3-line shim at the old path | `sound/tools/`, `work/persian/*.py` | `python work/persian/freesound_fetch.py --help` still exits 0 |
| M11 | glm | Scan for secrets and binaries; report only (no fixes) | `scripts/pa/` | `pa scan --secrets --binaries` exits 0 or lists each hit (owner decides) |
| M12 | owner (decision), then glm | After rubric-v2 approval: `pa verify` uses it; `evals/rubric.md` becomes v2 with history | `evals/` | owner approval recorded in `research/DECISIONS.jsonl`; `pa verify` produces `eval/vN.json` |
| M13 | owner decision only | Move `work/persian/src/film/*` into `films/<slug>/` (kernel extraction) with junction or shim at the old path | `films/`, `kernels/`, `work/persian/src/film/` | `npx remotion render` of each film still works from the old path |

Do not do in this plan: moving `library/`, changing `.github/workflows`, moving the rendered `media/` binaries, or deleting `work/persian/reports/`. Those need separate owner decisions. `docs/motion/` is not touched by these orders.

Autosync: `work/persian/autosync.ps1` whitelist should gain `films/`, `contracts/`, `scripts/pa/`, `research/`, `orders/`, `sound/tools/`, `evals/`. This is a persistent-config change; ask the owner first (per the permission rules).

## 10. Risks

1. Scope creep: `pa` becomes a second project. Mitigation: each command is a wrapper; logic stays in kernels.
2. Migration breaks the publish or autosync flow. Mitigation: shims; no change to `library/` or `.github/workflows` in this plan.
3. Windows path and junction issues (PowerShell 7 required; long paths). Mitigation: test in M4 with `--dry-run`.
4. Manifests reference ignored binaries that are not on another machine. Mitigation: `missing` status, never a hard failure.
5. The owner's client-name rule is not written down, and folder names (`uni-admissions`, `university-admissions`) may already leak it. Mitigation: owner supplies the term list; M5 uses neutral slugs; `pa scan --confidential` gates it.
6. Quality gate blocked by an unapproved rubric. Mitigation: run `pa verify` in "report only" until M12.
7. Two writers at once (autosync and the docs/motion worker). Mitigation: one DECISIONS file; orders own their paths.
8. Cheap workers doing moves badly. Mitigation: every move has a shim and a command acceptance; reviewer on each diff.
9. Some decisions are guesses: (a) `pa` is unbuilt; (b) no CI workflow runs schema checks today; (c) SSIM threshold 0.90 is a starting guess.

## 11. Effort (estimate, guess)

M1-M12 is about 12 orders at 10-20 minutes of worker time each, plus one lead review per order (short report only). Wall clock about 1-2 working days with GLM outside the Z.ai peak window (Mon-Fri 14:00-18:00 UTC+8). M13 is a separate, later decision.

## 12. First three orders to run now

1. M1 (haiku): record this ADR in `research/DECISIONS.jsonl` and create `research/adr/`. Cheap, no risk, and it gives the owner a decision line to accept or reject.
2. M2 (glm, low): contracts folder with schemas and a validator. Everything else depends on it.
3. Owner question (before any move): supply the client-name term list for `contracts/confidential-terms.local.txt`, and say whether autosync may cover the new folders (M9 onward).

After these three, run M3 and M4 in parallel with the owner's answers, then M5 and M7.
