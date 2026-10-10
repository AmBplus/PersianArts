// Static preview server for work/ with HTTP Range support (so <video> can seek).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

// usage: node work/serve.mjs [dir relative to repo root (default: work)] [port (default 4173)]
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(REPO, process.argv[2] || "work");
const PORT = Number(process.argv[3] || process.env.PORT || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".tsx": "text/plain; charset=utf-8",
};

const listing = (dir, url) => {
  const rows = fs.readdirSync(dir, {withFileTypes: true})
    .map((e) => `<li><a href="${path.posix.join(url, e.name)}${e.isDirectory() ? "/" : ""}">${e.name}${e.isDirectory() ? "/" : ""}</a></li>`)
    .join("");
  return `<!doctype html><meta charset="utf-8"><body style="font:15px system-ui;background:#111;color:#eee;padding:24px"><h2>${url}</h2><ul>${rows}</ul>`;
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  const st = fs.statSync(file);
  if (st.isDirectory()) {
    const idx = path.join(file, "index.html");
    if (fs.existsSync(idx)) return fs.createReadStream(idx).pipe(res.writeHead(200, {"Content-Type": TYPES[".html"]}));
    res.writeHead(200, {"Content-Type": TYPES[".html"]}).end(listing(file, url.endsWith("/") ? url : url + "/"));
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : st.size - 1;
    res.writeHead(206, {"Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1});
    fs.createReadStream(file, {start, end}).pipe(res);
  } else {
    res.writeHead(200, {"Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": st.size});
    fs.createReadStream(file).pipe(res);
  }
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
