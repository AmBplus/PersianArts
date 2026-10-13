# Measured film process template

Use this beside `TEMPLATE.md` for a new film. Keep one production directory per experiment. Record every work action in `actions.jsonl`; the gate never invents missing values. This generic template contains no project or institution copy.

## Gate stages

Run the stages in order from the repository root. `structural` checks the record shape and can pass an honestly marked draft. `preflight` requires source/director freshness, decision and constraint records, reuse coverage, and sampled-frame evidence. `delivery` adds explicit evidence for requirements, Persian reading, bidi, fonts, and preserved positive traits. A later stage does not inherit PASS from an earlier run: run it again against the current files. `process.json.status` must exactly match the requested later stage. Preflight binds review to source/director hashes and inspected still hashes; after edits, review new stills and record new hashes, never refresh hashes automatically.

```powershell
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage structural
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage preflight
node work/persian/tools/film-process-gates.mjs --production-dir <production-directory> --root . --stage delivery
```

Use paths in manifests and evidence relative to `--root`. Every evidence path must exist. Hash all consumed source files and the current director file with SHA-256; regenerate hashes after edits. `sourceFiles` must list every file consumed to produce the film, including the primary `source.path`.

## `process.json`

```json
{
  "status": "draft",
  "source": { "path": "work/persian/src/film/example/entry.tsx", "sha256": "<64 hex chars>" },
  "sourceFiles": [{ "path": "work/persian/src/film/example/entry.tsx", "sha256": "<64 hex chars>" }],
  "director": { "path": "media/film-versions/example/director.json", "sha256": "<64 hex chars>" },
  "reviewedAgainst": { "sourceFiles": [{ "path": "work/persian/src/film/example/entry.tsx", "sha256": "<same reviewed hash>" }], "director": { "path": "media/film-versions/example/director.json", "sha256": "<same reviewed hash>" } },
  "decisionLedger": "docs/motion/DECISIONS.jsonl",
  "decisionRefs": ["D-20261013-16"],
  "constraints": ["Keep all approved claims verbatim"],
  "reuseLedger": {
    "idea": { "eligible": [{ "id": "concept-1", "evidence": "docs/decision.md" }], "observed": [{ "id": "concept-1", "evidence": "docs/review.md" }] },
    "code": { "eligible": [{ "id": "utility-1", "evidence": "docs/inventory.md" }], "observed": [] },
    "process": { "eligible": [{ "id": "check-1", "evidence": "docs/inventory.md" }], "observed": [{ "id": "check-1", "evidence": "docs/run.md" }] }
  },
  "frameChecks": [{
    "frame": 120, "composition": "ExampleFilm", "ratio": "9:16", "noOverlap": true, "rtlReadable": true, "logoContrast": true,
    "safeArea": true, "focalPoint": true, "scenePurpose": true,
    "evidence": [{ "path": "media/film-versions/example/stills/frame-0120.png", "sha256": "<sha256 of inspected still>" }]
  }],
  "requiredEvidence": {
    "requirements": [{ "id": "claim-1", "status": "pass", "evidence": [{ "path": "docs/checks/claim-1.md", "sha256": "<SHA-256 of inspected evidence>" }] }],
    "reading": [{ "id": "copy-1", "status": "pass", "evidence": [{ "path": "docs/checks/reading.md", "sha256": "<SHA-256 of inspected evidence>" }] }],
    "bidi": [{ "id": "numbers-1", "status": "pass", "evidence": [{ "path": "media/film-versions/example/stills/numbers.png", "sha256": "<SHA-256 of inspected evidence>" }] }],
    "font": [{ "id": "font-1", "status": "pass", "evidence": [{ "path": "docs/checks/font.md", "sha256": "<SHA-256 of inspected evidence>" }] }],
    "preservePositive": [{ "id": "trait-1", "status": "pass", "evidence": [{ "path": "docs/checks/preserved-traits.md", "sha256": "<SHA-256 of inspected evidence>" }] }]
  }
}
```

Keep `status` at `draft` while any review is pending. Promote it to `preflight` only when source hashes, constraints, reuse ledger, and frame samples are ready; use `delivery` only after all required checks pass. Structural validation intentionally tolerates absent/unknown review declarations for drafts; that never earns preflight or delivery PASS.

Reuse counts are distinct opportunity IDs, not lines or subjective similarity scores. Before production, list each eligible idea, code component, and process/tool opportunity with evidence showing why it applied. Mark an ID observed only with separate evidence that it was actually reused or adapted. Report each coverage as observed distinct IDs / eligible distinct IDs. Never omit an eligible opportunity to improve the ratio. An empty denominator is unknown and fails the gate; it is not zero percent or 100 percent. Separate idea, code, and process coverage; do not combine them into one score.

`frameChecks` are human-reviewed samples from meaningful scenes and ratios. Attach the actual still/frame evidence and record `noOverlap`, `rtlReadable`, `logoContrast`, `safeArea`, `focalPoint`, and `scenePurpose` as true only after review. The command checks that declarations and evidence files exist; it cannot decide whether the composition is attractive, readable, balanced, or faithful. Unknown or false flags fail preflight.

For `requiredEvidence`, make a check for every applicable requirement or review item. Status is exactly `pass`, `fail`, `not-run`, or `unknown`; delivery accepts only `pass` with evidence. Include tests for Persian reading in context, right-to-left text and left-to-right number runs, actual loaded font/weight, and each approved visual/creative trait that must survive. Describe evidence so a reviewer can tell what was checked and what result was observed. Do not use a tool exit code as proof of subjective quality.

For delivery, copy the full current `requiredEvidence` object into `reviewedAgainst.requiredEvidence` **after** review. Every delivery evidence item must be a `{path, sha256}` object. Missing, changed, or unhashed evidence fails delivery. Do not update the reviewed snapshot automatically after changing evidence. Frame samples require a nonnegative integer `frame`, a `composition` ID and a supported `ratio` (9:16, 1:1, 4:5, 16:9). This identifies the inspected sample; render provenance and completeness of sampling remain reviewer/operator responsibilities.

Decision references must resolve to IDs in `decisionLedger` (default `docs/motion/DECISIONS.jsonl`). Existence does not prove that a decision was followed or supersession correctly interpreted.

## `actions.jsonl`

Append one completed row for every discrete action: research, implementation, review, render, fix, and coordination. For every new action, record actual `issuedAt`, `startedAt`, and `endedAt` timestamps in ISO 8601 UTC, a declared timebox, actor, model, reasoning effort, action `scope`, outcome, reason, and scoped reviewed outcomes. Each action also requires `phase`, `inputs`, `tools`, `skills`, `components`, `ideaRefs`, and `howApplied`. Arrays explicitly list what was used; empty means none. Record automatically selected skills as well as user-requested skills by name/path, and explain how tools, ideas and components were applied. For legacy unknown provenance, explicitly record `unknown` and explain the missing record; do not silently claim none. Parent and retry IDs link delegation and rework; links must be strings or null, may not self-reference or cycle, and retryOf must reference an earlier logged completed attempt; use `null` when absent. Keep failed and blocked attempts; do not overwrite them.

```json
{"id":"a1","parentId":null,"retryOf":null,"timingStatus":"measured","issuedAt":"2026-10-13T07:59:00Z","startedAt":"2026-10-13T08:00:00Z","endedAt":"2026-10-13T08:12:00Z","timeboxMinutes":12,"outcome":"success","scope":"visual","phase":"review","inputs":["source.tsx"],"tools":["frame viewer"],"skills":[],"components":[],"ideaRefs":[],"howApplied":"Inspected rendered title and recorded observations","actor":"lead","model":"gpt-6.1-sol","reasoning":"medium","reason":"review first scene","reviewedOutcomes":[{"scope":"visual","result":"pass","evidence":[{"path":"media/film-versions/example/stills/frame-0120.png","sha256":"<sha256 of inspected still>"}]}]}
```

Action outcomes are `success`, `failed`, `partial`, `blocked`, or `cancelled`. Action scope is `structural`, `visual`, `audio`, `content`, or `process`. Every `reviewedOutcomes` entry separately states scope and result (`pass`, `fail`, `not-run`, `unknown`) with evidence. Historical action outcomes are never rewritten and a prior failed review does not poison a fixed version. Current-stage acceptance comes from the current `reviewedAgainst` hashes, `frameChecks`, and (for delivery) `requiredEvidence`; those current records must pass. Unknown/not-run may be recorded in an honest structural draft.

For a historical/imported action whose times were never recorded, use `timingStatus: legacy-unknown`; set `issuedAt`, `startedAt`, `endedAt`, and `timeboxMinutes` to `null`. Do not backfill guessed times. These events count in timing coverage and action totals but have no duration or overrun; unknown timing alone does not block later gates. New rows must use `timingStatus: measured` with real ordered timestamps. The command calculates overrun only for measured rows. Do not add estimated/fabricated money or token costs. Unknown is not zero.
## Reported measures and decision record

Report per-scope reuse coverage, action count, retry count, and overrun count. Define retry count as rows with `retryOf`; overrun as elapsed minutes greater than that action's declared timebox. Report wall time only from a stated session start/end with a known clock source. Keep worker time separate from wall time and disclose overlapping intervals. Do not infer absent time as zero, assign costs without account-level usage evidence, or compare ratios with different denominators.

The command reports action count, measured timing coverage, retry count, overrun count among measured actions, action scopes, and per-scope reuse coverage. For each requirement, reading/bidi/font check, and preserved-positive trait, provide the evidence path and result. Include sample-frame paths and the source/director hashes used. Record subjective review separately from measurable checks; an automated PASS confirms record integrity and declared evidence paths, not film quality. Preserve failures and limitations in the result report. Do not publish until the required evidence has been reviewed and the owner accepts the result.





The CLI reports measured effort seconds per phase, count of unknown actions, and each measured interval. Summed effort is not session wall time and may include overlapping actions. Actual intervals and provenance are entered records; the validator cannot attest the truth or completeness of those records.
