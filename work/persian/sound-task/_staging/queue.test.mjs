// Queue tests: `qh order` enqueue/FIFO, detached runner, orders/result/stop, STALLED flag (fake worker, no model calls).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'qh-queue-'));
process.env.QH_FAKE_WORKER = '1';
process.env.QH_DATA_DIR = join(tmp, 'data');
process.env.QH_RUNS_DIR = join(tmp, 'runs');
process.env.QH_ORDERS_DIR = join(tmp, 'orders');
process.env.QH_QUEUE_IDLE_MS = '2000';
after(() => rmSync(tmp, { recursive: true, force: true }));

const { openDb } = await import('../lib/db.mjs');
const { enqueueOrder, nextOrder, processNext, listOrders, orderResult, stopOrder, progressPathOf, reportPathOf } = await import('../lib/queue.mjs');
const { getJob } = await import('../lib/jobs.mjs');
const cwd = join(tmp, 'cwd');
mkdirSync(cwd, { recursive: true });

test('Progress:/Report: path parsing', () => {
  const t = 'Progress: work/x/progress-o2.md\nReport: work/x/report.md\nreport path: other.md';
  assert.equal(progressPathOf(t), 'work/x/progress-o2.md');
  assert.equal(reportPathOf(t), 'work/x/report.md');
});

test('enqueue: writes order files, FIFO positions, validates worker and --after', () => {
  const db = openDb(join(tmp, 't1.db'));
  const a = enqueueOrder(db, { worker: 'codex-a', cwd, title: 'First Order!', text: 'do A' });
  const b = enqueueOrder(db, { worker: 'codex-a', cwd, title: 'second', text: 'do B' });
  assert.match(a.orderFile, /first-order\.md$/);
  assert.ok(a.orderId < b.orderId);
  assert.equal(a.queuePosition, 1);
  assert.equal(b.queuePosition, 2);
  assert.throws(() => enqueueOrder(db, { worker: 'nope', cwd, text: 't' }), /unknown worker/);
  assert.throws(() => enqueueOrder(db, { worker: 'codex-a', cwd, text: 't', afterId: 999 }), /--after/);
  assert.equal(nextOrder(db).id, a.orderId);
});

test('queue runs orders FIFO, one at a time; status/job recording matches qh run', async () => {
  const db = openDb(join(tmp, 't2.db'));
  const a = enqueueOrder(db, { worker: 'codex-a', cwd, title: 'a', kind: 'k', text: '@write a.txt A' });
  const b = enqueueOrder(db, { worker: 'codex-a', cwd, title: 'b', text: '@sleep 300\n@write b.txt B' });
  const r1 = await processNext(db);
  assert.equal(r1.orderId, a.orderId);
  assert.equal(r1.status, 'ok');
  const rows = listOrders(db);
  assert.equal(rows.find((o) => o.orderId === a.orderId).status, 'done');
  assert.equal(rows.find((o) => o.orderId === a.orderId).jobStatus, 'ok');
  const r2 = await processNext(db);
  assert.equal(r2.orderId, b.orderId);
  const ja = getJob(db, r1.jobId); const jb = getJob(db, r2.jobId);
  assert.ok(ja.ts_end <= jb.ts_start, 'jobs ran one at a time');
});

test('--after: order waits until the referenced order has a finished job', () => {
  const db = openDb(join(tmp, 't3.db'));
  const a = enqueueOrder(db, { worker: 'codex-b', cwd, title: 'a', text: 'x' });
  const b = enqueueOrder(db, { worker: 'codex-b', cwd, title: 'b', text: 'y', afterId: a.orderId });
  assert.equal(nextOrder(db).id, a.orderId);
  db.prepare(`UPDATE queue SET status = 'running' WHERE id = ?`).run(a.orderId);
  assert.equal(nextOrder(db), null); // b blocked by running a (same worker) and unfinished --after
  db.prepare(`UPDATE queue SET status = 'queued' WHERE id = ?`).run(a.orderId);
});

test('orders flags STALLED when the progress file is stale', () => {
  const db = openDb(join(tmp, 't4.db'));
  const o = enqueueOrder(db, { worker: 'codex-b', cwd, title: 'stall', text: 'x\nProgress: prog.md' });
  const pf = join(cwd, 'prog.md');
  writeFileSync(pf, 'step 1\n');
  const old = Date.now() / 1000 - 700;
  utimesSync(pf, old, old);
  db.prepare(`UPDATE queue SET status = 'running', ts = ? WHERE id = ?`).run(Math.floor(old), o.orderId);
  const row = listOrders(db).find((x) => x.orderId === o.orderId);
  assert.equal(row.stalled, true);
  assert.equal(row.flag, 'STALLED');
  assert.ok(row.progressAgeS > 600);
});

test('stop: kills the worker process tree and marks the order stopped (runner does not overwrite)', async () => {
  const db = openDb(join(tmp, 't5.db'));
  const o = enqueueOrder(db, { worker: 'codex-b', cwd, title: 'slow', text: '@sleep 30000' });
  const running = processNext(db);
  let q = null;
  for (let i = 0; i < 50 && !(q && q.pid); i++) {
    await new Promise((r) => setTimeout(r, 100));
    q = db.prepare('SELECT * FROM queue WHERE id = ?').get(o.orderId);
  }
  assert.ok(q.pid, 'worker pid recorded for stop');
  const st = stopOrder(db, o.orderId);
  assert.equal(st.status, 'stopped');
  await running; // runJob notices the kill and records the job; status must stay 'stopped'
  const row = db.prepare('SELECT status, job_id FROM queue WHERE id = ?').get(o.orderId);
  assert.equal(row.status, 'stopped');
  assert.ok(row.job_id, 'job still recorded');
});

test('CLI: qh order -> runner -> orders --json -> result with report file', async () => {
  const cli = join(here, '..', 'bin', 'qh.mjs');
  const env = { ...process.env };
  const r = spawnSync(process.execPath, [cli, 'order', '--worker', 'codex-a', '--cwd', cwd, '--title', 'cli demo',
    '--text', '@write cli.txt hi\n@write rep.md report-content\nProgress: prog.md\nReport: rep.md'], { env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const { orderId, queuePosition, orderFile } = JSON.parse(r.stdout);
  assert.equal(queuePosition, 1);
  assert.ok(orderFile.endsWith('.md'));
  let done = null;
  for (let i = 0; i < 100 && !done; i++) {
    await new Promise((res) => setTimeout(res, 300));
    const out = spawnSync(process.execPath, [cli, 'orders', '--json'], { env, encoding: 'utf8' });
    done = JSON.parse(out.stdout).find((o) => o.orderId === orderId && o.status === 'done');
  }
  assert.ok(done, 'runner finished the order');
  const res = JSON.parse(spawnSync(process.execPath, [cli, 'result', String(orderId)], { env, encoding: 'utf8' }).stdout);
  assert.equal(res.status, 'done');
  assert.equal(res.finalMessage, 'fake done');
  assert.deepEqual(res.changedFiles, ['cli.txt', 'rep.md']);
  assert.match(res.report, /report-content/);
  assert.equal(res.reportFile, join(cwd, 'rep.md'));
});

test('CLI: qh stop cancels a queued order', () => {
  const cli = join(here, '..', 'bin', 'qh.mjs');
  const env = { ...process.env };
  const db = openDb(join(tmp, 't6.db'));
  const o = enqueueOrder(db, { worker: 'codex-b', cwd, title: 'never', text: 'x' });
  const out = spawnSync(process.execPath, [cli, 'stop', String(o.orderId)], { env, encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(JSON.parse(out.stdout).status, 'stopped');
  assert.equal(db.prepare('SELECT status FROM queue WHERE id = ?').get(o.orderId).status, 'stopped');
});
