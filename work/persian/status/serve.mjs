// Dependency-free status server. Start: node work/persian/status/serve.mjs [port]   (default 4747, localhost only)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..', '..');
const port = Number(process.argv[2] || process.env.PORT || 4747);
const files = {
  '/': ['board.html', 'text/html; charset=utf-8'],
  '/board.html': ['board.html', 'text/html; charset=utf-8'],
  '/metering-history.json': ['metering-history.json', 'application/json; charset=utf-8'],
  '/metrics.json': ['metrics.json', 'application/json; charset=utf-8'],
  '/board.json': ['board.json', 'application/json; charset=utf-8'],
  '/fonts/Vazirmatn-Variable.ttf': ['fonts/Vazirmatn-Variable.ttf', 'font/ttf'],
};
// ONLY these folders (relative to repo root) are ever served by /f/ and /recent.json.
const ALLOWED = ['media/film-versions', 'docs/motion/reports', 'work/persian/status'];
const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm',
  wav: 'audio/wav', mp3: 'audio/mpeg', md: 'text/plain; charset=utf-8', json: 'application/json; charset=utf-8' };
const SCAN_EXT = new Set(['png', 'mp4', 'wav', 'mp3', 'md']);
const H = { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache', Expires: '0' };
function resolveAllowed(rel) {
  let r; try { r = decodeURIComponent(rel); } catch { return null; }
  if (r.includes('\0') || r.includes(String.fromCharCode(92)) || r.split('/').some(s => s === '..' || s === '.' )) return null;
  r = r.replace(/^\/+/, '');
  const abs = path.resolve(root, r);
  for (const a of ALLOWED) {
    const base = path.resolve(root, a);
    if (abs.startsWith(base + path.sep)) {
      let real; try { real = fs.realpathSync(abs); } catch { return null; }
      let rb; try { rb = fs.realpathSync(base); } catch { return null; }
      if (real.startsWith(rb + path.sep)) return real;
    }
  }
  return null;
}
function scan() {
  const out = [];
  const walk = (d, depth) => {
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (e.name === 'node_modules' || e.name.startsWith('_bundle') || e.name.startsWith('_silent')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (depth < 6) walk(p, depth + 1); continue; }
      const ext = path.extname(e.name).slice(1).toLowerCase();
      if (!SCAN_EXT.has(ext)) continue;
      const st = fs.statSync(p);
      out.push({ path: path.relative(root, p).split(path.sep).join('/'), kind: ext === 'png' ? 'image' : ext === 'mp4' ? 'video' : ext === 'md' ? 'report' : 'audio', mtime: st.mtimeMs, size: st.size });
    }
  };
  for (const a of ALLOWED) walk(path.resolve(root, a), 0);
  return out.sort((x, y) => y.mtime - x.mtime).slice(0, 30);
}
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost').pathname;
  if (u === '/recent.json') { res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(scan())); }
  if (u.startsWith('/f/')) {
    const abs = resolveAllowed(u.slice(3));
    if (!abs) { res.writeHead(403, H); return res.end('forbidden'); }
    const ext = path.extname(abs).slice(1).toLowerCase();
    const type = TYPES[ext];
    let st; try { st = fs.statSync(abs); } catch { res.writeHead(404, H); return res.end('not found'); }
    if (!type || !st.isFile()) { res.writeHead(403, H); return res.end('forbidden'); }
    const hd = { ...H, 'Content-Type': type, 'Accept-Ranges': 'bytes' };
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      let s = m[1] === '' ? Math.max(0, st.size - Number(m[2])) : Number(m[1]);
      let e = m[1] !== '' && m[2] !== '' ? Number(m[2]) : st.size - 1;
      e = Math.min(e, st.size - 1);
      if (s > e) { res.writeHead(416, { ...H, 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...hd, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Content-Length': e - s + 1 });
      return fs.createReadStream(abs, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { ...hd, 'Content-Length': st.size });
    return fs.createReadStream(abs).pipe(res);
  }
  const f = files[u];
  if (!f) { res.writeHead(404, H); return res.end('not found'); }
  fs.readFile(path.join(dir, f[0]), (e, d) => {
    if (e) { res.writeHead(500, H); return res.end('read error'); }
    if (f[0] === 'board.json') {
      try { JSON.parse(d.toString('utf8').replace(/^﻿/, '')); } catch (x) { res.writeHead(503, { ...H, 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('invalid board.json: ' + x.message); }
      d = Buffer.from(d.toString('utf8').replace(/^﻿/, ''));
    }
    res.writeHead(200, { ...H, 'Content-Type': f[1] });
    res.end(d);
  });
}).listen(port, '127.0.0.1', () => console.log(`status board: http://localhost:${port}/`));
