Plan:
1. Survey sources (hub.db jobs/ratings/snapshots, logs, run metas, review JSONs, trial results, specs, orders).
2. Extract per-model numbers and verify list-L claims against data; mark unverified ones.
3. Write docs/DELEGATION-PROCESS-REPORT.md (Persian) + docs/DELEGATION-JOURNAL.md (English journal) + report-p1.md.
Steps done:
Surveyed hub.db (252 jobs, 213 ratings, 2336 snapshots), invalid_ids, lane/pilot logs, run metas.
Aggregated per-model real-card stats (38 scored cards), synthetic tier means, 99 review runs, quota deltas.
Wrote docs/DELEGATION-PROCESS-REPORT.md (7 sections, Persian) and docs/DELEGATION-JOURNAL.md (20 lines). Gaps: config/policy.json and eval/README.md missing; wave-1 model attribution unknown; esbuild/env-leak/session-limit claims not verifiable in stored logs.
