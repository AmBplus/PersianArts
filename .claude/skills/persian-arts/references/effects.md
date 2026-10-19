# references/effects.md — the effect kit (چه افکتی، چطور، چقدر هزینه)

قانون: افکت یک **ابزار** است، نه یک فیلم. هر افکت باید یک کار بکند (جذب توجه، ساخت عمق، پنهان‌کردن یک ضعف). بیش از
دو افکت فعال در یک لحظه = شلوغی.

## سه لایهٔ افکت که داریم

| لایه | فایل | چه می‌دهد | هزینه |
|---|---|---|---|
| canvas 2D | `work/persian/htmlfilm/lib/pa-effects.js` → `PF.fx` | chroma، leak، halftone، dust، scan، vhs، grade، glow | ارزان (الگوها یک‌بار پخته می‌شوند) |
| WebGL2 | `work/persian/htmlfilm/lib/pa-fx.js` + `lib/shaders/` | ~۴۰ ترنزیشن GLSL (fade، wipe-left، circleopen، morph، ripple، noise-dissolve، page-curl-lite…) + ۶ افکت (rgb-glitch، noise-displace، pixel-dissolve، crumple-fold، ripple-wave، swirl-vortex) | متوسط (یک context جدا) |
| سه‌بعدی | `work/persian/htmlfilm/lib/pa-world.js` | صحنهٔ three.js: نور، سایه، مه، bloom، bokeh، grade سینمایی | سنگین (برای پس‌زمینه) |

## توابع canvas (PF.fx)

```js
const fx = PF.fx;                       // یا window.PFX
fx.grade(ctx, W, H, {warm: 0.10, cool: 0.06, contrast: 0.08});   // فیلم‌لوک
fx.leak(ctx, W, H, t, {color: "#ff9a5a", alpha: 0.26, speed: 0.05});
fx.chroma(ctx, W, H, t, {px: 6, alpha: 0.30});                   // پاشش رنگ لنز
fx.halftone(ctx, W, H, t, {cell: 16, angle: 0.45, alpha: 0.30}); // صفحهٔ نقطه‌ای / چاپ
fx.dust(ctx, W, H, t, {count: 160, alpha: 0.35});                // غبار فیلم قدیمی
fx.scan(ctx, W, H, {spacing: 6, alpha: 0.16});                   // اسکن‌لاین CRT
fx.vhs(ctx, W, H, t, {amount: 0.6});                             // آنالوگ (chroma+scan+نوار)
fx.glow(ctx, W, H, t, {amount: 0.22, blur: 18});                  // هاله/بووم
```

ترتیب درست: `grade → leak → صحنه → chroma/glow → grain → vignette → تایپ`. گرین و ویگنت **بعد** از تایپ
هیچ‌وقت نه؛ گرین روی متن، خوانایی را می‌خورد.

## افکت‌های آماده (ترکیب‌های شناخته‌شده)

| اسم لوک | ترکیب | کِی |
|---|---|---|
| film look | `grade(warm .12, contrast .08)` + `PF.grain` + `PF.vignette` | پیش‌فرض همهٔ فیلم‌های ما |
| old film | `dust` + `leak(amber, .22)` + `grade(warm .1)` + `grain(.08)` | خاطره، روایت گذشته |
| print / news | `halftone(cell 14, angle .5)` + `grade(contrast .12)` + `dust` | اینفوگرافیک، خبری |
| analogue | `vhs(amount .6)` + `chroma(px 4)` | کلیپ کوتاه، ریتم بالا |
| lens | `chroma(px 5, alpha .35)` + `glow(.25)` | لحظهٔ اوج، انرژی |
| dream | `leak(cool, .3, speed .03)` + `glow(.3, blur 30)` + `grade(cool .1)` | صحبت احساسی |

## کتابخانه‌هایی که نصب شده‌اند

| جا | کتابخانه | لایسنس | کاربرد |
|---|---|---|---|
| `work/persian/htmlfilm/vendor/` | three 0.186.1 · postprocessing 6.39.5 · pixi.js 8.22.0 | MIT · Zlib · MIT | رندر سه‌بعدی و افکت‌های WebGL |
| `work/persian/tools/assets/` | sharp · pixelmatch · svg-path-properties · web-audio-beat-detector · gl-transitions · svgo | Apache-2.0 · ISC · MIT · MIT · MIT · MIT | پردازش تصویر سمت node، مقایسهٔ فریم، شمارش ضرب |

نصب/بازیابی خودکار: `node .claude/skills/persian-arts/scripts/bootstrap.mjs`

## افکت‌هایی که باید خودمان بنویسیم (npm جواب نمی‌دهد)

`film-grain`، `light-leak`، `chromatic-aberration`، `lens-flare`، `caustics`، `halftone`، `dither`، `vhs`،
`bokeh`، `prism` روی npm یا ۴۰۴‌اند یا بی‌ربط (bokeh = صف، prism = Redux، vhs = انیمیشن CSS).
پس: GLSL خودمان (`lib/shaders/`) و canvas خودمان (`pa-effects.js`). این کار انجام شده.

قطعه‌های GLSL آماده و قابل کپی (همه MIT/BSD، بدون وابستگی):
`glsl-film-grain` (پارامتر `frame` → قطعی‌ترین گرین) · `glsl-dither` (Bayer 8×8) · `glsl-halftone` ·
`glsl-lut` · `glsl-random` · `glsl-blend-soft-light` · `glsl-luma`.

## ممنوع

- `opentype.js` برای فارسی → shaping ندارد، پیوند حروف می‌شکند (README خودش تأیید می‌کند).
- `fluent-ffmpeg` (آرشیوشده) · `ffmpeg-static` (باینری GPL-3.0) · `gsap` (لایسنس غیر-OSI) ·
  `essentia.js` (AGPL) · `p5` (LGPL) · `troika-three-text` · `wasm-vips` (۰.۰.x) · `glfx.js` (۳ سال بدون به‌روزرسانی).
- هر کتابخانه‌ای که با rAF / `Date.now()` / `Math.random()` تصویر می‌سازد → رندر غیرقطعی، شکست تساوی فریم.

## گزارش کامل تحقیق

`docs/motion/EFFECT-LIBRARIES-2026-10-20.md` (جدول‌ها با ★، لایسنس، آخرین پوش، ریسک)
`docs/motion/FFMPEG-EFFECTS-2026-10-20.md` (دستورهای ffmpeg با exit code واقعی)
