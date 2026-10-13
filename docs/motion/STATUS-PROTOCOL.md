# Status protocol (every worker order)

The owner watches http://localhost:4747/ (`node work/persian/status/serve.mjs`). Data: `work/persian/status/board.json`.

Rule for every worker order:
1. At start: `pwsh work/persian/tools/pa.ps1 status set <itemId> -State running -Percent 0 -Note "started"`
   (new item: `status add-item <itemId> -Goal <goalId> -Title "..." -ExpectedMinutes 20`).
2. At every step: `status set <itemId> -Percent <n> -Note "<what just finished>"`.
3. At the end: `status set <itemId> -State done` (or `-State blocked -Note "<why>"`).
4. Blockers for the owner: `status blocker add "<text>"`; remove with `status blocker clear "<text part>"`.
5. 10 minutes without an update on a running item = stalled (the page turns it red). Stalled work is stopped and re-ordered narrower.
6. Use label `uni-admissions` only; never the client's real name in notes.
7. Renders: `render_all.ps1` updates the render panel itself (frame x of y, fps, ETA) every 2 seconds.
8. Do not edit board.json by hand; `pa.ps1` writes it atomically (temp file + rename).

## Resilience rule
1. On a block, try at least two alternative reasonable paths before reporting a blocker (e.g. copy instead of symlink; installed Chrome instead of a downloaded browser).
2. The report states which paths were tried and the result of each.
3. Blockers go to the board only if no workable path remains; the owner is involved only when the work truly cannot proceed without them.
4. Reports contain no excuses and no lists of restrictions: only done / not done / measured time.
5. Do not complain about limits; find another reasonable path and solve it.
