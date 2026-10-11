import type { Ctx, Env } from "./core";
import { drawPersianText } from "./persianText";
import { PALETTES, paintPaper, type PaperStyle } from "./persianSceneKit";
import type { Film, FilmAudio } from "./film";
import { shotcraftAudio } from "./shotcraftAudio";

export type PersianVariantFamily = "trace" | "kinetic" | "chart" | "camera" | "collage";
export type PersianVariantSpec = {
  modelId: string;
  variantKey: string;
  variantIndex?: number;
  family: PersianVariantFamily;
  titleFa: string;
  bodyFa: string;
  promptFa?: string;
  font?: string;
  paper?: PaperStyle;
  seed?: number;
  durationFrames?: number;
  fps?: number;
  accent?: string;
  values?: number[];
};

const W = 1920, H = 1080;
const fonts = ["Vazirmatn", "Estedad", "Shabnam", "Sahel", "Gandom", "Lalezar"];
const fontFiles: Record<string, string> = { Vazirmatn: "Vazirmatn-Variable.ttf", Estedad: "Estedad-Variable.ttf", Shabnam: "Shabnam-Regular.ttf", Sahel: "Sahel-Variable.ttf", Gandom: "Gandom-Regular.ttf", Lalezar: "Lalezar-Regular.ttf" };
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const hash = (text: string) => { let h = 2166136261; for (const ch of text) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); } return h >>> 0; };
const line = (ctx: Ctx, points: [number, number][], color: string, width: number, progress = 1) => {
  const n = Math.max(2, Math.floor((points.length - 1) * clamp(progress)) + 1);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); points.slice(0, n).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
};
const text = (ctx: Ctx, value: string, x: number, y: number, size: number, family: string, color: string, progress = 1, weight = 700) =>
  drawPersianText(ctx, { text: value, x, y, size, family, color, progress, weight, mode: "ink", digits: "persian" });

const paintFrame = (ctx: Ctx, env: Env, spec: PersianVariantSpec, frame: number) => {
  const paper = spec.paper ?? "warm-paper", palette = PALETTES[paper], accent = spec.accent ?? palette.accent;
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  paintPaper(ctx, W, H, paper, frame);
  ctx.fillStyle = "#ffffff26"; ctx.fillRect(76, 70, W - 152, H - 140);
  ctx.strokeStyle = `${accent}55`; ctx.lineWidth = 2; ctx.strokeRect(76, 70, W - 152, H - 140);
  ctx.restore();
};

const drawTrace = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string, palette: typeof PALETTES[PaperStyle]) => {
  const progress = ease(clamp(t / 0.66));
  const points: [number, number][] = Array.from({ length: 46 }, (_, i) => {
    const u = i / 45, x = 260 + u * 1390, y = 555 + Math.sin(u * Math.PI * 2.2) * 120 + Math.sin(u * 13 + (spec.seed ?? 0)) * 12;
    return [x, y];
  });
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  line(ctx, points, palette.ink, 22, progress);
  line(ctx, points.map(([x, y]) => [x, y - 30] as [number, number]), palette.accent, 5, progress);
  const p = points[Math.min(points.length - 1, Math.floor(progress * (points.length - 1)))];
  ctx.fillStyle = palette.pen; ctx.beginPath(); ctx.arc(p[0], p[1], 16, 0, Math.PI * 2); ctx.fill();
  text(ctx, spec.titleFa, W - 250, 235, 74, family, palette.ink, clamp((t - 0.08) / 0.34));
  text(ctx, spec.bodyFa, W - 250, 330, 32, family, palette.accent, clamp((t - 0.18) / 0.38), 500);
  ctx.restore();
};

const drawKinetic = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string, palette: typeof PALETTES[PaperStyle]) => {
  const p = ease(clamp(t / 0.7));
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  for (let i = 0; i < 5; i++) {
    const q = clamp((p - i * 0.12) / 0.72), x = 250 + i * 300, y = 470 + Math.sin((t + i * 0.07) * Math.PI * 2) * 20;
    ctx.save(); ctx.globalAlpha = q; ctx.translate(x + (1 - q) * 130, y); ctx.rotate((1 - q) * (i % 2 ? -0.18 : 0.18));
    ctx.fillStyle = i % 2 ? `${palette.accent}dd` : `${palette.ink}e8`; ctx.fillRect(-105, -105, 210, 210);
    ctx.fillStyle = palette.paper; ctx.fillRect(-70, -16, 140, 32); ctx.restore();
  }
  text(ctx, spec.titleFa, W - 250, 235, 76, family, palette.ink, clamp((t - 0.22) / 0.35));
  text(ctx, spec.bodyFa, W - 250, 330, 32, family, palette.accent, clamp((t - 0.32) / 0.3), 500);
  ctx.restore();
};

const drawChart = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string, palette: typeof PALETTES[PaperStyle]) => {
  const values = spec.values?.length ? spec.values : [0.34, 0.58, 0.47, 0.82, 0.68];
  const p = ease(clamp(t / 0.62));
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const base = 780, left = 310, gap = 230;
  ctx.strokeStyle = `${palette.ink}55`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(left - 35, base); ctx.lineTo(left + gap * values.length - 50, base); ctx.stroke();
  values.forEach((value, i) => { const q = ease(clamp((p - i * 0.08) / 0.75)), h = 390 * value * q; ctx.fillStyle = i % 2 ? palette.accent : palette.ink; ctx.fillRect(left + i * gap, base - h, 130, h); });
  text(ctx, spec.titleFa, W - 250, 235, 76, family, palette.ink, clamp((t - 0.12) / 0.35));
  text(ctx, spec.bodyFa, W - 250, 330, 32, family, palette.accent, clamp((t - 0.22) / 0.35), 500);
  ctx.restore();
};

const drawCamera = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string, palette: typeof PALETTES[PaperStyle]) => {
  const p = ease(clamp(t / 0.82)), zoom = 0.7 + p * 0.42;
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom);
  for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? palette.accent : palette.ink; ctx.globalAlpha = 0.8 - i * 0.12; ctx.lineWidth = 8 - i; ctx.beginPath(); ctx.arc(0, 30, 120 + i * 100 + Math.sin(t * 8 + i) * 14, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.fillStyle = palette.paper; ctx.fillRect(-350, -84, 700, 168); text(ctx, spec.titleFa, 300, 25, 70, family, palette.ink, clamp((t - 0.2) / 0.35));
  ctx.restore();
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); text(ctx, spec.bodyFa, W - 250, 900, 32, family, palette.accent, clamp((t - 0.32) / 0.35), 500); ctx.restore();
};

const drawCollage = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string, palette: typeof PALETTES[PaperStyle]) => {
  const p = ease(clamp(t / 0.72));
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const cards = [[320, 420, 330, 250], [730, 330, 420, 300], [1230, 470, 320, 220]];
  cards.forEach(([x, y, w, h], i) => { const q = ease(clamp((p - i * 0.16) / 0.72)); ctx.save(); ctx.globalAlpha = q; ctx.translate(x + (1 - q) * (i % 2 ? -150 : 150), y); ctx.rotate((1 - q) * (i - 1) * 0.16); ctx.fillStyle = i % 2 ? `${palette.accent}dd` : `${palette.ink}dd`; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = palette.paper; ctx.fillRect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48); ctx.restore(); });
  text(ctx, spec.titleFa, W - 250, 235, 76, family, palette.ink, clamp((t - 0.2) / 0.35));
  text(ctx, spec.bodyFa, W - 250, 330, 32, family, palette.accent, clamp((t - 0.3) / 0.35), 500);
  ctx.restore();
};

const rounded = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + w - k, y); ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k); ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - k); ctx.lineTo(x, y + k); ctx.quadraticCurveTo(x, y, x + k, y); ctx.closePath();
};
const mixHex = (a: string, b: string, p: number) => {
  const q = clamp(p), parse = (s: string) => [0, 2, 4].map(i => parseInt(s.slice(i + 1, i + 3), 16));
  const x = parse(a), y = parse(b); return `#${x.map((v, i) => Math.round(v + (y[i] - v) * q).toString(16).padStart(2, "0")).join("")}`;
};

// These three scenes mirror the source Shotcraft timing contracts. They intentionally
// bypass the paper families above: the source is a UI/effects study, not a paper plate.
const drawAiStreamResponse = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string) => {
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#111d2d"; rounded(ctx, 92, 76, 1736, 928, 28); ctx.fill();
  ctx.fillStyle = "#1d3046"; ctx.fillRect(92, 76, 1736, 4);
  text(ctx, "پاسخ زنده", 1680, 166, 38, family, "#96aeca", 1, 600);
  const summary = ease(clamp((t - 0.04) / 0.18));
  ctx.globalAlpha = summary; ctx.fillStyle = "#172d43"; rounded(ctx, 156, 208, 1608, 150, 18); ctx.fill();
  ctx.fillStyle = "#31d3b0"; rounded(ctx, 156, 208, 8, 150, 4); ctx.fill();
  text(ctx, spec.titleFa, 1660, 272, 54, family, "#ecf6ff", summary, 700);
  text(ctx, spec.bodyFa, 1660, 322, 28, family, "#8ca6bd", summary, 500); ctx.globalAlpha = 1;
  const rows = ["خلاصه آماده شد", "منبع نخست بررسی شد", "داده‌های کلیدی پیدا شد", "ارتباط شواهد کامل شد", "پاسخ دوباره خوانی شد", "وضعیت نهایی تأیید شد", "پاسخ برای نمایش آماده است"];
  rows.forEach((label, i) => {
    const start = 0.22 + i * 0.075, q = ease(clamp((t - start) / 0.16)), y = 404 + i * 72 + (1 - q) * 52;
    if (q <= 0) return;
    ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = i === rows.length - 1 ? "#153c48" : "#162638"; rounded(ctx, 156, y, 1608, 52, 12); ctx.fill();
    ctx.strokeStyle = i === rows.length - 1 ? "#31d3b0" : "#263a50"; ctx.lineWidth = 2; ctx.stroke();
    const state = ease(clamp((t - start - 0.10) / 0.13)); ctx.fillStyle = state > 0.75 ? "#31d3b0" : "#49627a"; ctx.beginPath(); ctx.arc(210, y + 26, 12, 0, Math.PI * 2); ctx.fill();
    if (state > 0.75) { ctx.strokeStyle = "#07151e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(204, y + 26); ctx.lineTo(209, y + 31); ctx.lineTo(218, y + 20); ctx.stroke(); }
    text(ctx, label, 1690, y + 34, 28, family, "#d7e5ef", q, 600); ctx.restore();
  });
  const done = ease(clamp((t - 0.78) / 0.12)); ctx.globalAlpha = done * 0.35; ctx.strokeStyle = "#31d3b0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1648, 904, 28 + done * 36, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  text(ctx, "تکمیل شد", 1690, 920, 25, family, "#65e0c3", done, 600); ctx.restore();
};

const drawAssembleThenTypeFlyin = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string) => {
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = "#10131b"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#252b37"; ctx.lineWidth = 2; for (let x = 80; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 60; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const parts = [[220, 158, 520, 18, -1, -1], [220, 212, 360, 24, -1, 1], [1540, 158, 180, 18, 1, -1], [1540, 212, 420, 24, 1, 1], [330, 820, 520, 14, -1, 1], [1440, 820, 340, 14, 1, 1]];
  parts.forEach(([x, y, w, h, dx, dy], i) => { const q = ease(clamp((t - 0.03 - i * 0.035) / 0.22)); if (q <= 0) return; ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * dx * 420, (1 - q) * dy * 220); ctx.fillStyle = i % 2 ? "#59647a" : "#9a6cff"; rounded(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.restore(); });
  const frameQ = ease(clamp((t - 0.18) / 0.25)); ctx.globalAlpha = frameQ * 0.9; ctx.strokeStyle = "#6f7d96"; ctx.lineWidth = 3; rounded(ctx, 300, 270, 1320, 540, 28); ctx.stroke(); ctx.globalAlpha = 1;
  const blocks = [
    { s: 0.34, x: 1480, y: 390, size: 76, label: spec.titleFa, color: "#f1f4ff" },
    { s: 0.43, x: 1480, y: 482, size: 32, label: "المكوّنات تتجمع", color: "#aab8d0" },
    { s: 0.52, x: 1480, y: 590, size: 40, label: "الواجهة جاهزة", color: "#9a6cff" },
    { s: 0.64, x: 1480, y: 688, size: 28, label: spec.bodyFa, color: "#d7ddec" },
    { s: 0.76, x: 1480, y: 756, size: 23, label: "حرکتِ متن کامل شد", color: "#8490a7" },
  ];
  blocks.forEach((b, i) => { const q = ease(clamp((t - b.s) / 0.18)); if (q <= 0) return; ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * (i % 2 ? -170 : 170), (1 - q) * (i - 2) * 28); ctx.rotate((1 - q) * (i % 2 ? -0.05 : 0.05)); text(ctx, b.label, b.x, b.y, b.size, family, b.color, q, i === 0 ? 750 : 550); ctx.restore(); });
  ctx.restore();
};

const drawAuroraBloomBgFlip = (ctx: Ctx, env: Env, spec: PersianVariantSpec, t: number, family: string) => {
  ctx.save(); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  const flip = ease(clamp((t - 0.63) / 0.07)); ctx.fillStyle = mixHex("#e8e9ee", "#111322", flip); ctx.fillRect(0, 0, W, H);
  const blob = (cx: number, cy: number, r: number, color: string, alpha: number) => { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`); g.addColorStop(0.52, `${color}${Math.round(alpha * 0.38 * 255).toString(16).padStart(2, "0")}`); g.addColorStop(1, `${color}00`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const rise = ease(clamp(t / 0.62)); blob(520, 1010 - rise * 390, 290, "#985fff", 0.82 * (1 - flip * 0.35)); blob(970, 1080 - rise * 470, 360, "#ff8a4d", 0.78 * (1 - flip * 0.3)); blob(1440, 1030 - rise * 330, 300, "#f9f7ff", 0.74 * (1 - flip * 0.5));
  ctx.globalAlpha = 1; const a = 1 - ease(clamp((t - 0.56) / 0.12)), b = ease(clamp((t - 0.70) / 0.14)); text(ctx, spec.titleFa, 1600, 470, 82, family, mixHex("#3c304b", "#f5f5ff", flip), a, 750); text(ctx, spec.bodyFa, 1600, 544, 32, family, mixHex("#716276", "#b6bfd9", flip), a, 500); text(ctx, "پس‌زمینه عوض شد", 1600, 470, 82, family, "#f5f5ff", b, 750); text(ctx, "نور به پس‌درخشش رسید", 1600, 544, 32, family, "#b6bfd9", b, 500);
  ctx.globalAlpha = 0.65 * flip; ctx.strokeStyle = "#9a6cff"; ctx.lineWidth = 3; rounded(ctx, 180, 880, 1560, 3, 2); ctx.stroke(); ctx.restore();
};

export const makePersianVariantFilm = (input: PersianVariantSpec): Film => {
  const spec = { ...input, fps: input.fps ?? 30, durationFrames: input.durationFrames ?? 180, seed: input.seed ?? hash(`${input.modelId}/${input.variantKey}`) };
  const family = spec.font ?? fonts[spec.seed % fonts.length], paper = spec.paper ?? "warm-paper", palette = PALETTES[paper];
  const scene = (ctx: Ctx, local: number, env: Env) => {
    const t = clamp(local / Math.max(1, spec.durationFrames! - 1));
    if (spec.modelId === "shotcraft/ai-stream-response") { drawAiStreamResponse(ctx, env, spec, t, family); return; }
    if (spec.modelId === "shotcraft/assemble-then-type-flyin") { drawAssembleThenTypeFlyin(ctx, env, spec, t, family); return; }
    if (spec.modelId === "shotcraft/aurora-bloom-bg-flip") { drawAuroraBloomBgFlip(ctx, env, spec, t, family); return; }
    paintFrame(ctx, env, spec, local);
    if (spec.family === "trace") drawTrace(ctx, env, spec, t, family, palette);
    else if (spec.family === "kinetic") drawKinetic(ctx, env, spec, t, family, palette);
    else if (spec.family === "chart") drawChart(ctx, env, spec, t, family, palette);
    else if (spec.family === "camera") drawCamera(ctx, env, spec, t, family, palette);
    else drawCollage(ctx, env, spec, t, family, palette);
  };
  const audio: FilmAudio = shotcraftAudio(spec.modelId, spec.durationFrames!, spec.fps!);
  return {
    meta: { title: `PersianDoodle · ${spec.modelId}/${spec.variantKey}`, W, H, fps: spec.fps!, bpm: 120, durationFrames: spec.durationFrames!, kind: "story", holds: [[spec.durationFrames! - 24, spec.durationFrames!, "read"]], poster: Math.min(spec.durationFrames! - 1, Math.round(spec.durationFrames! * 0.68)) },
    assets: { images: {}, fonts: Object.fromEntries(fonts.map((name) => [name, `assets/fonts/${fontFiles[name]}`])) },
    shots: [{ id: `${spec.family}-${spec.variantKey}`, start: 0, end: spec.durationFrames!, draw: scene }],
    audio,
  };
};
