#!/usr/bin/env node
// build-gallery.mjs — ساخت صفحهٔ گالری مرجع موشن از پوشهٔ همین دایرکتوری.
//
// هدف: تیم باید بتواند موشن‌گرافیک حرفه‌ایِ کد-رندرشده را ببیند و مقایسه کند.
// ورودی: فایل‌های .jpg/.png/.webp/.gif/.mp4 در همین پوشه + MANIFEST.md (اختیاری)
// خروجی: index.html در همین پوشه.
//
//   node work/persian/reference-motion/build-gallery.mjs
//
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";

const dir = import.meta.dirname;
const files = readdirSync(dir)
  .filter((f) => !f.startsWith("_") && f !== "index.html" && f !== "MANIFEST.md")
  .filter((f) => [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov"].includes(extname(f).toLowerCase()))
  .map((f) => ({ file: f, size: statSync(join(dir, f)).size }))
  .sort((a, b) => a.file.localeCompare(b.file));

// نام‌های فایل را به برچسب فارسی/انگلیسی خوانا تبدیل کن
const label = (f) => {
  const base = basename(f, extname(f)).replace(/__/g, " · ");
  return base.replace(/_/g, " ");
};

let manifestRows = "";
const manifestPath = join(dir, "MANIFEST.md");
if (existsSync(manifestPath)) {
  const md = readFileSync(manifestPath, "utf8");
  manifestRows = md
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => {
      const cells = l.split("|").map((c) => c.trim());
      return cells.length > 3 ? cells.slice(1, -1) : null;
    })
    .filter(Boolean);
}

const cards = files
  .map((f) => {
    const isVideo = [".mp4", ".mov"].includes(extname(f.file).toLowerCase());
    const isGif = extname(f.file).toLowerCase() === ".gif";
    const media = isVideo
      ? `<video src="${f.file}" controls muted loop playsinline></video>`
      : `<img src="${f.file}" loading="lazy" alt="${label(f.file)}">`;
    const row = manifestRows.find((r) => r[0] && r[0].includes(basename(f.file)));
    const note = row ? row[3] || row[2] || "" : "";
    const src = row ? row[1] || "" : "";
    return `<figure class="item">
  <div class="media">${media}</div>
  <figcaption>
    <strong>${label(f.file)}</strong>
    <span class="meta">${(f.size / 1048576).toFixed(2)} MB${isGif ? " · gif" : ""}${isVideo ? " · video" : ""}</span>
    ${note ? `<span class="note">${note}</span>` : ""}
    ${src ? `<span class="src">${src}</span>` : ""}
  </figcaption>
</figure>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="fa" dir="rtl">
<meta charset="utf-8">
<title>مرجع موشن — گالری</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 24px; background: #101012; color: #e8e6e3;
         font-family: "Vazirmatn", system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p.lede { color: #9a968f; margin: 0 0 24px; font-size: 14px; }
  .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .item { margin: 0; background: #17171a; border: 1px solid #26262b; border-radius: 10px; overflow: hidden; }
  .media { background: #000; aspect-ratio: 16/9; display: grid; place-items: center; }
  .media img, .media video { width: 100%; height: 100%; object-fit: contain; display: block; }
  figcaption { padding: 10px 12px 14px; font-size: 13px; display: grid; gap: 3px; }
  .meta { color: #8d8880; font-size: 11px; }
  .note { color: #c9c3b8; }
  .src { color: #6f6a63; font-size: 11px; word-break: break-all; }
</style>
<h1>مرجع موشن — گالری</h1>
<p class="lede">${files.length} مرجع کد-رندرشده از ریپوهای حرفه‌ای موشن. هدف: دیدن استاندارد واقعی قبل از داوری خروجی خودمان. منبع هر فایل در زیر آمده.</p>
<div class="grid">
${cards}
</div>
</html>
`;

writeFileSync(join(dir, "index.html"), html, "utf8");
console.log(`gallery: ${files.length} items -> ${join(dir, "index.html")}`);
