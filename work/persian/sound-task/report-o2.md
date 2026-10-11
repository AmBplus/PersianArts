# report-o2 (TASK A + AMENDMENT A last paragraph)

## What I did (all inside D:\P\tools\quota-hub)
- lib/queue.mjs (NEW): enqueueOrder (writes data/orders/<ts>-<slug>.md + .json sidecar, FIFO queuePosition, validates worker and --after), ensureRunner (detached lib/queue-runner.mjs, pid file data/queue-runner.pid), nextOrder/processNext (per-worker FIFO, honors --after, glm waits for the single-job lock instead of failing, sets QH_GLM_ALLOWED / QH_CODEX_FULL), listOrders (progress-file age from the 'Progress:' path, STALLED after 600s), orderResult (status, duration, quota delta, final message, changed files, report file from 'Report:'/'report path:'), stopOrder (killTree + mark stopped).
- lib/queue-runner.mjs (NEW): detached runner loop, single-runner lock file, exits when idle (QH_QUEUE_IDLE_MS, default 120s).
- lib/db.mjs: added `queue` table + index to SCHEMA.
- lib/runner.mjs: runJob calls opts.onChild(child.pid) so the queue records the worker pid for `qh stop`.
- bin/qh.mjs: new commands order / orders [--json] / result <jobId|orderId> / stop <orderId> (+ --text --allowed --full-access --after), usage line updated.
- README.md: usage lines + "Order queue" section.
- test/queue.test.mjs (NEW): 8 tests, fake worker only (enqueue/FIFO, --after, STALLED flag, stop kills process tree, full CLI order->orders->result round trip).

## Acceptance
1) npm test (script = node --test test/*.test.mjs): tests 31, pass 31, fail 0.
2) Fake-worker demo (QH_FAKE_WORKER=1, isolated QH_DB/QH_DATA_DIR, worker glm; changedFiles truncated - it lists the uncommitted persianArts files because the demo cwd is inside that git repo):
- qh order -> {"orderId":1,"queuePosition":1,"orderFile":"...\\_qh-demo\\data\\orders\\2026-10-11T17-46-38-demo-order.md","runnerStarted":true,"runnerPid":34456}
- qh orders --json -> [{"orderId":1,"ageS":4,"worker":"glm","status":"done","jobId":1,"jobStatus":"ok","durationS":0.1,"afterId":null,"orderFile":"...\\2026-10-11T17-46-38-demo-order.md"}]
- qh result 1 -> {"orderId":1,"jobId":1,"status":"done","worker":"glm","title":"demo order","durationS":0.1,"quotaDeltaPct":0,"quotaDelta":{"5h":0,"week":0},"finalMessage":"fake done","changedFiles":["...62 repo files incl. work/persian/sound-task/_qh-demo/demo.txt, progress.md, rep.md ..."],"reportFile":"...\\_qh-demo\\rep.md","report":"all done, 2 files written\n"}

## Doubts
- TASK A also says to update C:\Users\Amir\.claude\skills\quota-hub\SKILL.md, but the order says "Edit only inside D:\P\tools\quota-hub" - I did NOT touch SKILL.md; needs a separate order.
- Early failing test runs briefly wrote 2 queue rows + order files into the real data/hub.db (no model calls, fake quota server only). I deleted those rows, order files and run dirs; verified clean.
- changedFiles is large in the demo only because the demo cwd sits inside the persianArts git repo; real orders point at their own project cwd.
