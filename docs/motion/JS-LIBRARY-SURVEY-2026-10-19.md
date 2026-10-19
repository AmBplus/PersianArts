# بررسی کتابخانه‌های JS/TS برای خط لولهٔ موشن — داده‌های دقیق

تاریخ: 2026-10-19 · روش: GitHub REST API (`/repos/…` + `/search/repositories`) + npm registry (`/latest`) + raw README.
ستاره/لایسنس/تاریخ = مقادیر API در همان تاریخ. `NOASSERTION`/`NONE` = API شیء لایسنس را برنگرداند (متن لایسنس هست ولی شناخته نشد)؛ لایسنس npm در پرانتز آمده.
منبع این سند: یک survey موازی زیر نظر مستقیم؛ اعداد از پاسخ واقعی API آمده‌اند و هیچ‌کدام ساخته نشده‌اند. چند مورد مشکوک در انتها علامت خورده.

---

## ۱. موتورهای انیمیشن قطعی / تایم‌لاین

| نام | npm | ★ | لایسنس | آخرین پوش | چه میدهد | ریسک |
|---|---|---|---|---|---|---|
| GSAP | gsap 3.15.0 | 29,482 | NONE (npm: «no charge») | 2026-04-13 | بهترین تایم‌لاین؛ `tl.seek(t)` → frame-addressable؛ DOM/SVG/canvas | غیر OSI؛ بررسی لایسنس برای استفادهٔ تجاری |
| motion (framer-motion) | motion 14.4.0 | 34,359 | MIT | 2026-10-19 | React declarative spring/timeline؛ اکشن رسمی Remotion | rAF پیشفرض → باید از `useCurrentFrame` رانده شود |
| anime.js v4 | animejs 4.5.0 | 73,708 | MIT | 2026-08-21 | تایم‌لاین v4 `seek()`؛ stagger قوی | rAF؛ قطعی فقط با seek صریح |
| theatre.js | @theatre/core 0.7.2 | 12,780 | Apache-2.0 | 2024-08-14 | ادیتور keyframe + scrub | **بی‌نگهداری (>۱۸ ماه)** |
| popmotion | popmotion 11.0.5 | 20,152 | NONE | 2024-03-12 | tween/spring/decay | **۳۱ ماه**؛ superseded by motion |
| @react-spring | @react-spring/web 10.1.2 | 29,173 | MIT | 2026-10-19 | spring فیزیکی | فیزیک روی dt انتگرال می‌گیرد → fixed-step لازم |
| remotion | remotion 4.0.537 | 65,284 | NOASSERTION (Remotion) | 2026-10-19 | رندر frame-indexed، `useCurrentFrame`، رندر workerی | لایسنس شرکتی بالای free tier |
| revideo | @revideo/core 0.11.0 | 4,122 | MIT | 2026-07-15 | fork از Motion Canvas؛ generator + `yield*` | اکوسیستم کوچک‌تر |
| motion-canvas | @motion-canvas/core 3.17.2 | 19,393 | MIT | 2026-07-02 | scene graph با `yield` صریح → قطعی | مسیر export خودش |
| manim-web | manim-web 0.39.4 | 487 | MIT | 2026-10-18 | پورت Manim به TS | جوان؛ تضمین seek ندارد |

## ۲. ویدیوی برنامه‌نویسی‌شده (declarative)

| نام | npm | ★ | لایسنس | پوش | چه میدهد | ریسک |
|---|---|---|---|---|---|---|
| remotion | 4.0.537 | 65,284 | NOASSERTION | 2026-10-19 | رندر قطعی frame + mux | — |
| revideo | 0.11.0 | 4,122 | MIT | 2026-07-15 | ویدیوی برنامه‌ای | §۱ |
| motion-canvas | 3.17.2 | 19,393 | MIT | 2026-07-02 | scene/tween | §۱ |
| editly | editly 0.14.2 | 5,532 | MIT | 2025-05-12 | spec → filtergraph ffmpeg | **۱۷ ماه**؛ تایم‌لاین داخل ffmpeg → قاب‌به‌قاب seek ندارد |
| ffmpeg.wasm | @ffmpeg/ffmpeg 0.12.15 | 17,891 | MIT | 2026-09-29 | ffmpeg در Node/Browser | کند، مصرف حافظه بالا |
| canvas-record | 6.0.0 | 432 | MIT | 2026-09-17 | Canvas→MP4/WebM با WebCodecs | **ضبط wall-clock** → غیرقطعی |
| CCapture.js | ccapture.js 2.0.0 | 3,777 | MIT | 2026-10-13 | override تایمر/rAF برای capture | دستکاری سراسری تایمر؛ بدون صدا |
| timecut | timecut 0.3.3 | 655 | BSD-3 | 2023-07-18 | Puppeteer frame-by-frame | **۳۹ ماه** |
| puppeteer | 25.14.0 | 95,724 | Apache-2.0 | 2026-10-19 | Chromium headless، screenshot، CDP | فقط Chrome |
| playwright | 1.64.1 | 98,088 | Apache-2.0 | 2026-10-19 | چند-مرورگر، `page.clock`، مقایسهٔ بصری | clock همهٔ `performance.now` داخلی را یخ نمی‌زند |

## ۳. ریاضیات spring / easing

| نام | npm | ★ | لایسنس | پوش | ریسک |
|---|---|---|---|---|---|
| rebound | rebound 0.1.0 | 5,378 | NOASSERTION | 2019-03-27 | **بایگانی‌شده، ۷ سال** |
| popmotion | 11.0.5 | 20,152 | NONE | 2024-03-12 | بی‌نگهداری |
| spring-easing | spring-easing 2.3.3 | 79 | MIT | 2023-08-25 | **۳۷ ماه**؛ جامعهٔ کوچک |
| bezier-easing | bezier-easing 3.2.0 | 1,778 | MIT | 2026-10-18 | **بهترین انتخاب**: خالص، بدون state |
| eases | eases 1.0.8 | 384 | MIT | 2017-07-08 | **۹ سال**؛ فرمول‌ها را کپی کن |
| d3-ease | d3-ease 3.0.1 | 607 | BSD-3 | 2023-10-06 | کامل‌شده و منجمد |
| easing-functions (JS) | — | — | — | — | **UNVERIFIED** — ریپوی معتبر JS پیدا نشد |

## ۴. runtime دو-بعدی / WebGL

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| pixi.js | pixi.js 8.22.0 | 48,421 | MIT | 2026-10-17 | WebGL/WebGPU 2D؛ نیاز به render-on-demand + `preserveDrawingBuffer` |
| two.js | two.js 0.8.24 | 8,672 | MIT | 2026-10-14 | scene graph چند-بک‌اند |
| konva | konva 10.9.0 | 14,875 | NOASSERTION (npm MIT) | 2026-10-15 | editor-oriented |
| fabric.js | fabric 7.4.0 | 31,505 | MIT | 2026-10-17 | مدل شیء غنی، سنگین |
| paper.js | paper 0.13.0 | 15,084 | NOASSERTION (npm MIT) | 2026-10-19 | boolean ops روی مسیر |
| zrender | zrender 6.1.0 | 6,311 | BSD-3 | 2026-10-16 | موتور ECharts |
| p5.js | p5 2.3.4 | 24,145 | LGPL-2.1 | 2026-10-17 | **LGPL**؛ مدل rAF |
| regl | regl 2.1.1 | 5,587 | MIT | 2026-10-17 | stateless → **قطعی ذاتاً** |
| ogl | ogl 1.0.11 | 4,676 | NONE (Unlicense) | 2025-04-13 | **۱۸ ماه** |
| three.js | three 0.186.1 | 116,627 | MIT | 2026-10-19 | 3D کامل؛ `Clock`/rAF را با frame-clock جایگزین کن |
| @babylonjs/core | 9.31.0 | 26,194 | Apache-2.0 | 2026-10-19 | سنگین‌ترین |

## ۵. شیدر / پست‌پروسس

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| pmndrs/postprocessing | postprocessing 6.39.5 | 2,887 | Zlib | 2026-10-05 | bloom/DOF/SMAA/glitch؛ وابسته به نسخهٔ three |
| shader-doodle | 0.0.5 | 588 | MIT | 2026-09-15 | rAF؛ `u_time` دستی |
| gl-transitions | gl-transitions 1.76.1 | 2,156 | NOASSERTION | 2026-10-19 | ~۹۰ شیدر ترنزیشن با uniform `progress` → **frame-addressable** |
| shader-park-core | 0.2.8 | 828 | MIT | 2026-10-05 | JS→GLSL SDF |
| glsl-sandbox (mrdoob) | — | 1,686 | MIT | 2026-08-25 | ادیتور/گالری، نه کتابخانه |

## ۶. تایپوگرافی / شکل‌دهی RTL

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| opentype.js | opentype.js 2.0.0 | 5,034 | MIT | 2026-08-08 | **بدون shaping** → اتصال حروف فارسی می‌شکند |
| fontkit | fontkit 2.0.4 | 1,677 | NONE (MIT) | 2026-10-18 | GSUB/GPOS + joining عربی؛ Node-side |
| harfbuzzjs | harfbuzzjs 1.6.3 | 293 | MIT | 2026-10-16 | **HarfBuzz واقعی (WASM)** → shaping درست RTL |
| text-to-svg | text-to-svg 3.1.5 | 1,011 | NOASSERTION | 2023-09-26 | **۳۷ ماه**؛ بدون bidi |
| troika-three-text | 0.52.5 | 1,981 | MIT | 2026-07-24 | SDF text در three؛ RTL ناقص |
| satori | satori 0.63.0 | 14,111 | MPL-2.0 | 2026-10-19 | JSX+CSS→SVG؛ **MPL** |
| @resvg/resvg-js | 2.6.2 | 2,002 | MPL-2.0 | 2026-06-30 | Rust resvg→PNG؛ shaping ضعیف‌تر از Skia |
| canvaskit-wasm | canvaskit-wasm 0.42.0 | 10,992 (skia) | BSD-3 | 2026-10-19 | Skia WASM: shaping+bidi+features؛ ~۷MB wasm |
| bidi-js | bidi-js 1.1.0 | 54 | MIT | 2026-09-06 | الگوریتم UBA؛ فقط ۵۴★ |
| fonttools (Py) | PyPI | 5,294 | MIT | 2026-10-19 | subset + variable-font instancing (build-time) |

## ۷. داده و چارت

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| d3 | d3 7.9.0 | 113,771 | ISC | 2026-05-28 | generatorها خالص‌اند؛ transitionها زمان‌محور |
| @visx | @visx/visx 4.0.0 | 21,079 | MIT | 2026-06-22 | فقط React |
| echarts | echarts 6.1.0 | 67,546 | Apache-2.0 | 2026-10-13 | انیمیشن `setOption` زمان‌محور → باید غیرفعال و هر فریم redraw شود |
| chart.js | chart.js 4.5.1 | 67,749 | MIT | 2026-10-04 | قابل seek نیست |
| @observablehq/plot | 0.6.17 | 5,407 | ISC | 2026-09-01 | ایستا و مناسب فریم |
| roughjs | roughjs 4.6.6 | 21,289 | MIT | 2024-07-28 | **۲۷ ماه**؛ seeded (قطعی) |
| rough-notation | rough-notation 0.5.1 | 9,715 | MIT | 2024-03-18 | **۳۱ ماه**؛ rAF |

## ۸. وکتور / لایه‌بندی

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| svgo | svgo 4.1.0 | 22,759 | MIT | 2026-08-27 | build-time |
| svg-path-properties | 2.2.0 | 292 | MIT | 2026-10-19 | point-at-length برای draw-on |
| flubber | flubber 0.4.2 | 6,941 | MIT | 2022-11-08 | **۴۷ ماه**؛ morph بین‌فرم |
| polymorph | — | — | — | — | **UNVERIFIED** — ریپو پیدا نشد |
| svg-mesh-3d | svg-mesh-3d 1.1.0 | 1,223 | MIT | 2018-11-03 | **۸ سال** |
| paper.js | 0.13.0 | 15,084 | NOASSERTION (npm MIT) | 2026-10-19 | boolean/offset/flatten |

## ۹. صدا و بیت

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| tone.js | tone 15.1.22 | 14,782 | MIT | 2026-10-17 | Web Audio؛ `Tone.Offline` برای رندر آفلاین |
| web-audio-beat-detector | 8.2.39 | 680 | MIT | 2026-08-30 | BPM+offset از buffer؛ **قطعی** |
| essentia.js | 0.1.3 | 871 | **AGPL-3.0** | 2025-12-10 | MIR; ریسک لایسنس |
| meyda | meyda 5.6.3 | 1,672 | MIT | 2024-07-15 | **۲۷ ماه**؛ real-time |
| wavesurfer.js | 8.0.3 | 10,443 | BSD-3 | 2026-10-19 | پخش‌محور |
| realtime-bpm-analyzer | 5.0.16 | 331 | Apache-2.0 | 2026-10-19 | real-time |
| audiomotion-analyzer | 4.5.4 | 964 | **AGPL-3.0** | 2026-07-19 | AGPL + real-time |

## ۱۰. کپچر / انکد / تحویل

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| ffmpeg-static | 5.3.0 | 1,406 | **GPL-3.0** | 2026-03-21 | باینری pin‌شده |
| @ffmpeg/ffmpeg | 0.12.15 | 17,891 | MIT | 2026-09-29 | WASM؛ کند |
| sharp | sharp 0.35.5 | 32,777 | Apache-2.0 | 2026-10-19 | libvips؛ raw RGBA، مناسب diff |
| jimp | 1.6.1 | 14,673 | MIT | 2026-04-07 | خالص JS؛ `Jimp.diff` |
| pngjs | pngjs 7.0.0 | 746 | NOASSERTION (MIT) | 2024-03-23 | **۳۱ ماه** |
| mediabunny | 1.61.6 | 7,334 | MPL-2.0 | 2026-10-16 | mux/demux با WebCodecs |
| mp4-muxer | 5.2.2 | 616 | MIT | 2025-09-21 | در mediabunny ادغام شده |
| webm-muxer | 5.1.4 | 340 | MIT | 2025-07-03 | **۱۵ ماه** |
| @remotion/media-utils | 4.0.537 | 65,284 (monorepo) | NOASSERTION | 2026-10-19 | waveform/BPM — نیاز ما را پوشش می‌دهد |
| hyperframes | hyperframes 0.8.177 | «۶۷٬۵۳۰» ⚠️ | Apache-2.0 | 2026-10-19 | HTML→MP4 قطعی با قرارداد seekable ⚠️ **ستاره تأییدنشده — خودت چک کن** |

## ۱۱. کمک‌ابزار قطعیت / QA

| نام | npm | ★ | لایسنس | پوش | نکته |
|---|---|---|---|---|---|
| pixelmatch | pixelmatch 8.0.0 | 6,994 | ISC | 2026-10-06 | diff پیکسلی AA-aware |
| looks-same | looks-same 10.0.1 | 828 | MIT | 2025-08-18 | **۱۴ ماه** |
| odiff-bin | odiff-bin 4.5.0 | 3,274 | MIT | 2026-10-13 | موتور diff سریع native |
| ssim.js | ssim.js 3.5.0 | 317 | MIT | 2023-12-07 | **بایگانی‌شده** |
| playwright | 1.64.1 | 98,088 | Apache-2.0 | 2026-10-19 | `toHaveScreenshot`، masks، thresholds |
| jimp (diff) | 1.6.1 | 14,673 | MIT | 2026-04-07 | بدون AA-awareness |
| sharp (diff) | 0.35.5 | 32,777 | Apache-2.0 | 2026-10-19 | خودت metric را می‌نویسی |

---

## ۱۲. نتیجه‌گیری برای PersianArts

**قبلاً پوشش داده‌شده توسط Remotion + Playwright + ffmpeg (وابستگی جدید لازم نیست):**
رندر frame-accurate قطعی، کپچر، mux/encode، اندازه‌گیری صدا، QA بصری، و **شکل‌دهی فارسی (HarfBuzz داخل Chromium)**.

**افزودنی‌های واقعاً ارزشمند (به‌ترتیب اولویت):**

| اولویت | کتابخانه | چرا |
|---|---|---|
| ۱ | **gl-transitions** | ~۹۰ شیدر ترنزیشن آماده با uniform `progress` → قطعی، frame-addressable، بدون وابستگی سنگین |
| ۲ | **sharp** | پردازش/دیف تصویری سریع برای QA (خواندن RGBA، composite، diff) |
| ۳ | **pixi.js** (اگر 2D سنگین لازم شد) | WebGL 2D با render-on-demand؛ برای ذرات/ماسک/بافت |
| ۴ | **bezier-easing** (یا کپی ۲۰ خط فرمول) | easing خالص و قطعی، بدون state |
| ۵ | **web-audio-beat-detector** | BPM قطعی از فایل → کوانتیزه‌کردن کی‌فریم‌ها روی گِرید بیت |
| ۶ | **odiff-bin** | اگر دیف‌های بصری زیاد شد |
| ۷ | **fontkit / harfbuzzjs** | فقط اگر فارسی را بیرون از مرورگر رندر کنیم (canvas/WebGL) — وگرنه لازم نیست |
| ۸ | **canvaskit-wasm** | اگر خواستیم shaping فارسی را مستقل از مرورگر داشته باشیم (۷MB wasm) |

**بعدی که نباید اضافه شود:** `canvas-record` و `CCapture.js` (wall-clock → غیرقطعی)، `editly` (تایم‌لاین داخل ffmpeg)، `theatre.js`/`popmotion`/`rebound`/`eases` (بی‌نگهداری)، `essentia.js`/`audiomotion-analyzer` (AGPL)، `ffmpeg-static` (GPL در بستهٔ توزیع).

**پرچم‌های ریسک لایسنس:** GSAP (غیر OSI — بررسی لازم)، Remotion (شرکتی بالای free tier)، p5.js (LGPL)، satori/resvg-js/mediabunny (MPL-2.0)، ffmpeg-static (GPL-3.0)، essentia.js/audiomotion-analyzer (AGPL-3.0).

**موارد مشکوک که باید خودت چک کنی:** عدد ستارهٔ `hyperframes` (۶۷٬۵۳۰ به‌شکل مشکوک شبیه monorepo Remotion است) و تأییدنشده‌بودن `polymorph` و `easing-functions`.
