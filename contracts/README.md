# contracts/

JSON contracts for the motion project, one schema per artefact, plus a dependency-free validator and a confidentiality and secrets scan. Decision record: [docs/motion/adr/0001-architecture-option-c.md](../docs/motion/adr/0001-architecture-option-c.md). Layout and owners: [docs/motion/ARCHITECTURE.md](../docs/motion/ARCHITECTURE.md).

## Files

| Path | Purpose |
|---|---|
| `schemas/brief.schema.json` | JSON form of a film brief (`brief.json` next to the human `brief.md`) |
| `schemas/film.schema.json` | film manifest, `films/<slug>/film.json` |
| `schemas/cue-sheet.schema.json` | cue sheet, `films/<slug>/cues.json` or a version's cues file |
| `schemas/version.schema.json` | version manifest, `VERSION.json` in a version folder (canonical layout below) |
| `schemas/decision.schema.json` | one line of `docs/motion/DECISIONS.jsonl` |
| `examples/` | valid examples: `film.pencil-social.json`, `brief.pencil-social.json`, `cue-sheet.pencil-social.json`, `version.v51-lnplus-597024.json`, `decision.line.jsonl` |
| `validate.mjs` | validator (Node, no dependencies; subset of JSON Schema 2020-12) |
| `scan.mjs` | confidentiality and secrets scan |
| `confidential-terms.local.txt` | term list, git-ignored, never printed; owner supplies and maintains |

## Commands

```
node contracts/validate.mjs <schema> <file>   # schema: name (film, version, cue-sheet, brief, decision) or path
node contracts/validate.mjs --selftest        # examples pass, a broken copy is rejected
node contracts/validate.mjs --all             # DECISIONS.jsonl, films/*/film.json, films/*/cues.json, media/film-versions/**/VERSION.json
node contracts/scan.mjs [--confidential] [--secrets]   # exit 1 on any hit; prints paths and line numbers only
```

Exit codes: 0 pass, 1 failure or hit, 2 usage or setup error.

## Canonical version layout (one spec for render and docs)

`media/film-versions/<film>/<version>/` (git-ignored binaries, see `.gitignore`):

- `VERSION.json` (version.schema): film, version, date, source_commit, bpm, t0_s, track, cues_file, ratios, outputs[], verify, status, promoted, owner_score, notes.
- `render.txt`: the exact command line(s) that produced the outputs.
- `render-report.json`: written by the render kernel (wall times, cache hits, props); referenced by `render_report`.
- `verify.json`: numbers from the verify step; referenced by `verify.file`.
- Outputs: `silent-<ratio>.mp4` (render kernel) and `mixed-<ratio>.mp4` (after mix); any other name is allowed only if listed in `outputs[].file`.

Legacy folders (`v2-*`, `v3-*`, `v4-*`, `v5-*`, `v51-*`) have older `VERSION.json` files. `validate.mjs --all` reports them as failing: that is the migration backlog (M6 marks them `status: "legacy"` and keeps old keys in `legacy_fields`). Old keys map as: `BPM`→`bpm`, `T0_S`/`track_t0_s`→`t0_s`/`track.t0_s`, `track` string→`track.slug`+`track.path`, `git_commit_sources`→`source_commit`, `silent_render`→`legacy_fields`, `file`→`outputs[]`.

## Cue format mapping

The existing cue files (`cues-*.json`: `n`, `event`, `file`, `at{cut,ref}`, `dur`, `fade_ms`, `gain_db`) map to the canonical cue (`id`, `role`, `beat` or `abs_s`, `file` or `catalogue_id`, `gain_db`, `trim_s`, `fade_in_s`, `fade_out_s`, `event`): `n`→`id` as `<slug>.c<NN>`; `fade_ms`→`fade_out_s` (divided by 1000); `role` is inferred by M8 and must be set by hand where unclear; the `at`/`dur` pair needs a cut-to-beat conversion, done by the M8 order.

## Diff needed in `work/persian/render_all.ps1` (not applied; the render order does it)

1. Write `VERSION.json` into `$OutFull` in the canonical shape: `film` (from the OutDir parent folder name, e.g. `pencil-social`, not `social`), `version` (folder name), `date`, `source_commit` (`git rev-parse --short HEAD`, or `unknown`), `bpm` (`-Bpm`), `t0_s` (`-T0`), `track` (null unless passed), `cues_file` (null unless passed), `ratios` (rendered ratios), `outputs[]` (see 3), `status: "test"`, `promoted: false`, `owner_score: null`, `notes: ""`.
2. Write `render.txt` containing the exact invocation (the command line and the resolved `-Bpm`, `-T0`, `-Film`, `-OutDir`); it is not written today.
3. For each output, add `kind`, `fps`, `duration_s`, `size_bytes`, `sha256` and `color_range` to the entry. Today only `pix_fmt`, `color_range`, `width`, `height`, `nb_frames`, `sizeBytes` go to `render-report.json` (camelCase, different key).
4. Keep `render-report.json` as is, but use the same snake_case keys as `VERSION.json` (`size_bytes`, `pix_fmt`, `nb_frames`), or document the difference in the schema.
5. Output names: keep `silent-<ratio>.mp4`; set `kind: "silent"`. Do not rename existing outputs.
6. Ignore folders starting with `_` (`_silent-cache`, `_bench*`) when listing versions; `OutDir` may not be one of them.
7. Do not change `-Film` values (`social`, `uni`); the film slug is taken from the path.

## Confidentiality

Client and institution names never appear in tracked files. Use neutral slugs and codes. The real terms live only in `confidential-terms.local.txt`; `scan.mjs` reports paths and line numbers, never the terms.
