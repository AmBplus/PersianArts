# quota-hub Codex queue check — 2026-10-12 22:38 UTC
1. HOLD CAUSE (confirmed): `lib/queue.mjs:71` — `SELECT id FROM jobs WHERE worker=? AND status='running' AND ts_start > nowS()-6*3600` → order skipped. Uses wall-clock `nowS()` at each scan. (`queue.mjs:70` also skips a worker with another 'running' queue row.)
2. Stale 'running' jobs (jobs table has NO pid column → "alive?" = unknown unless queue row holds one):
   | job | worker | title | ts_start | alive? |
   | 162 | codex-a | author product-card-progressive-assemble | 2026-10-11 15:13:35Z | unknown (no pid stored) |
   | 193 | codex-a | eval review-diff/expert | 2026-10-11 15:26:34Z | unknown (no pid stored) |
   | 260 | glm | codex-queue-check | 2026-10-12 22:29:43Z | DEAD — pid 52632 (queue row 10) absent from process list; `qh orders` flags order 10 STALLED |
3. WINDOW: hold for 162/193 expired 2026-10-11 21:13:35Z / 21:26:34Z (>25h ago) — NOT active. Order 9 was not blocked by it: it sat FIFO behind glm orders 6/7/8 on the single serial runner, then RAN as job 259 (imagegen-test-arch) 22:28:23→22:29:41Z, status ok, exit 0. `qh orders` shows order 9 done. Codex-a queue is clear; nothing self-clears anymore (already cleared).
4. OFFICIAL CLEANUP: none found. `qh stop <orderId>` (bin/qh.mjs:239 → lib/queue.mjs:160) only kills a live queue pid and sets queue.status='stopped'; it never updates jobs.status, and jobs 162/193 predate the queue (no queue rows) → unreachable. Minimal SQL the owner could run (WRITTEN, NOT EXECUTED):
   `UPDATE jobs SET status='error', ts_end=strftime('%s','now') WHERE id IN (162,193) AND status='running';` — plus job 260 when order 10 is stopped via `qh stop 10`.
5. codex.exe PIDs 23996 & 24496 are NOT qh jobs: no codex-a/codex-b job is 'running' now and runner 46892 has no codex child (PowerShell/wmic blocked this session; verdict by elimination from DB + tasklist). Runner 46892 alive.
6. QUOTA (`qh quota`, ok): codex-a 5h 3% used (97% headroom), week 39%, resets 4h35m; codex-b 5h 0% (100% headroom), week 54%, resets 5d6h.
7. RECOMMENDATION: no action needed for order 9 (succeeded). Housekeeping only: run the SQL above (or add a `qh reconcile` that closes running jobs whose 6h window expired / pid dead), and `qh stop 10` to clear the STALLED glm order.
