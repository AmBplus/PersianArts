// Order queue: the lead hands out work with `qh order` (no files to create by hand);
// a detached runner (lib/queue-runner.mjs) consumes the queue FIFO per worker and records jobs exactly like `qh run`.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { ROOT, getWorker } from './workers.mjs';
import { runJob, acquireGlmLock, killTree } from './runner.mjs';
import { getJob } from './jobs.mjs';

const nowS = () => Math.floor(Date.now() / 1000);
const STALL_S = 600; // rule 11e: no progress for 10 minutes => STALLED
export const dataDir = () => process.env.QH_DATA_DIR || join(ROOT, 'data');
export const ordersDir = () => process.env.QH_ORDERS_DIR || join(dataDir(), 'orders');
export const runnerPidFile = () => join(dataDir(), 'queue-runner.pid');

const safeRead = (f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } };
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export const slugify = (s) => (String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'order');

/** First `<Label>: <path>` token in the text (labels like 'Progress' / 'Report|report path'). */
export function parseLabeledPath(text, labels) {
  const m = String(text ?? '').match(new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*:\\s*(\\S+)`, 'i'));
  return m ? m[1].replace(/[)\].,;'"]+$/, '') : null;
}
export const progressPathOf = (text) => parseLabeledPath(text, ['Progress']);
export const reportPathOf = (text) => parseLabeledPath(text, ['Report', 'report path']);
export const readParams = (orderFile) => JSON.parse(readFileSync(orderFile.replace(/\.md$/, '.json'), 'utf8'));

/** Write the order text to data/orders/<timestamp>-<slug>.md and enqueue the job. Returns {orderId, queuePosition, orderFile}. */
export function enqueueOrder(db, o) {
  getWorker(o.worker);
  if (!o.cwd) throw new Error('order: --cwd is required');
  if (!o.text) throw new Error('order: --text is required');
  if (o.afterId != null && !db.prepare('SELECT id FROM queue WHERE id = ?').get(o.afterId))
    throw new Error(`order: --after ${o.afterId} names no known order`);
  mkdirSync(ordersDir(), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const orderFile = join(ordersDir(), `${stamp}-${slugify(o.title)}.md`);
  writeFileSync(orderFile, o.text, 'utf8');
  writeFileSync(orderFile.replace(/\.md$/, '.json'), JSON.stringify({
    worker: o.worker, model: o.model ?? null, effort: o.effort ?? null, cwd: resolve(o.cwd), title: o.title ?? null,
    kind: o.kind ?? null, timeoutSec: o.timeoutSec ?? null, allowed: o.allowed ?? null, fullAccess: !!o.fullAccess,
    afterId: o.afterId ?? null, orderFile,
  }, null, 2), 'utf8');
  const r = db.prepare(`INSERT INTO queue(ts, worker, order_file, status, after_id) VALUES(?,?,?,?,?)`)
    .run(nowS(), o.worker, orderFile, 'queued', o.afterId ?? null);
  const orderId = Number(r.lastInsertRowid);
  const queuePosition = 1
    + db.prepare(`SELECT COUNT(*) c FROM queue WHERE worker = ? AND status = 'queued' AND id < ?`).get(o.worker, orderId).c
    + db.prepare(`SELECT COUNT(*) c FROM queue WHERE worker = ? AND status = 'running'`).get(o.worker).c;
  return { orderId, queuePosition, orderFile };
}

/** Start the detached queue runner unless one is already alive (pid file in data/). */
export function ensureRunner() {
  try {
    const pid = Number(readFileSync(runnerPidFile(), 'utf8'));
    if (pid && alive(pid)) return { started: false, pid };
  } catch {}
  mkdirSync(dirname(runnerPidFile()), { recursive: true });
  const child = spawn(process.execPath, [join(ROOT, 'lib', 'queue-runner.mjs')], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return { started: true, pid: child.pid };
}

/** Next queued order eligible to run: per-worker FIFO, honors --after, skips workers with a live running job. */
export function nextOrder(db) {
  for (const q of db.prepare(`SELECT * FROM queue WHERE status = 'queued' ORDER BY id`).all()) {
    if (db.prepare(`SELECT id FROM queue WHERE worker = ? AND status = 'running' AND id != ?`).get(q.worker, q.id)) continue;
    if (db.prepare(`SELECT id FROM jobs WHERE worker = ? AND status = 'running' AND ts_start > ?`).get(q.worker, nowS() - 6 * 3600)) continue;
    if (q.after_id != null) {
      const a = db.prepare('SELECT job_id FROM queue WHERE id = ?').get(q.after_id);
      const j = a?.job_id != null ? getJob(db, a.job_id) : null;
      if (!j || j.status === 'running') continue;
    }
    return q;
  }
  return null;
}

/** Run the next eligible order to completion. Returns the runJob result + orderId, or null when the queue is empty. */
export async function processNext(db) {
  const q = nextOrder(db);
  if (!q) return null;
  db.prepare(`UPDATE queue SET status = 'running' WHERE id = ? AND status = 'queued'`).run(q.id);
  const p = readParams(q.order_file);
  const text = safeRead(q.order_file);
  if (p.allowed) process.env.QH_GLM_ALLOWED = p.allowed;
  if (p.fullAccess) process.env.QH_CODEX_FULL = '1';
  try {
    // jobs for the same worker are serial here, so for glm the single-job lock is normally free; wait instead of failing
    if (p.worker === 'glm') for (let i = 0; ; i++) {
      try { acquireGlmLock()(); break; }
      catch (e) { if (i > 150) throw e; await new Promise((r) => setTimeout(r, 2000)); }
    }
    const r = await runJob(db, {
      worker: p.worker, model: p.model, effort: p.effort, cwd: p.cwd, prompt: text, kind: p.kind, title: p.title,
      timeoutSec: p.timeoutSec ?? undefined, onChild: (pid) => db.prepare('UPDATE queue SET pid = ? WHERE id = ?').run(pid, q.id),
    });
    db.prepare('UPDATE queue SET job_id = ? WHERE id = ?').run(r.jobId, q.id);
    db.prepare(`UPDATE queue SET status = CASE WHEN status = 'running' THEN 'done' ELSE status END, pid = NULL WHERE id = ?`).run(q.id);
    return { ...r, orderId: q.id };
  } catch (e) {
    db.prepare(`UPDATE queue SET status = CASE WHEN status = 'running' THEN 'done' ELSE status END, pid = NULL WHERE id = ?`).run(q.id);
    throw e;
  } finally { delete process.env.QH_GLM_ALLOWED; delete process.env.QH_CODEX_FULL; }
}

/** All orders, newest first; running ones carry the progress-file age and the STALLED flag. */
export function listOrders(db) {
  const ageS = (t) => Math.round((Date.now() - t * 1000) / 1000);
  return db.prepare(`SELECT q.id, q.ts, q.worker, q.status, q.job_id, q.order_file, q.after_id,
      j.status AS job_status, j.duration_s
    FROM queue q LEFT JOIN jobs j ON j.id = q.job_id ORDER BY q.id DESC`).all().map((q) => {
    const out = { orderId: q.id, ageS: ageS(q.ts), worker: q.worker, status: q.status, jobId: q.job_id,
      jobStatus: q.job_status ?? null, durationS: q.duration_s ?? null, afterId: q.after_id ?? null, orderFile: q.order_file };
    if (q.status === 'running') {
      const text = safeRead(q.order_file);
      const pp = text && progressPathOf(text) && existsSync(q.order_file.replace(/\.md$/, '.json')) ? progressPathOf(text) : null;
      if (pp) {
        const abs = resolve(readParams(q.order_file).cwd, pp);
        out.progressFile = abs;
        try { out.progressAgeS = Math.round((Date.now() - statSync(abs).mtimeMs) / 1000); } catch { out.progressAgeS = null; }
      }
      out.stalled = (out.progressAgeS ?? out.ageS) > STALL_S;
      if (out.stalled) out.flag = 'STALLED';
    }
    return out;
  });
}

/** Full result of an order (or of a bare job id): status, duration, quota delta, final message, changed files, report file. */
export function orderResult(db, id) {
  const q = db.prepare('SELECT * FROM queue WHERE id = ?').get(id) ?? db.prepare('SELECT * FROM queue WHERE job_id = ?').get(id);
  const jobId = q ? q.job_id : id;
  const job = jobId != null ? getJob(db, jobId) : null;
  if (!q && !job) throw new Error(`no order or job ${id}`);
  const out = { orderId: q?.id ?? null, jobId: jobId ?? null, status: q ? q.status : job?.status,
    worker: q?.worker ?? job?.worker ?? null, title: job?.title ?? null, durationS: job?.duration_s ?? null,
    quotaDeltaPct: job?.quota_delta?.['5h'] ?? null, quotaDelta: job?.quota_delta ?? null };
  if (job?.result_path && existsSync(job.result_path)) out.finalMessage = safeRead(job.result_path);
  if (job?.result_path) {
    try { out.changedFiles = JSON.parse(safeRead(join(dirname(job.result_path), 'meta.json'))).changedFiles ?? null; }
    catch { out.changedFiles = null; }
  }
  const text = q ? safeRead(q.order_file) : null;
  if (text) {
    const rp = reportPathOf(text);
    if (rp && existsSync(q.order_file.replace(/\.md$/, '.json'))) {
      const abs = resolve(readParams(q.order_file).cwd, rp);
      out.reportFile = abs;
      out.report = safeRead(abs) ?? `(report file not found: ${abs})`;
    }
  }
  return out;
}

/** Kill a running order's worker process tree and mark it stopped (queued orders are simply cancelled). */
export function stopOrder(db, id) {
  const q = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
  if (!q) throw new Error(`no such order ${id}`);
  if (q.status === 'running' && q.pid && alive(q.pid)) killTree(q.pid);
  if (q.status === 'queued' || q.status === 'running') {
    db.prepare(`UPDATE queue SET status = 'stopped' WHERE id = ? AND status IN ('queued','running')`).run(id);
    return { orderId: id, status: 'stopped', killedPid: q.status === 'running' ? q.pid ?? null : null };
  }
  return { orderId: id, status: q.status };
}
