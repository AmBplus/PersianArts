# کتابخانه‌های افکت تصویری/ویدیویی برای لایهٔ بصری — EFFECT-LIBRARIES-2026-10-20

تاریخ تحقیق: 2026-10-20 · روش: GitHub REST API (`/repos/…` + `/search/repositories`) + npm registry (`/latest`) + raw README از `raw.githubusercontent.com`.
ستاره/لایسنس/تاریخ = مقادیر واقعی API در همان لحظه. `NOASSERTION` یعنی API شیء لایسنس را برنگرداند (متن لایسنس در فایل هست ولی SPDX شناسایی نشد). نسخهٔ npm = `latest` روی registry.
این سند لایهٔ «افکت» را پوشش می‌دهد و مکمل `docs/motion/JS-LIBRARY-SURVEY-2026-10-19.md` است (آن سند موتور/تایم‌لاین/کدگذاری را دارد). موارد مشترک فقط ارجاع داده شده‌اند.

**قید خط لولهٔ ما:** رندر در مرورگر (HTML + Canvas 2D / WebGL)، ضبط فریم‌به‌فریم با Playwright/headless Chromium به PNG، سپس encode با ffmpeg. هر افکت باید **قطعی (deterministic) نسبت به frame index** باشد: نه wall-clock، نه `Math.random` بدون seed.

---

## ۰. خلاصهٔ اجرایی

- برای WebGL افکت‌های استاندارد (Bloom, Glitch, Chromatic Aberration, Noise/grain, Dot-Screen/halftone, Scanline/CRT, God Rays, LUT, Shock Wave, DOF/bokeh, Vignette) فقط یک گزینهٔ جدی وجود دارد: **pmndrs/postprocessing** (Zlib، 2,887★، push 2026-10-05). همهٔ افکت‌ها shader-based و با uniform قابل‌کنترل‌اند → قطعی، به شرط اینکه uniformها از frame index تغذیه شوند.
- برای بافت/نویز/گرین/دیتر/هالفتون/LUT بهترین راه، **کپی‌کردن چند قطعه GLSL کوچک** است، نه نصب dependency: `glsl-film-grain` (پارامتر `frame` صریح دارد → قطعی‌ترین گرین موجود)، `glsl-dither`، `glsl-halftone`، `glsl-lut`، `glsl-random`، `glsl-blend-soft-light`، `glsl-luma`. همه MIT/BSD، همه زیر ۲KB، همه stale ولی frozen.
- **افکت‌های micro با npm اختصاصی تقریباً وجود ندارند**: جست‌وجوی npm برای `film-grain`, `light-leak`, `chromatic-aberration`, `lens-flare`, `caustics`, `prism`, `bokeh`, `vhs`, `dither` یا ۴۰۴ داد یا بسته‌های بی‌ربط (Redux/ZeroMQ/CSS). نتیجه: افکت را **خودمان به‌صورت GLSL/Canvas2D می‌نویسیم** و از این micro-libها فقط ایده می‌گیریم.
- **هیچ‌کدام از ابزارهای ویدیویی کلاسیک JS نیستند**: VidGear و ffmpeg-python پایتون‌اند، frei0r پلاگین C است (GPL-2.0)، dsfilters ویندوزی/DirectShow است. تنها گزینه‌های JS: `@ffmpeg/ffmpeg` (ffmpeg.wasm، MIT) و `ffmpeg-static` (wrapper MIT ولی خودِ باینری GPL-3.0). برای ما ffmpeg بومی موجود است → چیزی نصب لازم نیست.
- **شکل‌دهی فارسی**: `opentype.js` = **NO-SHAPING** (مدرک صریح در README خودش). `harfbuzzjs` = HarfBuzz واقعی (WASM). `fontkit` = GSUB/GPOS + layout. `troika-three-text` v0.52.5 حالا READMEش ادعای «joined scripts like Arabic» دارد (تغییر مهم، ولی در این تحقیق رندر واقعی تست نشد → UNVERIFIED).
- **نکتهٔ کلیدی معماری**: مرورگر (Chrome/HarfBuzz) خودش متن فارسی را درست shape می‌کند. بنابراین shaping فقط وقتی لازم است که متن را **بیرون از مرورگر** (node-side asset pipeline) تولید کنیم.

---

## ۱. محدودیت‌های داده (صادقانه)

- سقف GitHub API بدون احراز هویت ۶۰ درخواست/ساعت بود؛ تقریباً کل سهمیه مصرف شد. هر مقداری که در ادامه آمده از **پاسخ واقعی API** است، نه از حافظه.
- API callهایی که **شکست خوردند** (و در نتیجه داده‌ای برایشان وجود ندارد):
  - `GET /repos/pmndrs/postprocessing` → خطای شبکه در تلاش اول؛ **در تلاش دوم موفق** (2,887★ / Zlib / 2026-10-05).
  - `GET /repos/pmndrs/react-postprocessing` → `No such host is known`؛ **در تلاش دوم موفق** (1,440★ / MIT / 2026-10-19).
  - `GET /repos/0beqz/postfx` → **404** (و npm `postfx` هم 404) → این بسته عملاً ناپدید شده.
  - `GET /repos/Sean-Bradley/Realism-Effects` → 404؛ نام درست: `0beqz/realism-effects` (1,737★ / MIT / 2024-02-04).
  - `GET /repos/frei0r/frei0r` → 404؛ نام درست: `dyne/frei0r` (594★ / GPL-2.0 / 2026-10-06).
  - `GET /repos/mattdesl/glsl-luma` → 404؛ نام درست: `hughsk/glsl-luma` (39★ / NOASSERTION / 2014-06-09).
  - `GET /repos/Sean-Bradley/…`، `GET /search?q=postfx…` → نتیجهٔ مفیدی برنگرداند (۰ نتیجه) → postfx تعویض‌شده/حذف‌شده تلقی می‌شود.
  - npm 404: `postfx`, `film-grain`, `light-leak`, `chromatic-aberration`, `lens-flare`, `canvas-texture`, `glsl-hash-rotate`, `vidgear`, `ffmpeg-python`, `3dlut`, `luts`, `cube-lut`, `ffmpeg.wasm` (نام درست `@ffmpeg/ffmpeg`).
- مواردی که **UNVERIFIED** هستند و در جدول با همین برچسب آمده‌اند: رفتار shaping عربی در `fontkit` در عمل، shaping فارسی در `@napi-rs/canvas`، قطعی‌بودن افکت `noise` در `glfx.js`، و اینکه `NoiseEffect` در postprocessing uniform زمان دارد یا نه.

---

## ۲. دسته‌بندی‌ها

### ۲.۱ WebGL post-processing / effect composers (2D+3D)

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| pmndrs/postprocessing | `postprocessing` 6.39.5 | 2,887 | Zlib | 2026-10-05 | ✅ (uniform-driven) | **انتخاب اول** برای Bloom/Glitch/CA/Noise/Dot-Screen/Scanline/GodRays/LUT/ShockWave/DOF |
| pmndrs/react-postprocessing | `@react-three/postprocessing` 3.2.1 | 1,440 | MIT | 2026-10-19 | ✅ | فقط اگر R3F داشته باشیم؛ ما R3F نداریم → فعلاً لازم نیست |
| gl-transitions/gl-transitions | `gl-transitions` 1.76.1 | 2,158 | NOASSERTION (npm: MIT) | 2026-10-19 | ✅ (`progress` فقط) | بانک transitionهای GLSL؛ برای cut/transition بین دو فریم عالی |
| 0beqz/realism-effects | `realism-effects` 1.1.2 | 1,737 | MIT | 2024-02-04 | ✅ | SSGI / Motion Blur / TRAA → افکتِ صحنه، نه افکتِ فیلم |
| 0beqz/postfx | — | — | — | — | — | **DO NOT** — npm 404 و GitHub 404 |
| greggman/twgl.js | `twgl` 7.0.3 | 3,023 | MIT | 2026-10-19 | ✅ | ابزار کمکی WebGL است، نه افکت؛ فقط اگر postprocessing را کنار بگذاریم |
| mrdoob/three.js (addons) | `three` 0.186.1 | 116,628 | MIT | 2026-10-19 | ✅ | `EffectComposer`/`BokehPass`/`FilmPass` داخلی — fallback اگر postprocessing را نخواهیم |
| shader-effects-inc/shaders (Shader Park) | `shaders` 4.0.4 | 5,139 | MIT | 2026-10-09 | ⚠️ WebGPU | **مرجع** برای پورت GLSL، نه نصب (WebGPU در headless Chromium پرچم‌محور است) |

**پروفایل‌ها:**

- **pmndrs/postprocessing** — README: «Post processing introduces the concept of passes and effects to extend the common rendering workflow with fullscreen image manipulation tools.» فهرست افکت‌های README: Bloom، Blur، Color Depth، Color Grading (Color Average/Sepia/Brightness/Hue/**LUT**)، Depth of Field + Vignette، **Glitch / Chromatic Aberration / Noise**، God Rays، Pattern (**Dot-Screen**/Grid/**Scanline**)، Pixelation، Outline، **Shock Wave**، Depth Picking، SSAO، Texture، Tone Mapping. لایسنس: «This library is licensed under the Zlib license».
  - **چه می‌دهد:** همان چیزی که لایهٔ بصری لازم دارد: bloom، glitch، chromatic aberration، film grain (Noise + blend mode)، halftone (Dot-Screen)، scanline/CRT (Scanline/Grid)، LUT look (ColorGradingEffect)، ripple/displacement (ShockWave)، bokeh (DepthOfField با `bokehScale`)، vignette.
  - **قطعی:** بله — همهٔ افکت‌ها fullscreen shader با uniform هستند؛ اگر `time`-مانند uniform را از `frameIndex` بدهیم، خروجی هر فریم ثابت است. ⚠️ `NoiseEffect` را باید تست کنیم (احتمالاً hash‌محور و بدون زمان → UNVERIFIED).
  - **ریسک:** peer-dependency روی `three`؛ حجم دمو ~۶۰MB (README: «The total demo download size is about 60 MB») ولی خود کتابخانه کوچک است؛ API نسخه‌ای است (v6.39.5) و EffectPassها merge می‌شوند.
  - **در خط لولهٔ ما:** `browser vendor` — فقط اگر لایهٔ ۳D/three داریم. برای فیلم‌های ۲D (Canvas2D) این کتابخانه به‌تنهایی کافی نیست؛ باید GLSL خودمان را در WebGL بنویسیم یا از یک pass سفارشی استفاده کنیم.

- **gl-transitions/gl-transitions** — README: «A GL Transition is a GLSL code that implements a `transition` function which takes a `vec2 uv` pixel position and returns a `vec4` color… based on… a contextual `progress` value from `0.0` to `1.0`». یعنی هر transition فقط به `progress` نیاز دارد → **کاملاً قطعی** و مستقیماً frame-indexable. لایسنس در GitHub `NOASSERTION` ولی در npm `MIT` (اختلاف را در فایل LICENSE چک کنید). بانک بزرگی از transitionهای GLSL (dissolve, luma burn, ripple…) که همان «افکتِ بین دو فریم» موردنیاز ماست.
  - **در خط لولهٔ ما:** `browser vendor` (یک `.glsl` را کپی می‌کنیم و در pass خودمان صدا می‌زنیم).

- **0beqz/realism-effects** — «SSGI, Motion Blur, TRAA - Effects to enhance your three.js scene's realism». این‌ها screen-space GI و motion blur هستند، نه grain/leak/CA. برای فیلم‌های ۲D ما بی‌ربط‌اند. آخرین push 2024-02-04 (۲۰ ماه) → نیمه‌رهاشده.

- **shader-effects-inc/shaders (Shader Park)** — README: «Real WebGPU, declarative API: 200+ effects you drop in as components. Gradients, noise, glass, metal, light, distortions, transitions, blurs, cursor effects.» برای ما فقط **منبع ایده و GLSL** است؛ خودش WebGPU است و در headless Chromium بدون پرچم/سخت‌افزار ممکن است اجرا نشود. پرچم `deterministic?` = ⚠️.

### ۲.۲ Shader libraries / GLSL effect packs

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| stackgl/glslify (repo: `glslify/glslify`) | `glslify` 7.1.1 | 2,285 | NOASSERTION (npm: MIT) | 2022-06-29 | ✅ | سیستم ماژول GLSL (`#pragma glslify: x = require(...)`) → build-time |
| hughsk/glsl-noise | `glsl-noise` 0.0.0 | 406 | MIT | 2015-12-27 | ✅ | پورت webgl-noise؛ **frozen** |
| ashima/webgl-noise | (بدون npm) | 3,000 | MIT | 2024-11-15 | ✅ | مرجع اصلی noise (simplex 2D/3D/4D) |
| stegu/webgl-noise | (بدون npm) | 595 | MIT | 2025-04-27 | ✅ | نسخهٔ GLSL1/2/3 + psrdnoise |
| mattdesl/glsl-film-grain | `glsl-film-grain` 1.0.4 | 210 | MIT | 2016-03-11 | ✅✅ | **بهترین گرین**؛ پارامتر `frame` دارد |
| stackgl/glsl-halftone | `glsl-halftone` 1.0.4 | 53 | MIT | 2015-04-06 | ✅ | halftone در GLSL |
| hughsk/glsl-dither | `glsl-dither` 1.0.1 | 225 | NOASSERTION (npm: MIT) | 2014-06-08 | ✅ | Bayer dithering 8x8/4x4/2x2 |
| mattdesl/glsl-lut | `glsl-lut` 1.1.3 | 185 | MIT | 2024-06-12 | ✅ | LUT color transform برای glslify |
| mattdesl/glsl-random | `glsl-random` 0.0.5 | 64 | BSD-3-Clause | 2015-01-26 | ✅ | pseudo-random 2D noise |
| mattdesl/glsl-blend-soft-light | `glsl-blend-soft-light` 1.0.5 | 16 | MIT | 2015-01-26 | ✅ | blend mode `overlay` |
| hughsk/glsl-luma | `glsl-luma` 1.0.1 | 39 | NOASSERTION (npm: MIT) | 2014-06-09 | ✅ | luma/greyscale |
| DOWNPOURDIGITAL/glsl-chromatic-aberration | `glsl-chromatic-aberration` 1.0.1 | 5 | NOASSERTION (npm: MIT) | 2018-08-21 | ✅ | CA به‌صورت تابع glslify؛ تک‌نفره/کم‌اعتبار |

**پروفایل‌ها:**

- **glslify** — README: «A node.js-style module system for GLSL!» و لیست ماژول‌های پیشنهادی‌اش دقیقاً همان چیزی است که لازم داریم: `[noise](https://github.com/hughsk/glsl-noise)` و `[film grain](https://github.com/mattdesl/glsl-film-grain)`. نمونهٔ README: `#pragma glslify: noise = require('glsl-noise/simplex/3d')`. ⚠️ آخرین push 2022-06-29 و مشکل شناخته‌شده با Babel (`Babel mangles the output into source code that it...`) → فقط در build-time استفاده شود، نه در runtime مرورگر.
- **glsl-film-grain** — README: «Natural looking film grain using 3D noise functions… This is a fairly expensive technique to achieve film grain, but it looks more realistic than a hash function and also produces better motion.» و امضای تابع: «`f = grain(texCoord, resolution[, frame[, q]])` … `frame` the animation frame, which is an offset into the Z of the 3D noise». **این دقیقاً چیزی است که ما می‌خواهیم:** گرین با شمارهٔ فریم → در `frameIndex` ثابت می‌ماند و بین فریم‌ها حرکت می‌کند. ترکیب پیشنهادی خودش: `glsl-blend-soft-light` + `glsl-luma`. ⚠️ stale (۲۰۱۶) و «fairly expensive» (نویز سه‌بعدی هر فریم).
- **glsl-dither** — README: «Bayer matrix dithering in GLSL» با توابع `dither8x8(vec2 pos, vec3|vec4|float brightness)` و `dither4x4` و `dither2x2`. برای حس dithering/8-bit banding مناسب است. stale (۲۰۱۴) ولی frozen و ۲KB.
- **glsl-halftone** — «a halftone effect in GLSL»؛ برای حس چاپ/کاغذ (انگار) به‌کار می‌رود. ۲۰۱۵، ۵۳★.
- **glsl-lut** — «lookup table color transforms for glslify»؛ برای LUT look (سینمایی) در WebGL. push 2024-06-12 → هنوز به‌روز.
- **glsl-noise / webgl-noise** — پایهٔ نویز: `snoise2`, `snoise3` و… برای smoke, caustics, paper texture, displacement. ashima/webgl-noise مرجع upstream است (3,000★) و ۲۰۲۴ آخرین push.

### ۲.۳ Image filters / pixel-level libraries

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| evanw/glfx.js | `glfx` 0.0.4 | 3,456 | MIT | 2023-10-23 | ⚠️ | افکت‌های WebGL روی عکس؛ **۳ سال بدون push** |
| image-js/image-js | `image-js` 1.7.1 | 1,092 | MIT | 2026-09-30 | ✅ | پردازش پیکسل خالص JS؛ بهترین گزینهٔ node-side |
| jimp-dev/jimp | `jimp` 1.6.1 | 14,673 | MIT | 2026-04-07 | ✅ | API plugin-friendly؛ «zero native dependencies» |
| lovell/sharp | `sharp` 0.35.5 | 32,777 | Apache-2.0 | 2026-10-19 | ✅ | libvips؛ سریع برای resize/فرمتِ فریم‌های PNG |
| nodeca/pica | `pica` 10.0.3 | 4,154 | MIT | 2026-08-15 | ✅ | resize با کیفیت بالا **داخل مرورگر** (Lanczos3) |
| kleisauke/wasm-vips | `wasm-vips` 0.0.19 | 890 | MIT | 2026-10-14 | ✅ | libvips در WASM؛ «still under early development» |
| jamsinclair/jSquash | `@jsquash/png` 3.1.1 | 737 | Apache-2.0 | 2026-01-05 | ✅ | codecهای wasm برای مرورگر (Squoosh) |
| Brooooooklyn/canvas (`@napi-rs/canvas`) | `@napi-rs/canvas` 1.0.11 | 2,340 | NOASSERTION (npm: MIT) | 2026-10-19 | ✅ | Skia canvas در Node؛ «Embedded fonts - Vector glyph paths for text rendering without system fonts» |
| Automattic/node-canvas | `canvas` 3.2.3 | 10,696 | NOASSERTION (npm: MIT) | 2026-10-11 | ✅ | Cairo؛ قدیمی‌تر و کندتر از @napi-rs/canvas |
| Postcard/halftone | `halftone` 0.1.1 | 1 | NOASSERTION | 2016-01-21 | ✅ | halftone نقطه‌ای ۴۵° روی canvas — stale و بی‌اعتبار |

**پروفایل‌ها:**

- **glfx.js** — README: «Adjust photos in your browser in realtime with glfx.js, an image effects library powered by WebGL… There are two caveats… due to the same origin policy, JavaScript is only allowed to read images that originate from the same domain». یعنی: sepia/hsepia/vignette/pixelate/dotScreen/noise روی یک texture. ⚠️ ریسک‌ها: آخرین push **2023-10-23** (۳ سال)، و README هشدار same-origin می‌دهد (در pipeline ما تصاویر local هستند → باید data-URL/blob بدهیم). قطعی‌بودن افکت `noise` آن **UNVERIFIED** (ممکن است `Math.random` داشته باشد → باید seed بدهیم یا کنار بگذاریم).
- **image-js** — README: «Image processing and manipulation in JavaScript.» نگه‌دارنده: Zakodium. کتابخانهٔ pure-JS برای عملیات پیکسلی (threshold, convolution, color, morphological) → مناسب برای **post-pass روی فریم‌های capture‌شده** (مثلاً تبدیل به ۱-bit یا emboss برای حس حکاکی).
- **jimp** — README: «An image processing library for Node written entirely in JavaScript, with zero native dependencies». API به‌شکل plugin (`@jimp/custom`) → افکت‌های خودمان را به‌صورت plugin اضافه می‌کنیم. ولی از نظر سرعت، sharp بهتر است.
- **sharp** — README: «The typical use case for this high speed Node-API module is to convert large images… Resizing an image is typically 4x-5x faster than using the quickest ImageMagick… due to its use of libvips.» لایسنس Apache-2.0. → **بهترین گزینهٔ node-side برای post-process فریم‌های PNG** (resize نهایی، تبدیل WebP/AVIF، sharpen).
- **pica** — README: `pica.resize(from, to, { filter: 'lanczos3' })`، «High quality image resize in browser». برای وقتی لازم داریم **داخل صفحهٔ رندر** تصویر را دقیق upscale کنیم (مثلاً یک تصویر کم‌رزولوشن را برای motion به بزرگی قاب ببریم).
- **wasm-vips** — README: «libvips for the browser and Node.js, compiled to WebAssembly… Programs that use wasm-vips don't manipulate images directly, instead they create pipelines of image processing operations» + هشدار «This library is still under early development». نسخهٔ ۰.۰.۱۹ → **ریسک**؛ فقط اگر واقعاً به libvips در مرورگر نیاز شد.
- **@napi-rs/canvas** — README: `GlobalFonts.registerFromPath(...)` و «Embedded fonts - Vector glyph paths for text rendering without system fonts». یعنی می‌توان فونت را از فایل ثبت کرد و متن را **بیرون از مرورگر** رندر کرد. ⚠️ shaping عربی در Skia: Skia معمولاً HarfBuzz دارد و فارسی را درست shape می‌کند، ولی **در این تحقیق تست نشد → UNVERIFIED** (باید با فونت واقعی فارسی تست شود، مخصوصاً ZWNJ/نیم‌فاصله).

### ۲.۴ «افکت‌های جذاب» micro-libraries

نتیجهٔ تحقیق: **این دسته تقریباً خالی است.** جست‌وجوی npm نشان داد بسته‌هایی که اسمشان شبیه افکت است یا ۴۰۴ می‌دهند یا بی‌ربط‌اند.

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| OutThisLife/crt-shader | `crt-shader` 1.0.1 | 12 | MIT | 2026-09-27 | ✅ | **بهترین CRT**: «Multi-pass CRT reconstruction for WebGL, Three.js and React, with portable GLSL sources» |
| nicc/halftone-print | `halftone-print` 0.1.0 | 0 | MIT | 2026-10-01 | ✅ | «Turn any image into halftone dots on canvas — rotated screen, ink gain, jitter and noise for a printed look» → حس چاپ/حکاکی |
| ugolbck/instantshader | `instantshader` 0.8.1 | 3 | MIT | 2026-09-27 | ✅ | «Animated WebGL gradient shaders, plus dither, pixelate, halftone and ASCII effects. Zero dependencies» |
| pixijs/filters | `pixi-filters` / `@pixi/filter-old-film` 5.1.1 | 1,139 | MIT | 2026-02-13 | ✅ | `OldFilmFilter` (grain+scratches)، `CRTFilter`، `AdvancedBloomFilter`، `DisplacementFilter`، `SimplexNoiseFilter`، `BulgePinchFilter` — ولی وابسته به PixiJS |
| eamonliu/liquid-glass-js | `liquid-glass-js` 0.1.0 | — | MIT | — | ✅ | refraction واقعی + chromatic aberration + specular (نه film-grade) |
| jukrapopk/shardlight | `shardlight` 0.2.1 | — | MIT | — | ⚠️ | lens flare procedural برای three/R3F؛ رندر مبتنی بر صحنه، نه post |
| DOWNPOURDIGITAL/glsl-chromatic-aberration | `glsl-chromatic-aberration` 1.0.1 | 5 | NOASSERTION (npm: MIT) | 2018-08-21 | ✅ | تابع glslify؛ ریسک: تک‌نفره و بی‌مستند |
| simonswain/crt | `crt` 0.0.0 | 2 | NOASSERTION | 2015-05-31 | — | **DO NOT** — ۱۱ سال stale |
| akincan-kilic/caustics | `caustics` 0.0.0 | — | MIT | — | — | **DO NOT** — «Reserved name… real package coming» (placeholder) |
| Postcard/halftone | `halftone` 0.1.1 | 1 | NOASSERTION | 2016-01-21 | ✅ | **DO NOT** — ۱★ و ۱۰ سال stale |
| — | `film-grain` | — | — | — | — | **DO NOT** — npm 404؛ فقط `glsl-film-grain` |
| — | `light-leak` | — | — | — | — | **DO NOT** — npm 404؛ light leak را خودمان می‌نویسیم |
| — | `chromatic-aberration` | — | — | — | — | **DO NOT** — npm 404 |
| — | `lens-flare` | — | — | — | — | **DO NOT** — npm 404 |
| — | `bokeh` | — | MIT | — | — | **DO NOT** — «a blazing-fast task queue built on Node.js and ZeroMQ» (اصلاً افکت نیست) |
| — | `vhs` | — | MIT | — | — | **DO NOT** — «Post-future CSS animations» (اصلاً افکت نیست) |
| — | `prism` | — | MIT | — | — | **DO NOT** — «React / Redux action composition» |
| — | `dither` | — | ISC | — | — | **DO NOT** — بدون repo، بدون مستند، provenance نامعلوم |
| — | `@remotion/light-leaks` | 4.0.537 | Remotion License (شرکتی) | — | ✅ | فقط داخل Remotion؛ ما Remotion-side نیستیم → فعلاً رد |

**نتیجهٔ کلیدی:** برای grain/leak/dust/scratch/CA/halftone/prism/caustics/smoke/ink هیچ micro-lib قابل‌اتکایی وجود ندارد. مسیر درست: **GLSL خودمان** (با قطعه‌های `glsl-*` به‌عنوان پایه) + یک pass WebGL سفارشی. `crt-shader` و `halftone-print` تنها دو بستهٔ تازه و MIT هستند که ارزش کپی‌کردن دارند.

### ۲.۵ Texture/asset generation (procedural)

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| jwagner/simplex-noise.js | `simplex-noise` 4.0.3 | 1,850 | MIT | 2024-07-26 | ✅ (با PRNG seed‌دار) | **بهترین** برای بافت کاغذ/دود/نویز سمت node |
| joshforisha/fast-simplex-noise-js | `fast-simplex-noise` 4.0.0 | 66 | Unlicense | 2026-03-02 | ✅ | TypeScript، «faster simplex noise» |
| xixixao/noisejs | `noisejs` 2.1.0 | 37 | NOASSERTION | 2013-12-21 | ⚠️ | Perlin/simplex قدیمی |
| gorhill/Javascript-Voronoi | `voronoi` 1.0.0 | — | MIT | — | ✅ | Voronoi/=Worley → ترک‌کردن کاغذ، لکه |
| — | `noise-2d` | — | MIT | — | ⚠️ | بی‌نام‌و‌نشان، بدون repo |

**پروفایل‌ها:**

- **simplex-noise (jwagner)** — README: «simplex-noise is a simplex noise implementation in Javascript/TypeScript… fairly fast (about 20 nanoseconds for a sample of 2d noise) and tree shakeable» و لیست کاربردها: «Film grain in analog film emulator»، «Applying volumetric wood grain to 3D prints». API: `createNoise2D()` با PRNG قابل‌دادن → **برای ما حیاتی است**: `createNoise2D(alea(seed))` خروجی کاملاً قطعی می‌دهد و می‌توان بذر را از frame index مشتق کرد (مثلاً `seed = filmId * 1000 + frameIndex`).
- **Voronoi/Worley** — برای بافت کاغذ/ترک/لکهٔ جوهر؛ الگوریتم Fortune (بدون وابستگی). ⚠️ جزئیات API از README تأیید نشد (UNVERIFIED).

### ۲.۶ ابزارهای سمت ویدیو/ffmpeg (و آنچه اصلاً JS نیست)

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| ffmpegwasm/ffmpeg.wasm | `@ffmpeg/ffmpeg` 0.12.15 | 17,891 | MIT | 2026-09-29 | ✅ | ffmpeg در مرورگر/WASM؛ فقط اگر ffmpeg بومی نداشتیم |
| eugeneware/ffmpeg-static | `ffmpeg-static` 5.3.0 | 1,406 | **GPL-3.0** (باینری) / MIT (wrapper) | 2026-03-21 | ✅ | ⚠️ باینری GPL → توزیعِ آن تعهد GPL دارد |
| fluent-ffmpeg/node-fluent-ffmpeg | `fluent-ffmpeg` 2.1.3 | 8,229 | MIT | 2025-05-22 | ✅ | **DO NOT** — `archived: true` در API |
| dyne/frei0r | — | 594 | **GPL-2.0** | 2026-10-06 | — | **NOT JS** — پلاگین‌های ویدیویی C → نه JS، نه مرورگر |
| dsfilters (Windows DirectShow) | — | — | — | — | — | **NOT JS** — فیلترهای DirectShow ویندوز → خارج از دسترس مرورگر |
| VidGear | — (PyPI) | — | Apache-2.0 (به‌خاطر حافظه) | — | — | **NOT JS** — پایتون |
| ffmpeg-python | — (PyPI) | — | MIT (به‌خاطر حافظه) | — | — | **NOT JS** — پایتون |
| — | `vidgear` / `ffmpeg-python` روی npm | — | — | — | — | **DO NOT** — npm 404 (چون اصلاً JS نیستند) |
| LUT handling | `glsl-lut` 1.1.3 | 185 | MIT | 2024-06-12 | ✅ | LUT در WebGL |
| LUT handling | ffmpeg `lut3d`/`lutyuv` | — | (ffmpeg: LGPL/GPL بسته به build) | — | ✅ | LUT در ffmpeg بومی — بدون کتابخانهٔ JS |
| optical-flow / time-remap | — | — | — | — | — | **NOT JS** — `minterpolate`/`minterpolate` ffmpeg بومی؛ در JS کتابخانهٔ قابل‌اتکا پیدا نشد → UNVERIFIED |

**پروفایل‌ها:**

- **@ffmpeg/ffmpeg (ffmpeg.wasm)** — README: «ffmpeg.wasm is a pure Webassembly / Javascript port of FFmpeg. It enables video & audio record, convert and stream right inside browsers.» MIT. اما ما ffmpeg بومی داریم (طبق `docs/motion/PLAYBOOK-RENDER.md`) → استفاده از wasm فقط سربار است. ⚠️ badge «stability-experimental».
- **ffmpeg-static** — npm license = `GPL-3.0-or-later` (خودِ باینری ffmpeg)؛ wrapper MIT. اگر فقط «ابزار توسعه» محلی باشد مشکلی ندارد، ولی **نباید باینری را داخل ریپوی منتشرشده بگذاریم**. خط لولهٔ ما ffmpeg سیستمی را صدا می‌زند → اصلاً لازم نیست.
- **fluent-ffmpeg** — API صریحاً `archived: true` برگرداند و آخرین push 2025-05-22 است → deprecation عملی. به‌جای آن: `child_process.spawn('ffmpeg', [...])` یا همان wrapper خودمان.
- **frei0r / dsfilters** — **پاسخ صریح به بخش «کدام‌ها JS نیستند»**: frei0r یک مجموعهٔ پلاگین C برای GIMP/ffmpeg/Kdenlive است (`dyne/frei0r`، GPL-2.0)؛ dsfilters مجموعهٔ فیلترهای DirectShow مخصوص ویندوز است. هیچ‌کدام در مرورگر ما قابل‌استفاده نیستند و چون GPL هستند به‌راحتی وارد پروژه نمی‌شوند. **نتیجه: افکت‌های ویدیویی ما باید در ffmpeg-native (filter graph) یا در WebGL ما انجام شوند.**

### ۲.۷ Typography / lettering (و shaping فارسی)

| نام | npm | ★ | لایسنس | آخرین پوش | قطعی؟ | حکم |
|---|---|---|---|---|---|---|
| harfbuzz/harfbuzzjs | `harfbuzzjs` 1.6.3 | 293 | MIT | 2026-10-16 | ✅ | **HarfBuzz واقعی (WASM)** → shaping درست RTL/عربی؛ مرجع |
| foliojs/fontkit | `fontkit` 2.0.4 | 1,677 | NOASSERTION (npm: MIT) | 2026-10-18 | ✅ | GSUB/GPOS + «AAT and OpenType shaping»؛ path/glyph API |
| opentypejs/opentype.js | `opentype.js` 2.0.0 | 5,034 | MIT | 2026-08-08 | ✅ | **NO-SHAPING** → برای فارسی ممنوع |
| protectwise/troika (troika-three-text) | `troika-three-text` 0.52.5 | 1,981 | MIT | 2026-07-24 | ✅ | SDF text در three؛ README v0.52.5: «handles… right-to-left/bidirectional layout, joined scripts like Arabic» → **UNVERIFIED در عمل** |
| paperjs/paper.js | `paper` 0.13.0 | 15,084 | NOASSERTION (npm: MIT) | 2026-10-19 | ✅ | vector + `PointText` روی مسیر (text-on-path) |
| lojjic/bidi-js | `bidi-js` 1.1.0 | 54 | MIT | 2026-09-06 | ✅ | پیاده‌سازی UBA → ترتیب RTL در متن سمت node |
| paulzi/svg-text-to-path | `svg-text-to-path` 2.1.0 | — | MIT | — | ✅ | تبدیل `<text>` به path — **بدون shaping** |
| shrhdk/text-to-svg | `text-to-svg` 3.1.5 | — | MIT | — | ✅ | متن→SVG path — **بدون shaping** |

**مدرک صریح NO-SHAPING برای opentype.js** — از README خودش:
> «Note that this function assumes that there is a one-to-one mapping between the given character and a glyph; **for complex scripts, this might not be the case.**»

و در فهرست قابلیت‌ها: «Support arabic text rendering (See issue #364 & PR #359 #361)» — یعنی موضوع باز است، نه پیاده‌سازی‌شده. نتیجه: **opentype.js برای فارسی ممنوع** (اتصال حروف و ارقام فارسی می‌شکند). این با سند قبلی `JS-LIBRARY-SURVEY-2026-10-19.md` هم‌خوان است.

**fontkit** — README: «// layout a string, using default shaping features.» و «supporting AAT and OpenType shaping.» و در کد `LayoutEngine.js`: «scripts are currently supported because the shaping logic is built into the font.» یعنی fontkit ویژگی‌های GSUB/GPOS را اعمال می‌کند (شامل init/medi/fina عربی) ولی **reordering دوجهته را خودش انجام نمی‌دهد** → برای RTL نیاز به `bidi-js` داریم. رفتار دقیق فارسی در این تحقیق تست نشد → **UNVERIFIED**.

**troika-three-text v0.52.5** — README (بخش troika-three-text): «…handles proper kerning, ligature glyph substitution, right-to-left/bidirectional layout, **joined scripts like Arabic**, and will automatically load fallback fonts for full unicode coverage.» این ادعای جدید است (نسخه‌های قدیمی‌تر نداشتند) و مهم است، ولی در این تحقیق رندر واقعی تست نشد → **UNVERIFIED**؛ قبل از اتکا باید با فونت واقعی فارسی و متن دارای نیم‌فاصله تست شود.

**قید معماری کلیدی:** چون فیلم‌ها در مرورگر رندر می‌شوند، **Chrome خودش (HarfBuzz) متن فارسی را درست shape می‌کند** → برای متن روی canvas/webgl نیازی به کتابخانهٔ shaping نداریم. shaping فقط برای مسیر **node-side asset** (ساخت SVG/PNG از node) لازم است، و آن‌جا `harfbuzzjs` + `bidi-js` ابزار درست است. `svg-text-to-path` و `text-to-svg` چون بر opentype.js تکیه دارند → **بدون shaping → برای فارسی ممنوع**.

---

## ۳. نصب پیشنهادی (shortlist)

۱. **`postprocessing` 6.39.5** — لایسنس **Zlib** — قطعی: **بله** (uniform-driven؛ `NoiseEffect` را تست کنیم) — محل: **browser vendor** (فقط اگر لایهٔ three داریم). چرا: یک‌جا همهٔ افکت‌های استاندارد (Bloom/Glitch/CA/Noise/Dot-Screen/Scanline/LUT/ShockWave/DOF/Vignette). ریسک: peer-dep روی three؛ README خودش می‌گوید دمو ۶۰MB است.
۲. **بستهٔ GLSL: `glsl-film-grain` + `glsl-dither` + `glsl-halftone` + `glsl-lut` + `glsl-random` + `glsl-blend-soft-light` + `glsl-luma`** — لایسنس **MIT/BSD-3** (به‌جز `glsl-dither` و `glsl-luma` که GitHub=NOASSERTION و npm=MIT) — قطعی: **بله** (grain پارامتر `frame` دارد) — محل: **browser vendor** به‌صورت متن GLSL در `lib/pa-fx/`. چرا: کل لایهٔ «حس فیلم/چاپ» با <۲KB کد، بدون هیچ dependency runtime. ریسک: stale (۲۰۱۴–۲۰۱۶) ولی frozen و مستقل.
۳. **`simplex-noise` 4.0.3** — لایسنس **MIT** — قطعی: **بله** با PRNG seed‌دار (`createNoise2D(alea(seed))`) — محل: **node tool** (تولید textureهای کاغذ/دود/نویز به‌صورت PNG) و **browser vendor** (اگر noise را در GPU لازم شد). چرا: تنها راه قطعی برای بافت‌های پروسیجرال. ریسک: push 2024-07 (هنوز قابل‌قبول).
۴. **`glslify` 7.1.1** (یا فقط `glsl-*` ها بدون glslify) — لایسنس npm **MIT** (GitHub NOASSERTION) — قطعی: **بله** — محل: **node tool / build-time** فقط. چرا: سازمان‌دهی `#pragma glslify: x = require(...)` برای فایل‌های shader ما. ریسک: push 2022-06؛ تداخل با Babel → فقط در build استفاده شود. اگر pipeline ما Vite/esbuild است، glslify را با `vite-plugin-glslify` جایگزین کنیم یا اصلاً کپی-پیست کنیم.
۵. **`harfbuzzjs` 1.6.3** — لایسنس **MIT** — قطعی: **بله** — محل: **node tool** (ساخت asset متن فارسی بیرون از مرورگر). چرا: تنها گزینهٔ JS که shaping واقعی عربی/فارسی می‌دهد؛ `hb.shape(font, buffer)`. ریسک: WASM (~۱–۲MB)؛ باید با `fontkit` برای ساخت buffer ترکیب شود.
۶. **`fontkit` 2.0.4** — لایسنس npm **MIT** (GitHub NOASSERTION) — قطعی: **بله** — محل: **node tool** (خواندن فایل فونت، استخراج glyph path، layout). چرا: مکمل طبیعی harfbuzzjs؛ «supporting AAT and OpenType shaping». ریسک: رفتار دقیق joining عربی **UNVERIFIED** → با فونت واقعی تست شود.
۷. **`bidi-js` 1.1.0** — لایسنس **MIT** — قطعی: **بله** — محل: **node tool**. چرا: UBA خالص برای ترتیب RTL در متن سمت node؛ کوچک و بدون dependency. ریسک: فقط reordering؛ shaping را نمی‌کند.
۸. **`sharp` 0.35.5** — لایسنس **Apache-2.0** — قطعی: **بله** — محل: **node tool** (post-process فریم‌های PNG بعد از capture: resize نهایی، تبدیل فرمت، sharpen). چرا: ۴–۵ برابر سریع‌تر از ImageMagick؛ «the fastest module to resize…». ریسک: باینری native (sharp/libvips) → باید برای هر محیط build شود (لینوکس/ویندوز)؛ اگر فقط resize لازم داریم، pica در مرورگر جایگزین سبک‌تری است.
۹. **`pica` 10.0.3** — لایسنس **MIT** — قطعی: **بله** — محل: **browser vendor**. چرا: resize با کیفیت Lanczos3 **داخل صفحهٔ رندر** (بالاسازی تصویر کم‌رزولوشن به اندازهٔ قاب بدون پله‌دانه). ریسک: CPU-bound → برای فریم‌های زیاد کند می‌شود؛ در صورت استفاده، cache کنیم.
۱۰. **`image-js` 1.7.1** — لایسنس **MIT** — قطعی: **بله** — محل: **node tool** (پردازش پیکسلی pure-JS: threshold/convolution → حس حکاکی/engraving، 1-bit، emboss). چرا: سبک، بدون native، API تمیز. ریسک: برای تصاویر بزرگ کند است (در برابر sharp).
۱۱. **`gl-transitions` 1.76.1** — لایسنس npm **MIT** (GitHub NOASSERTION) — قطعی: **بله** (فقط `progress`) — محل: **browser vendor** (کپی یک `.glsl` transition). چرا: بانک بزرگ transitionهای GLSL برای cutهای بین دو صحنه. ریسک: مجوز GitHub نامشخص (NOASSERTION) → قبل از استفادهٔ تجاری، LICENSE را بخوانیم.
۱۲. **`crt-shader` 1.0.1** — لایسنس **MIT** — قطعی: **بله** — محل: **browser vendor** (GLSL قابل‌حمل). چرا: «Multi-pass CRT reconstruction for WebGL, Three.js and React» → CRT/VHS به‌روز و MIT؛ ۱۲★ ولی push 2026-09-27. ریسک: ★ کم → کد را بخوانیم و در صورت نیاز پورت/کپی کنیم.
۱۳. **اختیاری: `@ffmpeg/ffmpeg` 0.12.15** — لایسنس **MIT** — قطعی: **بله** — محل: **ffmpeg side** — فقط اگر ffmpeg بومی در محیط CI نبود. ریسک: کند و حافظه‌بر؛ badge «experimental».

**کل نصبِ پیشنهادی در سطح ریپو (حداقل):** `postprocessing` (اختیاری و فقط برای 3D)، `simplex-noise`, `image-js`, `sharp`, `bidi-js`, `harfbuzzjs` + `fontkit` (اختیاری، فقط اگر asset متن را بیرون از مرورگر بسازیم). بقیه = **کپی GLSL** (بدون dependency).

---

## ۴. DO NOT (ردشده‌ها با دلیل)

- **`opentype.js` برای فارسی** — README خودش می‌گوید نگاشت یک‌به‌یک کاراکتر↔glyph فرض شده و «for complex scripts, this might not be the case» → **NO-SHAPING**؛ اتصال حروف و ارقام فارسی می‌شکند. (برای Latin/paths بی‌اشکال است.)
- **`svg-text-to-path` و `text-to-svg`** — هر دو روی opentype.js سوارند → **بدون shaping** → برای متن فارسی ممنوع.
- **`troika-three-text`** — ۳D SDF text؛ ما فیلم ۲D می‌سازیم و shaping فارسی در آن هنوز **UNVERIFIED** (ادعای جدید README) → نیازی نیست.
- **npm `vhs`** — «Post-future CSS animations» → اصلاً افکت نیست.
- **npm `bokeh`** — «a blazing-fast task queue built on Node.js and ZeroMQ» → اصلاً افکت نیست.
- **npm `prism`** — «React / Redux action composition» → اصلاً افکت نیست.
- **npm `dither`** — بدون repo، بدون README، license فقط ISC در registry → provenance نامعلوم.
- **npm `caustics`** — «Reserved name for … real package coming» → placeholder.
- **npm `crt` (simonswain)** — ۲★، push 2015 → یک `crt-shader` به‌روزتر داریم.
- **npm `halftone` (Postcard)** — ۱★، push 2016 → در برابر `halftone-print` و `glsl-halftone` بی‌ارزش.
- **npm `film-grain` / `light-leak` / `chromatic-aberration` / `lens-flare` / `postfx`** — همه **404**؛ `postfx` در GitHub هم 404 → این ecosystem وجود ندارد. افکت‌ها را خودمان می‌نویسیم.
- **`fluent-ffmpeg`** — `archived: true` در API؛ آخرین push 2025-05 → deprecation عملی. از `spawn` مستقیم استفاده کنیم.
- **`ffmpeg-static`** — باینری ffmpeg با **GPL-3.0**؛ برای محیط توسعه محلی اشکالی ندارد ولی نباید داخل ریپوی منتشرشده برود. ffmpeg سیستمی را ترجیح می‌دهیم.
- **frei0r / dsfilters / VidGear / ffmpeg-python** — **اصلاً JS نیستند** (C، DirectShow، Python) → در خط لولهٔ مرورگری ما قابل‌استفاده نیستند؛ معادل‌های JS: ffmpeg-native filter graph (سمت ffmpeg) و postprocessing/GLSL (سمت مرورگر).
- **`wasm-vips`** — «still under early development» و نسخهٔ 0.0.x → فقط اگر واقعاً به libvips در مرورگر نیاز شد.
- **`shader-effects-inc/shaders` (Shader Park) به‌عنوان dependency** — WebGPU؛ در headless Chromium ریسک اجرا دارد → فقط **مرجع GLSL** برای پورت.
- **PavelDoGreat/WebGL-Fluid-Simulation** — MIT و 16,738★ و بسیار معروف، اما: (الف) پخش‌کنندهٔ GPU با splat تصادفی (نیازمند seed/کنترل)، (ب) هزینهٔ GPU بالا، (ج) برای دود/سیال در فیلم ۲D سنگین است → فقط **مرجع الگوریتم** برای نوشتن یک نسخهٔ سبک و قطعی.

---

## ۵. چک‌لیست قطعیت (determinism) برای خط لولهٔ ما

1. تنها منبع زمان = `frameIndex`. هر افکتی که `time`/`elapsed`/`Date.now` می‌خواهد باید از frame index تغذیه شود (یا اصلاً استفاده نشود).
2. `Math.random` ممنوع مگر با PRNG seed‌دار: `simplex-noise` + `alea`/`xorshift` با seed = `hash(filmId, frameIndex)`.
3. `glsl-film-grain` را با پارامتر `frame` صدا بزنید: `grain(uv, resolution, float(frame))` → گرین بین فریم‌ها حرکت می‌کند ولی **تکرارپذیر** است.
4. `postprocessing`: همهٔ افکت‌ها uniform-driven هستند؛ `NoiseEffect` را یک‌بار تست کنیم که time-uniform ندارد (UNVERIFIED).
5. `gl-transitions`: فقط `progress` (0→1) → مستقیم `progress = (frame - cutStart) / cutDuration`.
6. GPU در headless Chromium: SwiftShader/ANGLE software renderer ممکن است floating-point متفاوت بدهد → برای مقایسهٔ فریم‌به‌فریم، خروجی PNG را با tolerance بسنجیم نه byte-wise. (این ریسک در `docs/motion/REPO-DEEP-DIVE-2026-10-19.md` هم دیده شده: «Renders lie; the file doesn't».)
7. `noise`-های textureی (کاغذ، دود) را **یک‌بار در node** با seed ثابت تولید کنید و به‌صورت PNG بی‌طرف وارد کنید (asset) → قطعی و سریع.

---

## ۶. ارجاع‌های API (منبع اعداد)

- GitHub REST: `https://api.github.com/repos/{owner}/{repo}` → `stargazers_count`, `license.spdx_id`, `pushed_at`, `archived`, `description`.
- GitHub Search: `https://api.github.com/search/repositories?q=…` (۴ جست‌وجو: fluid simulation، postfx، realism effects، frei0r/dsfilters).
- npm: `https://registry.npmjs.org/{pkg}/latest` → `version`, `license`, `repository.url`, `description`.
- README: `https://raw.githubusercontent.com/{owner}/{repo}/HEAD/README.md`.
- سقف: ۶۰ درخواست/ساعت GitHub بدون توکن → در این تحقیق تقریباً کامل مصرف شد؛ اگر ادامهٔ کار لازم شد، با `GITHUB_TOKEN` یا از راه `/search` لیست کنیم.
