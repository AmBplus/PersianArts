// لایهٔ دادهٔ کتابخانه — تایپوگرافی + کاتالوگ + رندرهای فارسی، یکپارچه در یک منو
import { faBlurb } from "../../../library/typography/shots.js";

const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${u} → ${r.status}`))));

export const SOURCE_FA = {
  typography: "تایپوگرافی",
  shotcraft: "video-shotcraft",
  mg: "موشن‌گرافیک",
  talkcraft: "تاک‌کرفت",
  explainer: "اکسپلینر",
  onetake: "وان‌تیک",
  native: "بومی",
};

const faDigits = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
export const faNum = faDigits;

// برچسب‌های دسته در video-shotcraft (tags) → نام فارسی دسته؛ یک کارت می‌تواند چند دسته داشته باشد
// (همان منطق library.html: دستهٔ اصلی + برچسب‌های frontmatter) تا شمارش‌ها با صفحهٔ مرجع برابر بماند.
const TAG_FA = {
  "ui-entrance": "ورود عناصر",
  typography: "تایپوگرافی",
  effects: "افکت",
  transition: "ترنزیشن",
  camera: "دوربین",
  opening: "شروع و برند",
  interaction: "تعامل",
  data: "داده و نمودار",
  rhythm: "ریتم",
  outro: "پایان",
};

function countBy(items, key) {
  const m = new Map();
  for (const it of items) {
    const ks = key === "category" ? it.cats : [it[key] || "سایر"];
    for (const k of ks) m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function loadLibrary() {
  const [typo, catalog, renders, entryMedia, refMedia] = await Promise.all([
    j("./data/typography-models.json"),
    j("./data/catalog.json"),
    j("./data/persian-renders.json").catch(() => null),
    j("./data/entry-media.json").catch(() => null),
    // رندرهای مرجعِ کد اصلی (فقط محلی، هرگز منتشر نمی‌شود) — برای مقایسه با نسخهٔ فارسی
    j("./data/entry-media.reference.json").catch(() => null),
  ]);

  // پوستر/ویدیوی رندرشده برای entryهای کاتالوگ (اگر وجود داشته باشد)
  const mediaOf = {};
  const R = (renders && renders.renders) || {};
  for (const [id, r] of Object.entries(R)) {
    const v = (r.variants || []).find((x) => x && (x.poster || x.thumbnail || x.video));
    if (v) mediaOf[id] = {
      poster: v.poster,
      thumbnail: v.thumbnail,
      video: v.video,
      audio: v.video ? String(v.video).replace(/preview\.mp4$/, "music.m4a") : null,
    };
  }
  // رندرهای محلیِ جدید (entry-media.json): ویدیو + پوستر + صدا برای همهٔ آیتم‌هایی که رندر شده‌اند
  for (const [id, m] of Object.entries((entryMedia && entryMedia.items) || {})) {
    mediaOf[id] = { ...mediaOf[id], ...m };
  }
  // مرجع: کنار نسخهٔ فارسی برای مقایسه؛ اگر هنوز فارسی نشده، تنها رسانهٔ قابل نمایش (با نشان «رندر مرجع»)
  for (const [id, r] of Object.entries((refMedia && refMedia.items) || {})) {
    const refs = r.variants || [];
    if (!refs.length) continue;
    if (mediaOf[id]?.video) mediaOf[id] = { ...mediaOf[id], reference: refs };
    else mediaOf[id] = { ...mediaOf[id], renderKind: "upstream-baseline", video: refs[0].video, poster: refs[0].poster, thumbnail: refs[0].thumbnail, variants: refs };
  }

  const typoItems = typo.models.map((m) => ({
    kind: "typo",
    id: `typo/${m.key}`,
    title: m.titleFa,
    desc: m.descFa,
    category: "تایپوگرافی موشن",
    cats: ["تایپوگرافی موشن"],
    source: "typography",
    tags: m.tags || [],
    font: m.defaultFont,
    text: m.defaultText,
    accent: m.accent,
    pen: m.pen,
    media: m.media ? { ...m.media, audio: m.media.video ? m.media.video.replace(/preview\.mp4$/, "music.m4a") : null } : null,
    frames: m.durationFrames || 150,
    fps: m.fps || 30,
    sub: m.sub || null,
    target: m.target || null,
    finale: m.finale || null,
    model: m,
  }));

  const entryItems = catalog.entries
    .filter((e) => !(e.source === "native" && e.kind !== "audio")) // فونت‌ها/نمونه‌ها از گالری خارج‌اند
    .map((e) => {
      const fa = faBlurb(e);
      return {
        kind: "entry",
        id: e.id,
        title: e.titleFa && e.titleFa !== e.name ? e.titleFa : fa.title,
        desc: fa.blurb,
        category: e.category || "سایر",
        cats: [...new Set([e.category || "سایر", ...(e.source === "shotcraft" && e.kind === "shot" ? (e.tags || []).map((t) => TAG_FA[t]).filter(Boolean) : [])])],
        source: e.source,
        tags: e.tags || [],
        duration: e.duration,
        energy: e.energy,
        license: e.license,
        sourceUrl: e.sourceUrl,
        status: e.status,
        media: mediaOf[e.id] || null,
      };
    });

  const items = [...typoItems, ...entryItems];
  return {
    items,
    categories: countBy(items, "category"),
    sources: countBy(items, "source"),
    stats: {
      typo: typoItems.length,
      entries: entryItems.length,
      total: items.length,
    },
  };
}
