// fa-film/manifest-fa-film.tsx — the «میزکار» film as ONE WorkbenchManifest. v2 (fix round).
//
// ARC (stated honestly, measured on the v1 render and now by design):
//   navy #0D1D2C → navy (library panel) → navy → cream #F4F4F3 → cream → navy → navy → navy.
//   v1's header claimed "dark → cream → dark" while frame 105 was a full-bleed WHITE card; that was
//   false. Beat 2's library card is now an INSET rounded panel on the navy plate (FaPanelStage), so the
//   white is a page panel inside the film's world and the arc statement holds: one cream excursion in
//   beats 4-5, navy everywhere else.
// ONE ACCENT: #CE924A (library gold, desaturated). Every shot and transition declares it; the v1
//   per-shot accents (#4c9aff on beats 2/6, #f7c948 on beat 8, #c2622a on beats 4/5) are deleted.
// HERO-CONTRAST FRAME (BTY-COLOR-008, named once): frame 626 (20.87 s) — the outro, where the lamp, the
//   Lalezar wordmark and the amber pill all read at once.
// TYPE SCALE (BTY-COMP-002, floor 0.22 of frame height in 16:9): headline 238 (ink ≈257 px = 0.238),
//   stat value 330 (ink ≈241 px = 0.223), outro wordmark 320. The library POSTER median is 0.0917.
// MOTION (verdict fix 3): expo-out reveals, damped-spring landings, anticipation dips, an outBack
//   overshoot on the outro, per-level stagger, ambient drift through every hold — no single-bezier film.
// RATIO: 16:9 ONLY. The vertical composition is deliberately withheld; the v1 vertical was a mechanical
//   0.5625 scale (a 1080×608 letterbox with 65% bare navy) and shipping it would be a fake re-cut.
import type React from "react";
import type { WorkbenchManifest } from "../cards/manifest";
import { ACCENT, FaLightPlay, FaOutro, FaPanelStage, FaStat, FaTitle, FaValueMarquee } from "./fa-cards";
import { UnitDotSwarmRegroupV2 } from "@demos/data/chart-live-moves/UnitDotSwarmRegroupV2";
import { flashCutCard } from "../cards/inkpress/flash-cut";

const asCard = (c: unknown) => c as React.ComponentType<Record<string, unknown>>;
const FlashCut = flashCutCard.component;

/** Beat 2: the library data card, presented as an inset panel on the navy plate. `desaturate` neutralises
 *  the card's native #b45309 orange at our wrapper — editing demosrc/UnitDotSwarmRegroupV2.tsx is not
 *  allowed, and a second saturated accent cannot enter a one-accent film (verdict fix 4). */
const SwarmPanel: React.FC = () => (
  <FaPanelStage technique="خوشهٔ نقطه‌ها" face="Vazirmatn" desaturate={0.28}>
    <UnitDotSwarmRegroupV2 />
  </FaPanelStage>
);

export const FA_FILM: WorkbenchManifest = {
  name: "میزکار — کتابخانهٔ حرکت فارسی",
  fps: 30,
  width: 1920,
  height: 1080,
  total: 820,
  background: "#0D1D2C",
  revision: "mizkar-2",
  shots: [
    // ── 1 · navy open ────────────────────────────────────────────────────────────────
    {
      id: "b1-open",
      label: "۱ · گشایش",
      from: 0,
      duration: 90,
      component: asCard(FaTitle),
      cardId: "fa-title",
      cardName: "کارت تیتر فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        eyebrow: "نسخهٔ ۲٫۰ · کتابخانهٔ حرکت فارسی",
        headline: "از ایده تا فیلم",
        deck: "۲۳۰ کارت حرکت فارسی، آمادهٔ ترکیب در یک میزکار",
        ghost: "میزکار",
        technique: "تیتر",
        face: "Vazirmatn",
        tone: "dark",
        fontSize: 238,
      },
    },
    // ── 2 · library data card, as a panel ───────────────────────────────────────────
    {
      id: "b2-swarm",
      label: "۲ · خوشهٔ نقطه‌ها",
      from: 90,
      duration: 110,
      component: asCard(SwarmPanel),
      cardId: "demo:UnitDotSwarmRegroupV2",
      cardName: "Unit Dot Swarm Regroup V2",
      accent: ACCENT,
      props: {},
    },
    // ── 3 · navy stat ───────────────────────────────────────────────────────────────
    {
      id: "b3-stat",
      label: "۳ · عدد",
      from: 200,
      duration: 90,
      component: asCard(FaStat),
      cardId: "fa-stat",
      cardName: "کارت عدد فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        eyebrow: "همه‌چیز آماده است",
        value: "۲۳۰",
        label: "کارت حرکت فارسی، از تیتر تا گذار",
        ghost: "۲۳۰",
        technique: "عدد",
        face: "Vazirmatn",
        tone: "dark",
        fontSize: 330,
      },
    },
    // ── 4 · cream headline (the film's one paper excursion) ──────────────────────────
    {
      id: "b4-cream",
      label: "۴ · کاغذ",
      from: 290,
      duration: 100,
      component: asCard(FaTitle),
      cardId: "fa-title",
      cardName: "کارت تیتر فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        eyebrow: "ساختار، نه شلوغی",
        headline: "هر جمله، خوانا",
        deck: "تایپوگرافی فارسی با فاصلهٔ درست و جهت راست‌به‌چپ",
        ghost: "کاغذ",
        technique: "کاغذ",
        face: "Vazirmatn",
        tone: "cream",
        fontSize: 238,
      },
    },
    // ── 5 · cream stat ──────────────────────────────────────────────────────────────
    {
      id: "b5-speed",
      label: "۵ · سرعت",
      from: 390,
      duration: 90,
      component: asCard(FaStat),
      cardId: "fa-stat",
      cardName: "کارت عدد فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        eyebrow: "سرعت واقعی",
        value: "۹۰ ثانیه",
        label: "از ایدهٔ اول تا پیش‌نمایش روی میز",
        ghost: "۹۰",
        technique: "سرعت",
        face: "Vazirmatn",
        tone: "cream",
        fontSize: 330,
      },
    },
    // ── 6 · light play (replaces demo:OrbFlylineRelay) ───────────────────────────────
    {
      id: "b6-light",
      label: "۶ · نور و مسیر",
      from: 480,
      duration: 100,
      component: asCard(FaLightPlay),
      cardId: "fa-light-play",
      cardName: "کارت نور فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        eyebrow: "نور از یک منبع می‌آید",
        headline: "چراغ روی متن",
        deck: "لبهٔ روشن، سایهٔ واقعی، مسیرِ خواندن",
        technique: "نور",
        face: "Vazirmatn",
        tone: "dark",
        fontSize: 200,
      },
    },
    // ── 7 · navy close (hero-contrast frame 606) ─────────────────────────────────────
    {
      id: "b7-outro",
      label: "۷ · امضا",
      from: 580,
      duration: 110,
      component: asCard(FaOutro),
      cardId: "fa-outro",
      cardName: "کارت پایانی فارسی (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: {
        name: "میزکار",
        tagline: "کتابخانهٔ حرکت فارسی",
        cta: "امروز شروع کن",
        technique: "امضا",
        face: "Lalezar",
        tone: "dark",
        fontSize: 320,
      },
    },
    // ── 8 · marquee close, one hue in three value steps ──────────────────────────────
    {
      id: "b8-slogan",
      label: "۸ · شعار",
      from: 690,
      duration: 130,
      component: asCard(FaValueMarquee),
      cardId: "fa-value-marquee",
      cardName: "شعار سطربه‌سطر (میزکار)",
      accent: ACCENT,
      durationProp: "duration",
      props: { technique: "شعار", face: "Lalezar" },
    },
  ],
  transitions: [
    {
      id: "t1",
      label: "فلاش · ورود کاغذ",
      from: 285,
      duration: 10,
      component: asCard(FlashCut),
      cardId: "inkpress-flash-cut",
      accent: ACCENT,
      durationProp: "duration",
      props: { peak: 0.42, color: "#E8CFA8" },
    },
    {
      id: "t2",
      label: "فلاش · رفتن به پایانی",
      from: 575,
      duration: 10,
      component: asCard(FlashCut),
      cardId: "inkpress-flash-cut",
      accent: ACCENT,
      durationProp: "duration",
      props: { peak: 0.5, color: "#F0DCC0" },
    },
    {
      id: "t3",
      label: "فلاش · شعار",
      from: 685,
      duration: 10,
      component: asCard(FlashCut),
      cardId: "inkpress-flash-cut",
      accent: ACCENT,
      durationProp: "duration",
      props: { peak: 0.38, color: "#E8CFA8" },
    },
  ],
};
