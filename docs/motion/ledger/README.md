# Production ledger: how long a motion really takes

Owner question: "a 17-second film" says nothing about production time. This ledger records wall-clock time and worker seconds per phase, per film version.

## Update after each order (one command)

```
node work/persian/tools/ledger/build_ledger.mjs
```

It reads the quota-hub job table (`D:/P/tools/quota-hub/data/hub.db`, table `jobs`, read-only; override with env `QH_DB`) and the film folders under `media/film-versions/`. It writes:
- `docs/motion/ledger/ledger.jsonl`: one line per qh order (`kind: order`) and one line per film version folder (`kind: version`).
- `docs/motion/ledger/ledger-pencil-social.md`, `ledger-uni-admissions.md`: per-film tables.

Order-to-phase mapping: `work/persian/tools/ledger/phase-map.json` (first matching rule wins). Unmapped jobs show as `unmapped` in the build output; add a rule for them.

## Phase taxonomy (10 phases)

| phase | what it covers | how it is measured |
|---|---|---|
| decision | choosing the direction, process decisions | lead decision time: not measured (no session timestamps). Worker orders mapped here: qh seconds |
| concept | brief, doctrine, research brief | qh order start/end |
| scene-build | scene code, payoff and teaser edits | qh order start/end |
| asset-prep | image generation, asset cleanup | qh order start/end |
| render | Remotion renders | qh order start/end; render-report.json wall seconds when present |
| music-pick | choosing tracks | qh order start/end |
| sfx-cues | cue sheets, SFX synthesis | qh order start/end |
| mix | loudnorm mix, mux, packaging | qh order start/end |
| verify | checks, verify.json, batch checks | qh order start/end |
| owner-review | owner watching and deciding | not measured |

Rule: every report must include total elapsed, per-phase seconds, and what changed versus the previous version.

## Limits (read before quoting numbers)

- Pencil v3 to v51 builds are not in the qh job table. Their per-phase worker seconds are not measured; the version table uses file write times only.
- File write times (`write span`) are a lower bound: a folder is written in a short burst at the end of a build.
- `step window` is the wall time since the previous version's final mp4. Parallel tracks (dogo, feeblom, dolphins) interleave, so a step window is not a per-phase time.
- `ratio` render times come from `render-report.json`. The version folders have none, so the render time of v3 to v51 is not measured.
- Timezone: qh times are UTC. File times are converted from epoch to UTC; the VERSION.json notes use local time (UTC+3:30).
- Overruns must be recorded: each order that misses its expected time gets one line with order, expected, actual and action taken.
