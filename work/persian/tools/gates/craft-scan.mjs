#!/usr/bin/env node
// craft-scan.mjs — تحلیل ایستای یک فیلم html برای تشخیص الگوهای «چرت».
//
//   node work/persian/tools/gates/craft-scan.mjs <film.html> [film2.html ...]
//
// گزارش می‌دهد (بدون رندر):
//   - تعداد و تنوع job های حرکتی (PF.motion.*)
//   - تعداد کین‌فریم‌ها (دوربین/مقادیر)
//   - پنجره‌های زمانی PF.win و طولانی‌ترین سکون بین آن‌ها
//   - وجود easing خطی و مدت‌های آن
//   - presence PF.typeQueue / PF.drawLine / PF.beam / PF.grain
//   - تعداد PF.keyframes دوربین
//   - نسبت خطوط فریم به PF.win
// هیچ فایلی تغییر نمی‌کند؛ فقط می‌خواند.
import { readFileSync } from "node:fs";

const num = (s) => parseFloat(s);

function scan(file) {
  const src = readFileSync(file, "utf8");
  const jobs = [...src.matchAll(/PF\.motion\.([a-zA-Z]+)/g)].map((m) => m[1]);
  const counts = {};
  for (const j of jobs) counts[j] = (counts[j] || 0) + 1;
  const distinct = Object.keys(counts).sort();

  const kf = [...src.matchAll(/PF\.keyframes\s*\(/g)].length;
  const wins = [...src.matchAll(/PF\.win\s*\(([^)]*)\)/g)].map((m) => m[1]);

  // پنجره‌های زمانی: win(t, a, b) → a,b اعداد ساده باشند
  const windows = [];
  for (const w of wins) {
    const parts = w.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const a = num(parts[1]);
      const b = num(parts[2]);
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) windows.push([a, b]);
    }
  }
  windows.sort((x, y) => x[0] - y[0]);

  // طولانی‌ترین فاصلهٔ بدون پنجرهٔ حرکتی
  let gap = 0, gapAt = 0, cursor = 0;
  for (const [a, b] of windows) {
    if (a - cursor > gap) { gap = a - cursor; gapAt = cursor; }
    cursor = Math.max(cursor, b);
  }
  const tailGap = Math.max(0, 20 - cursor);
  if (tailGap > gap) { gap = tailGap; gapAt = cursor; }

  const linear = (src.match(/['"]linear['"]/g) || []).length;
  const springCfg = [...src.matchAll(/PF\.motion\.spring\s*\(([^)]*)\)/g)].map((m) => m[1].trim());

  const has = (k) => src.includes(k);
  const lines = src.split("\n").length;

  return {
    file,
    lines,
    jobsTotal: jobs.length,
    jobsDistinct: distinct.length,
    jobs: counts,
    keyframeCalls: kf,
    winCalls: wins.length,
    windowsFound: windows.length,
    longestSilentGap: +gap.toFixed(2),
    longestSilentGapAt: +gapAt.toFixed(2),
    linearUses: linear,
    springCalls: springCfg.length,
    hasTypeQueue: has("PF.typeQueue"),
    hasDrawLine: has("PF.drawLine"),
    hasBeam: has("PF.beam"),
    hasGrain: has("PF.grain"),
    hasVignette: has("PF.vignette"),
    hasKeyframes: has("PF.keyframes"),
    hasCameraFn: /placeCamera|camera\s*\(/.test(src),
    randomUses: (src.match(/Math\.random\(/g) || []).length,
    dateUses: (src.match(/Date\.now\(|new Date\(/g) || []).length,
    cssTransition: /transition\s*:/.test(src),
  };
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node craft-scan.mjs <film.html> [...]");
  process.exit(2);
}
const out = files.map(scan);
console.log(JSON.stringify(out, null, 2));

// سیگنال‌های هشدار
for (const s of out) {
  const warn = [];
  if (s.jobsDistinct < 3) warn.push(`تنوع job کم (${s.jobsDistinct}): ${Object.keys(s.jobs).join(",") || "هیچ"}`);
  if (s.longestSilentGap > 2) warn.push(`سکون ${s.longestSilentGap}s از t=${s.longestSilentGapAt}`);
  if (s.linearUses > 0) warn.push(`easing خطی ×${s.linearUses}`);
  if (!s.hasCameraFn) warn.push("دوربین/placeCamera پیدا نشد");
  if (!s.hasTypeQueue) warn.push("PF.typeQueue ندارد");
  if (s.randomUses || s.dateUses) warn.push(`غیرقطعی: random=${s.randomUses} date=${s.dateUses}`);
  if (warn.length) console.error(`\n[${s.file}]\n  - ` + warn.join("\n  - "));
}
