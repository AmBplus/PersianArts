# Delegation Journal (append-only; one line per entry: UTC time | order/decision | worker | result | verdict)
2026-10-11T13:52Z | decision: build quota-hub per SPEC.md; log in codex-a, codex-b, GLM key via ZAI_API_KEY | lead | snapshot polling online (hub.db) | ok
2026-10-11T14:24Z | order: pilot eval 4 runs (css-persian-fix easy/hard) | codex-a/glm/codex-b | 1 timeout, 1 failed, 2 scored very low (43/25) | scores discarded as pilot; infra-invalidations introduced
2026-10-11T14:29Z | decision: run synthetic eval suites 8 task kinds x easy/hard (+expert) on 8 models in 3 lanes | lead | 252 jobs, 213 auto ratings recorded | accepted
2026-10-11T15:20Z | auto-invalidation: run 178 author type-and-filter failed (apply_patch multiple operations) | gpt-5.6-terra | marked invalid | rerun ordered (job 197 later ok)
2026-10-11T15:25Z | auto-invalidation: runs 190,191,192 eval expert failed | gpt-6-astra/gpt-6-sol/gpt-6.1-sol | invalid_ids.txt [178,190,191,192] | excluded from ratings
2026-10-11T14:29Z | order: author 39-card real trial (batch39.json) via cheap-batch/cheap-author, 5 models | 5 workers | 34 logged runs (32 ok), 38 cards scored by independent Sonnet review | accepted
2026-10-10T21:45Z | decision: independent Sonnet review, verdict-only (wave 1) | reviewer | 43 cards reviewed (36 approve / 7 fix); model attribution not logged | accepted with gap
2026-10-11T15:0xZ | decision: scored review 0-100, approve at 85+ (wave 2, until 16:50) | reviewer | 38 scored reviews (32 approve / 6 fix), overall mean 86.0 | accepted
2026-10-11T15:12Z | order: fix rounds for flagged cards (persian-fix wave 15:12-18:32 UTC) | various | 7 persian-fix jobs rated 85-92 (all >=85); round reviews logged separately, none reached approve | partial
2026-10-11T16:55Z | order: monolithic "persian sound tool v1" | glm | 30+ min no output, stopped (job 240) | failed -> policy: milestone orders only
2026-10-11T17:2xZ | decision (owner): brain-and-hands doctrine; lead must not implement; bootstrap gap to be fixed with qh order | lead | rules 1-11 drafted | accepted
2026-10-11T17:24Z | order o1: write doctrine into CLAUDE.md, AGENTS.md, quota-hub SKILL.md, memory | glm | done, grep acceptance passed (report-o1.md) | accepted
2026-10-11T17:28Z | order o2: add qh order/orders/result/stop queue to quota-hub | glm | done, 8 queue tests pass (report-o2.md) | accepted
2026-10-11T17:48Z | order s1: persian-sound picture analysis (analysis.py + tests) | glm | done in 4.2 min, 4 tests OK (report-s1.md) | accepted
2026-10-11T17:52Z | order s2: numpy synth + profiles.json + tests | glm | done in 7.4 min, tests OK (report-s2.md) | accepted
2026-10-11T18:00Z | order s3: mix.py + make_sound.py CLI, loudnorm, mux | glm | done in 10.3 min; 3 real samples rendered and verified (report-s3.md) | accepted
2026-10-12T20:13Z | order s4: verify_sound.py + batch.py + README + batch dry-run | glm | timeout at 25 min; verify_sound.py present, batch.py and README missing (progress-s4.md) | failed -> needs re-slice
2026-10-12T20:38Z | order o3: link-script ONLY_STATUS/KEEP + .fa.sound.mp4 packaging | glm | done in 4.9 min, 2 dry-run acceptances pass (report-o3.md) | accepted
2026-10-12T20:44Z | order p1-process-doc: write DELEGATION-PROCESS-REPORT.md + DELEGATION-JOURNAL.md | glm | this order; both docs written | delivered
