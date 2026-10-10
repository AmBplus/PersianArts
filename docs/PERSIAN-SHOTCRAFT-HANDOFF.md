# Persian shotcraft localization — handoff / resume guide

Everything needed to continue this project from another machine or a new session. If you are an AI agent asked to
"continue this project": read this file, then `AGENTS.md`, then `docs/PERSIAN-LOCALIZATION-LESSONS.md`, then
`work/persian/PROGRESS.md`, and resume with the steps in §4.

## 1. Goal

Rewrite every motion demo of the upstream library **video-shotcraft** (https://vincentwei1021.github.io/video-shotcraft/library.html,
repo https://github.com/Vincentwei1021/video-shotcraft, Apache-2.0) into **Persian**: Persian copy, right-to-left layout,
motion mirrored wherever it carries reading direction, a Persian font chosen per demo mood — while the motion design, timing
and energy stay faithful to the original. 157 cards, 221 demo components, 214 library style samples.

The owner's priorities: **quality and craft over speed**, per-demo deep analysis (never one formula for all), but work as
efficiently as possible. Persian-specific details (letter-by-letter reveals, pen/handwriting paths, elegant fonts, shaping)
are where results get ruined — see the lessons file §1b.

## 2. What exists

| path | what |
|---|---|
| `work/upstream/src` | untouched clone of video-shotcraft (git-ignored, re-clone if missing: see §5) |
| `work/persian/src` | our copy of its `demos/`, `assets/`, `workbench/` — the Persian versions are edited here in place |
| `work/persian/src/demos/_fa/index.tsx` | shared Persian/RTL kit: FaRoot, FaFonts, faText, fs, FA_LH, typeOn, joinedGroups, words, faDigits, revealFromStart, FONT_FILES (25 fonts) |
| `work/persian/src/workbench/public/fonts` | the 25 Persian TTFs (copied from `skills/anidoodle/engine/assets/fonts`) |
| `work/persian/render-card.mjs` | per-card harness: bundles only one card, renders Persian stills + matching original frames, `--frames`, `--duration`, `--video` |
| `work/persian/card-info.mjs` | facts for one card (`--slug`) or the list of all slugs (`--list`) |
| `work/persian/workflow/persian-rtl-localize.js` | the multi-agent workflow: per card author → independent review → fix |
| `work/persian/progress.mjs` → `PROGRESS.md`, `progress.json`, `reports/` | tracked progress record (status per card, fonts, reports and reviews) |
| `work/persian/out/<slug>/` | stills, `*.fa.mp4`, report.json, review.json (git-ignored; the reports are copied into `reports/`) |
| `docs/PERSIAN-LOCALIZATION-LESSONS.md` | every conversion problem found so far and its fix — agents read it first and add to it |
| `docs/PERSIAN-RENDER-CONTRACT.md` | publication rules (nothing public without source-fidelity evidence) |
| `library-app/`, `scripts/map-shotcraft-comps.mjs`, `scripts/link-upstream-baseline-media.mjs` | our library UI (source + tag multi-category filter + style variants) and the reference-render linking |

Reference example of the expected standard: `work/persian/src/demos/interaction/ai-stream-response/StreamResponse.tsx`
(header comment lists every RTL decision).

## 3. Method (why it is built this way)

- Upstream demos are prop-less React/Remotion components exporting `<Stem>` and a `*_DURATION` constant; the workbench
  registers all of them (`workbench/src/cards/demo-index.ts`). Bundling the whole workbench means one half-edited file breaks
  every render, so the harness generates a temporary entry with **only one card's** demos (isolation for parallel agents).
- Localization = edit the copy in `work/persian/src/demos/<cat>/<slug>/`, keep component names, durations, fps, seeds.
- Each card goes through three agents (Sonnet 5.5, medium effort; decisions and acceptance stay with the main session):
  1. **author** — reads lessons, kit, example, source prompt (Chinese design intent), original code and frames; writes the
     analysis header; edits; renders; compares fa vs orig frames; iterates; renders the video; writes report.json.
  2. **reviewer** — adversarial, independent: re-renders at real beats, hunts shaping/overflow/direction/leftover-text/font/
     fidelity/craft defects; verdict approve or fix (review.json).
  3. **fixer** — only when the review has blockers/majors.
- Cost seen: ≈185k subagent tokens per card; ~13 min per 6-card wave with pool 6 (machine: 10 cores, 32 GB, ~10 GB free).
  A Claude Pro session limit can stop a batch midway: failed agents end as `author-failed`; just rerun those slugs.

## 4. How to resume

```bash
node work/persian/progress.mjs          # refresh PROGRESS.md / progress.json from the outputs
```

1. Pick the next slugs: status `todo`, `needs-fix` or `localized` in `work/persian/progress.json`.
2. Run the workflow (Claude Code main session), e.g. 30–40 slugs per batch:
   `Workflow({scriptPath: "<repo>/work/persian/workflow/persian-rtl-localize.js", args: {slugs: [...], pool: 6, review: true, root: "<repo absolute path>"}})`
3. When it finishes: read the result (fonts, issues, concerns, **lessons**); spot-check a few fa vs orig stills yourself;
   merge new lessons into `docs/PERSIAN-LOCALIZATION-LESSONS.md`; import the agents' returned results (reviewers that approve
   often skip writing review.json, fixers sometimes skip report.json) with
   `node work/persian/import-journal.mjs <journal.jsonl …>` (journals: `~/.claude/projects/<project>/<session>/subagents/workflows/wf_*/journal.jsonl`),
   then run `node work/persian/progress.mjs`.
   Note: the workflow script must stay free of control characters (no CR line endings, ZWNJ written as `‌`) or the
   Workflow approval dialog rejects it.
4. Commit and push to `main` (owner's decision 2026-10-11; `main` deploys the library on `library/**` changes).
   Keep `pwsh -File work/persian/autosync.ps1` running in the background during batches: every 5 min it regenerates
   progress, commits only this project's paths and pushes over SSH (`git@github.com:AmBplus/PersianArts.git`), so nothing is
   lost if the session hits a usage limit. HTTPS push needs an interactive login on this machine; SSH works non-interactively.
5. Repeat until all 157 are approved/fixed. Then: package the Persian MP4s into `library/media/shotcraft/<card>/v<n>/`
   (H.264 CRF 22, < 2 MB, poster/thumb WebP), register them in `library/data/persian-renders.json` with
   `sourceFidelity` evidence (prompt SHA + ≥3 orig/fa frame pairs) per the render contract, and add sound (SFX table method
   from upstream `sound-design.md`, see `work/own/` examples).

## 5. Rebuilding the local environment on a new machine

```bash
git clone https://github.com/Vincentwei1021/video-shotcraft work/upstream/src
```

Then in `work/upstream/src/workbench`: `npm install`; render the reference set with `node scripts/render-upstream-batch.mjs`
(writes `work/upstream/out/video/demo-*.mp4`, used by the harness for the "orig" frames) and save the composition list:
`npx remotion compositions src/remotion/index.ts > ../../comps.txt` (from the workbench dir; file expected at `work/upstream/comps.txt`).
Recreate the two junctions in `work/persian/src/workbench`: `demosrc -> ../demos` and `node_modules -> work/upstream/src/workbench/node_modules`
(PowerShell: `New-Item -ItemType Junction -Path demosrc -Target (Resolve-Path ..\demos)`).

## 6. Known open points

- Some cards are registered shorter than their design (30 f vs 144 f): use `--duration` when inspecting; the final MP4 uses the
  registry duration like upstream.
- `flash-cut` (shot-transitions) has no demo component; `page-waterfall-wall` failed to render upstream.
- Upstream demos are silent; sound is a later phase.
- Reference renders (upstream code, English) are linked in the library only as "رندر مرجع" and must not be published.
