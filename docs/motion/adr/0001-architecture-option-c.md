# ADR-0001: Architecture option C for the PersianArts motion project

Status: accepted
Date: 2026-10-13
Owner approval: owner delegated approval 2026-10-13
Source brief: [work/persian/architecture-brief.md](../../../work/persian/architecture-brief.md) (sections 3 to 9)

## Context

The motion work has grown without a shared layout:

- Two film packages (`work/persian/src/film/social` and `src/film/uni`) repeat the same structure and render path.
- Orders, reports and progress files sit in at least four homes.
- The version spec in `media/film-versions/README.md` (VERSION.json, render.txt) disagrees with what `render_all.ps1` writes (silent-<ratio>.mp4, render-report.json).
- The `pa` command layer is designed in `docs/MOTION-SKILL-PLAN.md` but not built.
- No check covers schemas, confidentiality or secrets.

The brief compared four options: (A) vertical slices per film, (B) layered capability kernels, (C) kernels plus slices plus a thin `pa` command layer plus JSON contracts, ADRs and a decisions log, and (D) conventions only.

## Decision

Adopt option C, in stages, with no big-bang move:

1. Capability kernels for render, kit, sound and evals. Existing scripts stay in place behind shims.
2. Vertical film slices under `films/<slug>/` (manifests, copy, cues, version pointers). Binaries stay under the ignored `media/` tree.
3. One thin command layer, `pa` (PowerShell entry, Node core), with commands only wrapping kernels.
4. JSON contracts under `contracts/` with a validator and a confidentiality and secrets scan.
5. ADRs under `docs/motion/adr/`, one line per decision in `docs/motion/DECISIONS.jsonl`.

Option D (conventions only) is rejected: it already failed to hold.

## Consequences

Positive:
- One place per concern. Schemas stop the spec disagreement.
- A film can be versioned and re-judged as a unit.
- Cheap workers get small milestone orders with exact paths and acceptance commands.

Negative and risks:
- More folders to explain; discipline is needed.
- Scope creep: `pa` must stay a wrapper, not a second project.
- Manifests reference ignored binaries that may be missing on another machine. `pa verify` reports `missing`; it does not fail the film.
- The client-name rule was not written down before this ADR. Terms live only in the git-ignored `contracts/confidential-terms.local.txt`.
- `library/`, `.github/workflows/` and the published pages are out of scope and stay untouched.

## Migration plan (summary)

Full list in the brief, section 9. Milestones:

- M1: this ADR, the decisions line, `docs/motion/ARCHITECTURE.md`.
- M2: `contracts/` with schemas, the validator and the scan.
- M3 to M4: `scripts/pa` with `scan` and `new-film --dry-run`; `films/_template`.
- M5 to M6: manifests for the two existing films; `pa version list` backfill (read-only on `media/`).
- M7: `render_all.ps1` writes `VERSION.json` and `render.txt`; `pa render` wraps it unchanged.
- M8 to M9: `pa mix` wrapper and cue sheet; orders folder and `pa order` wrapper.
- M10 to M11: sound fetchers moved to `sound/tools/` with shims; secrets and binaries scan (report only).
- M12: after owner approval of rubric v2, `pa verify` uses it.
- M13: moving `work/persian/src/film/*` into `films/` is an owner decision, later.

Each step keeps old paths working until the replacement is verified.

## Links

- Brief: `work/persian/architecture-brief.md`
- Contracts: `contracts/README.md`
- Architecture overview: `docs/motion/ARCHITECTURE.md`
- Decisions log: `docs/motion/DECISIONS.jsonl`
