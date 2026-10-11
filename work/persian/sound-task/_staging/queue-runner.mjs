// Detached queue runner: consumes the order queue (lib/queue.mjs) FIFO per worker.
// Started automatically by `qh order`; exits after QH_QUEUE_IDLE_MS (default 120s) with nothing to do.
import { closeSync, openSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openDb } from './db.mjs';
import { processNext, runnerPidFile, dataDir } from './queue.mjs';

const IDLE_MS = Number(process.env.QH_QUEUE_IDLE_MS || 120000);
const TICK_MS = 1000;
const pidFile = runnerPidFile();
const lockFile = join(dataDir(), 'queue-runner.lock');

// single-runner guard (same trick as the glm lock): exclusive create, dead-owner takeover not needed
try { const fd = openSync(lockFile, 'wx'); writeFileSync(fd, String(process.pid)); closeSync(fd); }
catch { process.exit(0); } // another runner is alive
writeFileSync(pidFile, String(process.pid));
const cleanup = () => { try { unlinkSync(pidFile); } catch {} try { unlinkSync(lockFile); } catch {} };
process.on('SIGINT', cleanup); process.on('SIGTERM', cleanup); process.on('exit', cleanup);

const db = openDb();
let idleSince = Date.now();
for (;;) {
  let ran = false;
  try { ran = (await processNext(db)) != null; }
  catch (e) { console.error('queue runner:', e.message); }
  if (ran) idleSince = Date.now();
  else if (Date.now() - idleSince > IDLE_MS) break;
  else await new Promise((r) => setTimeout(r, TICK_MS));
}
